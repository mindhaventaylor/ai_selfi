-- Script para criar os packs de créditos necessários
-- Execute este script no Supabase SQL Editor ou via psql

-- IMPORTANTE: Você precisará criar os preços no Stripe primeiro e adicionar os stripePriceId aqui
-- Para criar no Stripe, vá em Products > Add Product e crie os produtos com os preços listados abaixo

-- Limpar packs existentes (CUIDADO: Isso apagará todos os packs existentes!)
-- Descomente apenas se quiser recriar tudo do zero
-- DELETE FROM public.credit_packs;

-- ============================================
-- PAGE1 VARIANTS (Flow Original)
-- ============================================

-- Starter Pack - $29, 40 créditos
INSERT INTO public.credit_packs (name, description, price, credits, "stripePriceId", "createdAt")
VALUES (
  'Starter Pack',
  '40 professional AI-generated photos',
  29.00,
  40,
  NULL, -- SUBSTITUA pelo stripePriceId real do Stripe
  NOW()
)
ON CONFLICT DO NOTHING;

-- Pro Pack - $39, 100 créditos
INSERT INTO public.credit_packs (name, description, price, credits, "stripePriceId", "createdAt")
VALUES (
  'Pro Pack',
  '100 professional AI-generated photos',
  39.00,
  100,
  NULL, -- SUBSTITUA pelo stripePriceId real do Stripe
  NOW()
)
ON CONFLICT DO NOTHING;

-- Premium Pack - $49, 150 créditos (ou 140 se preferir)
INSERT INTO public.credit_packs (name, description, price, credits, "stripePriceId", "createdAt")
VALUES (
  'Premium Pack',
  '150 professional AI-generated photos',
  49.00,
  150,
  NULL, -- SUBSTITUA pelo stripePriceId real do Stripe
  NOW()
)
ON CONFLICT DO NOTHING;

-- Se você preferir 140 créditos para o Premium:
-- INSERT INTO public.credit_packs (name, description, price, credits, "stripePriceId", "createdAt")
-- VALUES (
--   'Premium Pack',
--   '140 professional AI-generated photos',
--   49.00,
--   140,
--   NULL, -- SUBSTITUA pelo stripePriceId real do Stripe
--   NOW()
-- )
-- ON CONFLICT DO NOTHING;

-- ============================================
-- PAGE2 VARIANTS (Flow com Preços Promocionais)
-- ============================================

-- Basic Pack (Page2) - $18, 40 créditos
INSERT INTO public.credit_packs (name, description, price, credits, "stripePriceId", "createdAt")
VALUES (
  'Basic Pack',
  '40 professional AI-generated photos',
  18.00,
  40,
  NULL, -- SUBSTITUA pelo stripePriceId real do Stripe
  NOW()
)
ON CONFLICT DO NOTHING;

-- Standard Pack (Page2) - $25, 60 créditos
INSERT INTO public.credit_packs (name, description, price, credits, "stripePriceId", "createdAt")
VALUES (
  'Standard Pack',
  '60 professional AI-generated photos',
  25.00,
  60,
  NULL, -- SUBSTITUA pelo stripePriceId real do Stripe
  NOW()
)
ON CONFLICT DO NOTHING;

-- Premium Pack (Page2) - $40, 100 créditos
INSERT INTO public.credit_packs (name, description, price, credits, "stripePriceId", "createdAt")
VALUES (
  'Premium Pack (Page2)',
  '100 professional AI-generated photos',
  40.00,
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

