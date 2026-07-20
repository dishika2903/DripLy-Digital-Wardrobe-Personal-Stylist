import { z } from 'zod';

export const suggestOutfitsSchema = z.object({
  occasion: z.enum(['CASUAL', 'FORMAL', 'BUSINESS', 'SPORT', 'PARTY', 'LOUNGE']).optional(),
  prompt: z.string().trim().max(500).optional(),
}).refine((value) => value.occasion || value.prompt, { message: 'Choose an occasion or tell DripLy what you need.' });

export const rateOutfitSchema = z.object({ rating: z.union([z.literal(1), z.literal(-1)]) });

export const generateOutfitsSchema = z.object({
  occasion: z.enum(['CASUAL', 'FORMAL', 'BUSINESS', 'SPORT', 'PARTY', 'LOUNGE']).default('CASUAL'),
  limit: z.coerce.number().int().min(1).max(12).default(5),
});

const OccasionEnum = z.enum(['CASUAL', 'FORMAL', 'BUSINESS', 'SPORT', 'PARTY', 'LOUNGE']);

export const saveOutfitSchema = z.object({
  occasion: OccasionEnum,
  clothingItemIds: z.array(z.string().uuid()).min(1, 'At least one clothing item is required')
    .refine((ids) => new Set(ids).size === ids.length, 'Clothing items must be unique'),
  aiReason: z.string().trim().min(1, 'Outfit reasoning is required').max(1000),
  weatherTag: z.string().trim().max(100).optional().nullable(),
});

export const savedOutfitsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  favoritesOnly: z.enum(['true', 'false']).optional(),
});

export const updateOutfitFavoriteSchema = z.object({
  isFavorite: z.boolean(),
});
