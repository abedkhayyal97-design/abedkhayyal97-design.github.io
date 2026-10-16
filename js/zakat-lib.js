/* منطق حساب الزكاة — يعمل في المتصفح وفي Node */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ZakatLib = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var GOLD_NISAB_G = 85;   // غرام ذهب خالص (عيار 24)
  var SILVER_NISAB_G = 595; // غرام فضة خالصة
  var RATE = 0.025;         // 2.5%

  function num(v) {
    var n = Number(v);
    return isFinite(n) && n > 0 ? n : 0;
  }

  /**
   * in: goldPrice (سعر غرام الذهب عيار 24), silverPrice (اختياري),
   *     goldGrams, goldKarat (24/22/21/18), silverGrams, cash, trade,
   *     receivables (ديون مرجوّة السداد لك), debts (ديون حالّة عليك),
   *     basis: "gold" | "silver"
   */
  function calcZakat(i) {
    var errors = [];
    var goldPrice = num(i.goldPrice), silverPrice = num(i.silverPrice);
    var karat = num(i.goldKarat) || 24;
    if (karat > 24) karat = 24;
    var goldPure = num(i.goldGrams) * karat / 24;
    var silverGrams = num(i.silverGrams);
    var basis = i.basis === "silver" ? "silver" : "gold";

    if ((goldPure > 0 || basis === "gold") && goldPrice <= 0) errors.push("أدخل سعر غرام الذهب (عيار 24) الحالي.");
    if ((silverGrams > 0 || basis === "silver") && silverPrice <= 0) errors.push("أدخل سعر غرام الفضة الحالي.");
    if (errors.length) return { ok: false, errors: errors };

    var goldValue = goldPure * goldPrice;
    var silverValue = silverGrams * silverPrice;
    var cash = num(i.cash), trade = num(i.trade), rec = num(i.receivables), debts = num(i.debts);
    var gross = goldValue + silverValue + cash + trade + rec;
    var net = Math.max(0, gross - debts);
    var nisabGold = goldPrice > 0 ? GOLD_NISAB_G * goldPrice : null;
    var nisabSilver = silverPrice > 0 ? SILVER_NISAB_G * silverPrice : null;
    var nisab = basis === "silver" ? nisabSilver : nisabGold;
    var due = net >= nisab && net > 0;
    var zakat = due ? net * RATE : 0;
    return {
      ok: true, errors: [], basis: basis, goldPure: goldPure, goldValue: goldValue, silverValue: silverValue,
      cash: cash, trade: trade, receivables: rec, debts: debts, gross: gross, net: net,
      nisab: nisab, nisabGold: nisabGold, nisabSilver: nisabSilver, due: due, zakat: zakat,
      remainingToNisab: due ? 0 : nisab - net
    };
  }
  return { calcZakat: calcZakat, GOLD_NISAB_G: GOLD_NISAB_G, SILVER_NISAB_G: SILVER_NISAB_G, RATE: RATE };
});
