-- إصلاح مشكلة fk_ratings_user_id
-- تغيير المرجع ليشير إلى auth.users بدلاً من users
-- user_id في ratings سيخزن auth.users.id مباشرة

-- 1. تحويل التقييمات الموجودة من users.id إلى auth_id (إن وجد جدول users)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    UPDATE public.ratings r SET user_id = u.auth_id
    FROM public.users u WHERE r.user_id = u.id AND r.user_id != u.auth_id;
  END IF;
END $$;

-- 2. حذف القيد القديم
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS fk_ratings_user_id;

-- 3. حذف التقييمات التي تحتوي على user_id غير صالح
DELETE FROM public.ratings WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 4. إضافة قيد جديد يشير إلى auth.users
ALTER TABLE public.ratings 
ADD CONSTRAINT fk_ratings_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
