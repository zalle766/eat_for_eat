-- إصلاح مشكلة foreign key constraint في جدول ratings
-- هذا الملف يتحقق من أن جميع المستخدمين المسجلين في auth.users موجودون في جدول users

-- إنشاء أو استبدال دالة لإنشاء مستخدم تلقائياً عند تسجيل الدخول
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
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger لإنشاء مستخدم تلقائياً عند تسجيل الدخول
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- إصلاح أي تقييمات موجودة بدون user_id صحيح
-- (هذا سيفشل إذا كان هناك تقييمات ب user_id غير موجود)
-- يمكنك حذف هذه التقييمات يدوياً إذا لزم الأمر:
-- DELETE FROM ratings WHERE user_id NOT IN (SELECT id FROM users);

-- التحقق من أن جميع التقييمات لها user_id صحيح
DO $$
DECLARE
  invalid_ratings_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_ratings_count
  FROM ratings r
  WHERE r.user_id IS NOT NULL 
    AND NOT EXISTS (
      SELECT 1 FROM users u WHERE u.id = r.user_id
    );
  
  IF invalid_ratings_count > 0 THEN
    RAISE NOTICE 'تحذير: يوجد % تقييمات ب user_id غير موجود في جدول users', invalid_ratings_count;
    RAISE NOTICE 'يمكنك حذفها باستخدام: DELETE FROM ratings WHERE user_id NOT IN (SELECT id FROM users);';
  ELSE
    RAISE NOTICE 'جميع التقييمات تحتوي على user_id صحيح';
  END IF;
END $$;

