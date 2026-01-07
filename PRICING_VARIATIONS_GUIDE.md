# Pricing Variations Guide

This guide explains how to manage and switch between different pricing variations using the `variant_pricing` table.

## Available Pricing Variations

| Variation | Starter/Basic | Pro/Standard | Premium |
|-----------|---------------|--------------|---------|
| **Variation 1** | $5 | $7 | $15 |
| **Variation 2** | $12 | $15 | $25 |
| **Variation 3** | $29 | $39 | $59 |
| **Variation 4** | $35 | $45 | $75 |

## Setup Instructions

### Step 1: Create the Table

First, run the table creation script (if not already done):

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/create_variant_pricing.sql
```

### Step 2: Add All Pricing Variations

Run the pricing variations script to insert all 4 variations:

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/add_pricing_variations.sql
```

This will:
- Deactivate any existing pricing
- Insert all 4 pricing variations (all inactive by default)
- You can then activate the one you want

### Step 3: Activate a Variation

To activate a specific variation, run the activation script:

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/activate_pricing_variation.sql
```

By default, it activates **Variation 1** ($5, $7, $15).

To activate a different variation, uncomment the appropriate section in the script.

## Quick Activation Commands

### Activate Variation 1 ($5, $7, $15)
```sql
UPDATE variant_pricing SET "isActive" = false WHERE currency = 'USD';
UPDATE variant_pricing SET "isActive" = true 
WHERE currency = 'USD' AND price IN (500, 700, 1500);
```

### Activate Variation 2 ($12, $15, $25)
```sql
UPDATE variant_pricing SET "isActive" = false WHERE currency = 'USD';
UPDATE variant_pricing SET "isActive" = true 
WHERE currency = 'USD' AND price IN (1200, 1500, 2500);
```

### Activate Variation 3 ($29, $39, $59)
```sql
UPDATE variant_pricing SET "isActive" = false WHERE currency = 'USD';
UPDATE variant_pricing SET "isActive" = true 
WHERE currency = 'USD' AND price IN (2900, 3900, 5900);
```

### Activate Variation 4 ($35, $45, $75)
```sql
UPDATE variant_pricing SET "isActive" = false WHERE currency = 'USD';
UPDATE variant_pricing SET "isActive" = true 
WHERE currency = 'USD' AND price IN (3500, 4500, 7500);
```

## Verify Active Pricing

To see which pricing is currently active:

```sql
SELECT 
  "packKey",
  "variant",
  price / 100.0 as price_usd,
  "oldPrice" / 100.0 as old_price_usd,
  credits,
  "isActive",
  "updatedAt"
FROM variant_pricing
WHERE currency = 'USD' AND "isActive" = true
ORDER BY price, "packKey";
```

## How It Works

1. **Database Storage**: All pricing variations are stored in the `variant_pricing` table
2. **Active Flag**: Only one variation should have `isActive = true` at a time
3. **Application**: The app automatically fetches active pricing via the tRPC endpoint
4. **Fallback**: If database is unavailable, the app uses hardcoded fallback prices ($5, $10, $15)
5. **Cache**: Pricing is cached for 5 minutes to reduce database load

## A/B Testing

To run A/B tests with different pricing:

1. Insert a new pricing variation with unique prices
2. Use the `isActive` flag to switch between variations
3. Track conversions by price point
4. Activate the best-performing variation

Example:
```sql
-- Add test variation
INSERT INTO "variant_pricing" ("packKey", "variant", "currency", "price", "oldPrice", "credits", "isActive") VALUES
  ('starter', 'page1', 'USD', 999, NULL, NULL, false),
  ('pro', 'page1', 'USD', 1999, NULL, NULL, false),
  ('premium', 'page1', 'USD', 2999, NULL, NULL, false);

-- Activate test variation
UPDATE variant_pricing SET "isActive" = false WHERE currency = 'USD';
UPDATE variant_pricing SET "isActive" = true WHERE price IN (999, 1999, 2999);
```

## Notes

- Prices are stored in cents (e.g., 500 = $5.00)
- The `updatedAt` timestamp tracks when pricing was last changed
- Both `page1` and `page2` variants use the same pricing structure
- The `business` pack follows the same price as `premium`
- Page2 credits remain constant (40, 60, 100) across all variations

## Updating Fallback Prices

If you want to update the hardcoded fallback prices in the code:

Edit `/client/src/utils/currency.ts`:

```typescript
const FALLBACK_PRICES = {
  page1: {
    starter: { price: 500, oldPrice: undefined },  // Change these values
    pro: { price: 700, oldPrice: undefined },
    premium: { price: 1500, oldPrice: undefined },
    business: { price: 1500, oldPrice: undefined },
  },
  page2: {
    basic: { price: 500, oldPrice: undefined, credits: 40 },
    standard: { price: 700, oldPrice: undefined, credits: 60 },
    premium: { price: 1500, oldPrice: undefined, credits: 100 },
  },
};
```

## Troubleshooting

**Pricing not updating?**
- Check that only one variation has `isActive = true`
- Clear the pricing cache (wait 5 minutes or restart the app)
- Verify the database connection is working

**App showing wrong prices?**
- Check active pricing with the verify query above
- Ensure `currency = 'USD'` (EUR is not currently used)
- Check browser console for any tRPC errors

