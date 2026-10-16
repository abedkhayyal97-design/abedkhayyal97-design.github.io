/* وظائف مشتركة: تحميل AdSense عند توفّر المعرّف، أدوات الأرقام، زر التقرير */
(function () {
  var cfg = window.SITE_CONFIG || {};
  var local = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname);
  if (local || /[?&]ads=1/.test(location.search)) document.documentElement.classList.add("show-ads");

  // AdSense: يُحمَّل فقط إن غُيّر المعرّف عن القيمة الافتراضية
  if (cfg.ADSENSE_ID && /^ca-pub-\d{10,}$/.test(cfg.ADSENSE_ID)) {
    var s = document.createElement("script");
    s.async = true; s.crossOrigin = "anonymous";
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(cfg.ADSENSE_ID);
    document.head.appendChild(s);
  }

  var AR_DIGITS = "٠١٢٣٤٥٦٧٨٩", FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
  function normalize(str) {
    var s = String(str == null ? "" : str).replace(/[٠-٩۰-۹]/g, function (c) {
      var i = AR_DIGITS.indexOf(c); return i < 0 ? FA_DIGITS.indexOf(c) : i;
    }).replace(/[٬\s]/g, "").replace(/٫/g, ".").replace(/،/g, ",");
    // الفاصلة: آلاف إن جاءت بنمط 1,234 أو 1,234,567 وإلا فاصلة عشرية
    if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
    else s = s.replace(/,/g, ".");
    return s;
  }
  /** يقرأ رقماً (يقبل الأرقام العربية). يعيد NaN إن كان الحقل فارغاً أو غير صالح */
  function parseNum(str) { var s = normalize(str); if (s === "") return NaN; return /^-?\d*\.?\d+$/.test(s) ? parseFloat(s) : NaN; }
  function fmt(n, d) {
    if (!isFinite(n)) return "—";
    return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: d == null ? 2 : d });
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  window.CalcUtil = { parseNum: parseNum, fmt: fmt, esc: esc };

  // زر التقرير المفصّل (placeholder — بدون ربط دفع فعلي)
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-pdf-btn]");
    if (!b) return;
    var box = b.closest(".pdf-box"), msg = box.querySelector(".pdf-msg");
    var ready = cfg.BINANCE_PAY_ID && cfg.BINANCE_PAY_ID !== "YOUR_BINANCE_PAY_ID";
    msg.textContent = ready
      ? "ميزة التقرير قيد التجهيز حالياً وسيتم تفعيل الدفع قريباً. شكراً لاهتمامك!"
      : "ميزة التقرير المفصّل غير مفعّلة بعد (نسخة تجريبية). سيتم تفعيل الدفع عبر Binance Pay قريباً.";
  });
})();
