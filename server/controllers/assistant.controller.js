import { createPartFromFunctionResponse } from '@google/genai';
import { getGeminiClient } from '../lib/gemini.js';
import { TOOL_DECLARATIONS, TOOL_FUNCTIONS } from '../lib/assistantTools.js';

const GEMINI_MODEL = 'gemini-flash-lite-latest';
const MAX_TOOL_ITERATIONS = 5;

const SYSTEM_INSTRUCTION = 'You are a helpful assistant inside ParentPilotAI, a family organizer app. '
  + "Answer questions about the family's homework, fees, calendar events, appointments, and medications "
  + 'using the provided tools — never guess at this data. If a tool returns no items, say so plainly. '
  + 'Keep responses concise and parent-friendly.';

const executeToolCall = async (functionCall, familyId) => {
  const responseId = functionCall.id ?? functionCall.name;
  const toolFn = TOOL_FUNCTIONS[functionCall.name];

  if (!toolFn) {
    return createPartFromFunctionResponse(responseId, functionCall.name, {
      error: `Unknown tool: ${functionCall.name}`,
    });
  }

  try {
    const rawOutput = await toolFn({ ...functionCall.args, familyId });
    // Tool results can contain Prisma types (e.g. Decimal for Fee.amount)
    // that chat.getHistory()'s structuredClone() can't handle — round-trip
    // through JSON to normalize to plain, cloneable values first.
    const output = JSON.parse(JSON.stringify(rawOutput));
    return createPartFromFunctionResponse(responseId, functionCall.name, { output });
  } catch (error) {
    return createPartFromFunctionResponse(responseId, functionCall.name, { error: error.message });
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
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      },
      history: Array.isArray(history) ? history : [],
    });

    let response = await chatSession.sendMessage({ message });
    let iterations = 0;

    while (response.functionCalls && response.functionCalls.length > 0) {
      iterations += 1;

      if (iterations > MAX_TOOL_ITERATIONS) {
        return res.status(502).json({
          error: `Assistant did not produce a final response after ${MAX_TOOL_ITERATIONS} tool-call iterations`,
        });
      }

      const responseParts = await Promise.all(
        response.functionCalls.map((functionCall) => executeToolCall(functionCall, req.familyId)),
      );

      // Each round of tool calls must be resolved before the next can be
      // requested, so this genuinely has to run sequentially.
      // eslint-disable-next-line no-await-in-loop
      response = await chatSession.sendMessage({ message: responseParts });
    }

    return res.status(200).json({
      reply: response.text,
      history: chatSession.getHistory(),
    });
  } catch (error) {
    return next(error);
  }
};

export { chat };
