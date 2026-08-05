import { getGeminiClient } from '../lib/gemini.js';

const GEMINI_MODEL = 'gemini-flash-lite-latest';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

const EVENT_CATEGORIES = ['school', 'activity', 'medical', 'family', 'announcement'];

const buildExtractionPrompt = () => `You are extracting calendar events from an image such as a school newsletter, flyer, or calendar page.

Respond ONLY with a JSON array, with no other text and no markdown formatting. Each item in the array must be an object with exactly these fields:
- title (string, required)
- category (string, required, one of: ${EVENT_CATEGORIES.map((category) => `"${category}"`).join(', ')})
- date (string, required, "YYYY-MM-DD" format — if no year is visible in the image, assume the current year, ${new Date().getFullYear()})
- description (string, optional)
- allDay (boolean, defaults to true unless the image clearly shows a specific time)

If the image contains no identifiable calendar events, respond with an empty array: []`;

const stripCodeFences = (text) => text
  .trim()
  .replace(/^```(?:json)?\s*/i, '')
  .replace(/\s*```\s*$/, '')
  .trim();

const extractCalendar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'image is required' });
    }

    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: `mimeType must be one of: ${ALLOWED_MIME_TYPES.join(', ')}` });
    }

    const ai = getGeminiClient();
    const base64Image = req.file.buffer.toString('base64');

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: buildExtractionPrompt() },
            {
              inlineData: {
                mimeType: req.file.mimetype,
                data: base64Image,
              },
            },
          ],
        },
      ],
    });

    const rawText = response.text;

    if (!rawText) {
      return res.status(502).json({ error: 'Gemini returned an empty response' });
    }

    let events;

    try {
      events = JSON.parse(stripCodeFences(rawText));
    } catch (parseError) {
      return res.status(502).json({ error: 'Unable to parse events from the AI response', raw: rawText });
    }

    if (!Array.isArray(events)) {
      return res.status(502).json({ error: 'AI response was not a JSON array', raw: rawText });
    }

    return res.status(200).json(events);
  } catch (error) {
    return next(error);
  }
};

export { extractCalendar };
