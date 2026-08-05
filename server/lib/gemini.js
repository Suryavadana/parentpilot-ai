import { GoogleGenAI } from '@google/genai';
let client = null;

const getGeminiClient = () => {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY must be set');
    }

    client = new GoogleGenAI({ apiKey });
  }

  return client;
};

export { getGeminiClient };
