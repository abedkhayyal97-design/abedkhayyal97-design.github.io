(function () {
  var $ = function (id) { return document.getElementById(id); };
  var U = window.CalcUtil, Z = window.ZakatLib;
  var form = $("zakat-form"), out = $("zakat-result");
  var KEYS = ["currency", "goldPrice", "silverPrice"];
  try { KEYS.forEach(function (k) { var v = localStorage.getItem("zk_" + k); if (v && $(k)) $(k).value = v; }); } catch (e) {}

  function val(id) { return U.parseNum($(id).value); }
  function run(ev) {
    if (ev) ev.preventDefault();
    var cur = ($("currency").value || "").trim() || "وحدة";
    try { KEYS.forEach(function (k) { localStorage.setItem("zk_" + k, $(k).value); }); } catch (e) {}
    var r = Z.calcZakat({
      goldPrice: val("goldPrice"), silverPrice: val("silverPrice"), goldGrams: val("goldGrams"), goldKarat: $("goldKarat").value,
      silverGrams: val("silverGrams"), cash: val("cash"), trade: val("trade"), receivables: val("receivables"), debts: val("debts"),
      basis: form.elements.basis.value
    });
    out.hidden = false;
    if (!r.ok) { out.className = "result error"; out.innerHTML = "<strong>" + r.errors.map(U.esc).join("<br>") + "</strong>"; return; }
    var f = function (n) { return U.fmt(n) + " " + U.esc(cur); };
    var h = "";
    if (r.due) {
      out.className = "result";
      h += "<div>زكاة مالك الواجبة هذا العام:</div><div class=\"big\">" + f(r.zakat) + "</div>";
      h += "<p>بلغ مالك النصاب، فيجب إخراج 2.5% من صافي المال شرط مرور سنة هجرية كاملة على بلوغه النصاب (الحول).</p>";
    } else {
      out.className = "result warn";
      h += "<div class=\"big\">لا زكاة عليك الآن</div>";
      h += "<p>صافي مالك أقل من النصاب بمقدار " + f(r.remainingToNisab) + ". إن بلغت النصاب لاحقاً وحال عليه الحول وجبت الزكاة.</p>";
    }
    h += "<dl class=\"kv\">";
    if (r.goldValue) h += "<dt>قيمة الذهب (" + U.fmt(r.goldPure) + " غ خالص)</dt><dd>" + f(r.goldValue) + "</dd>";
    if (r.silverValue) h += "<dt>قيمة الفضة</dt><dd>" + f(r.silverValue) + "</dd>";
    if (r.cash) h += "<dt>النقد والأرصدة</dt><dd>" + f(r.cash) + "</dd>";
    if (r.trade) h += "<dt>عروض التجارة</dt><dd>" + f(r.trade) + "</dd>";
    if (r.receivables) h += "<dt>ديون مرجوّة لك</dt><dd>" + f(r.receivables) + "</dd>";
    if (r.debts) h += "<dt>ديون عليك (تُخصم)</dt><dd>− " + f(r.debts) + "</dd>";
    h += "<dt>صافي المال الخاضع للزكاة</dt><dd>" + f(r.net) + "</dd>";
    h += "<dt>النصاب المعتمد (" + (r.basis === "gold" ? "85 غ ذهب" : "595 غ فضة") + ")</dt><dd>" + f(r.nisab) + "</dd>";
    if (r.nisabGold && r.nisabSilver) h += "<dt>للمقارنة: نصاب الذهب / الفضة</dt><dd>" + U.fmt(r.nisabGold) + " / " + U.fmt(r.nisabSilver) + "</dd>";
    h += "</dl>";
    out.innerHTML = h;
    out.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  form.addEventListener("submit", run);
  form.addEventListener("reset", function () { setTimeout(function () { out.hidden = true; }, 0); });
})();
