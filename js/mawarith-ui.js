(function () {
  var $ = function (id) { return document.getElementById(id); };
  var U = window.CalcUtil, M = window.MawarithLib;
  var form = $("maw-form"), out = $("maw-result");
  function syncWives() { $("wives-field").hidden = $("spouse").value !== "wives"; }
  $("spouse").addEventListener("change", syncWives); syncWives();
  function cnt(id) { var n = U.parseNum($(id).value); return isFinite(n) && n > 0 ? Math.floor(n) : 0; }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var r = M.calcMawarith({ spouse: $("spouse").value, wives: cnt("wives"), sons: cnt("sons"), daughters: cnt("daughters"), father: $("father").checked, mother: $("mother").checked });
    out.hidden = false;
    if (!r.ok) { out.className = "result error"; out.innerHTML = "<strong>" + r.errors.map(U.esc).join("<br>") + "</strong>"; return; }
    var cur = ($("currency").value || "").trim() || "وحدة";
    var estate = U.parseNum($("estate").value), debts = U.parseNum($("debts").value), beq = U.parseNum($("bequest").value);
    var hasAmount = isFinite(estate) && estate > 0, net = null;
    if (hasAmount) net = M.netEstate(estate, isFinite(debts) ? debts : 0, isFinite(beq) ? beq : 0);
    var h = "<h3 style=\"margin-top:0\">نتيجة القسمة" + (r.awl ? " <span class=\"pill\">فيها عول</span>" : "") + (r.radd ? " <span class=\"pill\">فيها ردّ</span>" : "") + "</h3>";
    h += "<p class=\"hint\">أصل المسألة: <strong>" + r.base + "</strong></p>";
    h += "<div class=\"tbl-wrap\"><table><thead><tr><th>الوارث</th><th>العدد</th><th>النصيب</th><th>النسبة</th><th>نصيب الفرد</th>" + (net ? "<th>المبلغ (للمجموعة)</th><th>المبلغ (للفرد)</th>" : "") + "<th>السبب</th></tr></thead><tbody>";
    r.rows.forEach(function (x) {
      h += "<tr><td>" + U.esc(x.label) + "</td><td class=\"num\">" + x.count + "</td><td class=\"num\">" + M.str(x.share) + "</td><td class=\"num\">" + U.fmt(M.val(x.share) * 100, 2) + "%</td><td class=\"num\">" + M.str(x.per) + "</td>";
      if (net) h += "<td class=\"num\">" + U.fmt(M.val(x.share) * net.distributable) + "</td><td class=\"num\">" + U.fmt(M.val(x.per) * net.distributable) + "</td>";
      h += "<td class=\"sm\">" + U.esc(x.basis) + "</td></tr>";
    });
    h += "</tbody></table></div>";
    if (net) {
      h += "<dl class=\"kv\"><dt>التركة</dt><dd>" + U.fmt(estate) + " " + U.esc(cur) + "</dd>";
      if (isFinite(debts) && debts > 0) h += "<dt>الديون (تُسدَّد أولاً)</dt><dd>− " + U.fmt(debts) + "</dd>";
      if (net.bequest > 0) h += "<dt>الوصية (حتى الثلث)</dt><dd>− " + U.fmt(net.bequest) + "</dd>";
      h += "<dt>الصافي الموزَّع على الورثة</dt><dd>" + U.fmt(net.distributable) + " " + U.esc(cur) + "</dd></dl>";
      if (net.bequestCapped) h += "<p class=\"hint\">⚠️ الوصية تتجاوز ثلث الباقي بعد الديون، فتم تقليصها إلى الثلث. وما زاد عنه لا ينفذ إلا بإجازة الورثة.</p>";
    }
    if (r.notes.length) h += "<ul class=\"notes\">" + r.notes.map(function (n) { return "<li>" + U.esc(n) + "</li>"; }).join("") + "</ul>";
    out.className = "result"; out.innerHTML = h;
    out.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  form.addEventListener("reset", function () { setTimeout(function () { out.hidden = true; syncWives(); }, 0); });
})();
