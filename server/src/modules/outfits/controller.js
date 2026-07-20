import { generateOutfitsSchema, rateOutfitSchema, saveOutfitSchema, savedOutfitsQuerySchema, suggestOutfitsSchema, updateOutfitFavoriteSchema } from './validation.js';
import { deleteOutfit, generateOutfits, getSavedOutfits, saveOutfit, setOutfitFavorite, setOutfitRating, suggestOutfits } from './service.js';

export const generate = async (req, res, next) => {
  try {
    const { occasion, limit } = generateOutfitsSchema.parse(req.query);
    const suggestions = await generateOutfits(req.user.id, occasion, limit);
    res.json({ success: true, data: suggestions });
  } catch (error) { next(error); }
};

export const suggest = async (req, res, next) => {
  try {
    res.json({ success: true, data: await suggestOutfits(req.user.id, suggestOutfitsSchema.parse(req.body)) });
  } catch (error) { next(error); }
};

export const createOutfit = async (req, res, next) => {
  try {
    const outfit = await saveOutfit(req.user.id, saveOutfitSchema.parse(req.body));
    res.status(201).json({ success: true, data: outfit });
  } catch (error) { next(error); }
};

export const getOutfits = async (req, res, next) => {
  try {
    const result = await getSavedOutfits(req.user.id, savedOutfitsQuerySchema.parse(req.query));
    res.json({ success: true, data: result.outfits, pagination: result.pagination });
  } catch (error) { next(error); }
};

export const updateFavorite = async (req, res, next) => {
  try {
    const { isFavorite } = updateOutfitFavoriteSchema.parse(req.body);
    const outfit = await setOutfitFavorite(req.params.id, req.user.id, isFavorite);
    res.json({ success: true, data: outfit });
  } catch (error) { next(error); }
};

export const rate = async (req, res, next) => {
  try {
    const outfit = await setOutfitRating(req.params.id, req.user.id, rateOutfitSchema.parse(req.body).rating);
    res.json({ success: true, data: outfit });
  } catch (error) { next(error); }
};

export const removeOutfit = async (req, res, next) => {
  try {
    await deleteOutfit(req.params.id, req.user.id);
    res.json({ success: true, data: { message: 'Outfit deleted successfully' } });
  } catch (error) { next(error); }
};
