-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS) AND POLICIES
-- This ensures users can only access their own data
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.model_training_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_generation_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Note: credit_packs should remain public (read-only for all users)
-- Note: users table RLS is typically handled by Supabase Auth

-- ============================================
-- POLICIES FOR model_training_images
-- ============================================

-- Users can view their own model training images
CREATE POLICY "Users can view own model training images"
ON public.model_training_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.models
    JOIN public.users ON users.id::integer = models."userId"::integer
    WHERE models.id::integer = model_training_images."modelId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- Users can insert their own model training images
CREATE POLICY "Users can insert own model training images"
ON public.model_training_images
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.models
    JOIN public.users ON users.id::integer = models."userId"::integer
    WHERE models.id::integer = model_training_images."modelId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- Users can delete their own model training images
CREATE POLICY "Users can delete own model training images"
ON public.model_training_images
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.models
    JOIN public.users ON users.id::integer = models."userId"::integer
    WHERE models.id::integer = model_training_images."modelId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- ============================================
-- POLICIES FOR photo_generation_batches
-- ============================================

-- Users can view their own generation batches
CREATE POLICY "Users can view own generation batches"
ON public.photo_generation_batches
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = photo_generation_batches."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- Users can insert their own generation batches
CREATE POLICY "Users can insert own generation batches"
ON public.photo_generation_batches
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = photo_generation_batches."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- Users can update their own generation batches
CREATE POLICY "Users can update own generation batches"
ON public.photo_generation_batches
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = photo_generation_batches."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- ============================================
-- POLICIES FOR coupons
-- ============================================

-- Everyone can view active coupons (for redemption)
CREATE POLICY "Anyone can view active coupons"
ON public.coupons
FOR SELECT
USING ("isActive" = true AND ("validUntil" IS NULL OR "validUntil" > now()));

-- Only admins can insert/update/delete coupons
CREATE POLICY "Admins can manage coupons"
ON public.coupons
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users."openId" = auth.uid()::text
    AND users.role = 'admin'
  )
);

-- ============================================
-- POLICIES FOR coupon_redemptions
-- ============================================

-- Users can view their own coupon redemptions
CREATE POLICY "Users can view own coupon redemptions"
ON public.coupon_redemptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = coupon_redemptions."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- Users can insert their own coupon redemptions
CREATE POLICY "Users can insert own coupon redemptions"
ON public.coupon_redemptions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = coupon_redemptions."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- ============================================
-- POLICIES FOR gift_cards
-- ============================================

-- Users can view gift cards they purchased or redeemed
CREATE POLICY "Users can view own gift cards"
ON public.gift_cards
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE (
      (users.id::integer = gift_cards."purchasedByUserId"::integer AND gift_cards."purchasedByUserId" IS NOT NULL)
      OR (users.id::integer = gift_cards."redeemedByUserId"::integer AND gift_cards."redeemedByUserId" IS NOT NULL)
    )
    AND users."openId" = auth.uid()::text
  )
  OR "status" = 'active' -- Anyone can view active gift cards (to redeem)
);

-- Users can insert gift cards (when purchasing)
CREATE POLICY "Users can insert gift cards"
ON public.gift_cards
FOR INSERT
WITH CHECK (
  "purchasedByUserId" IS NULL -- Allow anonymous purchases
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = gift_cards."purchasedByUserId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- Users can update gift cards they purchased (to mark as sent)
CREATE POLICY "Users can update own purchased gift cards"
ON public.gift_cards
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = gift_cards."purchasedByUserId"::integer
    AND gift_cards."purchasedByUserId" IS NOT NULL
    AND users."openId" = auth.uid()::text
  )
);

-- Users can redeem active gift cards
CREATE POLICY "Users can redeem active gift cards"
ON public.gift_cards
FOR UPDATE
USING ("status" = 'active' AND ("expiresAt" IS NULL OR "expiresAt" > now()))
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = gift_cards."redeemedByUserId"::integer
    AND gift_cards."redeemedByUserId" IS NOT NULL
    AND users."openId" = auth.uid()::text
  )
  AND "status" = 'redeemed'
);

-- ============================================
-- POLICIES FOR credit_history
-- ============================================

-- Users can view their own credit history
CREATE POLICY "Users can view own credit history"
ON public.credit_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = credit_history."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- System can insert credit history (via service role or function)
-- Note: This should typically be done via server-side functions, not direct inserts
-- For now, we'll allow users to insert their own (though this should be restricted in practice)
CREATE POLICY "Users can insert own credit history"
ON public.credit_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = credit_history."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- ============================================
-- POLICIES FOR photos
-- ============================================

-- Users can view their own photos
CREATE POLICY "Users can view own photos"
ON public.photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = photos."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- Users can insert their own photos
CREATE POLICY "Users can insert own photos"
ON public.photos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = photos."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- Users can update their own photos (e.g., mark as favorite, update download count)
CREATE POLICY "Users can update own photos"
ON public.photos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = photos."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- Users can delete their own photos
CREATE POLICY "Users can delete own photos"
ON public.photos
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = photos."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- ============================================
-- POLICIES FOR models
-- ============================================

-- Users can view their own models
CREATE POLICY "Users can view own models"
ON public.models
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = models."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- Users can insert their own models
CREATE POLICY "Users can insert own models"
ON public.models
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = models."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- Users can update their own models
CREATE POLICY "Users can update own models"
ON public.models
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = models."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- Users can delete their own models
CREATE POLICY "Users can delete own models"
ON public.models
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = models."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- ============================================
-- POLICIES FOR transactions
-- ============================================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON public.transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = transactions."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- Users can insert their own transactions (when initiating payment)
CREATE POLICY "Users can insert own transactions"
ON public.transactions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = transactions."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- Users can update their own pending transactions (to update status after payment)
CREATE POLICY "Users can update own transactions"
ON public.transactions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = transactions."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- ============================================
-- POLICIES FOR credit_packs (Public Read)
-- ============================================

-- Enable RLS on credit_packs
ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;

-- Everyone can view credit packs (for pricing page)
CREATE POLICY "Anyone can view credit packs"
ON public.credit_packs
FOR SELECT
USING (true);

-- Only admins can manage credit packs
CREATE POLICY "Admins can manage credit packs"
ON public.credit_packs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users."openId" = auth.uid()::text
    AND users.role = 'admin'
  )
);

-- ============================================
-- HELPER FUNCTION: Get current user ID
-- ============================================

-- Create a helper function to get user ID from auth.uid()
-- This makes policies more readable
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.users WHERE "openId" = auth.uid()::text LIMIT 1;
$$;

-- ============================================
-- IMPORTANT NOTES
-- ============================================

-- 1. These policies assume Supabase Auth is being used
-- 2. auth.uid() returns the UUID from Supabase Auth, which should match users.openId
-- 3. If you're using a different auth system, you'll need to adjust the policies
-- 4. Service role operations bypass RLS - use service_role key for admin operations
-- 5. Test policies after applying to ensure they work correctly
-- 6. The users table RLS is typically managed by Supabase Auth
-- 7. Credit history inserts should ideally be done via server-side functions/triggers
-- 8. Gift card redemption should be done via a server-side function to ensure atomicity
-- 9. All policies use auth.uid() which is provided by Supabase Auth

