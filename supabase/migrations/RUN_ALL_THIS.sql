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

-- ============================================================
-- تم! تأكد من إنشاء bucket باسم restaurant-images في Storage
-- ============================================================
