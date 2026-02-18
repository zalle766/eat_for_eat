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
