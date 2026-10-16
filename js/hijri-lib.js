/* التحويل بين الهجري (أم القرى) والميلادي عبر Intl.DateTimeFormat — يعمل في المتصفح وNode */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.HijriLib = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var MIN_H = 1318, MAX_H = 1600; // النطاق المدعوم في بيانات ICU لأم القرى
  var HIJRI_MONTHS = ["محرّم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوّال", "ذو القعدة", "ذو الحجة"];
  var GREG_MONTHS = ["كانون الثاني (يناير)", "شباط (فبراير)", "آذار (مارس)", "نيسان (أبريل)", "أيار (مايو)", "حزيران (يونيو)", "تمّوز (يوليو)", "آب (أغسطس)", "أيلول (سبتمبر)", "تشرين الأول (أكتوبر)", "تشرين الثاني (نوفمبر)", "كانون الأول (ديسمبر)"];
  var WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  var DAY = 86400000;

  var fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { year: "numeric", month: "numeric", day: "numeric", timeZone: "UTC" });

  // التاريخ الميلادي يُمثَّل بـ {y,m,d} ويُحوَّل داخلياً إلى منتصف نهار UTC
  function utc(g) { return Date.UTC(g.y, g.m - 1, g.d, 12); }
  function fromUtc(ms) { var d = new Date(ms); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }; }

  function gregorianToHijri(g) {
    var parts = fmt.formatToParts(new Date(utc(g))), o = {};
    parts.forEach(function (p) { if (p.type === "year" || p.type === "month" || p.type === "day") o[p.type] = parseInt(p.value, 10); });
    return { y: o.year, m: o.month, d: o.day };
  }

  function sameH(a, b) { return a.y === b.y && a.m === b.m && a.d === b.d; }

  // تحويل هجري -> ميلادي بالبحث حول تقدير تقريبي. يعيد null إن لم يوجد التاريخ (مثلاً يوم 30 في شهر من 29).
  function hijriToGregorian(h) {
    if (!h || h.y < MIN_H || h.y > MAX_H || h.m < 1 || h.m > 12 || h.d < 1 || h.d > 30) return null;
    // تقدير بالتقويم الهجري المدني الجدولي (يختلف عن أم القرى بيوم أو يومين على الأكثر) ثم تصحيح بالبحث
    var jd = h.d + Math.ceil(29.5 * (h.m - 1)) + (h.y - 1) * 354 + Math.floor((3 + 11 * h.y) / 30) + 1948439.5 - 1;
    var dayNum = Math.floor(jd - 2440587.5 + 0.5);
    var start = dayNum * DAY + 12 * 3600000;
    for (var k = -4; k <= 4; k++) {
      var g = fromUtc(start + k * DAY);
      if (sameH(gregorianToHijri(g), h)) return g;
    }
    return null;
  }

  function monthLength(y, m) {
    return hijriToGregorian({ y: y, m: m, d: 30 }) ? 30 : 29;
  }

  function weekday(g) { return WEEKDAYS[new Date(utc(g)).getUTCDay()]; }
  function daysBetween(a, b) { return Math.round((utc(b) - utc(a)) / DAY); }
  function cmpG(a, b) { return utc(a) - utc(b); }
  function validGregorian(g) {
    if (!g || !g.y || g.m < 1 || g.m > 12 || g.d < 1) return false;
    var x = fromUtc(utc(g));
    return x.y === g.y && x.m === g.m && x.d === g.d;
  }
  function todayGregorian() { var n = new Date(); return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() }; }

  /** العمر بالهجري بين تاريخي ميلاد وحساب (ميلاديين) */
  function hijriAge(birthG, asOfG) {
    if (cmpG(asOfG, birthG) < 0) return { ok: false, error: "تاريخ الحساب يجب أن يكون بعد تاريخ الميلاد." };
    var b = gregorianToHijri(birthG), a = gregorianToHijri(asOfG);
    if (b.y < MIN_H || a.y > MAX_H) return { ok: false, error: "التاريخ خارج النطاق المدعوم (" + MIN_H + "–" + MAX_H + " هـ)." };
    var y = a.y - b.y, m = a.m - b.m, d = a.d - b.d;
    if (d < 0) {
      m--;
      var pm = a.m - 1, py = a.y; if (pm < 1) { pm = 12; py--; }
      d += monthLength(py, pm);
    }
    if (m < 0) { y--; m += 12; }
    // عيد الميلاد الهجري القادم
    var ny = a.y, nd = Math.min(b.d, monthLength(ny, b.m));
    var next = hijriToGregorian({ y: ny, m: b.m, d: nd });
    if (!next || cmpG(next, asOfG) < 0) { ny++; nd = Math.min(b.d, monthLength(ny, b.m)); next = hijriToGregorian({ y: ny, m: b.m, d: nd }); }
    return {
      ok: true, birthH: b, asOfH: a, years: y, months: m, days: d, totalDays: daysBetween(birthG, asOfG),
      nextBirthday: next ? { gregorian: next, hijriYear: ny, daysLeft: daysBetween(asOfG, next) } : null
    };
  }

  /** العمر الميلادي */
  function gregorianAge(birthG, asOfG) {
    var y = asOfG.y - birthG.y, m = asOfG.m - birthG.m, d = asOfG.d - birthG.d;
    if (d < 0) { m--; d += new Date(Date.UTC(asOfG.y, asOfG.m - 1, 0)).getUTCDate(); }
    if (m < 0) { y--; m += 12; }
    return { years: y, months: m, days: d };
  }

  return {
    MIN_H: MIN_H, MAX_H: MAX_H, HIJRI_MONTHS: HIJRI_MONTHS, GREG_MONTHS: GREG_MONTHS, WEEKDAYS: WEEKDAYS,
    gregorianToHijri: gregorianToHijri, hijriToGregorian: hijriToGregorian, monthLength: monthLength,
    weekday: weekday, daysBetween: daysBetween, validGregorian: validGregorian, todayGregorian: todayGregorian,
    hijriAge: hijriAge, gregorianAge: gregorianAge, cmpG: cmpG
  };
});
