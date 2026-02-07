-- ضمان وجود جدول users مع البنية الصحيحة ودالة ensure_user_exists
-- هذا الملف يحل مشكلة fk_ratings_user_id
-- نفّذ هذا الملف في Supabase SQL Editor: ensure_user_exists_trigger.sql أولاً ثم هذا الملف

-- إضافة UNIQUE constraint على auth_id إذا لم يكن موجوداً
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'auth_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_auth_id_key' 
    AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL; -- القيد موجود بالفعل
END $$;

-- إنشاء أو استبدال دالة ensure_user_exists التي تنشئ المستخدم إذا لم يكن موجوداً
CREATE OR REPLACE FUNCTION public.ensure_user_exists(auth_user_id UUID)
RETURNS UUID AS $$
DECLARE
  user_record_id UUID;
BEGIN
  -- محاولة الحصول على المستخدم
  SELECT id INTO user_record_id
  FROM public.users
  WHERE auth_id = auth_user_id
  LIMIT 1;
  
  -- إذا لم يكن موجوداً، إنشاؤه
  IF user_record_id IS NULL THEN
    BEGIN
      INSERT INTO public.users (auth_id, name, email, created_at)
      VALUES (
        auth_user_id,
        COALESCE(
          (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = auth_user_id),
          (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth_user_id),
          (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = auth_user_id),
          'مستخدم'
        ),
        (SELECT email FROM auth.users WHERE id = auth_user_id),
        NOW()
      )
      RETURNING id INTO user_record_id;
    EXCEPTION
      WHEN unique_violation THEN
        -- المستخدم موجود بالفعل (إدراج متزامن)
        SELECT id INTO user_record_id FROM public.users WHERE auth_id = auth_user_id LIMIT 1;
    END;
  END IF;
  
  RETURN user_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح صلاحيات التنفيذ
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(UUID) TO anon;
