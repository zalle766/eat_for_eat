# نشر المشروع على Vercel

## 1. ربط المشروع

- اربط المستودع من GitHub مع Vercel.
- المشروع مُعد مسبقاً عبر `vercel.json` (مجلد المخرجات: `out`، إعادة توجيه SPA).

## 2. إضافة المتغيرات البيئية

في Vercel: **Settings → Environment Variables** أضف:

| المتغير | الوصف |
|---------|-------|
| `VITE_PUBLIC_SUPABASE_URL` | رابط مشروع Supabase (مثل `https://xxx.supabase.co`) |
| `VITE_PUBLIC_SUPABASE_ANON_KEY` | المفتاح العام (anon key) من Supabase |

يمكنك أخذ القيم من Supabase → Project Settings → API.

## 3. إعداد Supabase للنطاق

في Supabase → Project Settings → Authentication → URL Configuration:

- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: أضف `https://your-app.vercel.app/**` وجميع المسارات التي تستخدم تسجيل الدخول.

## 4. النشر

بعد كل `git push` يتم النشر تلقائياً. أو استخدم **Redeploy** من لوحة Vercel.
