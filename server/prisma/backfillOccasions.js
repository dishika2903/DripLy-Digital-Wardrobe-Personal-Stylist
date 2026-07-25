// One-time backfill: items added before occasion detection existed all default to
// occasionTags = ['CASUAL'] (the only tag the old form pre-selected). That's the real reason
// outfit suggestions look identical across Formal/Business/Party/Sport/Lounge — there's no
// tagged data to actually differentiate them yet. This infers reasonable occasion tags from
// each item's subcategory text and only touches items still sitting at that exact default, so
// anything you've already tagged by hand (or re-identified with the AI) is left untouched.
//
// Usage:
//   cd server
//   node prisma/backfillOccasions.js            # preview what would change, no writes
//   node prisma/backfillOccasions.js --apply     # actually update the database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// [keyword substring to look for in subcategory (lowercased), occasions to apply]
const rules = [
  [['saree', 'sari', 'lehenga', 'gown', 'tuxedo', 'sherwani'], ['FORMAL', 'PARTY']],
  [['blazer', 'suit', 'trouser', 'button-down', 'oxford shoe', 'derby shoe', 'chino'], ['BUSINESS', 'FORMAL']],
  [['bodycon', 'sequin', 'cocktail', 'clutch', 'stiletto', 'block heel', 'wedge heel', 'platform heel', 'going out'], ['PARTY']],
  [['sneaker', 'jogger', 'sweatpant', 'legging', 'running shoe', 'track', 'activewear', 'bike short', 'gym'], ['SPORT']],
  [['pajama', 'sleep', 'lounge', 'robe', 'slipper', 'undershirt', 'shapewear'], ['LOUNGE']],
];

const inferOccasions = (subcategory = '') => {
  const text = subcategory.toLowerCase();
  const matched = new Set();
  for (const [keywords, occasions] of rules) {
    if (keywords.some((keyword) => text.includes(keyword))) occasions.forEach((occasion) => matched.add(occasion));
  }
  // Nothing matched a special-case keyword: keep it simple and casual, which is a safe
  // default for everyday tops/bottoms/footwear.
  if (matched.size === 0) matched.add('CASUAL');
  // Loungewear shouldn't also read as casual streetwear, but most other categories reasonably
  // double as casual too unless they're clearly business/formal/party-only.
  if (!matched.has('LOUNGE') && !matched.has('FORMAL') && !matched.has('BUSINESS')) matched.add('CASUAL');
  return [...matched];
};

const run = async () => {
  const apply = process.argv.includes('--apply');
  const items = await prisma.clothingItem.findMany({
    where: { occasionTags: { equals: ['CASUAL'] } },
    select: { id: true, subcategory: true, category: true, occasionTags: true },
  });

  console.log(`Found ${items.length} item(s) still at the default ['CASUAL'] tag.\n`);

  for (const item of items) {
    const next = inferOccasions(item.subcategory);
    const changed = next.length !== 1 || next[0] !== 'CASUAL';
    console.log(`${changed ? '→' : ' '} ${item.subcategory} (${item.category}): ['CASUAL'] -> [${next.join(', ')}]`);
    if (apply && changed) {
      await prisma.clothingItem.update({ where: { id: item.id }, data: { occasionTags: next } });
    }
  }

  console.log(apply ? '\nDone — database updated.' : '\nDry run only — nothing was written. Re-run with --apply to save these changes.');
  await prisma.$disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
