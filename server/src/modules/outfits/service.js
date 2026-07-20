import prisma from '../../config/db.js';
import ai, { GEMINI_MODEL } from '../../config/ai.js';
import { z } from 'zod';

const neutralColors = new Set(['BLACK', 'WHITE', 'GREY', 'BEIGE', 'BROWN', 'NAVY']);
const isDress = (item) => ['Dress', 'Jumpsuit'].includes(item.subcategory);
const scorePair = (first, second) => {
  if (first.color === second.color) return 3;
  if (neutralColors.has(first.color) || neutralColors.has(second.color)) return 2;
  if (first.color === 'MULTICOLOR' || second.color === 'MULTICOLOR') return 1;
  return 0;
};
const reasonFor = (items, occasion) => {
  const colors = [...new Set(items.map((item) => item.color.toLowerCase()))].join(' and ');
  return `A complete ${occasion.toLowerCase()} look using your available pieces, balanced with ${colors} tones.`;
};

export const generateOutfits = async (userId, occasion, limit) => {
  const matchingItems = await prisma.clothingItem.findMany({
    where: { userId, laundryStatus: 'AVAILABLE', occasionTags: { has: occasion } },
    orderBy: { createdAt: 'desc' },
  });
  const items = matchingItems.length ? matchingItems : await prisma.clothingItem.findMany({
    where: { userId, laundryStatus: 'AVAILABLE' },
    orderBy: { createdAt: 'desc' },
  });
  const tops = items.filter((item) => item.category === 'TOPS');
  const bottoms = items.filter((item) => item.category === 'BOTTOMS');
  const shoes = items.filter((item) => item.category === 'FOOTWEAR');
  const layers = items.filter((item) => item.category === 'OUTERWEAR');
  const dresses = items.filter(isDress);
  const suggestions = [];

  for (const dress of dresses) {
    for (const shoe of shoes.length ? shoes : [null]) {
      const outfitItems = [dress, shoe].filter(Boolean);
      suggestions.push({ items: outfitItems, score: 8 + (shoe ? scorePair(dress, shoe) : 0), aiReason: reasonFor(outfitItems, occasion) });
    }
  }
  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const shoe of shoes.length ? shoes : [null]) {
        const outfitItems = [top, bottom, shoe].filter(Boolean);
        const layer = layers.find((item) => scorePair(item, top) >= 1);
        if (layer) outfitItems.push(layer);
        suggestions.push({ items: outfitItems, score: 10 + scorePair(top, bottom) + (shoe ? scorePair(bottom, shoe) : 0) + (layer ? 1 : 0), aiReason: reasonFor(outfitItems, occasion) });
      }
    }
  }
  return suggestions.sort((a, b) => b.score - a.score).slice(0, limit).map(({ score, ...suggestion }) => suggestion);
};

const aiTimeout = (promise) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('AI request timed out')), 20000))]);
const outfitResponseSchema = (ids) => z.object({ suggestions: z.array(z.object({ clothingItemIds: z.array(z.enum(ids)).min(2).max(6), aiReason: z.string().min(1).max(600) })).min(1).max(6) });

