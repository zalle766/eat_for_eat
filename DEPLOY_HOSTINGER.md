# رفع المشروع على Hostinger

## ⚠️ إذا فشل "دبلوي من الملفات المصدرية" (Deployment from source)

المشروع يستخدم **Node.js 18** و **Vite 6**، مع **package.json** صالح وملف **vite.config.js** ومجلد إخراج **dist**. في إعدادات النشر اختر **Version Node: 18**. مهم جداً: **Répertoire racine** (المجلد الجذر) يجب أن يكون اسم المجلد الذي بداخله ملف **package.json** (مثلاً إذا كان اسم المجلد المضغوط « eatforeat » فضع eatforeat في Répertoire racine). راجع **HOSTINGER_ZIP_INSTRUCTIONS.txt**.

**إذا استمر الفشل:**
- **الطريقة الموثوقة:** بَنِ المشروع على جهازك ثم ارفع الناتج فقط (انظر القسم 1 و 2 أدناه): `npm install` ثم `npm run build`، ثم ارفع **محتوى** مجلد **`dist`** إلى **`public_html`**.
- إذا رفعت المشروع كمصدر، استخدم اسم مجلد **بدون مسافات** عند الضغط (مثلاً `eatforeat` بدلاً من `Nouveau dossier`).

---

## 1. تجهيز المشروع للنشر

### أ) إنشاء ملف المتغيرات للإنتاج (اختياري)

إذا كان موقعك سيعمل على نطاق مثل `https://fooddelivery-marrakech.com`:

- أنشئ ملف `.env.production` في جذر المشروع (بجانب `.env`) بالمحتوى:

```
VITE_PUBLIC_SUPABASE_URL=https://aypxbyzmaolnnlzjclev.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=المفتاح_الخاص_بمشروعك
```

- استبدل `المفتاح_الخاص_بمشروعك` بمفتاح الـ **anon/public** من Supabase (نفس الموجود في `.env` أو من لوحة Supabase → Project Settings → API).

- إذا كان الموقع في مجلد فرعي (مثل `https://example.com/app`) أضف أيضاً:
  `BASE_PATH=/app/`

### ب) بناء المشروع

على جهازك (يجب أن يكون Node.js مثبتاً):

```bash
npm install
npm run build
```

- الملفات الجاهزة للنشر ستكون داخل مجلد **`dist`** في جذر المشروع.

---

## 2. رفع الملفات على Hostinger

### أ) الدخول إلى Hostinger

1. ادخل إلى [hostinger.com](https://www.hostinger.com) وسجّل الدخول.
2. من لوحة التحكم (hPanel) اختر الاستضافة الخاصة بموقعك.
3. افتح **مدير الملفات (File Manager)** أو استخدم **FTP** (مثل FileZilla).

### ب) رفع محتويات مجلد `out`

1. انتقل إلى المجلد الذي يعرض فيه الموقع (عادةً **`public_html`**).
2. احذف أو انقل المحتويات القديمة إن وجدت (احتفظ بنسخة إذا لزم).
3. ارفع **كل محتويات** مجلد **`dist`** من مشروعك إلى `public_html`:
   - يجب أن ترى ملف **`index.html`** وملفات **`assets`** داخل `public_html` بعد الرفع.

**مهم:** ارفع محتويات المجلد `dist` وليس المجلد `dist` نفسه (أي الملفات التي بداخل `dist` تذهب داخل `public_html`).

---

## 3. إعداد الروابط (SPA) على Hostinger

المشروع يستخدم React Router. حتى تعمل الروابط مثل `/admin`, `/driver-login`, `/restaurant-dashboard` عند التحديث أو فتحها مباشرة، يجب توجيه كل الطلبات إلى `index.html`.

### ملف `.htaccess` مضاف تلقائياً

يوجد في المشروع مجلد **`public`** بداخله ملف **`.htaccess`**. عند تشغيل `npm run build` يتم نسخه إلى مجلد **`dist`**، لذلك عند رفع محتويات **`dist`** إلى **`public_html`** سيُرفع ملف `.htaccess` مع الملفات ولن تحتاج لإنشائه يدوياً.

- إذا كان الموقع في **مجلد فرعي** على الاستضافة (مثل `https://example.com/app`)، عدّل ملف **`public/.htaccess`** قبل البناء:
  - غيّر `RewriteBase /` إلى `RewriteBase /app/`
  - غيّر السطر الأخير إلى `RewriteRule . /app/index.html [L]`

ثم أعد البناء وارفع المحتويات من جديد.

---

## 4. إعداد Supabase للنطاق الجديد

1. ادخل إلى [Supabase](https://supabase.com) → مشروعك.
2. من **Project Settings** → **Authentication** → **URL Configuration**:
   - أضف في **Site URL** عنوان موقعك، مثلاً:  
     `https://fooddelivery-marrakech.com`
   - في **Redirect URLs** أضف كل ما تحتاجه، مثلاً:
     - `https://fooddelivery-marrakech.com/**`
     - `https://fooddelivery-marrakech.com/auth`
     - `https://fooddelivery-marrakech.com/driver-login`
     - إلخ حسب الصفحات التي تستخدم تسجيل الدخول.

هذا يضمن أن تسجيل الدخول (العملاء، السائقين، صاحب المطعم) يعمل بعد التوجيه إلى موقعك.

---

## 5. التحقق بعد الرفع

- افتح: `https://نطاقك.com`
- جرّب: `https://نطاقك.com/admin-login` و `https://نطاقك.com/driver-login` و `https://نطاقك.com/restaurant-dashboard` (بعد تسجيل الدخول).
- تأكد من تسجيل الدخول من المتصفح (Auth) وأن الصفحات لا تعطي 404.

---

## ملخص سريع

| الخطوة | ماذا تفعل |
|--------|------------|
| 1 | إنشاء `.env.production` (اختياري) مع رابط Supabase والمفتاح |
| 2 | تشغيل `npm run build` ومجلد الناتج هو **`dist`** |
| 3 | رفع محتويات **`dist`** إلى **`public_html`** في Hostinger |
| 4 | وضع ملف **`.htaccess`** في `public_html` كما هو أعلاه |
| 5 | إضافة نطاقك في Supabase (Site URL و Redirect URLs) |

بعد هذه الخطوات يكون الموقع منشوراً على Hostinger ويعمل مع قاعدة البيانات Supabase.
