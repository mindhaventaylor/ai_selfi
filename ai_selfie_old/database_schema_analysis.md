# Database Schema Analysis & Required Changes

Based on the entire chat history, here are the missing tables, attributes, and relationships needed:

## 1. MODELS TABLE - Missing Attributes

**Current:** Has basic fields
**Missing:**
- `gender` (hombre/mujer) - Selected during training
- `previewImageUrl` - For displaying in ViewModels page
- `trainingCreditsUsed` - Track credits spent on training
- `imagesCount` - Number of training images uploaded (1-5)

## 2. NEW TABLE: model_training_images

**Purpose:** Store individual images uploaded for training a model (1-5 images per model)

```sql
create table public.model_training_images (
  id serial not null,
  "modelId" integer not null,
  "imageUrl" text not null,
  "imageOrder" integer not null, -- 1-5, order of upload
  "fileSize" integer null, -- in bytes
  "fileName" text null,
  "createdAt" timestamp with time zone not null default now(),
  constraint model_training_images_pkey primary key (id),
  constraint model_training_images_modelId_fkey foreign key ("modelId") 
    references models (id) on delete cascade
) TABLESPACE pg_default;
```

## 3. PHOTOS TABLE - Missing Attributes

**Current:** Has basic fields
**Missing:**
- `creditsUsed` - Credits spent to generate this photo
- `aspectRatio` - "1:1" | "9:16" | "16:9"
- `glasses` - "yes" | "no"
- `hairColor` - "default" | "black" | "brown" | "blonde" | "red"
- `hairStyle` - "no-preference" | "short" | "medium" | "long" | "curly"
- `backgrounds` - JSON array of selected backgrounds
- `styles` - JSON array of selected styles
- `referenceImageId` - Reference to the selected image used (from exampleImages)
- `downloadCount` - Number of times downloaded
- `isFavorite` - Boolean for favorites/bookmarks
- `generationBatchId` - Link to generation batch (see below)

## 4. NEW TABLE: photo_generation_batches

**Purpose:** Track a single generation session where user selects multiple reference images and generates 4 images per reference

```sql
create table public.photo_generation_batches (
  id serial not null,
  "userId" integer not null,
  "modelId" integer not null,
  "totalImagesGenerated" integer not null, -- Total images in this batch
  "creditsUsed" integer not null, -- Total credits used
  "aspectRatio" text not null, -- "1:1" | "9:16" | "16:9"
  "glasses" text not null, -- "yes" | "no"
  "hairColor" text null,
  "hairStyle" text null,
  "backgrounds" jsonb null, -- Array of selected backgrounds
  "styles" jsonb null, -- Array of selected styles
  "status" text not null default 'generating', -- "generating" | "completed" | "failed"
  "createdAt" timestamp with time zone not null default now(),
  "completedAt" timestamp with time zone null,
  constraint photo_generation_batches_pkey primary key (id),
  constraint photo_generation_batches_userId_fkey foreign key ("userId") 
    references users (id) on delete cascade,
  constraint photo_generation_batches_modelId_fkey foreign key ("modelId") 
    references models (id) on delete set null
) TABLESPACE pg_default;
```

## 5. NEW TABLE: coupons

**Purpose:** Store coupon codes for discounts

```sql
create table public.coupons (
  id serial not null,
  "code" text not null unique,
  "description" text null,
  "discountType" text not null, -- "percentage" | "fixed_amount" | "credits"
  "discountValue" numeric(10, 2) not null, -- Percentage (0-100) or fixed amount or credits
  "maxUses" integer null, -- Null = unlimited
  "usedCount" integer not null default 0,
  "validFrom" timestamp with time zone not null,
  "validUntil" timestamp with time zone null, -- Null = no expiration
  "isActive" boolean not null default true,
  "createdAt" timestamp with time zone not null default now(),
  constraint coupons_pkey primary key (id)
) TABLESPACE pg_default;
```

## 6. NEW TABLE: coupon_redemptions

**Purpose:** Track when users redeem coupons

```sql
create table public.coupon_redemptions (
  id serial not null,
  "userId" integer not null,
  "couponId" integer not null,
  "creditsAwarded" integer null, -- If coupon gives credits
  "discountApplied" numeric(10, 2) null, -- If coupon gives discount
  "transactionId" integer null, -- Link to transaction if used for purchase
  "redeemedAt" timestamp with time zone not null default now(),
  constraint coupon_redemptions_pkey primary key (id),
  constraint coupon_redemptions_userId_fkey foreign key ("userId") 
    references users (id) on delete cascade,
  constraint coupon_redemptions_couponId_fkey foreign key ("couponId") 
    references coupons (id) on delete cascade,
  constraint coupon_redemptions_transactionId_fkey foreign key ("transactionId") 
    references transactions (id) on delete set null
) TABLESPACE pg_default;
```

