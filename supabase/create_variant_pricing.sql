-- Drop existing table and related objects if they exist
DROP TABLE IF EXISTS "variant_pricing" CASCADE;
DROP INDEX IF EXISTS "idx_variant_pricing_lookup";

-- Create variant_pricing table for dynamic pricing
CREATE TABLE "variant_pricing" (
  "id" SERIAL PRIMARY KEY,
  "packKey" TEXT NOT NULL,
  "variant" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "oldPrice" INTEGER,
  "credits" INTEGER,
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for fast lookups
CREATE INDEX "idx_variant_pricing_lookup" ON "variant_pricing" ("packKey", "variant", "currency", "isActive");

-- Insert default pricing data for page1 variant (USD)
INSERT INTO "variant_pricing" ("packKey", "variant", "currency", "price", "oldPrice", "credits", "isActive") VALUES
  ('starter', 'page1', 'USD', 500, NULL, NULL, true),
  ('pro', 'page1', 'USD', 1000, 2000, NULL, true),
  ('premium', 'page1', 'USD', 1500, 3000, NULL, true),
  ('business', 'page1', 'USD', 1500, NULL, NULL, true);

-- Insert default pricing data for page2 variant (USD only - all pricing uses USD)
INSERT INTO "variant_pricing" ("packKey", "variant", "currency", "price", "oldPrice", "credits", "isActive") VALUES
  ('basic', 'page2', 'USD', 500, NULL, 40, true),
  ('standard', 'page2', 'USD', 1000, 1500, 60, true),
  ('premium', 'page2', 'USD', 1500, 3000, 100, true);

-- Function to get pricing (helper function for easy queries)
CREATE OR REPLACE FUNCTION get_variant_pricing(
  p_pack_key TEXT,
  p_variant TEXT,
  p_currency TEXT DEFAULT 'USD'
)
RETURNS TABLE (
  id INTEGER,
  pack_key TEXT,
  variant TEXT,
  currency TEXT,
  price INTEGER,
  old_price INTEGER,
  credits INTEGER,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vp.id,
    vp."packKey" as pack_key,
    vp.variant,
    vp.currency,
    vp.price,
    vp."oldPrice" as old_price,
    vp.credits,
    vp."isActive" as is_active
  FROM variant_pricing vp
  WHERE vp."packKey" = p_pack_key
    AND vp.variant = p_variant
    AND vp.currency = p_currency
    AND vp."isActive" = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

