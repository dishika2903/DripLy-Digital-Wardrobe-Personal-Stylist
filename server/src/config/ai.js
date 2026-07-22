import { GoogleGenAI } from '@google/genai';
import env from './env.js';

// Keep AI client construction in config so routes never touch credentials directly.
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
// `gemini-2.5-flash` was retired for new API users.  Keeping this configurable
// makes future model migrations an environment change rather than a code change.
export const GEMINI_MODEL = env.GEMINI_MODEL || 'gemini-flash-latest';
export default ai;
