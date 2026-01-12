-- Add pricing variations to variant_pricing table
-- All prices in USD cents (multiply by 100)
-- 
-- Pricing Table by Variant:
-- page2: $5,  $7,  $15  (500, 700, 1500 cents)
-- page3: $12, $15, $25  (1200, 1500, 2500 cents)
-- page4: $29, $39, $59  (2900, 3900, 5900 cents)
-- page5: $35, $45, $75  (3500, 4500, 7500 cents)
--
-- All with 70% discount: oldPrice = CEIL((price / 0.3) / 100) * 100 (arredondado para cima para número inteiro)

-- First, deactivate existing pricing
UPDATE variant_pricing SET "isActive" = false WHERE "isActive" = true;

-- Page2 variant: $5, $7, $15 (500, 700, 1500 cents)
-- Cálculo: oldPrice = CEIL((price / 0.3) / 100) * 100 (valor original que com 70% desconto = price, arredondado para cima para número inteiro)
-- $5 / 0.3 = $16.67 → CEIL($16.67) = $17.00 → 1700, $7 / 0.3 = $23.33 → CEIL($23.33) = $24.00 → 2400, $15 / 0.3 = $50.00 → 5000
INSERT INTO "variant_pricing" ("packKey", "variant", "currency", "price", "oldPrice", "credits", "isActive") VALUES
  -- Page 1 variant (not used but keeping for compatibility)
  ('starter', 'page1', 'USD', 500, 1700, NULL, false),
  ('pro', 'page1', 'USD', 700, 2400, NULL, false),
  ('premium', 'page1', 'USD', 1500, 5000, NULL, false),
  ('business', 'page1', 'USD', 1500, 5000, NULL, false),
  -- Page 2 variant
  ('basic', 'page2', 'USD', 500, 1700, 40, false),      -- $5 (era $17.00 - 70% desconto, arredondado para cima)
  ('standard', 'page2', 'USD', 700, 2400, 60, false),   -- $7 (era $24.00 - 70% desconto, arredondado para cima)
  ('premium', 'page2', 'USD', 1500, 5000, 100, false); -- $15 (era $50.00 - 70% desconto)

-- Page3 variant: $12, $15, $25 (1200, 1500, 2500 cents)
-- $12 / 0.3 = $40.00 → 4000, $15 / 0.3 = $50.00 → 5000, $25 / 0.3 = $83.33 → CEIL($83.33) = $84.00 → 8400
INSERT INTO "variant_pricing" ("packKey", "variant", "currency", "price", "oldPrice", "credits", "isActive") VALUES
  -- Page 1 variant (not used but keeping for compatibility)
  ('starter', 'page1', 'USD', 1200, 4000, NULL, false),
  ('pro', 'page1', 'USD', 1500, 5000, NULL, false),
  ('premium', 'page1', 'USD', 2500, 8400, NULL, false),
  ('business', 'page1', 'USD', 2500, 8400, NULL, false),
  -- Page 3 variant
  ('basic', 'page3', 'USD', 1200, 4000, 40, false),      -- $12 (era $40.00 - 70% desconto)
  ('standard', 'page3', 'USD', 1500, 5000, 60, false),   -- $15 (era $50.00 - 70% desconto)
  ('premium', 'page3', 'USD', 2500, 8400, 100, false);  -- $25 (era $84.00 - 70% desconto, arredondado para cima)

-- Page4 variant: $29, $39, $59 (2900, 3900, 5900 cents)
-- $29 / 0.3 = $96.67 → CEIL($96.67) = $97.00 → 9700, $39 / 0.3 = $130.00 → 13000, $59 / 0.3 = $196.67 → CEIL($196.67) = $197.00 → 19700
INSERT INTO "variant_pricing" ("packKey", "variant", "currency", "price", "oldPrice", "credits", "isActive") VALUES
  -- Page 1 variant (not used but keeping for compatibility)
  ('starter', 'page1', 'USD', 2900, 9700, NULL, false),
  ('pro', 'page1', 'USD', 3900, 13000, NULL, false),
  ('premium', 'page1', 'USD', 5900, 19700, NULL, false),
  ('business', 'page1', 'USD', 5900, 19700, NULL, false),
  -- Page 4 variant
  ('basic', 'page4', 'USD', 2900, 9700, 40, false),      -- $29 (era $97.00 - 70% desconto, arredondado para cima)
  ('standard', 'page4', 'USD', 3900, 13000, 60, false),  -- $39 (era $130.00 - 70% desconto)
  ('premium', 'page4', 'USD', 5900, 19700, 100, false); -- $59 (era $197.00 - 70% desconto, arredondado para cima)

-- Page5 variant: $35, $45, $75 (3500, 4500, 7500 cents)
-- $35 / 0.3 = $116.67 → CEIL($116.67) = $117.00 → 11700, $45 / 0.3 = $150.00 → 15000, $75 / 0.3 = $250.00 → 25000
INSERT INTO "variant_pricing" ("packKey", "variant", "currency", "price", "oldPrice", "credits", "isActive") VALUES
  -- Page 1 variant (not used but keeping for compatibility)
  ('starter', 'page1', 'USD', 3500, 11700, NULL, false),
  ('pro', 'page1', 'USD', 4500, 15000, NULL, false),
  ('premium', 'page1', 'USD', 7500, 25000, NULL, false),
  ('business', 'page1', 'USD', 7500, 25000, NULL, false),
  -- Page 5 variant
  ('basic', 'page5', 'USD', 3500, 11700, 40, false),     -- $35 (era $117.00 - 70% desconto, arredondado para cima)
  ('standard', 'page5', 'USD', 4500, 15000, 60, false),  -- $45 (era $150.00 - 70% desconto)
  ('premium', 'page5', 'USD', 7500, 25000, 100, false); -- $75 (era $250.00 - 70% desconto)

-- Activate Variation 1 by default ($5, $7, $15)
-- To activate a different variation, run the appropriate UPDATE below

-- Activate Variation 1 (default)
-- UPDATE variant_pricing SET "isActive" = true WHERE price IN (500, 700, 1500) AND currency = 'USD';

-- Activate Variation 2
-- UPDATE variant_pricing SET "isActive" = false;
-- UPDATE variant_pricing SET "isActive" = true WHERE price IN (1200, 1500, 2500) AND currency = 'USD';

-- Activate Variation 3
-- UPDATE variant_pricing SET "isActive" = false;
-- UPDATE variant_pricing SET "isActive" = true WHERE price IN (2900, 3900, 5900) AND currency = 'USD';

-- Activate Variation 4
-- UPDATE variant_pricing SET "isActive" = false;
-- UPDATE variant_pricing SET "isActive" = true WHERE price IN (3500, 4500, 7500) AND currency = 'USD';

-- View all pricing variations
-- SELECT 
--   "packKey",
--   "variant",
--   price / 100.0 as price_usd,
--   "oldPrice" / 100.0 as old_price_usd,
--   credits,
--   "isActive"
-- FROM variant_pricing
-- WHERE currency = 'USD'
-- ORDER BY price, "packKey";

