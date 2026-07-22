import { Category, Color, Fabric, Pattern, Season } from '@prisma/client';
import { z } from 'zod';
import ai, { GEMINI_MODEL } from '../../config/ai.js';
import logger from '../../utils/logger.js';

const enumValues = { category: Object.values(Category), color: Object.values(Color), fabric: Object.values(Fabric), pattern: Object.values(Pattern), season: Object.values(Season) };
const rawClassificationSchema = z.object({ category: z.string(), subcategory: z.string().min(1).max(100), color: z.string(), pattern: z.string(), fabric: z.string(), season: z.string() });
const safeDefaults = { category: 'OTHER', color: 'MULTICOLOR', pattern: 'OTHER', fabric: 'OTHER', season: 'ALL_SEASON' };

const within = (field, value) => enumValues[field].includes(value) ? value : safeDefaults[field];
const withTimeout = (promise, ms = 20000) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('AI request timed out')), ms))]);

export const classifyImage = async (file) => {
  const prompt = `Classify this single clothing item. Return JSON only with category, subcategory, color, pattern, fabric, season. Use a specific natural-language subcategory (for example wide-leg jeans, oversized tee, button-down, ankle boots). Exact allowed enum values: category=${enumValues.category.join(', ')}, color=${enumValues.color.join(', ')}, pattern=${enumValues.pattern.join(', ')}, fabric=${enumValues.fabric.join(', ')}, season=${enumValues.season.join(', ')}.`;
  let response;
  try {
    response = await withTimeout(ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ inlineData: { mimeType: file.mimetype, data: file.buffer.toString('base64') } }, { text: prompt }],
      config: { responseMimeType: 'application/json' },
    }));
  } catch (error) {
    // Log the real Gemini error (bad API key, wrong model name, quota exceeded, network, etc.)
    // Previously this was swallowed by the controller's generic catch, so every single
    // classification failure looked identical to the user with no way to diagnose it.
    logger.error({ err: error, model: GEMINI_MODEL }, 'Gemini classifyImage request failed');
    throw error;
  }
  let raw;
  try {
    raw = rawClassificationSchema.parse(JSON.parse(response.text));
  } catch (error) {
    logger.error({ err: error, rawText: response.text }, 'Gemini classifyImage returned unparsable JSON');
    throw error;
  }
  const invalidFields = Object.keys(safeDefaults).filter((field) => raw[field] !== within(field, raw[field]));
  return { ...raw, ...Object.fromEntries(Object.keys(safeDefaults).map((field) => [field, within(field, raw[field])])), invalidFields };
};
