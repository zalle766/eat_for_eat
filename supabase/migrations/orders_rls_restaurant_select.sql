-- السماح لصاحب المطعم بقراءة وتحديث طلبات مطعمه، والعميل بقراءة طلباته (orders)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "orders_select_restaurant_owner" ON public.orders;
    CREATE POLICY "orders_select_restaurant_owner" ON public.orders
      FOR SELECT TO authenticated
      USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

    DROP POLICY IF EXISTS "orders_select_customer" ON public.orders;
    CREATE POLICY "orders_select_customer" ON public.orders
      FOR SELECT TO authenticated
      USING (customer_id = auth.uid());

    -- السائق: قراءة الطلبات المرتبطة بتوصيلاته فقط (للعرض والإحداثيات)
    DROP POLICY IF EXISTS "orders_select_driver" ON public.orders;
    CREATE POLICY "orders_select_driver" ON public.orders
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.deliveries d
          INNER JOIN public.drivers dr ON dr.id = d.driver_id
          WHERE d.order_id = orders.id
          AND (dr.auth_id)::uuid = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "orders_update_restaurant_owner" ON public.orders;
    CREATE POLICY "orders_update_restaurant_owner" ON public.orders
      FOR UPDATE TO authenticated
      USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));
  END IF;
END $$;

-- قراءة order_items: للعميل وصاحب المطعم فقط (للطلبات التي يملكون حق رؤيتها)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "order_items_select_visible_orders" ON public.order_items;
    CREATE POLICY "order_items_select_visible_orders" ON public.order_items
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = order_items.order_id
          AND (o.customer_id = auth.uid() OR o.restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()))
        )
      );
  END IF;
END $$;
