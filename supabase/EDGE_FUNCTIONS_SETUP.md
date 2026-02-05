# إعداد Edge Functions في Supabase

## إضافة Service Role Key كـ Secret

### الخطوات:

1. **افتح Supabase Dashboard**
   - اذهب إلى: https://supabase.com/dashboard
   - اختر مشروعك

2. **اذهب إلى Edge Functions**
   - من القائمة الجانبية: **Edge Functions** (أو **Functions**)

3. **افتح Secrets/Environment Variables**
   - ابحث عن تبويب **Secrets** أو **Environment Variables**
   - أو اذهب إلى: **Settings** → **Edge Functions** → **Secrets**

4. **أضف Secret جديد**
   - اضغط على **Add Secret** أو **New Secret**
   - **Name**: `SERVICE_ROLE_KEY` ⚠️ **مهم: لا تستخدم `SUPABASE_` في البداية**
   - **Value**: Service Role Key من Supabase
     - يمكنك الحصول عليه من: **Settings** → **API** → **service_role key** (secret)
   - اضغط **Save**
   
   **ملاحظة مهمة**: Supabase لا يسمح بأسماء Secrets تبدأ بـ `SUPABASE_` لأنها محجوزة للنظام. استخدم `SERVICE_ROLE_KEY` فقط.

### ملاحظات مهمة:
- ⚠️ **لا تشارك Service Role Key أبداً** - إنه مفتاح سري قوي
- Service Role Key يتجاوز جميع RLS policies
- يجب أن يكون موجوداً في كل Edge Function تحتاج إلى صلاحيات إدارية

---

## الحصول على Service Role Key

### الخطوات:

1. **افتح Supabase Dashboard**
2. **Settings** → **API**
3. ابحث عن **service_role key** (secret)
4. اضغط على **Reveal** أو **Show** لعرض المفتاح
5. انسخ المفتاح (يبدأ عادة بـ `eyJ...`)

---

## التحقق من الإعداد

بعد إضافة Secret، يمكنك التحقق من أنه يعمل:

1. افتح Edge Function `ratings`
2. تحقق من Logs
3. إذا ظهر خطأ "Service Role Key is required"، فهذا يعني أن Secret غير موجود أو اسمه خاطئ

---

## أسماء Secrets المطلوبة

للـ Edge Function `ratings`، تحتاج إلى:

1. `SERVICE_ROLE_KEY` - مطلوب (⚠️ لا تستخدم `SUPABASE_SERVICE_ROLE_KEY`)
2. `SUPABASE_URL` - موجود تلقائياً من Supabase
3. `SUPABASE_ANON_KEY` - موجود تلقائياً من Supabase

**ملاحظة**: Supabase يوفر `SUPABASE_URL` و `SUPABASE_ANON_KEY` تلقائياً، لكن `SERVICE_ROLE_KEY` يجب إضافته يدوياً.

---

## بديل: استخدام Environment Variables (للتنمية المحلية)

إذا كنت تعمل محلياً مع Supabase CLI:

```bash
# في ملف .env.local أو supabase/.env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```

ثم في الكود:
```typescript
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
```

---

## استكشاف الأخطاء

### الخطأ: "Service Role Key is required"
- **الحل**: تأكد من إضافة Secret باسم `SERVICE_ROLE_KEY` (بدون `SUPABASE_` في البداية)

### الخطأ: "Unauthorized" أو "Permission denied"
- **الحل**: تأكد من أن Service Role Key صحيح وليس Anon Key

### الخطأ: "Function not found"
- **الحل**: تأكد من نشر Edge Function بعد إضافة Secrets

