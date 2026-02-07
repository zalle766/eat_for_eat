-- دالة لجلب التقييمات مع أسماء المستخدمين
-- تعمل مباشرة في قاعدة البيانات وتتخطى مشاكل Edge Function
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
      -- 1. الاسم من users إذا كان صالحاً
      CASE 
        WHEN u.name IS NOT NULL AND TRIM(u.name) != '' AND TRIM(u.name) != 'مستخدم' 
        THEN u.name 
        ELSE NULL 
      END,
      -- 2. من auth.users: metadata ثم البريد
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
  WHERE r.restaurant_id = p_restaurant_id
     OR r.product_id IN (SELECT id FROM public.products WHERE restaurant_id = p_restaurant_id)
  ORDER BY r.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ratings_for_restaurant(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_ratings_for_restaurant(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ratings_for_restaurant(UUID) TO service_role;

-- صلاحيات التنفيذ
GRANT EXECUTE ON FUNCTION public.get_ratings_with_names(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_ratings_with_names(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ratings_with_names(UUID, UUID) TO service_role;

-- تحديث المستخدمين الذين لديهم "مستخدم" لاستخدام جزء البريد الإلكتروني
UPDATE public.users u
SET name = COALESCE(
  (SELECT raw_user_meta_data->>'full_name' FROM auth.users a WHERE a.id = u.auth_id),
  (SELECT raw_user_meta_data->>'name' FROM auth.users a WHERE a.id = u.auth_id),
  (SELECT split_part(email, '@', 1) FROM auth.users a WHERE a.id = u.auth_id)
)
WHERE (u.name IS NULL OR TRIM(u.name) = '' OR TRIM(u.name) = 'مستخدم')
  AND EXISTS (SELECT 1 FROM auth.users a WHERE a.id = u.auth_id);
