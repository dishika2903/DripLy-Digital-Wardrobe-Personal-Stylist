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
  const accessories = items.filter((item) => item.category === 'ACCESSORIES');
  const completeLooks = items.filter(isCompleteLook);
  const suggestions = [];
  const occasionScore = (outfitItems) => outfitItems.reduce((sum, item) => sum + occasionBonus(item, occasion), 0);
  // Pick at most one accessory per outfit — the best-scoring color/pattern match against the
  // outfit's anchor piece — rather than piling on every accessory the user owns. Optional: an
  // outfit with zero matching accessories (or none owned) is still returned as-is.
  const bestAccessory = (anchor) => accessories.reduce((best, accessory) => {
    const candidateScore = scorePair(anchor, accessory) + occasionBonus(accessory, occasion);
    return !best || candidateScore > best.score ? { item: accessory, score: candidateScore } : best;
  }, null);

  for (const look of completeLooks) {
    for (const shoe of shoes.length ? shoes : [null]) {
      const outfitItems = [look, shoe].filter(Boolean);
      const accessory = bestAccessory(look);
      if (accessory && accessory.score > 0) outfitItems.push(accessory.item);
      suggestions.push({ items: outfitItems, score: 8 + (shoe ? scorePair(look, shoe) : 0) + (accessory ? scorePair(look, accessory.item) : 0) + occasionScore(outfitItems), aiReason: reasonFor(outfitItems, occasion) });
    }
  }
  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const shoe of shoes.length ? shoes : [null]) {
        const outfitItems = [top, bottom, shoe].filter(Boolean);
        const layer = layers.find((item) => scorePair(item, top) >= 1);
        if (layer) outfitItems.push(layer);
        const accessory = bestAccessory(top);
        if (accessory && accessory.score > 0) outfitItems.push(accessory.item);
        suggestions.push({ items: outfitItems, score: 10 + scorePair(top, bottom) + (shoe ? scorePair(bottom, shoe) : 0) + (layer ? 1 : 0) + (accessory ? scorePair(top, accessory.item) : 0) + occasionScore(outfitItems), aiReason: reasonFor(outfitItems, occasion) });
      }
    }
  }
  return suggestions.sort((a, b) => b.score - a.score).map(({ score, ...suggestion }) => ({ ...suggestion, source: 'rule' }));
};

export const generateOutfits = async (userId, occasion, limit) => {
  const matchingItems = await prisma.clothingItem.findMany({ where: { userId, laundryStatus: 'AVAILABLE', occasionTags: { has: occasion } }, orderBy: { createdAt: 'desc' } });
  const matchingOutfits = buildOutfits(matchingItems, occasion).slice(0, limit);
  // If there's at least one real match, show only real matches — never pad a genuine set of
  // occasion-tagged outfits with unrelated items just to hit a target count. Padding used to
  // mix e.g. a random dress into "Sport/Athletic" results right alongside the real matches,
  // with no meaningful way to tell which was which at a glance.
  if (matchingOutfits.length > 0) return matchingOutfits;

  // Only when there are truly zero occasion-tagged outfits do we fall back to showing other
  // available clothes, and every one of those is clearly flagged via fallbackMessage so the
  // frontend can label them as "not tagged for this occasion" rather than as real matches.
  const availableItems = await prisma.clothingItem.findMany({ where: { userId, laundryStatus: 'AVAILABLE' }, orderBy: { createdAt: 'desc' } });
  const fallbackMessage = `You don't have any pieces tagged for ${occasion.toLowerCase().replace('_', ' ')} yet. Showing other available options instead — tag your clothes with occasions on the wardrobe page to get real matches here.`;
  return buildOutfits(availableItems, occasion)
    .slice(0, limit)
    .map((outfit) => ({ ...outfit, fallbackMessage }));
};

const aiTimeout = (promise) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('AI request timed out')), 20000))]);
// clothingItemIds intentionally is NOT validated against the real ID list here — a single bad
// ID from the model used to fail the whole array via z.enum() and throw away every suggestion
// in the response, even the valid ones. IDs are checked (and any suggestion referencing an
// unknown one is dropped, not the whole batch) after parsing instead, in suggestOutfits below.
// min(1) instead of min(2): a single piece can be a complete look (a dress, a saree, a
// jumpsuit) — requiring at least 2 items rejected every one of those suggestions outright.
const outfitResponseSchema = z.object({ suggestions: z.array(z.object({ clothingItemIds: z.array(z.string()).min(1).max(6), aiReason: z.string().min(1).max(600) })).min(1).max(6) });

