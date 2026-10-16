# حاسبة المسلم — موقع حاسبات إسلامية (ثابت، بلا تكلفة)

HTML/CSS/JS خالص، بدون بناء أو اعتماديات. RTL، جوال أولاً.

## الصفحات
`index.html` · `zakat.html` · `mawarith.html` · `hijri-converter.html` · `hijri-age.html` · `sitemap.xml` · `robots.txt`

## التشغيل محلياً
    python3 -m http.server 8099      # ثم افتح http://localhost:8099
    node tests/run-tests.js          # اختبارات المنطق (زكاة/مواريث/هجري)

## قبل النشر
1. استبدل `https://example.com` بنطاقك في كل الملفات:
   `sed -i 's#https://example.com#https://YOURDOMAIN#g' *.html sitemap.xml robots.txt`
2. عدّل `js/config.js`: `BINANCE_PAY_ID`, `ADSENSE_ID` (يُحمَّل سكربت AdSense تلقائياً فقط عند وضع معرّف صالح `ca-pub-…`).
3. مساحات الإعلان: عناصر `div.ad-slot` (top/middle/bottom) مخفية في الإنتاج وتظهر على localhost أو `?ads=1`. بعد موافقة AdSense ضع وحدة `<ins class="adsbygoogle">` داخلها.
4. زر «تقرير PDF» مجرّد placeholder يعرض رسالة؛ لا يوجد ربط دفع.
5. المسارات جذرية (`/css/...`) — تعمل على Netlify / Cloudflare Pages / نطاق مخصّص. على GitHub Pages لمستودع مشروع (user.github.io/repo) يلزم نطاق مخصّص أو تحويل المسارات لنسبية.
