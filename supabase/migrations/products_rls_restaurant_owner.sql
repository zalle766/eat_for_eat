-- RLS لجدول products: صاحب المطعم يمكنه إدارة منتجات مطعمه فقط
-- نفّذ هذا الملف إذا كان جدول products موجوداً ولم تكن السياسات مفعّلة

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "products_select_public" ON public.products;
    CREATE POLICY "products_select_public" ON public.products FOR SELECT TO public USING (true);

    DROP POLICY IF EXISTS "products_insert_restaurant_owner" ON public.products;
    CREATE POLICY "products_insert_restaurant_owner" ON public.products FOR INSERT TO authenticated
      WITH CHECK (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

    DROP POLICY IF EXISTS "products_update_restaurant_owner" ON public.products;
    CREATE POLICY "products_update_restaurant_owner" ON public.products FOR UPDATE TO authenticated
      USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

    DROP POLICY IF EXISTS "products_delete_restaurant_owner" ON public.products;
    CREATE POLICY "products_delete_restaurant_owner" ON public.products FOR DELETE TO authenticated
      USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));
  END IF;
END $$;
