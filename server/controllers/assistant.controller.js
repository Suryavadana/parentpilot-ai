import { createPartFromFunctionResponse } from '@google/genai';
import { getGeminiClient } from '../lib/gemini.js';
import { TOOL_DECLARATIONS, TOOL_FUNCTIONS } from '../lib/assistantTools.js';

const GEMINI_MODEL = 'gemini-flash-lite-latest';
const MAX_TOOL_ITERATIONS = 5;
const PROPOSAL_TOOL_PREFIX = 'propose_';

// A function, not a constant: it must reflect the real date at request time,
// not whenever this module happened to be first imported (the process can
// stay up for days). Nothing else grounds the model in "today" otherwise —
// confirmed by direct testing, this was the actual cause of proposals landing
// on essentially random dates ("Wednesday" resolving to a Wednesday months in
// the past just as often as one in the future) — the model has no notion of
// "today" unless it's told, so it can't compute a relative date without this.
const buildSystemInstruction = () => {
  const today = new Date();
  const todayLabel = today.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const todayIso = today.toISOString().slice(0, 10);

  return 'You are a helpful assistant inside ParentPilotAI, a family organizer app. '
    + `Today's date is ${todayLabel} (${todayIso}). Whenever the user gives a relative date or day `
    + '(e.g. "Wednesday", "tomorrow", "next week", "in two days"), compute the actual calendar date from '
    + "today's date above before calling any tool — never guess an unrelated date. \"Wednesday\" alone "
    + 'means the next upcoming Wednesday on or after today.\n\n'
    + "Answer questions about the family's homework, fees, calendar events, appointments, and medications "
    + 'using the provided tools — never guess at this data. If a tool returns no items, say so plainly. '
    + 'Keep responses concise and parent-friendly.\n\n'
    + 'You can also help the user create new homework, calendar events, or appointments. You have no ability '
    + 'to save anything to the database yourself — you never create these directly. When the user asks to '
    + 'add, create, or schedule something, call the matching propose_create_* tool to prepare a proposal. '
    + 'After calling it, clearly summarize in your reply exactly what you are proposing, and tell the user '
    + "they need to review and confirm it before anything is actually created. Never say or imply that you've "
    + 'already created, added, or saved it — you only ever propose.\n\n'
    + 'Whenever the user refers to a child by name for ANY create/propose action, you MUST call get_children '
    + "first (if you haven't already done so earlier in this conversation) to resolve the correct childId "
    + 'before calling any propose_* tool. Never guess a childId, never assume the family has only one child, '
    + "and never reuse a childId from a different child's context earlier in the conversation without "
    + "verifying it against get_children's actual current results — family membership can change, and a "
    + 'name you saw earlier may not map to the id you remember. If get_children does not contain a child '
    + 'matching the name the user gave, say so and ask them to clarify rather than guessing or substituting '
    + 'a different child.';
};

const executeToolCall = async (functionCall, familyId) => {
  const responseId = functionCall.id ?? functionCall.name;
  const toolFn = TOOL_FUNCTIONS[functionCall.name];

  if (!toolFn) {
    return {
      part: createPartFromFunctionResponse(responseId, functionCall.name, {
        error: `Unknown tool: ${functionCall.name}`,
      }),
      proposal: null,
    };
  }

  try {
    const rawOutput = await toolFn({ ...functionCall.args, familyId });
    // Tool results can contain Prisma types (e.g. Decimal for Fee.amount)
    // that chat.getHistory()'s structuredClone() can't handle — round-trip
    // through JSON to normalize to plain, cloneable values first.
    const output = JSON.parse(JSON.stringify(rawOutput));
    const isProposal = functionCall.name.startsWith(PROPOSAL_TOOL_PREFIX);

    return {
      part: createPartFromFunctionResponse(responseId, functionCall.name, { output }),
      proposal: isProposal ? output : null,
    };
  } catch (error) {
    return {
      part: createPartFromFunctionResponse(responseId, functionCall.name, { error: error.message }),
      proposal: null,
    };
  }
};

const chat = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const ai = getGeminiClient();
    const chatSession = ai.chats.create({
      model: GEMINI_MODEL,
      config: {
        systemInstruction: buildSystemInstruction(),
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      },
      history: Array.isArray(history) ? history : [],
    });

    let response = await chatSession.sendMessage({ message });
    let iterations = 0;
    const proposedActions = [];

    while (response.functionCalls && response.functionCalls.length > 0) {
      iterations += 1;

      if (iterations > MAX_TOOL_ITERATIONS) {
        return res.status(502).json({
          error: `Assistant did not produce a final response after ${MAX_TOOL_ITERATIONS} tool-call iterations`,
        });
      }

      const results = await Promise.all(
        response.functionCalls.map((functionCall) => executeToolCall(functionCall, req.familyId)),
      );

      results.forEach(({ proposal }) => {
        if (proposal) {
          proposedActions.push(proposal);
        }
      });

      // Each round of tool calls must be resolved before the next can be
      // requested, so this genuinely has to run sequentially.
      // eslint-disable-next-line no-await-in-loop
      response = await chatSession.sendMessage({ message: results.map(({ part }) => part) });
    }

    return res.status(200).json({
      reply: response.text,
      history: chatSession.getHistory(),
      ...(proposedActions.length > 0 ? { proposedActions } : {}),
    });
  } catch (error) {
    return next(error);
  }
};

export { chat };
