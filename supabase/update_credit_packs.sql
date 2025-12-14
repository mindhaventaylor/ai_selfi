-- Script para ATUALIZAR os packs de créditos existentes com os novos preços
-- Execute este script no Supabase SQL Editor ou via psql
-- 
-- IMPORTANTE: Este script atualiza os packs existentes. Se você quiser criar novos packs,
-- use o script create_credit_packs.sql

-- ============================================
-- ATUALIZAR PAGE1 VARIANTS (Variation 1)
-- ============================================

-- Atualizar Starter Pack - $5, 40 créditos
UPDATE public.credit_packs 
SET 
  price = 5.00,
  description = '40 professional AI-generated photos'
WHERE name = 'Starter Pack' AND credits = 40;

-- Atualizar Pro Pack - $10, 100 créditos
UPDATE public.credit_packs 
SET 
  price = 10.00,
  description = '100 professional AI-generated photos'
WHERE name = 'Pro Pack' AND credits = 100;

-- Atualizar Premium Pack - $25, 150 créditos
UPDATE public.credit_packs 
SET 
  price = 25.00,
  description = '150 professional AI-generated photos'
WHERE name = 'Premium Pack' AND credits = 150;

-- ============================================
-- ATUALIZAR PAGE2 VARIANTS (Variation 2)
-- ============================================

-- Atualizar Basic Pack - $10, 40 créditos
UPDATE public.credit_packs 
SET 
  price = 10.00,
  description = '40 professional AI-generated photos'
WHERE name = 'Basic Pack' AND credits = 40;

-- Atualizar Standard Pack - $20, 60 créditos
UPDATE public.credit_packs 
SET 
  price = 20.00,
  description = '60 professional AI-generated photos'
WHERE name = 'Standard Pack' AND credits = 60;

-- Atualizar Premium Pack (Page2) - $25, 100 créditos
UPDATE public.credit_packs 
SET 
  price = 25.00,
  description = '100 professional AI-generated photos'
WHERE name = 'Premium Pack (Page2)' AND credits = 100;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Visualizar todos os packs atualizados
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


