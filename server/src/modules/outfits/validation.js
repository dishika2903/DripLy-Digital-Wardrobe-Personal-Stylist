import { z } from 'zod';

export const generateOutfitsSchema = z.object({
  occasion: z.enum(['CASUAL', 'FORMAL', 'BUSINESS', 'SPORT', 'PARTY', 'LOUNGE']).default('CASUAL'),
  limit: z.coerce.number().int().min(1).max(12).default(5),
});
