-- =====================================================
-- إصلاح سياسات RLS لجدول restaurants
-- يسمح للمدير بتحديث حالة المطاعم (قبول/رفض/تعليق)
-- =====================================================

-- 1. التأكد من وجود عمود approved_at إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE public.restaurants ADD COLUMN approved_at TIMESTAMPTZ;
    END IF;
END $$;

-- 2. حذف السياسات القديمة المانعة إن وجدت (لتجنب التعارض)
DROP POLICY IF EXISTS "Restaurants are viewable by everyone" ON public.restaurants;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.restaurants;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.restaurants;
DROP POLICY IF EXISTS "Enable update for users" ON public.restaurants;
DROP POLICY IF EXISTS "Allow public read access" ON public.restaurants;
DROP POLICY IF EXISTS "Allow anon read" ON public.restaurants;

-- 3. تفعيل RLS على جدول restaurants
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- 4. حذف السياسات الجديدة إن وجدت (لإعادة التشغيل)
DROP POLICY IF EXISTS "restaurants_select_all" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_insert_authenticated" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_update_all" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_update_authenticated" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_delete_all" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_delete_authenticated" ON public.restaurants;

-- 5. السماح للجميع بقراءة المطاعم (للصفحة الرئيسية وقائمة المطاعم)
CREATE POLICY "restaurants_select_all"
ON public.restaurants
FOR SELECT
TO public
USING (true);

-- 6. السماح للمستخدمين المصادقين بإدراج مطاعم جديدة (تسجيل المطعم)
CREATE POLICY "restaurants_insert_authenticated"
ON public.restaurants
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 7. السماح بتحديث المطاعم - للمدير ولوحة التحكم
-- بما أن لوحة المدير تستخدم المفتاح anon، نسمح لـ anon و authenticated
CREATE POLICY "restaurants_update_all"
ON public.restaurants
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "restaurants_update_authenticated"
ON public.restaurants
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 8. السماح للمدير بحذف المطاعم
CREATE POLICY "restaurants_delete_all"
ON public.restaurants
FOR DELETE
TO anon
USING (true);

CREATE POLICY "restaurants_delete_authenticated"
ON public.restaurants
FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- ملاحظة: بعد تنفيذ هذا الملف في Supabase SQL Editor،
-- جرّب الضغط على زر Approuver مرة أخرى.
-- =====================================================
