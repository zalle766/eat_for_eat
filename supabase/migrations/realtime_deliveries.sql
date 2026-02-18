-- تفعيل Realtime لجدول deliveries حتى يظهر للموصّل الطلب فور تعيينه من المطعم
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