## 7. NEW TABLE: gift_cards

**Purpose:** Store gift card purchases and codes

```sql
create table public.gift_cards (
  id serial not null,
  "code" text not null unique, -- Unique gift card code
  "purchasedByUserId" integer null, -- Who bought it (null if bought without account)
  "purchasedByEmail" text null, -- Email of purchaser if no account
  "recipientEmail" text null, -- Who it's for
  "creditPackId" integer null, -- Which credit pack (Starter, Pro, Premium)
  "credits" integer not null, -- Credits this gift card gives
  "price" numeric(10, 2) not null, -- Price paid
  "status" text not null default 'pending', -- "pending" | "active" | "redeemed" | "expired"
  "redeemedByUserId" integer null, -- Who redeemed it
  "redeemedAt" timestamp with time zone null,
  "expiresAt" timestamp with time zone null,
  "transactionId" integer null, -- Link to purchase transaction
  "createdAt" timestamp with time zone not null default now(),
  constraint gift_cards_pkey primary key (id),
  constraint gift_cards_purchasedByUserId_fkey foreign key ("purchasedByUserId") 
    references users (id) on delete set null,
  constraint gift_cards_creditPackId_fkey foreign key ("creditPackId") 
    references credit_packs (id) on delete set null,
  constraint gift_cards_redeemedByUserId_fkey foreign key ("redeemedByUserId") 
    references users (id) on delete set null,
  constraint gift_cards_transactionId_fkey foreign key ("transactionId") 
    references transactions (id) on delete set null
) TABLESPACE pg_default;
```

## 8. NEW TABLE: credit_history

**Purpose:** Track all credit additions and deductions for better analytics and transparency

```sql
create table public.credit_history (
  id serial not null,
  "userId" integer not null,
  "amount" integer not null, -- Positive = added, Negative = deducted
  "type" text not null, -- "purchase" | "gift_card" | "coupon" | "generation" | "training" | "refund" | "admin_adjustment"
  "description" text null,
  "relatedTransactionId" integer null, -- Link to transaction if applicable
  "relatedPhotoId" integer null, -- Link to photo if used for generation
  "relatedModelId" integer null, -- Link to model if used for training
  "relatedGiftCardId" integer null, -- Link to gift card if redeemed
  "relatedCouponId" integer null, -- Link to coupon if redeemed
  "createdAt" timestamp with time zone not null default now(),
  constraint credit_history_pkey primary key (id),
  constraint credit_history_userId_fkey foreign key ("userId") 
    references users (id) on delete cascade,
  constraint credit_history_relatedTransactionId_fkey foreign key ("relatedTransactionId") 
    references transactions (id) on delete set null,
  constraint credit_history_relatedPhotoId_fkey foreign key ("relatedPhotoId") 
    references photos (id) on delete set null,
  constraint credit_history_relatedModelId_fkey foreign key ("relatedModelId") 
    references models (id) on delete set null,
  constraint credit_history_relatedGiftCardId_fkey foreign key ("relatedGiftCardId") 
    references gift_cards (id) on delete set null,
  constraint credit_history_relatedCouponId_fkey foreign key ("relatedCouponId") 
    references coupons (id) on delete set null
) TABLESPACE pg_default;
```

## 9. TRANSACTIONS TABLE - Missing Attributes

**Current:** Has basic fields
**Missing:**
- `couponId` - If coupon was used
- `giftCardId` - If gift card was purchased
- `creditsAwarded` - Credits given in this transaction

## 10. NEW ENUM: Add coupon_discount_type enum

```sql
create type public.coupon_discount_type as enum ('percentage', 'fixed_amount', 'credits');
```

## 11. NEW ENUM: Add gift_card_status enum

```sql
create type public.gift_card_status as enum ('pending', 'active', 'redeemed', 'expired');
```

## 12. NEW ENUM: Add credit_history_type enum

```sql
create type public.credit_history_type as enum (
  'purchase', 
  'gift_card', 
  'coupon', 
  'generation', 
  'training', 
  'refund', 
  'admin_adjustment'
);
```

## Summary of Changes Needed:

### Tables to CREATE:
1. `model_training_images` - Store training images
2. `photo_generation_batches` - Track generation sessions
3. `coupons` - Coupon codes
4. `coupon_redemptions` - Coupon usage tracking
5. `gift_cards` - Gift card management
6. `credit_history` - Credit tracking

### Tables to ALTER:
1. `models` - Add gender, previewImageUrl, trainingCreditsUsed, imagesCount
2. `photos` - Add creditsUsed, aspectRatio, glasses, hairColor, hairStyle, backgrounds, styles, referenceImageId, downloadCount, isFavorite, generationBatchId
3. `transactions` - Add couponId, giftCardId, creditsAwarded

### Enums to CREATE:
1. `coupon_discount_type`
2. `gift_card_status`
3. `credit_history_type`

