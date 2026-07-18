import { generateOutfitsSchema } from './validation.js';
import { generateOutfits } from './service.js';

export const generate = async (req, res, next) => {
  try {
    const { occasion, limit } = generateOutfitsSchema.parse(req.query);
    const suggestions = await generateOutfits(req.user.id, occasion, limit);
    res.json({ success: true, data: suggestions });
  } catch (error) { next(error); }
};
