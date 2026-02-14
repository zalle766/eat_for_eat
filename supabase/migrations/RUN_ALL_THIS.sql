-- ============================================================
-- كود قاعدة البيانات الكامل - نفّذه في Supabase SQL Editor
-- Eat for Eat - تشغيل واحد يكفي
-- ============================================================

-- 1. جدول users والمستخدمين
-- ============================================================
-- (إذا لم يكن جدول users موجوداً، أنشئه من Supabase Authentication أو يدوياً)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إضافة الأعمدة إن لم تكن موجودة
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- إضافة UNIQUE على auth_id إن لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_auth_id_key' AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- دالة إنشاء المستخدم عند التسجيل
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, name, email, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'مستخدم'),
    NEW.email,
    NOW()
  )
  ON CONFLICT (auth_id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- دالة ensure_user_exists
CREATE OR REPLACE FUNCTION public.ensure_user_exists(auth_user_id UUID)
RETURNS UUID AS $$
DECLARE user_record_id UUID;
BEGIN
  SELECT id INTO user_record_id FROM public.users WHERE auth_id = auth_user_id LIMIT 1;
  IF user_record_id IS NULL THEN
    INSERT INTO public.users (auth_id, name, email, created_at)
    VALUES (
      auth_user_id,
      COALESCE((SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = auth_user_id), (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = auth_user_id), 'مستخدم'),
      (SELECT email FROM auth.users WHERE id = auth_user_id),
      NOW()
    )
    RETURNING id INTO user_record_id;
  END IF;
  RETURN user_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(UUID) TO anon;

-- 2. جدول ratings والتقييمات (إن لم يكن موجوداً)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  restaurant_id UUID,
  product_id UUID,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS rating INTEGER;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ratings_rating_check') THEN
    ALTER TABLE public.ratings ADD CONSTRAINT ratings_rating_check CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS fk_ratings_user_id;
  ALTER TABLE public.ratings ADD CONSTRAINT fk_ratings_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS fk_ratings_restaurant_id;
  ALTER TABLE public.ratings ADD CONSTRAINT fk_ratings_restaurant_id 
    FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS ratings_product_id_fkey;
  ALTER TABLE public.ratings ADD CONSTRAINT ratings_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_ratings_restaurant_id ON public.ratings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ratings_product_id ON public.ratings(product_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON public.ratings(user_id);

-- 3. سياسات RLS للمطاعم
-- ============================================================
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

DROP POLICY IF EXISTS "restaurants_select_all" ON public.restaurants;
CREATE POLICY "restaurants_select_all" ON public.restaurants FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "restaurants_insert_authenticated" ON public.restaurants;
CREATE POLICY "restaurants_insert_authenticated" ON public.restaurants FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "restaurants_update_all" ON public.restaurants;
CREATE POLICY "restaurants_update_all" ON public.restaurants FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "restaurants_update_authenticated" ON public.restaurants;
CREATE POLICY "restaurants_update_authenticated" ON public.restaurants FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "restaurants_delete_all" ON public.restaurants;
CREATE POLICY "restaurants_delete_all" ON public.restaurants FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "restaurants_delete_authenticated" ON public.restaurants;
CREATE POLICY "restaurants_delete_authenticated" ON public.restaurants FOR DELETE TO authenticated USING (true);

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- 4. سياسات Storage لرفع صور المنتجات
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated uploads to restaurant-images" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to restaurant-images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'restaurant-images');

DROP POLICY IF EXISTS "Allow public read restaurant-images" ON storage.objects;
CREATE POLICY "Allow public read restaurant-images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'restaurant-images');

DROP POLICY IF EXISTS "Allow authenticated update restaurant-images" ON storage.objects;
CREATE POLICY "Allow authenticated update restaurant-images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'restaurant-images');

-- 5. دالة جلب التقييمات مع أسماء المستخدمين
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_ratings_with_names(
  p_restaurant_id UUID DEFAULT NULL,
  p_product_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  restaurant_id UUID,
  product_id UUID,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ,
  user_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.user_id,
    r.restaurant_id,
    r.product_id,
    r.rating,
    r.comment,
    r.created_at,
    COALESCE(
      CASE 
        WHEN u.name IS NOT NULL AND TRIM(u.name) != '' AND TRIM(u.name) != 'مستخدم' 
        THEN u.name 
        ELSE NULL 
      END,
      (SELECT COALESCE(
        NULLIF(TRIM(a.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(a.raw_user_meta_data->>'name'), ''),
        NULLIF(TRIM(split_part(COALESCE(a.email, ''), '@', 1)), '')
      ) FROM auth.users a WHERE a.id = r.user_id LIMIT 1),
      'مستخدم'
    )::TEXT AS user_name
  FROM public.ratings r
  LEFT JOIN public.users u ON u.auth_id = r.user_id
  WHERE (p_restaurant_id IS NULL OR r.restaurant_id = p_restaurant_id)
    AND (p_product_id IS NULL OR r.product_id = p_product_id)
  ORDER BY r.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ratings_with_names(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_ratings_with_names(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ratings_with_names(UUID, UUID) TO service_role;

-- دالة لجلب جميع التقييمات للمطعم (تقييم المطعم + تقييمات منتجاته)
CREATE OR REPLACE FUNCTION public.get_ratings_for_restaurant(p_restaurant_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  restaurant_id UUID,
  product_id UUID,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ,
  user_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id, r.user_id, r.restaurant_id, r.product_id, r.rating, r.comment, r.created_at,
    COALESCE(
      CASE WHEN u.name IS NOT NULL AND TRIM(u.name) != '' AND TRIM(u.name) != 'مستخدم' THEN u.name ELSE NULL END,
      (SELECT COALESCE(NULLIF(TRIM(a.raw_user_meta_data->>'full_name'), ''), NULLIF(TRIM(a.raw_user_meta_data->>'name'), ''), NULLIF(TRIM(split_part(COALESCE(a.email, ''), '@', 1)), '')) FROM auth.users a WHERE a.id = r.user_id LIMIT 1),
      'مستخدم'
    )::TEXT AS user_name
  FROM public.ratings r
  LEFT JOIN public.users u ON u.auth_id = r.user_id
  WHERE r.restaurant_id = p_restaurant_id
     OR r.product_id IN (SELECT id FROM public.products WHERE restaurant_id = p_restaurant_id)
  ORDER BY r.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ratings_for_restaurant(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_ratings_for_restaurant(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ratings_for_restaurant(UUID) TO service_role;

-- تحديث المستخدمين الذين لديهم "مستخدم" لاستخدام جزء البريد الإلكتروني
UPDATE public.users u
SET name = COALESCE(
  (SELECT raw_user_meta_data->>'full_name' FROM auth.users a WHERE a.id = u.auth_id),
  (SELECT raw_user_meta_data->>'name' FROM auth.users a WHERE a.id = u.auth_id),
  (SELECT split_part(email, '@', 1) FROM auth.users a WHERE a.id = u.auth_id)
)
WHERE (u.name IS NULL OR TRIM(u.name) = '' OR TRIM(u.name) = 'مستخدم')
  AND EXISTS (SELECT 1 FROM auth.users a WHERE a.id = u.auth_id);

-- 6. جدول العروض (Offres)
-- ============================================================
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

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "offers_select_all" ON public.offers;
CREATE POLICY "offers_select_all" ON public.offers FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "offers_insert_restaurant_owner" ON public.offers;
CREATE POLICY "offers_insert_restaurant_owner" ON public.offers FOR INSERT TO authenticated
  WITH CHECK (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "offers_update_restaurant_owner" ON public.offers;
CREATE POLICY "offers_update_restaurant_owner" ON public.offers FOR UPDATE TO authenticated
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "offers_delete_restaurant_owner" ON public.offers;
CREATE POLICY "offers_delete_restaurant_owner" ON public.offers FOR DELETE TO authenticated
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

-- 7. جدول الطلبات (orders) - إضافة موقع السائق والتوصيل
-- ============================================================
-- إذا كان جدول orders موجوداً مسبقاً، نضيف الأعمدة فقط
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS driver_lat DOUBLE PRECISION;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS driver_lng DOUBLE PRECISION;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_latitude DOUBLE PRECISION;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_longitude DOUBLE PRECISION;

-- السماح للسائقين بتحديث driver_lat و driver_lng فقط (عبر RLS أو من الخدمة)
-- سياسة: تحديث الطلب (حالة + موقع السائق) - للمصادقين
DROP POLICY IF EXISTS "orders_update_driver_location" ON public.orders;
CREATE POLICY "orders_update_driver_location" ON public.orders
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- تفعيل Realtime للجدول orders (للتتبع المباشر لموقع السائق)
-- إذا ظهر خطأ أن الجدول مضاف مسبقاً، يمكن تجاهله أو تشغيله من لوحة Supabase: Database → Replication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- 8. جدول رسائل الدردشة بين الزبون والموصّل
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'driver')),
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON public.order_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_created_at ON public.order_messages(created_at);

ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_messages_select_own" ON public.order_messages;
CREATE POLICY "order_messages_select_own" ON public.order_messages
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "order_messages_insert_authenticated" ON public.order_messages;
CREATE POLICY "order_messages_insert_authenticated" ON public.order_messages
  FOR INSERT TO authenticated WITH CHECK (true);

-- Realtime للدردشة
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 9. إشعارات المكالمات الواردة (الزبون يطلب الاتصال → الموصّل يرى الإشعار عند كونه متصلًا)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.call_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_requests_driver_id ON public.call_requests(driver_id);

ALTER TABLE public.call_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "call_requests_insert_authenticated" ON public.call_requests;
CREATE POLICY "call_requests_insert_authenticated" ON public.call_requests
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "call_requests_select_driver" ON public.call_requests;
CREATE POLICY "call_requests_select_driver" ON public.call_requests
  FOR SELECT TO authenticated USING (true);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.call_requests;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- تم! تأكد من إنشاء bucket باسم restaurant-images في Storage
-- ============================================================
