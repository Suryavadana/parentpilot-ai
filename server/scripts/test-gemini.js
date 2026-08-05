import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY must be set in .env');
}

const ai = new GoogleGenAI({ apiKey });

const main = async () => {
  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: "Say hello and confirm you're working",
  });

  console.log(response.text);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
