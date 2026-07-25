-- Expand the Pattern enum: the previous 9 values (Solid/Striped/Checked/Floral/Plaid/
-- Graphic/Animal/Dots/Other) covered apparel reasonably well but had nothing for footwear
-- and other pattern styles that don't fit those buckets (mesh knit textures, camo, colorblock
-- panels, gradients, metallics, etc).
ALTER TYPE "Pattern" ADD VALUE IF NOT EXISTS 'CAMOUFLAGE';
ALTER TYPE "Pattern" ADD VALUE IF NOT EXISTS 'COLORBLOCK';
ALTER TYPE "Pattern" ADD VALUE IF NOT EXISTS 'GEOMETRIC';
ALTER TYPE "Pattern" ADD VALUE IF NOT EXISTS 'TEXTURED';
ALTER TYPE "Pattern" ADD VALUE IF NOT EXISTS 'TIE_DYE';
ALTER TYPE "Pattern" ADD VALUE IF NOT EXISTS 'OMBRE';
ALTER TYPE "Pattern" ADD VALUE IF NOT EXISTS 'METALLIC';

-- Free-text descriptor for the actual colorway, e.g. "Black & white" or "Navy with red trim".
-- The Color enum stays a small, filterable set (so wardrobe filters/search stay usable), and
-- MULTICOLOR remains the enum value for anything with more than one dominant color — but
-- colorDetail now captures which colors those actually are instead of losing that detail.
ALTER TABLE "ClothingItem" ADD COLUMN "colorDetail" TEXT;
