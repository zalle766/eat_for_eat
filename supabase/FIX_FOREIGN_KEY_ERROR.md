# حل مشكلة Foreign Key Constraint في جدول ratings

## المشكلة
```
insert or update on table "ratings" violates foreign key constraint "fk_ratings_user_id"
```

هذا الخطأ يعني أن `user_id` المرسل إلى جدول `ratings` غير موجود في جدول `users`.

## الحل الشامل

### الخطوة 1: تطبيق Trigger تلقائي (موصى به بشدة)

1. افتح **Supabase Dashboard** → **SQL Editor**
2. انسخ محتوى ملف `supabase/migrations/ensure_user_exists_trigger.sql`
3. الصق المحتوى واضغط **Run**

هذا الـ trigger سينشئ مستخدم تلقائياً في جدول `users` عند تسجيل الدخول في `auth.users`.

### الخطوة 2: إضافة Service Role Key

1. افتح **Supabase Dashboard** → **Edge Functions** → **Secrets**
2. اضغط **Add Secret**
3. **Name**: `SERVICE_ROLE_KEY` (⚠️ بدون `SUPABASE_` في البداية)
4. **Value**: Service Role Key من **Settings** → **API** → **service_role key**
5. اضغط **Save**

### الخطوة 3: تطبيق Migrations

1. افتح **Supabase Dashboard** → **SQL Editor**
2. نفّذ `supabase/migrations/add_ratings_columns.sql`
3. نفّذ `supabase/migrations/fix_ratings_foreign_key.sql` (إذا كان موجوداً)

### الخطوة 4: التحقق من وجود المستخدمين الحاليين

إذا كان لديك مستخدمون مسجلون بالفعل، تأكد من وجودهم في جدول `users`:

```sql
-- التحقق من المستخدمين
SELECT u.id, u.auth_id, u.name, u.email 
FROM users u;

-- إذا لم يكن موجودين، يمكنك إنشاءهم:
-- (استبدل auth_user_id بـ auth.id الفعلي)
INSERT INTO users (auth_id, name, email, created_at)
SELECT 
  id as auth_id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1), 'مستخدم') as name,
  email,
  NOW() as created_at
FROM auth.users
WHERE id NOT IN (SELECT auth_id FROM users);
```

## التحقق من الإعداد

### 1. التحقق من Trigger
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### 2. التحقق من Service Role Key
- افتح **Edge Functions** → **ratings** → **Logs**
- حاول إضافة تقييم
- إذا ظهر خطأ "Service Role Key is required"، فـ Secret غير موجود

### 3. اختبار إضافة تقييم
1. سجّل الدخول
2. أضف تقييم لمطعم أو منتج
3. تحقق من Logs في Edge Function

## استكشاف الأخطاء

### الخطأ: "Service Role Key is required"
**الحل**: 
- تأكد من إضافة Secret باسم `SERVICE_ROLE_KEY` (بدون `SUPABASE_`)
- تأكد من أن المفتاح صحيح (من Settings → API → service_role key)

### الخطأ: "User not found in database"
**الحل**:
1. تأكد من تطبيق `ensure_user_exists_trigger.sql`
2. تحقق من وجود المستخدم في جدول `users`:
   ```sql
   SELECT * FROM users WHERE auth_id = 'your_auth_id_here';
   ```
3. إذا لم يكن موجوداً، أنشئه يدوياً أو سجّل الدخول مرة أخرى (سيُنشئه الـ trigger)

### الخطأ: "foreign key constraint violated"
**الحل**:
1. تأكد من تطبيق جميع ملفات SQL
2. تأكد من وجود المستخدم في جدول `users` قبل إضافة التقييم
3. تحقق من أن `user_id` في التقييم موجود في جدول `users`

## ملاحظات مهمة

1. **Trigger تلقائي**: بعد تطبيق `ensure_user_exists_trigger.sql`، سيتم إنشاء المستخدمين تلقائياً عند تسجيل الدخول
2. **Service Role Key**: مطلوب لتجاوز RLS policies
3. **المستخدمون الحاليون**: إذا كان لديك مستخدمون مسجلون بالفعل، قد تحتاج إلى إنشاءهم يدوياً في جدول `users`

## الخطوات السريعة

```bash
# 1. تطبيق Trigger
# في SQL Editor، نفّذ: ensure_user_exists_trigger.sql

# 2. إضافة Secret
# في Dashboard: Edge Functions → Secrets → Add Secret
# Name: SERVICE_ROLE_KEY
# Value: service_role key من Settings → API

# 3. اختبار
# سجّل الدخول وأضف تقييم
```


