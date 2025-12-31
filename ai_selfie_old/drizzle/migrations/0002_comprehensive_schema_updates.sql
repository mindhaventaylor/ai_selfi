-- ============================================
-- COMPREHENSIVE DATABASE SCHEMA UPDATES
-- Based on application requirements
-- ============================================

-- 1. CREATE NEW ENUMS
-- ============================================

CREATE TYPE public.coupon_discount_type AS ENUM ('percentage', 'fixed_amount', 'credits');
CREATE TYPE public.gift_card_status AS ENUM ('pending', 'active', 'redeemed', 'expired');
CREATE TYPE public.credit_history_type AS ENUM (
  'purchase', 
  'gift_card', 
  'coupon', 
  'generation', 
  'training', 
  'refund', 
  'admin_adjustment'
);

-- 2. ALTER EXISTING TABLES
-- ============================================

-- Add missing columns to models table
ALTER TABLE public.models 
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('hombre', 'mujer')),
ADD COLUMN IF NOT EXISTS "previewImageUrl" text,
ADD COLUMN IF NOT EXISTS "trainingCreditsUsed" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "imagesCount" integer CHECK ("imagesCount" >= 1 AND "imagesCount" <= 5);

-- Add missing columns to photos table
ALTER TABLE public.photos 
ADD COLUMN IF NOT EXISTS "creditsUsed" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "aspectRatio" text CHECK ("aspectRatio" IN ('1:1', '9:16', '16:9')),
ADD COLUMN IF NOT EXISTS glasses text CHECK (glasses IN ('yes', 'no')),
ADD COLUMN IF NOT EXISTS "hairColor" text CHECK ("hairColor" IN ('default', 'black', 'brown', 'blonde', 'red')),
ADD COLUMN IF NOT EXISTS "hairStyle" text CHECK ("hairStyle" IN ('no-preference', 'short', 'medium', 'long', 'curly')),
ADD COLUMN IF NOT EXISTS backgrounds jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS styles jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "referenceImageId" integer,
ADD COLUMN IF NOT EXISTS "downloadCount" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "isFavorite" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "generationBatchId" integer;

-- Add missing columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS "couponId" integer,
ADD COLUMN IF NOT EXISTS "giftCardId" integer,
ADD COLUMN IF NOT EXISTS "creditsAwarded" integer DEFAULT 0;

-- 3. CREATE NEW TABLES
-- ============================================