/** Ratings are prompt context only; this does not train or fine-tune a model. */
export const suggestOutfits = async (userId, { occasion = 'CASUAL', prompt }) => {
  const items = await prisma.clothingItem.findMany({ where: { userId, laundryStatus: 'AVAILABLE' }, select: { id: true, category: true, subcategory: true, color: true, colorDetail: true, pattern: true, fabric: true, season: true, occasionTags: true, imageUrl: true } });
  // Not enough wardrobe items for the AI to work with is a different situation from the AI
  // actually failing — tag it distinctly (aiUnavailableReason) so the frontend doesn't tell
  // the user "DripLy AI was unavailable" when the real issue is just a small wardrobe.
  if (items.length < 2) {
    const fallback = await generateOutfits(userId, occasion, 6);
    return fallback.map((outfit) => ({ ...outfit, aiUnavailableReason: 'insufficient_wardrobe' }));
  }
  const rated = await prisma.outfit.findMany({ where: { userId, aiRating: { not: null } }, orderBy: { updatedAt: 'desc' }, take: 10, include: { items: { include: { clothingItem: { select: { subcategory: true, color: true } } } } } });
  const feedback = rated.map((outfit) => `${outfit.aiRating === 1 ? 'Liked' : 'Disliked'}: ${outfit.items.map(({ clothingItem }) => `${clothingItem.color} ${clothingItem.subcategory}`).join(' + ')}`).join('; ') || 'No prior ratings.';
  const request = `You are DripLy, a thoughtful stylist. Create ranked wearable outfits only from this user's exact wardrobe IDs.
A single item CAN be a complete outfit on its own (a dress, saree, jumpsuit, gown, or suit) — don't force a top+bottom pairing when one full-look piece already works, though adding shoes/accessories on top of it is great when available.
Consider silhouette/proportion, color harmony, the requested occasion, and the current month (${new Date().toLocaleString('en', { month: 'long' })}).
Prioritize the user's specific request text over generic occasion matching when the two could pull in different directions — the free-text request is what the user actually asked for right now.
Vary the pieces used across the different suggestions where the wardrobe allows it — don't reuse the exact same top or bottom in every single suggestion if reasonable alternatives exist; only repeat a piece when there's genuinely no better-fitting alternative available.
Write each aiReason as a short, specific styling note (why these pieces work together for this occasion/request) rather than a generic restatement of the item list.
If the wardrobe is small enough that one pairing is clearly the strongest fit, it's fine for your top suggestion to match what a simple rules-based stylist would also pick — don't force a worse combination just to look different. In that case, make the aiReason earn its place: reference the specific request/occasion/season reasoning a simple matcher wouldn't produce, not just a restatement of "these go together."
Do not invent IDs — only use "id" values exactly as given below.
Occasion: ${occasion}. User request: ${prompt || 'No additional request.'}.
Wardrobe: ${JSON.stringify(items.map(({ imageUrl, ...item }) => item))}.
Lightweight preference context (not model training): ${feedback}.
Return JSON {"suggestions":[{"clothingItemIds":["real-id"],"aiReason":"..."}]}.`;
  try {
    const response = await aiTimeout(ai.models.generateContent({ model: GEMINI_MODEL, contents: request, config: { responseMimeType: 'application/json', temperature: 0.9 } }));
    const parsed = outfitResponseSchema.parse(JSON.parse(response.text));
    const knownIds = new Set(items.map((item) => item.id));
    const suggestions = parsed.suggestions
      // Drop any suggestion that references an ID that doesn't exist (hallucinated or stale)
      // rather than failing the entire response over one bad suggestion.
      .filter((suggestion) => suggestion.clothingItemIds.every((id) => knownIds.has(id)))
      .map((suggestion) => ({ ...suggestion, source: 'ai', items: suggestion.clothingItemIds.map((id) => items.find((item) => item.id === id)) }));
    if (!suggestions.length) throw new Error('Gemini returned no suggestions with valid item IDs');
    return suggestions;
  } catch (error) {
    // AI outages and hallucinated IDs degrade to the existing deterministic generator, but log
    // the real reason (bad API key, wrong model name, quota, timeout, schema mismatch, etc.) —
    // previously this was a bare `catch {}` so every AI failure was invisible and looked
    // identical to "AI is just giving generic guesses" from the user's side.
    logger.error({ err: error, occasion, prompt, model: GEMINI_MODEL }, 'Gemini suggestOutfits failed, degrading to rule-based generator');
    const fallback = await generateOutfits(userId, occasion, 6);
    return fallback.map((outfit) => ({ ...outfit, aiUnavailableReason: 'ai_error' }));
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
  // See the timeout note on the signup transaction in auth/service.js — same reasoning here:
  // this transaction does up to 3 sequential round trips (ownership check, outfit create,
  // favorite create), which is enough to occasionally exceed Prisma's 5s default against Neon.
  return prisma.$transaction(async (tx) => {
    const ownedItems = await tx.clothingItem.findMany({
      where: { id: { in: data.clothingItemIds }, userId },
      select: { id: true },
    });

    if (ownedItems.length !== data.clothingItemIds.length) throw notFoundError();

    const outfit = await tx.outfit.create({
      data: {
        userId,
        occasion: data.occasion,
        aiReason: data.aiReason,
        weatherTag: data.weatherTag || null,
        isFavorite: Boolean(data.isFavorite),
        items: { create: data.clothingItemIds.map((clothingItemId) => ({ clothingItemId })) },
      },
      include: outfitWithItems,
    });

    // Saving and favoriting used to be two separate requests (save, then a follow-up
    // PATCH .../favorite) — a suggestion couldn't be favorited until it existed as a saved
    // row. Creating the Favorite record here, in the same transaction as the outfit, lets a
    // suggestion be favorited directly without a prior save step, and keeps outfit.isFavorite
    // and the Favorite table consistent from the moment the outfit is created.
    if (data.isFavorite) await tx.favorite.create({ data: { userId, outfitId: outfit.id } });

    return outfit;
  }, { timeout: 15000 });
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
  }, { timeout: 15000 });
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
