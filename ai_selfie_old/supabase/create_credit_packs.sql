-- Script para criar os packs de créditos necessários
-- Execute este script no Supabase SQL Editor ou via psql

-- IMPORTANTE: Você precisará criar os preços no Stripe primeiro e adicionar os stripePriceId aqui
-- Para criar no Stripe, vá em Products > Add Product e crie os produtos com os preços listados abaixo

-- Limpar packs existentes (CUIDADO: Isso apagará todos os packs existentes!)
-- Descomente apenas se quiser recriar tudo do zero
-- DELETE FROM public.credit_packs;

-- ============================================
-- PAGE1 VARIANTS (Flow Original) - Variation 1
-- Todos os preços: $5, $10, $15
-- ============================================

-- Starter Pack - $5, 40 créditos
INSERT INTO public.credit_packs (name, description, price, credits, "stripePriceId", "createdAt")
VALUES (
  'Starter Pack',
  '40 professional AI-generated photos',
  5.00,
  40,
  NULL, -- SUBSTITUA pelo stripePriceId real do Stripe
  NOW()
)
ON CONFLICT DO NOTHING;

-- Pro Pack - $10, 100 créditos
INSERT INTO public.credit_packs (name, description, price, credits, "stripePriceId", "createdAt")
VALUES (
  'Pro Pack',
  '100 professional AI-generated photos',
  10.00,
  100,
  NULL, -- SUBSTITUA pelo stripePriceId real do Stripe
  NOW()
)
ON CONFLICT DO NOTHING;

-- Premium Pack - $15, 150 créditos
INSERT INTO public.credit_packs (name, description, price, credits, "stripePriceId", "createdAt")
VALUES (
  'Premium Pack',
  '150 professional AI-generated photos',
  15.00,
  150,
  NULL, -- SUBSTITUA pelo stripePriceId real do Stripe
  NOW()
)
ON CONFLICT DO NOTHING;

-- ============================================
-- PAGE2 VARIANTS (Flow Promocional) - Variation 2
-- Todos os preços: $5, $10, $15
-- ============================================

-- Basic Pack (Page2) - $5, 40 créditos
INSERT INTO public.credit_packs (name, description, price, credits, "stripePriceId", "createdAt")
VALUES (
  'Basic Pack',
  '40 professional AI-generated photos',
  5.00,
  40,
  NULL, -- SUBSTITUA pelo stripePriceId real do Stripe
  NOW()
)
ON CONFLICT DO NOTHING;

-- Standard Pack (Page2) - $10, 60 créditos
INSERT INTO public.credit_packs (name, description, price, credits, "stripePriceId", "createdAt")
VALUES (
  'Standard Pack',
  '60 professional AI-generated photos',
  10.00,
  60,
  NULL, -- SUBSTITUA pelo stripePriceId real do Stripe
  NOW()
)
ON CONFLICT DO NOTHING;

-- Premium Pack (Page2) - $15, 100 créditos
INSERT INTO public.credit_packs (name, description, price, credits, "stripePriceId", "createdAt")
VALUES (
  'Premium Pack (Page2)',
  '100 professional AI-generated photos',
  15.00,
  100,
  NULL, -- SUBSTITUA pelo stripePriceId real do Stripe
  NOW()
)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Visualizar todos os packs criados
SELECT 
  id,
  name,
  price,
  credits,
  "stripePriceId",
  "createdAt"
FROM public.credit_packs
ORDER BY price ASC;

-- Verificar se há conflitos de preço/créditos
SELECT 
  price,
  credits,
  COUNT(*) as count,
  STRING_AGG(name, ', ') as pack_names
FROM public.credit_packs
GROUP BY price, credits
HAVING COUNT(*) > 1;