-- Model Training Images
CREATE TABLE IF NOT EXISTS public.model_training_images (
  id serial NOT NULL,
  "modelId" integer NOT NULL,
  "imageUrl" text NOT NULL,
  "imageOrder" integer NOT NULL CHECK ("imageOrder" >= 1 AND "imageOrder" <= 5),
  "fileSize" integer,
  "fileName" text,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT model_training_images_pkey PRIMARY KEY (id),
  CONSTRAINT model_training_images_modelId_fkey FOREIGN KEY ("modelId") 
    REFERENCES public.models (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Photo Generation Batches
CREATE TABLE IF NOT EXISTS public.photo_generation_batches (
  id serial NOT NULL,
  "userId" integer NOT NULL,
  "modelId" integer NOT NULL,
  "totalImagesGenerated" integer NOT NULL,
  "creditsUsed" integer NOT NULL,
  "aspectRatio" text NOT NULL CHECK ("aspectRatio" IN ('1:1', '9:16', '16:9')),
  "glasses" text NOT NULL CHECK (glasses IN ('yes', 'no')),
  "hairColor" text CHECK ("hairColor" IN ('default', 'black', 'brown', 'blonde', 'red')),
  "hairStyle" text CHECK ("hairStyle" IN ('no-preference', 'short', 'medium', 'long', 'curly')),
  "backgrounds" jsonb DEFAULT '[]'::jsonb,
  "styles" jsonb DEFAULT '[]'::jsonb,
  "status" text NOT NULL DEFAULT 'generating' CHECK ("status" IN ('generating', 'completed', 'failed')),
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "completedAt" timestamp with time zone,
  CONSTRAINT photo_generation_batches_pkey PRIMARY KEY (id),
  CONSTRAINT photo_generation_batches_userId_fkey FOREIGN KEY ("userId") 
    REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT photo_generation_batches_modelId_fkey FOREIGN KEY ("modelId") 
    REFERENCES public.models (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id serial NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  "discountType" public.coupon_discount_type NOT NULL,
  "discountValue" numeric(10, 2) NOT NULL,
  "maxUses" integer,
  "usedCount" integer NOT NULL DEFAULT 0,
  "validFrom" timestamp with time zone NOT NULL,
  "validUntil" timestamp with time zone,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT coupons_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Coupon Redemptions
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id serial NOT NULL,
  "userId" integer NOT NULL,
  "couponId" integer NOT NULL,
  "creditsAwarded" integer,
  "discountApplied" numeric(10, 2),
  "transactionId" integer,
  "redeemedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT coupon_redemptions_pkey PRIMARY KEY (id),
  CONSTRAINT coupon_redemptions_userId_fkey FOREIGN KEY ("userId") 
    REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT coupon_redemptions_couponId_fkey FOREIGN KEY ("couponId") 
    REFERENCES public.coupons (id) ON DELETE CASCADE,
  CONSTRAINT coupon_redemptions_transactionId_fkey FOREIGN KEY ("transactionId") 
    REFERENCES public.transactions (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Gift Cards
CREATE TABLE IF NOT EXISTS public.gift_cards (
  id serial NOT NULL,
  code text NOT NULL UNIQUE,
  "purchasedByUserId" integer,
  "purchasedByEmail" text,
  "recipientEmail" text,
  "creditPackId" integer,
  credits integer NOT NULL,
  price numeric(10, 2) NOT NULL,
  status public.gift_card_status NOT NULL DEFAULT 'pending',
  "redeemedByUserId" integer,
  "redeemedAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  "transactionId" integer,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT gift_cards_pkey PRIMARY KEY (id),
  CONSTRAINT gift_cards_purchasedByUserId_fkey FOREIGN KEY ("purchasedByUserId") 
    REFERENCES public.users (id) ON DELETE SET NULL,
  CONSTRAINT gift_cards_creditPackId_fkey FOREIGN KEY ("creditPackId") 
    REFERENCES public.credit_packs (id) ON DELETE SET NULL,
  CONSTRAINT gift_cards_redeemedByUserId_fkey FOREIGN KEY ("redeemedByUserId") 
    REFERENCES public.users (id) ON DELETE SET NULL,
  CONSTRAINT gift_cards_transactionId_fkey FOREIGN KEY ("transactionId") 
    REFERENCES public.transactions (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Credit History
CREATE TABLE IF NOT EXISTS public.credit_history (
  id serial NOT NULL,
  "userId" integer NOT NULL,
  amount integer NOT NULL,
  type public.credit_history_type NOT NULL,
  description text,
  "relatedTransactionId" integer,
  "relatedPhotoId" integer,
  "relatedModelId" integer,
  "relatedGiftCardId" integer,
  "relatedCouponId" integer,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT credit_history_pkey PRIMARY KEY (id),
  CONSTRAINT credit_history_userId_fkey FOREIGN KEY ("userId") 
    REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT credit_history_relatedTransactionId_fkey FOREIGN KEY ("relatedTransactionId") 
    REFERENCES public.transactions (id) ON DELETE SET NULL,
  CONSTRAINT credit_history_relatedPhotoId_fkey FOREIGN KEY ("relatedPhotoId") 
    REFERENCES public.photos (id) ON DELETE SET NULL,
  CONSTRAINT credit_history_relatedModelId_fkey FOREIGN KEY ("relatedModelId") 
    REFERENCES public.models (id) ON DELETE SET NULL,
  CONSTRAINT credit_history_relatedGiftCardId_fkey FOREIGN KEY ("relatedGiftCardId") 
    REFERENCES public.gift_cards (id) ON DELETE SET NULL,
  CONSTRAINT credit_history_relatedCouponId_fkey FOREIGN KEY ("relatedCouponId") 
    REFERENCES public.coupons (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- 4. ADD FOREIGN KEY CONSTRAINTS TO EXISTING TABLES
-- ============================================

-- Add foreign key for photos.generationBatchId
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'photos_generationBatchId_fkey'
  ) THEN
    ALTER TABLE public.photos 
    ADD CONSTRAINT photos_generationBatchId_fkey 
    FOREIGN KEY ("generationBatchId") 
    REFERENCES public.photo_generation_batches (id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add foreign keys for transactions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'transactions_couponId_fkey'
  ) THEN
    ALTER TABLE public.transactions 
    ADD CONSTRAINT transactions_couponId_fkey 
    FOREIGN KEY ("couponId") 
    REFERENCES public.coupons (id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'transactions_giftCardId_fkey'
  ) THEN
    ALTER TABLE public.transactions 
    ADD CONSTRAINT transactions_giftCardId_fkey 
    FOREIGN KEY ("giftCardId") 
    REFERENCES public.gift_cards (id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_model_training_images_modelId ON public.model_training_images ("modelId");
CREATE INDEX IF NOT EXISTS idx_photo_generation_batches_userId ON public.photo_generation_batches ("userId");
CREATE INDEX IF NOT EXISTS idx_photo_generation_batches_modelId ON public.photo_generation_batches ("modelId");
CREATE INDEX IF NOT EXISTS idx_photos_generationBatchId ON public.photos ("generationBatchId");
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (code);
CREATE INDEX IF NOT EXISTS idx_coupons_isActive ON public.coupons ("isActive");
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_userId ON public.coupon_redemptions ("userId");
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_couponId ON public.coupon_redemptions ("couponId");
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON public.gift_cards (code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON public.gift_cards (status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_redeemedByUserId ON public.gift_cards ("redeemedByUserId");
CREATE INDEX IF NOT EXISTS idx_credit_history_userId ON public.credit_history ("userId");
CREATE INDEX IF NOT EXISTS idx_credit_history_type ON public.credit_history (type);
CREATE INDEX IF NOT EXISTS idx_credit_history_createdAt ON public.credit_history ("createdAt");

-- 6. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.model_training_images IS 'Stores individual images uploaded for training a model (1-5 images per model)';
COMMENT ON TABLE public.photo_generation_batches IS 'Tracks a single generation session where user selects multiple reference images and generates 4 images per reference';
COMMENT ON TABLE public.coupons IS 'Stores coupon codes for discounts and promotions';
COMMENT ON TABLE public.coupon_redemptions IS 'Tracks when users redeem coupons';
COMMENT ON TABLE public.gift_cards IS 'Stores gift card purchases and redemptions';
COMMENT ON TABLE public.credit_history IS 'Tracks all credit additions and deductions for analytics and transparency';

