import { z } from 'zod';

// Define enums corresponding to Prisma schema
const CategoryEnum = z.enum(['TOPS', 'BOTTOMS', 'OUTERWEAR', 'FOOTWEAR', 'ACCESSORIES', 'UNDERWEAR', 'OTHER']);
const ColorEnum = z.enum([
  'BLACK',
  'WHITE',
  'GREY',
  'BEIGE',
  'BROWN',
  'NAVY',
  'BLUE',
  'GREEN',
  'RED',
  'YELLOW',
  'PINK',
  'PURPLE',
  'ORANGE',
  'MULTICOLOR',
]);
const FabricEnum = z.enum(['COTTON', 'DENIM', 'LINEN', 'WOOL', 'SILK', 'LEATHER', 'SYNTHETIC', 'KNIT', 'VELVET', 'OTHER']);
const PatternEnum = z.enum(['SOLID', 'STRIPED', 'CHECKED', 'FLORAL', 'PLAID', 'GRAPHIC', 'ANIMAL', 'DOTS', 'OTHER']);
const SeasonEnum = z.enum(['SPRING', 'SUMMER', 'AUTUMN', 'WINTER', 'ALL_SEASON']);
const OccasionEnum = z.enum(['CASUAL', 'FORMAL', 'BUSINESS', 'SPORT', 'PARTY', 'LOUNGE']);
const LaundryStatusEnum = z.enum(['AVAILABLE', 'DIRTY', 'WASHING', 'IRONING', 'UNAVAILABLE']);

export const wardrobeQuerySchema = z.object({
  category: CategoryEnum.optional(),
  color: ColorEnum.optional(),
  occasion: OccasionEnum.optional(),
  brand: z.string().trim().max(100).optional(),
  season: SeasonEnum.optional(),
  laundryStatus: LaundryStatusEnum.optional(),
  isFavorite: z.enum(['true', 'false']).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(['newest', 'oldest', 'name-asc', 'name-desc']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

export const createClothingItemSchema = z.object({
  category: CategoryEnum.default('OTHER'),
  subcategory: z.string().trim().min(1, 'Subcategory is required').default('Other'),
  color: ColorEnum.default('MULTICOLOR'),
  brand: z.string().optional().nullable(),
  fabric: FabricEnum.default('OTHER'),
  pattern: PatternEnum.default('OTHER'),
  season: SeasonEnum.default('ALL_SEASON'),
  occasionTags: z.array(OccasionEnum).min(1, 'At least one occasion tag is required').default(['CASUAL']),
  isFavorite: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  purchaseDate: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  notes: z.string().optional().nullable(),
  laundryStatus: LaundryStatusEnum.default('AVAILABLE'),
});

export const updateClothingItemSchema = createClothingItemSchema.partial();
