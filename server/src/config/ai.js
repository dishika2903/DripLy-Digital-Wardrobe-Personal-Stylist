import { GoogleGenAI } from '@google/genai';
import env from './env.js';

// Keep AI client construction in config so routes never touch credentials directly.
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
export const GEMINI_MODEL = 'gemini-2.5-flash';
export default ai;
