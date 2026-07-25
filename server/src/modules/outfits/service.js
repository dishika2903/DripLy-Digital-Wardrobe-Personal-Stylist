import prisma from '../../config/db.js';
import ai, { GEMINI_MODEL } from '../../config/ai.js';
import { z } from 'zod';
import logger from '../../utils/logger.js';

const neutralColors = new Set(['BLACK', 'WHITE', 'GREY', 'BEIGE', 'BROWN', 'NAVY']);
// Patterns that read as visually "loud" — pairing two of these (even if different patterns)
// tends to clash, whereas any of them pairs fine with a SOLID piece.
const loudPatterns = new Set(['STRIPED', 'CHECKED', 'FLORAL', 'PLAID', 'GRAPHIC', 'ANIMAL', 'DOTS', 'CAMOUFLAGE', 'COLORBLOCK', 'GEOMETRIC', 'TIE_DYE']);
// A "complete look" is anything that's a full outfit on its own (dress, saree, gown, jumpsuit,
// suit, romper, etc.) rather than a top or bottom that needs pairing. These don't have their
// own Category in the schema — they all live under OTHER — so category is the reliable signal
// here, not subcategory text (which is free-form and can be anything the AI or the person
// typed, e.g. "bodycon midi dress" or "saree", neither of which matches a fixed word list).
const isCompleteLook = (item) => item.category === 'OTHER';
const scorePair = (first, second) => {
  let score = 0;
  if (first.color === second.color) score += 3;
  else if (neutralColors.has(first.color) || neutralColors.has(second.color)) score += 2;
  else if (first.color === 'MULTICOLOR' || second.color === 'MULTICOLOR') score += 1;

  // Pattern compatibility: two solids always work, one solid + one pattern always works,
  // two different loud patterns clash (e.g. stripes + florals), and matching patterns get a
  // small bonus for being an intentional coordinated look.
  if (first.pattern === second.pattern) score += 1;
  else if (loudPatterns.has(first.pattern) && loudPatterns.has(second.pattern)) score -= 2;

  return score;
};
// Bonus for an item actually being tagged for the target occasion. Weighted heavily (well
// above anything color/pattern scoring can contribute) so that occasion is the dominant signal
// in ranking, not a tie-breaker — an occasion-tagged item should consistently outrank an
// untagged one even if the untagged one happens to color-match slightly better.
const occasionBonus = (item, occasion) => (item.occasionTags?.includes(occasion) ? 6 : 0);
const reasonFor = (items, occasion) => {
  const colors = [...new Set(items.map((item) => item.color.toLowerCase()))].join(' and ');
  return `A complete ${occasion.toLowerCase()} look using your available pieces, balanced with ${colors} tones.`;
};

const buildOutfits = (items, occasion) => {
  const tops = items.filter((item) => item.category === 'TOPS');
  const bottoms = items.filter((item) => item.category === 'BOTTOMS');
  const shoes = items.filter((item) => item.category === 'FOOTWEAR');
  const layers = items.filter((item) => item.category === 'OUTERWEAR');
  const completeLooks = items.filter(isCompleteLook);
  const suggestions = [];
  const occasionScore = (outfitItems) => outfitItems.reduce((sum, item) => sum + occasionBonus(item, occasion), 0);

  for (const look of completeLooks) {
    for (const shoe of shoes.length ? shoes : [null]) {
      const outfitItems = [look, shoe].filter(Boolean);
      suggestions.push({ items: outfitItems, score: 8 + (shoe ? scorePair(look, shoe) : 0) + occasionScore(outfitItems), aiReason: reasonFor(outfitItems, occasion) });
    }
  }
  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const shoe of shoes.length ? shoes : [null]) {
        const outfitItems = [top, bottom, shoe].filter(Boolean);
        const layer = layers.find((item) => scorePair(item, top) >= 1);
        if (layer) outfitItems.push(layer);
        suggestions.push({ items: outfitItems, score: 10 + scorePair(top, bottom) + (shoe ? scorePair(bottom, shoe) : 0) + (layer ? 1 : 0) + occasionScore(outfitItems), aiReason: reasonFor(outfitItems, occasion) });
      }
    }
  }
  return suggestions.sort((a, b) => b.score - a.score).map(({ score, ...suggestion }) => ({ ...suggestion, source: 'rule' }));
};

export const generateOutfits = async (userId, occasion, limit) => {
  const [matchingItems, availableItems] = await Promise.all([
    prisma.clothingItem.findMany({ where: { userId, laundryStatus: 'AVAILABLE', occasionTags: { has: occasion } }, orderBy: { createdAt: 'desc' } }),
    prisma.clothingItem.findMany({ where: { userId, laundryStatus: 'AVAILABLE' }, orderBy: { createdAt: 'desc' } }),
  ]);
  const matchingOutfits = buildOutfits(matchingItems, occasion);
  if (matchingOutfits.length >= limit) return matchingOutfits.slice(0, limit);

  const seen = new Set(matchingOutfits.map((outfit) => outfit.items.map((item) => item.id).sort().join(':')));
  const fallbackMessage = `Only ${matchingOutfits.length ? `${matchingOutfits.length} ${occasion.toLowerCase()} look${matchingOutfits.length === 1 ? '' : 's'} ` : ''}could be made from your ${occasion.toLowerCase()} pieces. Showing other available options too.`;
  const fallbackOutfits = buildOutfits(availableItems, occasion)
    .filter((outfit) => !seen.has(outfit.items.map((item) => item.id).sort().join(':')))
    .map((outfit) => ({ ...outfit, fallbackMessage }));
  return [...matchingOutfits, ...fallbackOutfits].slice(0, limit);
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
    return parsed.suggestions.map((suggestion) => ({ ...suggestion, source: 'ai', items: suggestion.clothingItemIds.map((id) => items.find((item) => item.id === id)) }));
  } catch (error) {
    // AI outages and hallucinated IDs degrade to the existing deterministic generator, but log
    // the real reason (bad API key, wrong model name, quota, timeout, schema mismatch, etc.) —
    // previously this was a bare `catch {}` so every AI failure was invisible and looked
    // identical to "AI is just giving generic guesses" from the user's side.
    logger.error({ err: error, occasion, prompt, model: GEMINI_MODEL }, 'Gemini suggestOutfits failed, degrading to rule-based generator');
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
