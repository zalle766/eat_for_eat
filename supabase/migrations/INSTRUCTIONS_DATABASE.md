# تعليمات قاعدة البيانات - Eat for Eat

## ما الذي يجب تنفيذه في قاعدة البيانات؟

يجب تطبيق ملفات الـ migrations بشكل ترتيبي. إليك الخطوات:

---

## الطريقة 1: استخدام Supabase Dashboard (الأبسط)

1. افتح [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك
3. اذهب إلى **SQL Editor**
4. نفّذ الملفات التالية **بالترتيب** (انسخ محتوى كل ملف والصقه ثم Run):

### الترتيب المطلوب:

| # | الملف | الوصف |
|---|-------|-------|
| 1 | `ensure_user_exists_trigger.sql` | إنشاء ترايجر لجدول users |
| 2 | `ensure_users_table_and_functions.sql` | ضمان جدول users ودالة ensure_user_exists |
| 3 | `add_address_city_to_users.sql` | إضافة عمودي address و city للمستخدمين |
| 4 | `add_latitude_longitude_to_users.sql` | إضافة عمودي latitude و longitude |
| 5 | `add_ratings_columns.sql` | أعمدة التقييمات |
| 6 | `fix_ratings_foreign_key.sql` | إصلاح مفتاح التقييمات (إن وجد) |
| 7 | `fix_ratings_user_fk_to_auth.sql` | إصلاح ربط التقييمات بالمصادقة |
| 8 | `fix_restaurants_rls_policies.sql` | سياسات أمان المطاعم |
| 9 | **`create_restaurant_images_bucket.sql`** | سياسات تخزين الصور (لرفع صور المنتجات) |

---

## الطريقة 2: باستخدام Supabase CLI

```bash
# التأكد من الاتصال بالمشروع
supabase link

# تطبيق جميع الـ migrations دفعة واحدة
supabase db push
```

---

## إنشاء bucket الصور (مهم لرفع صور المنتجات)

إذا لم يكن bucket باسم `restaurant-images` موجوداً:

1. اذهب إلى **Storage** في Supabase Dashboard
2. اضغط **New bucket**
3. الاسم: `restaurant-images`
4. فعّل **Public bucket** (للسماح بعرض الصور)
5. اضغط **Create**

بعد إنشاء الـ bucket، نفّذ ملف `create_restaurant_images_bucket.sql` لإضافة السياسات.

---

## ملخص الوظائف

| الوظيفة | الملفات المطلوبة |
|---------|-------------------|
| تسجيل الدخول والمستخدمين | ensure_user_exists_trigger, ensure_users_table_and_functions |
| Checkout والعنوان | add_address_city_to_users, add_latitude_longitude_to_users |
| التقييمات | add_ratings_columns, fix_ratings_* |
| رفع صور المنتجات | create_restaurant_images_bucket + إنشاء bucket |

---

## التحقق من نجاح التطبيق

بعد التنفيذ، تأكد من:
- جدول `users` يحتوي على: address, city, latitude, longitude
- جدول `ratings` يعمل بشكل صحيح
- Storage → bucket `restaurant-images` موجود ولهolicies
