-- ============================================================
-- كود قاعدة البيانات الكامل - Eat for Eat (RLS)
-- ============================================================
-- 1. افتح Supabase → SQL Editor → New query
-- 2. الصق هذا الكود بالكامل
-- 3. اضغط Run
-- ============================================================
-- ملاحظة: إذا كان عمود drivers.auth_id من نوع TEXT، واستمر خطأ النوع،
-- استبدل (auth_id)::uuid بـ auth_id في سياسات السائق ثم نفّذ مرة أخرى.
-- ============================================================

-- 1) جدول products
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

-- 2) جدول orders
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "orders_select_restaurant_owner" ON public.orders;
    CREATE POLICY "orders_select_restaurant_owner" ON public.orders FOR SELECT TO authenticated
      USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));
    DROP POLICY IF EXISTS "orders_select_customer" ON public.orders;
    CREATE POLICY "orders_select_customer" ON public.orders FOR SELECT TO authenticated
      USING (customer_id = auth.uid());
    DROP POLICY IF EXISTS "orders_select_driver" ON public.orders;
    CREATE POLICY "orders_select_driver" ON public.orders FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.deliveries d
          INNER JOIN public.drivers dr ON dr.id = d.driver_id
          WHERE d.order_id = orders.id AND (dr.auth_id)::uuid = auth.uid()
        )
      );
    DROP POLICY IF EXISTS "orders_update_restaurant_owner" ON public.orders;
    CREATE POLICY "orders_update_restaurant_owner" ON public.orders FOR UPDATE TO authenticated
      USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));
  END IF;
END $$;

-- 3) جدول order_items
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "order_items_select_visible_orders" ON public.order_items;
    CREATE POLICY "order_items_select_visible_orders" ON public.order_items FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = order_items.order_id
          AND (o.customer_id = auth.uid() OR o.restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()))
        )
      );
  END IF;
END $$;

-- 4) جدول deliveries
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deliveries') THEN
    ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "deliveries_select_driver" ON public.deliveries;
    CREATE POLICY "deliveries_select_driver" ON public.deliveries FOR SELECT TO authenticated
      USING (driver_id IN (SELECT id FROM public.drivers WHERE (auth_id)::uuid = auth.uid()));
    DROP POLICY IF EXISTS "deliveries_update_driver" ON public.deliveries;
    CREATE POLICY "deliveries_update_driver" ON public.deliveries FOR UPDATE TO authenticated
      USING (driver_id IN (SELECT id FROM public.drivers WHERE (auth_id)::uuid = auth.uid()));
    DROP POLICY IF EXISTS "deliveries_insert_restaurant_owner" ON public.deliveries;
    CREATE POLICY "deliveries_insert_restaurant_owner" ON public.deliveries FOR INSERT TO authenticated
      WITH CHECK (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));
    DROP POLICY IF EXISTS "deliveries_select_restaurant_owner" ON public.deliveries;
    CREATE POLICY "deliveries_select_restaurant_owner" ON public.deliveries FOR SELECT TO authenticated
      USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));
  END IF;
END $$;

-- 5) جدول drivers — السماح لصاحب المطعم برؤية السائقين لتعيينهم للطلبات
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'drivers') THEN
    ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "drivers_select_authenticated" ON public.drivers;
    CREATE POLICY "drivers_select_authenticated" ON public.drivers
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
