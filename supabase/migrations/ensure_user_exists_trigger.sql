-- Trigger تلقائي لإنشاء مستخدم في جدول users عند تسجيل الدخول
-- هذا يحل مشكلة foreign key constraint

-- إنشاء أو استبدال دالة لإنشاء مستخدم تلقائياً
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, name, email, created_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'مستخدم'
    ),
    NEW.email,
    NOW()
  )
  ON CONFLICT (auth_id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- حذف trigger القديم إذا كان موجوداً
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- إنشاء trigger جديد
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- إنشاء دالة مساعدة لإنشاء مستخدم يدوياً إذا لم يكن موجوداً
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
    INSERT INTO public.users (auth_id, name, email, created_at)
    VALUES (
      auth_user_id,
      'مستخدم',
      (SELECT email FROM auth.users WHERE id = auth_user_id),
      NOW()
    )
    RETURNING id INTO user_record_id;
  END IF;
  
  RETURN user_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(UUID) TO service_role;


