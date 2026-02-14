-- RLS لجدول deliveries: السائق يرى ويحدّث توصيلاته، وصاحب المطعم يضيف التوصيلات
-- نفّذ هذا الملف في Supabase SQL Editor

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deliveries') THEN
    ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

    -- السائق: قراءة وتحديث التوصيلات المعيّنة له فقط
    DROP POLICY IF EXISTS "deliveries_select_driver" ON public.deliveries;
    CREATE POLICY "deliveries_select_driver" ON public.deliveries
      FOR SELECT TO authenticated
      USING (driver_id IN (SELECT id FROM public.drivers WHERE (auth_id)::uuid = auth.uid()));

    DROP POLICY IF EXISTS "deliveries_update_driver" ON public.deliveries;
    CREATE POLICY "deliveries_update_driver" ON public.deliveries
      FOR UPDATE TO authenticated
      USING (driver_id IN (SELECT id FROM public.drivers WHERE (auth_id)::uuid = auth.uid()));

    -- صاحب المطعم: إضافة توصيلة لطلبات مطعمه فقط
    DROP POLICY IF EXISTS "deliveries_insert_restaurant_owner" ON public.deliveries;
    CREATE POLICY "deliveries_insert_restaurant_owner" ON public.deliveries
      FOR INSERT TO authenticated
      WITH CHECK (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

    -- صاحب المطعم: قراءة توصيلات مطعمه (لعرض من تم تعيينه في لوحة الطلبات)
    DROP POLICY IF EXISTS "deliveries_select_restaurant_owner" ON public.deliveries;
    CREATE POLICY "deliveries_select_restaurant_owner" ON public.deliveries
      FOR SELECT TO authenticated
      USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));
  END IF;
END $$;
