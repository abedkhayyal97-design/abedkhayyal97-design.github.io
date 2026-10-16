(function () {
  var $ = function (id) { return document.getElementById(id); };
  var U = window.CalcUtil, H = window.HijriLib;
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function isoOf(g) { return g.y + "-" + pad(g.m) + "-" + pad(g.d); }
  function parseIso(v) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ""); return m ? { y: +m[1], m: +m[2], d: +m[3] } : null; }
  function gText(g) { return U.esc(H.weekday(g) + " " + g.d + " " + H.GREG_MONTHS[g.m - 1] + " " + g.y + " م"); }
  function hText(h) { return U.esc(h.d + " " + H.HIJRI_MONTHS[h.m - 1] + " " + h.y + " هـ"); }
  function fillMonths(sel) {
    sel.innerHTML = H.HIJRI_MONTHS.map(function (n, i) { return "<option value=\"" + (i + 1) + "\">" + (i + 1) + " - " + n + "</option>"; }).join("");
  }
  function show(out, cls, html) { out.hidden = false; out.className = "result " + cls; out.innerHTML = html; }
  function readHijri(p) {
    var d = U.parseNum($(p + "-d").value), y = U.parseNum($(p + "-y").value), m = parseInt($(p + "-m").value, 10);
    if (!isFinite(d) || !isFinite(y) || d < 1 || d > 30 || y < H.MIN_H || y > H.MAX_H || y % 1 || d % 1) return { error: "أدخل يوماً (1–30) وسنة هجرية بين " + H.MIN_H + " و " + H.MAX_H + "." };
    var h = { y: y, m: m, d: d }, g = H.hijriToGregorian(h);
    if (!g) return { error: "شهر " + H.HIJRI_MONTHS[m - 1] + " " + y + " هـ فيه " + H.monthLength(y, m) + " يوماً فقط حسب تقويم أم القرى." };
    return { h: h, g: g };
  }
  var today = H.todayGregorian(), todayH = H.gregorianToHijri(today);

  /* ===== صفحة المحوّل ===== */
  if ($("conv-g2h")) {
    fillMonths($("h2g-m"));
    $("g2h-date").value = isoOf(today);
    $("h2g-d").value = todayH.d; $("h2g-m").value = todayH.m; $("h2g-y").value = todayH.y;
    $("g2h-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var g = parseIso($("g2h-date").value), out = $("g2h-result");
      if (!g || !H.validGregorian(g)) return show(out, "error", "<strong>اختر تاريخاً ميلادياً صحيحاً.</strong>");
      var h = H.gregorianToHijri(g);
      if (h.y < H.MIN_H || h.y > H.MAX_H) return show(out, "error", "<strong>التاريخ خارج النطاق المدعوم (" + H.MIN_H + "–" + H.MAX_H + " هـ).</strong>");
      show(out, "", "<div>التاريخ الهجري (أم القرى):</div><div class=\"big\">" + hText(h) + "</div><p>" + gText(g) + "</p>");
    });
    $("h2g-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var r = readHijri("h2g"), out = $("h2g-result");
      if (r.error) return show(out, "error", "<strong>" + U.esc(r.error) + "</strong>");
      show(out, "", "<div>التاريخ الميلادي:</div><div class=\"big\">" + gText(r.g) + "</div><p>" + hText(r.h) + " (أم القرى)</p>");
    });
    $("g2h-today").addEventListener("click", function () { $("g2h-date").value = isoOf(today); $("g2h-form").requestSubmit(); });
    $("g2h-form").requestSubmit();
  }

  /* ===== صفحة العمر ===== */
  if ($("age-form")) {
    fillMonths($("b-m"));
    $("asof").value = isoOf(today);
    function syncType() {
      var hj = $("btype").value === "h";
      $("b-g-box").hidden = hj; $("b-h-box").hidden = !hj;
    }
    $("btype").addEventListener("change", syncType); syncType();
    $("age-form").addEventListener("reset", function () { setTimeout(function () { $("asof").value = isoOf(today); syncType(); $("age-result").hidden = true; }, 0); });
    $("age-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var out = $("age-result"), birth, asof = parseIso($("asof").value);
      if (!asof || !H.validGregorian(asof)) return show(out, "error", "<strong>اختر تاريخ الحساب بشكل صحيح.</strong>");
      if ($("btype").value === "h") {
        var r = readHijri("b"); if (r.error) return show(out, "error", "<strong>" + U.esc(r.error) + "</strong>"); birth = r.g;
      } else {
        birth = parseIso($("b-g").value);
        if (!birth || !H.validGregorian(birth)) return show(out, "error", "<strong>اختر تاريخ الميلاد بشكل صحيح.</strong>");
      }
      var a = H.hijriAge(birth, asof);
      if (!a.ok) return show(out, "error", "<strong>" + U.esc(a.error) + "</strong>");
      var g = H.gregorianAge(birth, asof);
      var h = "<div>عمرك بالتقويم الهجري:</div><div class=\"big\">" + a.years + " سنة، " + a.months + " شهر، " + a.days + " يوم</div>";
      h += "<dl class=\"kv\"><dt>تاريخ الميلاد</dt><dd>" + hText(a.birthH) + " = " + gText(birth) + "</dd>";
      h += "<dt>تاريخ الحساب</dt><dd>" + hText(a.asOfH) + " = " + gText(asof) + "</dd>";
      h += "<dt>العمر بالتقويم الميلادي</dt><dd>" + g.years + " سنة، " + g.months + " شهر، " + g.days + " يوم</dd>";
      h += "<dt>إجمالي الأيام</dt><dd>" + U.fmt(a.totalDays, 0) + " يوم</dd>";
      if (a.nextBirthday) {
        var nb = a.nextBirthday;
        h += "<dt>عيد الميلاد الهجري القادم (" + (nb.hijriYear - a.birthH.y) + " سنة)</dt><dd>" + (nb.daysLeft === 0 ? "اليوم 🎉" : "بعد " + U.fmt(nb.daysLeft, 0) + " يوماً — " + gText(nb.gregorian)) + "</dd>";
      }
      h += "</dl>";
      show(out, "", h);
    });
  }
})();
