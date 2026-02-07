-- جدول العروض (Offres) للمطاعم
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount TEXT NOT NULL,
  code TEXT NOT NULL,
  valid_until DATE,
  image_url TEXT,
  min_order NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_restaurant_id ON public.offers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_offers_is_active ON public.offers(is_active);
CREATE INDEX IF NOT EXISTS idx_offers_valid_until ON public.offers(valid_until);

-- سياسات RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "offers_select_all" ON public.offers;
CREATE POLICY "offers_select_all" ON public.offers FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "offers_insert_restaurant_owner" ON public.offers;
CREATE POLICY "offers_insert_restaurant_owner" ON public.offers FOR INSERT TO authenticated
  WITH CHECK (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "offers_update_restaurant_owner" ON public.offers;
CREATE POLICY "offers_update_restaurant_owner" ON public.offers FOR UPDATE TO authenticated
  USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "offers_delete_restaurant_owner" ON public.offers;
CREATE POLICY "offers_delete_restaurant_owner" ON public.offers FOR DELETE TO authenticated
  USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
  );