/** Ratings are prompt context only; this does not train or fine-tune a model. */
export const suggestOutfits = async (userId, { occasion = 'CASUAL', prompt }) => {
  const items = await prisma.clothingItem.findMany({ where: { userId, laundryStatus: 'AVAILABLE' }, select: { id: true, category: true, subcategory: true, color: true, pattern: true, fabric: true, season: true, imageUrl: true } });
  if (items.length < 2) return generateOutfits(userId, occasion, 6);
  const rated = await prisma.outfit.findMany({ where: { userId, aiRating: { not: null } }, orderBy: { updatedAt: 'desc' }, take: 10, include: { items: { include: { clothingItem: { select: { subcategory: true, color: true } } } } } });
  const feedback = rated.map((outfit) => `${outfit.aiRating === 1 ? 'Liked' : 'Disliked'}: ${outfit.items.map(({ clothingItem }) => `${clothingItem.color} ${clothingItem.subcategory}`).join(' + ')}`).join('; ') || 'No prior ratings.';
  const request = `You are DripLy, a thoughtful stylist. Create ranked wearable outfits only from this user's exact wardrobe IDs. Consider silhouette/proportion, color harmony, the requested occasion, and the current month (${new Date().toLocaleString('en', { month: 'long' })}). Do not invent IDs. Occasion: ${occasion}. User request: ${prompt || 'No additional request.'}. Wardrobe: ${JSON.stringify(items.map(({ imageUrl, ...item }) => item))}. Lightweight preference context (not model training): ${feedback}. Return JSON {"suggestions":[{"clothingItemIds":["real-id"],"aiReason":"..."}]}.`;
  try {
    const response = await aiTimeout(ai.models.generateContent({ model: GEMINI_MODEL, contents: request, config: { responseMimeType: 'application/json' } }));
    const parsed = outfitResponseSchema(items.map((item) => item.id)).parse(JSON.parse(response.text));
    return parsed.suggestions.map((suggestion) => ({ ...suggestion, items: suggestion.clothingItemIds.map((id) => items.find((item) => item.id === id)) }));
  } catch {
    // AI outages and hallucinated IDs degrade to the existing deterministic generator.
    return generateOutfits(userId, occasion, 6);
  }
};

const outfitWithItems = {
  items: { include: { clothingItem: true } },
};

const notFoundError = () => {
  const error = new Error('Outfit not found or unauthorized');
  error.status = 404;
  error.code = 'RECORD_NOT_FOUND';
  return error;
};

export const saveOutfit = async (userId, data) => {
  return prisma.$transaction(async (tx) => {
    const ownedItems = await tx.clothingItem.findMany({
      where: { id: { in: data.clothingItemIds }, userId },
      select: { id: true },
    });

    if (ownedItems.length !== data.clothingItemIds.length) throw notFoundError();

    return tx.outfit.create({
      data: {
        userId,
        occasion: data.occasion,
        aiReason: data.aiReason,
        weatherTag: data.weatherTag || null,
        items: { create: data.clothingItemIds.map((clothingItemId) => ({ clothingItemId })) },
      },
      include: outfitWithItems,
    });
  });
};

export const getSavedOutfits = async (userId, filters = {}) => {
  const parsedPage = Math.max(1, parseInt(filters.page, 10));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(filters.limit, 10)));
  const where = { userId };
  if (filters.favoritesOnly === 'true' || filters.favoritesOnly === true) where.isFavorite = true;

  const [outfits, total] = await Promise.all([
    prisma.outfit.findMany({
      where,
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
      orderBy: { createdAt: 'desc' },
      include: outfitWithItems,
    }),
    prisma.outfit.count({ where }),
  ]);

  return {
    outfits,
    pagination: { total, page: parsedPage, limit: parsedLimit, totalPages: Math.ceil(total / parsedLimit) },
  };
};

export const setOutfitFavorite = async (outfitId, userId, isFavorite) => {
  return prisma.$transaction(async (tx) => {
    const outfit = await tx.outfit.findFirst({ where: { id: outfitId, userId } });
    if (!outfit) throw notFoundError();

    await tx.favorite.deleteMany({ where: { userId, outfitId } });
    if (isFavorite) await tx.favorite.create({ data: { userId, outfitId } });

    return tx.outfit.update({
      where: { id: outfitId },
      data: { isFavorite },
      include: outfitWithItems,
    });
  });
};

export const setOutfitRating = async (outfitId, userId, aiRating) => {
  const outfit = await prisma.outfit.findFirst({ where: { id: outfitId, userId } });
  if (!outfit) throw notFoundError();
  return prisma.outfit.update({ where: { id: outfitId }, data: { aiRating }, include: outfitWithItems });
};

export const deleteOutfit = async (outfitId, userId) => {
  const outfit = await prisma.outfit.findFirst({ where: { id: outfitId, userId } });
  if (!outfit) throw notFoundError();
  return prisma.outfit.delete({ where: { id: outfitId } });
};
