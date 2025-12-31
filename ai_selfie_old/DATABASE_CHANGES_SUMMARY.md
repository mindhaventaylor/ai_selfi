# Database Schema Changes Summary

## Overview
This document summarizes all the database changes needed based on the entire application conversation. These changes support:
- Model training with image uploads
- Photo generation with detailed parameters
- Coupon and gift card systems
- Credit tracking and history
- Payment processing with discounts

## Files Created

1. **`drizzle/migrations/0002_comprehensive_schema_updates.sql`** - Complete SQL migration script
2. **`database_schema_analysis.md`** - Detailed analysis document
3. **`DATABASE_CHANGES_SUMMARY.md`** - This file

## Changes Summary

### ✅ New Tables (6 tables)

1. **`model_training_images`** - Stores individual training images (1-5 per model)
2. **`photo_generation_batches`** - Tracks generation sessions (multiple photos per batch)
3. **`coupons`** - Coupon codes for discounts
4. **`coupon_redemptions`** - Tracks coupon usage
5. **`gift_cards`** - Gift card purchases and redemptions
6. **`credit_history`** - Complete audit trail of credit changes

### ✅ New Enums (3 enums)

1. **`coupon_discount_type`** - percentage, fixed_amount, credits
2. **`gift_card_status`** - pending, active, redeemed, expired
3. **`credit_history_type`** - purchase, gift_card, coupon, generation, training, refund, admin_adjustment

### ✅ Modified Tables

#### **`models` table** - Added 4 columns:
- `gender` (text) - "hombre" | "mujer"
- `previewImageUrl` (text) - For displaying in ViewModels
- `trainingCreditsUsed` (integer) - Credits spent on training
- `imagesCount` (integer) - Number of training images (1-5)

#### **`photos` table** - Added 11 columns:
- `generationBatchId` (integer) - Links to generation batch
- `creditsUsed` (integer) - Credits spent
- `aspectRatio` (text) - "1:1" | "9:16" | "16:9"
- `glasses` (text) - "yes" | "no"
- `hairColor` (text) - "default" | "black" | "brown" | "blonde" | "red"
- `hairStyle` (text) - "no-preference" | "short" | "medium" | "long" | "curly"
- `backgrounds` (jsonb) - Array of selected backgrounds
- `styles` (jsonb) - Array of selected styles
- `referenceImageId` (integer) - Reference image used
- `downloadCount` (integer) - Download tracking
- `isFavorite` (boolean) - Favorites/bookmarks

#### **`transactions` table** - Added 3 columns:
- `couponId` (integer) - If coupon was used
- `giftCardId` (integer) - If gift card was purchased
- `creditsAwarded` (integer) - Credits given in transaction

## How to Apply Changes

### Option 1: Run SQL Migration (Recommended)
1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `drizzle/migrations/0002_comprehensive_schema_updates.sql`
3. Paste and run the script
4. Verify all tables and columns were created

### Option 2: Use Drizzle Kit (If configured)
```bash
npx drizzle-kit push
```

## Important Notes

1. **Foreign Key Constraints**: The SQL migration includes proper foreign key constraints with appropriate CASCADE/SET NULL behaviors

2. **Indexes**: Performance indexes are created for frequently queried columns

3. **Data Types**: 
   - JSONB is used for arrays (backgrounds, styles) for flexibility
   - Enums are used where values are fixed sets
   - Timestamps use `timestamp with time zone` for proper timezone handling

4. **Circular References**: The `gift_cards.transactionId` FK is handled in the SQL migration to avoid circular dependency issues

5. **Backward Compatibility**: All new columns have defaults or are nullable, so existing data won't break

## Next Steps

1. ✅ Run the SQL migration in Supabase
2. ✅ Update your application code to use the new schema
3. ✅ Update API endpoints to handle new fields
4. ✅ Test model training with image uploads
5. ✅ Test photo generation with all parameters
6. ✅ Implement coupon redemption logic
7. ✅ Implement gift card purchase/redemption flow
8. ✅ Add credit history tracking to all credit operations

## Questions?

If you need clarification on any table or relationship, refer to:
- `database_schema_analysis.md` - Detailed breakdown
- `drizzle/schema.ts` - TypeScript type definitions
- SQL migration file - Actual database structure

