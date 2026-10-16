/* حاسبة المواريث — الورثة المدعومون: الزوج/الزوجات، الأبناء، البنات، الأب، الأم
   تستخدم كسوراً دقيقة (أعداداً صحيحة) لتجنب أخطاء الفاصلة العائمة. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.MawarithLib = factory();
})(typeof self !== "undefined" ? self : this, function () {
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function F(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d);
    return { n: n / g, d: d / g };
  }
  function add(a, b) { return F(a.n * b.d + b.n * a.d, a.d * b.d); }
  function sub(a, b) { return F(a.n * b.d - b.n * a.d, a.d * b.d); }
  function mul(a, b) { return F(a.n * b.n, a.d * b.d); }
  function div(a, b) { return F(a.n * b.d, a.d * b.n); }
  function cmp(a, b) { return a.n * b.d - b.n * a.d; }
  function isZero(a) { return a.n === 0; }
  function val(a) { return a.n / a.d; }
  function str(a) { return a.d === 1 ? String(a.n) : a.n + "/" + a.d; }
  var ZERO = F(0), ONE = F(1);

  function toInt(v) { var n = Math.floor(Number(v)); return isFinite(n) && n > 0 ? n : 0; }

  /**
   * in: spouse: "none" | "husband" | "wives", wives (1..4), sons, daughters, father (bool), mother (bool)
   * out: { ok, errors, rows:[{key,label,count,share,per,basis}], awl, radd, umariyyah, base, notes }
   * share/per كسور {n,d} — مجموع share يساوي 1 دائماً (إلا إذا بقي فائض بلا مستحق).
   */
  function calcMawarith(i) {
    var errors = [], notes = [];
    var spouse = i.spouse === "husband" || i.spouse === "wives" ? i.spouse : "none";
    var wives = spouse === "wives" ? Math.min(4, Math.max(1, toInt(i.wives) || 1)) : 0;
    var sons = toInt(i.sons), daughters = toInt(i.daughters);
    var father = !!i.father, mother = !!i.mother;
    if (sons > 50 || daughters > 50) errors.push("عدد الأبناء أو البنات كبير جداً؛ تحقّق من الإدخال.");
    if (spouse === "none" && !sons && !daughters && !father && !mother) errors.push("اختر وريثاً واحداً على الأقل.");
    if (errors.length) return { ok: false, errors: errors };

    var hasDesc = sons > 0 || daughters > 0;
    var fixed = {}; // key -> مجموع نصيب المجموعة
    var basisText = {};
    var spouseShare = ZERO, umariyyah = false;

    if (spouse === "husband") {
      spouseShare = hasDesc ? F(1, 4) : F(1, 2);
      fixed.husband = spouseShare;
      basisText.husband = hasDesc ? "الربع لوجود فرع وارث" : "النصف لعدم وجود فرع وارث";
    } else if (spouse === "wives") {
      spouseShare = hasDesc ? F(1, 8) : F(1, 4);
      fixed.wives = spouseShare;
      basisText.wives = (hasDesc ? "الثمن لوجود فرع وارث" : "الربع لعدم وجود فرع وارث") + (wives > 1 ? " يُقسَم بالتساوي بينهنّ" : "");
    }

    if (mother) {
      if (hasDesc) { fixed.mother = F(1, 6); basisText.mother = "السدس لوجود فرع وارث"; }
      else if (father && spouse !== "none") {
        umariyyah = true;
        fixed.mother = div(sub(ONE, spouseShare), F(3));
        basisText.mother = "ثلث الباقي بعد نصيب الزوج/الزوجة (المسألة العُمَرية)";
      } else { fixed.mother = F(1, 3); basisText.mother = "الثلث لعدم وجود فرع وارث"; }
    }

    if (father) {
      if (hasDesc) {
        fixed.father = F(1, 6);
        basisText.father = sons > 0 ? "السدس لوجود الابن" : "السدس فرضاً + الباقي تعصيباً لعدم وجود الابن";
      } else { basisText.father = "الباقي تعصيباً"; }
    }

    if (daughters > 0 && sons === 0) {
      fixed.daughters = daughters === 1 ? F(1, 2) : F(2, 3);
      basisText.daughters = daughters === 1 ? "النصف للبنت الواحدة" : "الثلثان للبنات (اثنتان فأكثر) بالتساوي";
    }

    var total = ZERO, k;
    for (k in fixed) total = add(total, fixed[k]);

    var awl = false, radd = false, residue = ZERO;
    var shares = {};
    for (k in fixed) shares[k] = fixed[k];

    if (cmp(total, ONE) > 0) {
      // العول: تُنقَص الحصص بنسبة واحدة
      awl = true;
      for (k in shares) shares[k] = div(shares[k], total);
      notes.push("حصلت مسألة عَول: مجموع الفروض (" + str(total) + ") يزيد عن الواحد، فتُخفَّض كل الحصص بنسبة متساوية.");
    } else if (cmp(total, ONE) < 0) {
      residue = sub(ONE, total);
      if (sons > 0) {
        // الأبناء والبنات تعصيباً للذكر مثل حظ الأنثيين
        var w = sons * 2 + daughters;
        shares.sons = mul(residue, F(sons * 2, w));
        if (daughters > 0) shares.daughters = mul(residue, F(daughters, w));
        basisText.sons = daughters > 0 ? "الباقي تعصيباً للذكر مثل حظ الأنثيين" : "الباقي تعصيباً";
        if (daughters > 0) basisText.daughters = "الباقي تعصيباً مع الأبناء للذكر مثل حظ الأنثيين";
      } else if (father) {
        shares.father = add(shares.father || ZERO, residue);
      } else {
        // لا عاصب: ردّ الباقي على أصحاب الفروض عدا الزوجين
        var keys = [], sum = ZERO;
        for (k in fixed) if (k !== "husband" && k !== "wives") { keys.push(k); sum = add(sum, fixed[k]); }
        if (keys.length) {
          radd = true;
          keys.forEach(function (kk) { shares[kk] = add(shares[kk], mul(residue, div(fixed[kk], sum))); });
          notes.push("بقي فائض بلا عاصب فيُردّ على أصحاب الفروض (غير الزوجين) بنسبة فروضهم، وهو ما يعمل به أكثر الفقهاء وقوانين الأحوال الشخصية.");
        } else {
          notes.push("لا وارث غير الزوج/الزوجة: يبقى فائض من التركة (" + str(residue) + ") لا يُوزَّع هنا. يرجع الأمر لبيت المال أو لذوي الأرحام أو لقانون بلدك، فراجع المحكمة الشرعية.");
        }
      }
    }

    var rows = [];
    function pushRow(key, label, count, share) {
      if (!share || isZero(share)) return;
      rows.push({ key: key, label: label, count: count, share: share, per: div(share, F(count)), basis: basisText[key] || "" });
    }
    pushRow("husband", "الزوج", 1, shares.husband);
    pushRow("wives", wives > 1 ? "الزوجات (" + wives + ")" : "الزوجة", wives, shares.wives);
    pushRow("father", "الأب", 1, shares.father);
    pushRow("mother", "الأم", 1, shares.mother);
    pushRow("sons", sons > 1 ? "الأبناء (" + sons + ")" : "الابن", sons, shares.sons);
    pushRow("daughters", daughters > 1 ? "البنات (" + daughters + ")" : "البنت", daughters, shares.daughters);

    if (umariyyah) notes.push("هذه من المسائل العُمَرية: الأم تأخذ ثلث الباقي بعد فرض الزوج/الزوجة، والأب يأخذ الباقي.");

    // أصل المسألة: المضاعف المشترك الأصغر لمقامات الحصص
    var base = 1;
    rows.forEach(function (r) { base = base * r.share.d / gcd(base, r.share.d); });
    return { ok: true, errors: [], rows: rows, awl: awl, radd: radd, umariyyah: umariyyah, base: base, residue: residue, notes: notes };
  }

  /** تقسيم مبلغ التركة: يطبّق الديون والوصية (حتى الثلث) */
  function netEstate(estate, debts, bequest) {
    estate = Math.max(0, Number(estate) || 0); debts = Math.max(0, Number(debts) || 0); bequest = Math.max(0, Number(bequest) || 0);
    var afterDebts = Math.max(0, estate - debts);
    var maxBeq = afterDebts / 3;
    var beq = Math.min(bequest, maxBeq);
    return { afterDebts: afterDebts, bequest: beq, bequestCapped: bequest > maxBeq, distributable: afterDebts - beq };
  }

  return { calcMawarith: calcMawarith, netEstate: netEstate, F: F, val: val, str: str, add: add };
});
