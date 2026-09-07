# موقع كورس VFX

موقع Landing Page لكورس تعليم الـ VFX، مبني بـ Node.js + Express (سيرفر بسيط يقدّم ملفات HTML/CSS ثابتة). جاهز للرفع على Railway مباشرة.

## هيكل الملفات

```
vfx-course/
├── server.js          ← السيرفر (Express)
├── package.json        ← الاعتماديات + أمر التشغيل
├── railway.json         ← إعدادات Railway
└── public/
    ├── index.html      ← محتوى الموقع
    ├── styles.css      ← التصميم
```

## شلون تشغّله على جهازك (اختياري، للتجربة قبل الرفع)

```bash
npm install
npm start
```

بعدها افتح: http://localhost:3000

## شلون ترفعه على Railway

### الطريقة الأولى: عن طريق GitHub (الأسهل والأنسب)

1. سوّي repository جديد على GitHub وارفع هذا المجلد كامل إله (بما فيه `package.json` و`server.js` و`public/`).
2. روح لـ [railway.app](https://railway.app) وسجّل دخول (تكدر تدخل بحساب GitHub مباشرة).
3. اضغط **New Project** → **Deploy from GitHub repo**.
4. اختار الـ repository اللي رفعتها.
5. Railway بيكتشف تلقائياً إنه مشروع Node.js وبيشغّل `npm install` ثم `npm start`.
6. بعد ما يخلص الـ Build، روح لتبويب **Settings** → **Networking** واضغط **Generate Domain** عشان يعطيك رابط عام (public URL) تقدر تفتح موقعك منه.

### الطريقة الثانية: عن طريق Railway CLI (من جهازك مباشرة، بدون GitHub)

```bash
# تثبيت الأداة (مرة وحدة بس)
npm install -g @railway/cli

# تسجيل الدخول
railway login

# من داخل مجلد المشروع (vfx-course)
railway init
railway up
```

بعدها اطلع بنفس صفحة **Networking** بالمشروع على railway.app وسوّي **Generate Domain** عشان تحصل على الرابط.

## ملاحظات مهمة

- لا تحط رقم بورت ثابت بالكود — Railway يحدد البورت تلقائياً عن طريق `process.env.PORT`، وهذا موجود بالفعل بـ `server.js`.
- إذا تبي تعدّل المحتوى أو الألوان، الملفات اللي تخصك هي `public/index.html` (النصوص) و `public/styles.css` (التصميم).
- الموقع صفحة وحدة (single page) فيها كل الأقسام: التعريف، الاختصاصات، خطة الأسابيع، والأدوات.
