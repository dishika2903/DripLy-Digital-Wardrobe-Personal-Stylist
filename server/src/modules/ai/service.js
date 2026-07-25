import { Category, Color, Fabric, Occasion, Pattern, Season } from '@prisma/client';
import { z } from 'zod';
import ai, { GEMINI_MODEL } from '../../config/ai.js';
import logger from '../../utils/logger.js';

const enumValues = { category: Object.values(Category), color: Object.values(Color), fabric: Object.values(Fabric), pattern: Object.values(Pattern), season: Object.values(Season), occasion: Object.values(Occasion) };
const rawClassificationSchema = z.object({
  category: z.string(),
  subcategory: z.string().min(1).max(100),
  color: z.string(),
  colorDetail: z.string().max(100).optional().nullable(),
  pattern: z.string(),
  fabric: z.string(),
  season: z.string(),
  occasions: z.array(z.string()).optional().default([]),
});
const safeDefaults = { category: 'OTHER', color: 'MULTICOLOR', pattern: 'OTHER', fabric: 'OTHER', season: 'ALL_SEASON' };

const within = (field, value) => enumValues[field].includes(value) ? value : safeDefaults[field];
const withTimeout = (promise, ms = 20000) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('AI request timed out')), ms))]);

export const classifyImage = async (file) => {
  const prompt = `Classify this single clothing item. Return JSON only with category, subcategory, color, colorDetail, pattern, fabric, season, occasions.
Use a specific natural-language subcategory (for example wide-leg jeans, oversized tee, button-down, ankle boots, chelsea boots) rather than a generic one.
For color, pick the single closest dominant enum value; if the item genuinely has two or more distinct colors (not just shading of one color), set color to MULTICOLOR and describe the actual colorway in colorDetail as a short natural phrase (for example "black and white" or "navy with red trim"). If the item is a single color, leave colorDetail empty.
For occasions, return an array of ALL enum values that realistically fit how this item would be worn (an item can fit more than one, for example a blazer can be both BUSINESS and FORMAL; plain sneakers can be both CASUAL and SPORT). Include at least one.
Exact allowed enum values: category=${enumValues.category.join(', ')}, color=${enumValues.color.join(', ')}, pattern=${enumValues.pattern.join(', ')}, fabric=${enumValues.fabric.join(', ')}, season=${enumValues.season.join(', ')}, occasions=${enumValues.occasion.join(', ')}.`;
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
  const occasions = [...new Set(raw.occasions.filter((value) => enumValues.occasion.includes(value)))];
  const color = within('color', raw.color);
  return {
    ...raw,
    ...Object.fromEntries(Object.keys(safeDefaults).map((field) => [field, within(field, raw[field])])),
    // Only keep colorDetail when the color actually is MULTICOLOR — otherwise a stray value
    // from the model would show up as a confusing subtitle on a plain single-color item.
    colorDetail: color === 'MULTICOLOR' ? (raw.colorDetail || null) : null,
    occasions,
    invalidFields,
  };
};
