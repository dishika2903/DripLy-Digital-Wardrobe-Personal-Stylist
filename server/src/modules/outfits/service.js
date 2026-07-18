import prisma from '../../config/db.js';

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
