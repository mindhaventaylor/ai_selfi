# Variant Pricing Setup

This document explains how to set up and use the variant pricing table for dynamic pricing management.

## Overview

The `variant_pricing` table allows you to manage prices dynamically from the database instead of hardcoding them in the application. This makes it easier to:

- Update prices without code changes
- Support A/B testing with different pricing
- Have different prices for different currencies
- Manage discounts and old prices

## Database Setup

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Open and run the SQL file: `supabase/create_variant_pricing.sql`

### Option 2: Using Drizzle Kit

Run the migration using Drizzle:

```bash
npm run db:push
```

This will push the schema changes to your database.

## Schema

The `variant_pricing` table has the following columns:

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `packKey` | TEXT | Pack identifier (e.g., "starter", "pro", "premium", "basic", "standard") |
| `variant` | TEXT | Page variant ("page1" or "page2") |
| `currency` | TEXT | Currency code ("USD" or "EUR") |
| `price` | INTEGER | Current price in cents |
| `oldPrice` | INTEGER | Original price before discount (optional) |
| `credits` | INTEGER | Number of credits/photos (for page2 variant) |
| `isActive` | BOOLEAN | Whether this pricing is currently active |
| `createdAt` | TIMESTAMP | When the pricing was created |
| `updatedAt` | TIMESTAMP | When the pricing was last updated |

## Default Pricing

The migration includes default pricing data:

### Page 1 Variant
- **Starter**: $5.00 / €5.00 (no discount)
- **Pro**: $10.00 / €10.00 (originally $20.00 / €20.00)
- **Premium**: $15.00 / €15.00 (originally $30.00 / €30.00)
- **Business**: $15.00 / €15.00 (no discount)

### Page 2 Variant
- **Basic**: $5.00 / €5.00 (40 photos, no discount)
- **Standard**: $10.00 / €10.00 (60 photos, originally $15.00 / €15.00)
- **Premium**: $15.00 / €15.00 (100 photos, originally $30.00 / €30.00)

## How It Works

1. **Client-side**: The `currency.ts` utility functions now fetch prices from the database via tRPC
2. **Server-side**: The `pricing` router in `server/routers.ts` handles database queries
3. **Caching**: Prices are cached for 5 minutes to reduce database load
4. **Fallback**: If the database is unavailable, hardcoded fallback prices are used

## Updating Prices

To update prices, simply update the database records:

```sql
-- Update the price for a specific pack
UPDATE variant_pricing
SET price = 1200, "updatedAt" = NOW()
WHERE "packKey" = 'pro' 
  AND variant = 'page1' 
  AND currency = 'USD'
  AND "isActive" = true;
```

To add a discount:

```sql
-- Add a discount by setting oldPrice
UPDATE variant_pricing
SET "oldPrice" = 1500, price = 999, "updatedAt" = NOW()
WHERE "packKey" = 'basic' 
  AND variant = 'page2' 
  AND currency = 'USD'
  AND "isActive" = true;
```

To remove a discount:

```sql
-- Remove discount by setting oldPrice to NULL
UPDATE variant_pricing
SET "oldPrice" = NULL, "updatedAt" = NOW()
WHERE "packKey" = 'basic' 
  AND variant = 'page2' 
  AND currency = 'USD'
  AND "isActive" = true;
```

## A/B Testing

You can create multiple pricing entries and toggle them:

```sql
-- Create a new test pricing
INSERT INTO variant_pricing ("packKey", variant, currency, price, "oldPrice", credits, "isActive")
VALUES ('pro', 'page1', 'USD', 899, 1500, NULL, false);

-- Activate the test pricing
UPDATE variant_pricing SET "isActive" = false WHERE "packKey" = 'pro' AND variant = 'page1' AND currency = 'USD' AND id != <new_id>;
UPDATE variant_pricing SET "isActive" = true WHERE id = <new_id>;
```

## Files Changed

- `drizzle/schema.ts` - Added `variantPricing` table definition
- `drizzle/migrations/0011_create_variant_pricing.sql` - Migration file
- `supabase/create_variant_pricing.sql` - SQL file for Supabase
- `server/routers.ts` - Added `pricing` router
- `client/src/utils/currency.ts` - Updated to fetch from database
- `client/src/lib/trpc.ts` - Added vanilla tRPC client

## Notes

- All prices are stored in cents (e.g., 500 = $5.00)
- The caching mechanism reduces database load
- Fallback prices ensure the app works even if the database is unavailable
- The index on `(packKey, variant, currency, isActive)` ensures fast lookups

