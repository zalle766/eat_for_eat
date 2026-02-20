# تفعيل تسجيل الدخول عبر Google (Supabase)

لتشغيل زر « Continuer avec Google » في صفحة تسجيل الدخول، يجب تفعيل مزود Google في Supabase وإضافة بيانات التطبيق من Google Cloud.

## 1. إنشاء مشروع OAuth في Google Cloud

1. ادخل إلى [Google Cloud Console](https://console.cloud.google.com/).
2. أنشئ مشروعاً جديداً أو اختر مشروعاً موجوداً.
3. من القائمة الجانبية: **APIs & Services** → **Credentials**.
4. اضغط **Create Credentials** → **OAuth client ID**.
5. إذا طُلب منك، اضبط **OAuth consent screen** (نوع المستخدم: External، ثم أضف اسم التطبيق والبريد الإلكتروني للمطور).
6. عند إنشاء OAuth client ID:
   - Application type: **Web application**
   - Name: مثلاً `Eat for Eat`
   - **Authorized redirect URIs**: أضف الرابط الذي يعطيك إياه Supabase:
     - ادخل إلى Supabase (الخطوة التالية) وانسخ **Redirect URL** من صفحة Authentication → Providers → Google.
     - يكون عادة بالشكل: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
7. انسخ **Client ID** و **Client Secret**.

## 2. تفعيل Google في Supabase

1. ادخل إلى [Supabase](https://supabase.com) → مشروعك.
2. من القائمة: **Authentication** → **Providers** → **Google**.
3. فعّل **Enable Sign in with Google**.
4. الصق **Client ID** و **Client Secret** من Google Cloud.
5. احفظ (Save).

## 3. إعداد عناوين الموقع وإعادة التوجيه (URL Configuration)

في Supabase هذه الإعدادات تحدد **من أين** يأتي المستخدم و**إلى أين** يُعاد بعد تسجيل الدخول بـ Google. يجب ضبطها حتى لا يرفض Supabase الطلب أو يوجّه المستخدم لرابط خاطئ.

### أين أجد هذه الإعدادات؟

1. في Supabase: من القائمة الجانبية **Authentication**.
2. تحت **CONFIGURATION** اختر **URL Configuration**.

ستجد حقلين مهمين:

---

### 1) Site URL

- **ما هو؟** عنوان الموقع الرئيسي الذي يعمل عليه تطبيقك (الصفحة الأولى).
- **ماذا يفعله؟** Supabase يستخدمه كـ « مصدر موثوق »: روابط التأكيد بالبريد، وإعادة التوجيه الافتراضية بعد تسجيل الدخول، تُبنى نسبةً إليه.
- **ماذا أضع؟**
  - **إذا الموقع منشور على الإنترنت (حالتك):**  
    ضع بالضبط:  
    `https://www.eatforeat.com`  
    (بدون `/` في النهاية، وبدون مسار مثل `/auth`).
  - **أثناء التطوير على جهازك فقط:**  
    يمكنك وضع: `http://localhost:5173`  
    (أو المنفذ الذي يستخدمه مشروعك، مثلاً 5173 لـ Vite).

---

### 2) Redirect URLs

- **ما هي؟** قائمة عناوين يُسمح لـ Supabase بإعادة توجيه المستخدم إليها بعد تسجيل الدخول (بعد النقر على « Continuer avec Google » وخروج المستخدم من Google).
- **لماذا مهمة؟** لأسباب أمان، Supabase لا يقبل إعادة التوجيه إلا إلى عناوين مضافة هنا. إذا لم يكن الرابط في القائمة، قد يظهر خطأ أو لا يتم إكمال تسجيل الدخول.
- **ماذا أضيف؟**
  - **للموقع المنشور (eatforeat.com):**  
    أضف سطراً واحداً:  
    `https://www.eatforeat.com/auth`
  - **للتجربة على جهازك (تطوير):**  
    أضف:  
    `http://localhost:5173/auth`

يمكنك إضافة الاثنين معاً في **Redirect URLs** إذا كنت تستخدم الموقع أحياناً من النت وأحياناً من localhost.

---

### ملخص القيم المقترحة لموقعك

| الإعداد        | القيمة (للإنتاج)              | للتطوير المحلي        |
|----------------|-------------------------------|------------------------|
| **Site URL**   | `https://www.eatforeat.com`   | `http://localhost:5173` |
| **Redirect URLs** | `https://www.eatforeat.com/auth` | `http://localhost:5173/auth` |

بعد التعديل اضغط **Save** في نفس الصفحة.

---

### ماذا يحدث عند النقر على « Continuer avec Google »؟

1. المستخدم يُوجّه إلى Google للموافقة.
2. بعد الموافقة، Google يرسل المستخدم إلى رابط Supabase (Callback URL الذي أضفته في Google Cloud).
3. Supabase يتحقق من الجلسة ثم يعيد توجيه المستخدم إلى أحد عناوين **Redirect URLs** (مثلاً `https://www.eatforeat.com/auth`).
4. صفحة `/auth` في موقعك تفتح والمستخدم يكون مسجّل الدخول تلقائياً.

إذا لم تضف `https://www.eatforeat.com/auth` في **Redirect URLs**، قد يظهر خطأ من Supabase أو لا يتم إكمال تسجيل الدخول. تأكدي أن هذا الرابط مضاف وحُفظ.

بعد حفظ هذه الإعدادات، جرّبي في الموقع المنشور زر « Continuer avec Google ». إن ظهر أي خطأ أو رسالة معيّنة، انسخيها أو التقطي لقطة شاشة وأرسليها لمتابعة الحل.

---

## 4. حل مشكلة الخطأ 500 (Unexpected failure)

إذا ظهرت رسالة خطأ مثل:
```json
{"code": 500, "error_code": "unexpected_failure", "msg": "Unexpected failure, please check server logs for more information"}
```

هذا يعني أن هناك مشكلة في إعدادات Supabase أو Google OAuth. اتبع الخطوات التالية:

### الخطوات لحل المشكلة:

1. **التحقق من Redirect URLs في Supabase:**
   - اذهب إلى Supabase → Authentication → URL Configuration
   - تأكد من إضافة الرابط الصحيح في **Redirect URLs**:
     - للإنتاج: `https://www.eatforeat.com/auth`
     - للتطوير: `http://localhost:5173/auth`
   - تأكد من الضغط على **Save**

2. **التحقق من Site URL في Supabase:**
   - في نفس الصفحة (URL Configuration)
   - تأكد من أن **Site URL** مضبوط بشكل صحيح:
     - للإنتاج: `https://www.eatforeat.com` (بدون `/` في النهاية)
     - للتطوير: `http://localhost:5173`

3. **التحقق من Google OAuth Credentials:**
   - اذهب إلى Google Cloud Console → APIs & Services → Credentials
   - تأكد من أن **Authorized redirect URIs** يحتوي على:
     - `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
     - (استبدل `<PROJECT_REF>` بمعرف مشروع Supabase الخاص بك)
   - تأكد من نسخ **Client ID** و **Client Secret** بشكل صحيح في Supabase

4. **فحص Supabase Logs:**
   - اذهب إلى Supabase → Logs → API Logs
   - ابحث عن الأخطاء المتعلقة بـ `auth/v1/callback`
   - الأخطاء ستخبرك بالضبط ما هي المشكلة

5. **التحقق من أن Google OAuth مفعّل:**
   - في Supabase → Authentication → Providers → Google
   - تأكد من أن **Enable Sign in with Google** مفعّل
   - تأكد من حفظ التغييرات

6. **إعادة المحاولة:**
   - بعد إصلاح الإعدادات، انتظر دقيقة أو دقيقتين
   - امسح الكاش في المتصفح (Ctrl+Shift+Delete)
   - جرّب تسجيل الدخول مرة أخرى

### ملاحظات مهمة:

- **تأكد من تطابق النطاق:** إذا كان موقعك يعمل على `www.eatforeat.com`، استخدم `www` في جميع الإعدادات. إذا كان بدون `www`، استخدم `eatforeat.com` فقط.
- **لا تستخدم `http://` للإنتاج:** تأكد من استخدام `https://` في جميع الإعدادات للإنتاج.
- **انتظر قليلاً بعد التعديل:** Supabase قد يحتاج إلى بضع دقائق لتطبيق التغييرات.

إذا استمرت المشكلة بعد اتباع جميع الخطوات، راجع سجلات Supabase (Logs) للحصول على تفاصيل أكثر عن الخطأ.
