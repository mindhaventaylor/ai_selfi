-- Script to activate a specific pricing variation
-- Run one of the sections below to activate the desired variation

-- ============================================
-- PAGE2 VARIANT: $5, $7, $15
-- ============================================
-- Deactivate all
UPDATE variant_pricing SET "isActive" = false WHERE currency = 'USD';
-- Activate page2 variant
UPDATE variant_pricing 
SET "isActive" = true 
WHERE currency = 'USD' 
  AND "variant" = 'page2';

-- ============================================
-- PAGE3 VARIANT: $12, $15, $25
-- ============================================
-- Uncomment to activate:
-- UPDATE variant_pricing SET "isActive" = false WHERE currency = 'USD';
-- UPDATE variant_pricing 
-- SET "isActive" = true 
-- WHERE currency = 'USD' 
--   AND "variant" = 'page3';

-- ============================================
-- PAGE4 VARIANT: $29, $39, $59
-- ============================================
-- Uncomment to activate:
-- UPDATE variant_pricing SET "isActive" = false WHERE currency = 'USD';
-- UPDATE variant_pricing 
-- SET "isActive" = true 
-- WHERE currency = 'USD' 
--   AND "variant" = 'page4';

-- ============================================
-- PAGE5 VARIANT: $35, $45, $75
-- ============================================
-- Uncomment to activate:
-- UPDATE variant_pricing SET "isActive" = false WHERE currency = 'USD';
-- UPDATE variant_pricing 
-- SET "isActive" = true 
-- WHERE currency = 'USD' 
--   AND "variant" = 'page5';

-- ============================================
-- Verify active pricing
-- ============================================
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

