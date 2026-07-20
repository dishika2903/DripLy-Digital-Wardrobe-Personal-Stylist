import bcrypt from 'bcryptjs';
import prisma from '../src/config/db.js';

const photos = ['photo-1521572163474-6864f9cf17ab','photo-1542291026-7eec264c27ff','photo-1506629905607-d405b7a30db6','photo-1515372039744-b8f02a3ae446','photo-1539109136881-3be0616acf4b'];
const specs = [
  ['TOPS','fitted white tee','WHITE','COTTON','SOLID'], ['TOPS','oversized graphic tee','BLACK','COTTON','GRAPHIC'], ['TOPS','blue button-down','BLUE','COTTON','SOLID'], ['BOTTOMS','wide-leg jeans','BLUE','DENIM','SOLID'], ['BOTTOMS','black straight trousers','BLACK','SYNTHETIC','SOLID'], ['BOTTOMS','beige chinos','BEIGE','COTTON','SOLID'], ['OUTERWEAR','navy blazer','NAVY','WOOL','SOLID'], ['OUTERWEAR','denim jacket','BLUE','DENIM','SOLID'], ['FOOTWEAR','white sneakers','WHITE','LEATHER','SOLID'], ['FOOTWEAR','black ankle boots','BLACK','LEATHER','SOLID'], ['ACCESSORIES','brown leather belt','BROWN','LEATHER','SOLID'], ['ACCESSORIES','black crossbody bag','BLACK','LEATHER','SOLID'], ['OTHER','floral midi dress','PINK','SILK','FLORAL'], ['OTHER','black jumpsuit','BLACK','SYNTHETIC','SOLID'], ['TOPS','cream knit sweater','BEIGE','KNIT','SOLID'], ['BOTTOMS','plaid skirt','GREY','WOOL','PLAID']
];

async function main() {
  const passwordHash = await bcrypt.hash('DripLyTest123!', 10);
  const user = await prisma.user.upsert({ where: { email: 'test@driply.dev' }, update: { passwordHash }, create: { email: 'test@driply.dev', name: 'DripLy Tester', passwordHash } });
  await prisma.outfit.deleteMany({ where: { userId: user.id } }); await prisma.clothingItem.deleteMany({ where: { userId: user.id } });
  const items = await Promise.all(specs.map(([category, subcategory, color, fabric, pattern], index) => prisma.clothingItem.create({ data: { userId: user.id, category, subcategory, color, fabric, pattern, season: 'ALL_SEASON', occasionTags: ['CASUAL','PARTY'], imageUrl: `https://images.unsplash.com/${photos[index % photos.length]}?auto=format&fit=crop&w=700&q=80` } })));
  for (const [index, ids, rating] of [[0, [0,3,8], 1], [1, [2,4,9], null]]) await prisma.outfit.create({ data: { userId: user.id, occasion: 'CASUAL', aiReason: 'Seeded outfit for testing the saved look and feedback flow.', aiRating: rating, items: { create: ids.map((item) => ({ clothingItemId: items[item].id })) } } });
  console.log('Seeded test@driply.dev / DripLyTest123!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
