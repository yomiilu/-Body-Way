document.addEventListener('DOMContentLoaded', function () {
  var calc = document.getElementById('calcStepper');
  if (!calc) return;
  initCalculator();
});

function initCalculator() {
  var SICK_DAYS_PER_PERSON = 10;
  var REPLACE_COST_FACTOR = 0.5;

  var CONFIG_HINTS = {
    massage: 'Чем чаще массаж — тем выше эффект. Еженедельные сеансы дают максимальную пользу.',
    bos: 'Золотая зона эффективности БОС-терапии: 18–25 сессий в год на участника, минимум 1 сессия в неделю в активной фазе (8–12 недель). Эффект сохраняется 6–12 месяцев после курса.'
  };

  var SERVICES = {
    massage: {
      label: 'Выездной массаж',
      icon: 'assets/icons/icon-massage.svg',
      price: 2500,
      effects: { sick: 0.25, turnover: 0.10, prod: 0.10 },
      fieldA: { label: 'Сотрудников в сеанс?', default: 26 },
      fieldB: { label: 'Сеансов в месяц?', default: 9 },
      mode: 'company-sessions'
    },
    yoga: {
      label: 'Йога',
      icon: 'assets/icons/icon-yoga.svg',
      price: 6500,
      effects: { sick: 0.18, turnover: 0.15, prod: 0.06 },
      fieldA: { label: 'Сотрудников за занятие?', default: 18 },
      fieldB: { label: 'Сеансов в месяц?', default: 4 },
      mode: 'group-sessions'
    },
    bos: {
      label: 'Психолог / БОС',
      icon: 'assets/icons/icon-bos.svg',
      price: 6500,
      effects: { sick: 0.10, turnover: 0.12, prod: 0.10 },
      fieldA: { label: 'Сотрудников в месяц?', default: 10 },
      fieldB: { label: 'Сеансов у каждого?', default: 2 },
      mode: 'per-person-monthly'
    },
    nutrition: {
      label: 'Нутрициолог',
      icon: 'assets/icons/icon-leaf.svg',
      price: 6000,
      effects: { sick: 0.08, turnover: 0.05, prod: 0.08 },
      fieldA: { label: 'Сотрудников в месяц?', default: 10 },
      fieldB: { label: 'Сеансов у каждого?', default: 2 },
      mode: 'per-person-monthly'
    },
    aroma: {
      label: 'Ароматерапия',
      icon: 'assets/icons/icon-perfume.svg',
      price: 2500,
      effects: { sick: 0.12, turnover: 0.05, prod: 0.05 },
      fieldA: { label: 'Сотрудников в сеанс?', default: 20 },
      fieldB: { label: 'Сеансов в месяц?', default: 8 },
      mode: 'company-sessions'
    }
  };

  var state = {
    step: 1,
    maxStep: 1,
    enabled: { massage: true, yoga: true, bos: false, nutrition: false, aroma: false },
    config: {}
  };

  Object.keys(SERVICES).forEach(function (key) {
    state.config[key] = {
      a: SERVICES[key].fieldA.default,
      b: SERVICES[key].fieldB.default
    };
  });

  var root = document.querySelector('.calc');
  var stepper = document.getElementById('calcStepper');
  var panels = root.querySelectorAll('.calc__panel');
  var nextBtn = document.getElementById('calcNextBtn');
  var backBtn = document.getElementById('calcBackBtn');
  var actionsWrap = document.getElementById('calcActions');
  var configWrap = document.getElementById('calcConfig');
  var resultsWrap = document.getElementById('calcResults');
  var pdfBtn = document.getElementById('calcPdfBtn');
  var consultBtn = document.getElementById('calcConsultBtn');
  var printWrap = document.getElementById('calcPrint');

  function fmtMoney(n) {
    return Math.round(n).toLocaleString('ru-RU') + ' ₽';
  }

  function fmtInt(n) {
    return Math.round(n).toLocaleString('ru-RU');
  }

  /* ---------- navigation ---------- */

  function goTo(step) {
    state.step = step;
    if (step > state.maxStep) state.maxStep = step;

    panels.forEach(function (p) {
      p.hidden = parseInt(p.dataset.panel, 10) !== step;
    });

    stepper.querySelectorAll('.calc__step').forEach(function (el) {
      var s = parseInt(el.dataset.step, 10);
      el.classList.toggle('calc__step--active', s === step);
      el.classList.toggle('calc__step--done', s < step);
    });

    var arrowFill = document.getElementById('calcStepperFill');
    var arrowHead = document.getElementById('calcStepperHead');
    if (arrowFill && arrowHead) {
      var pct = ((step - 1) / 3) * 100;
      arrowFill.style.width = pct + '%';
      arrowHead.style.left = pct + '%';
    }

    backBtn.hidden = step === 1 || step === 4;
    nextBtn.hidden = step === 4;
    consultBtn.hidden = step !== 4;
    actionsWrap.classList.toggle('calc__actions--split', step > 1 && step < 4);

    if (step === 3) renderConfigStep();
    if (step === 4) renderResults();
  }

  stepper.querySelectorAll('.calc__step').forEach(function (el) {
    el.addEventListener('click', function () {
      var s = parseInt(el.dataset.step, 10);
      if (s !== state.step) goTo(s);
    });
  });

  backBtn.addEventListener('click', function () {
    if (state.step > 1) goTo(state.step - 1);
  });

  nextBtn.addEventListener('click', function () {
    if (state.step === 1) {
      var salary = parseFloat(document.getElementById('calcSalary').value);
      var employees = parseFloat(document.getElementById('calcEmployees').value);
      if (!salary || !employees) {
        alert('Заполните, пожалуйста, зарплату и количество сотрудников.');
        return;
      }
    }
    if (state.step === 2) {
      var anyEnabled = Object.keys(state.enabled).some(function (k) { return state.enabled[k]; });
      if (!anyEnabled) {
        alert('Выберите хотя бы одну услугу.');
        return;
      }
    }
    if (state.step < 4) goTo(state.step + 1);
  });

  /* ---------- step 2: service toggles ---------- */

  document.querySelectorAll('[data-service-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.dataset.serviceToggle;
      state.enabled[key] = !state.enabled[key];
      btn.classList.toggle('calc-toggle--on', state.enabled[key]);
    });
  });

  /* ---------- step 3: dynamic configuration rows ---------- */

  function renderConfigStep() {
    configWrap.innerHTML = '';
    Object.keys(SERVICES).forEach(function (key) {
      if (!state.enabled[key]) return;
      var svc = SERVICES[key];
      var cfg = state.config[key];

      var row = document.createElement('div');
      row.className = 'calc-config-row';
      row.innerHTML =
        '<img src="' + svc.icon + '" alt="" class="calc-config-row__icon">' +
        '<div class="calc-config-row__info">' +
          '<h4 class="calc-config-row__title">' + svc.label + '</h4>' +
          '<p class="calc-config-row__price">от ' + fmtInt(svc.price) + ' ₽/ сеанс</p>' +
          (CONFIG_HINTS[key] ? '<p class="calc-config-row__hint">' + CONFIG_HINTS[key] + '</p>' : '') +
        '</div>' +
        '<div class="calc-counter" data-field="a">' +
          '<span class="calc-counter__label">' + svc.fieldA.label + '</span>' +
          '<div class="calc-counter__control">' +
            '<span class="calc-counter__btn" data-dir="-1">−</span>' +
            '<input type="number" class="calc-counter__value" data-value min="1" value="' + cfg.a + '">' +
            '<span class="calc-counter__btn" data-dir="1">+</span>' +
          '</div>' +
        '</div>' +
        '<div class="calc-counter" data-field="b">' +
          '<span class="calc-counter__label">' + svc.fieldB.label + '</span>' +
          '<div class="calc-counter__control">' +
            '<span class="calc-counter__btn" data-dir="-1">−</span>' +
            '<input type="number" class="calc-counter__value" data-value min="1" value="' + cfg.b + '">' +
            '<span class="calc-counter__btn" data-dir="1">+</span>' +
          '</div>' +
        '</div>';

      row.querySelectorAll('.calc-counter').forEach(function (counterEl) {
        var field = counterEl.dataset.field;
        var valueEl = counterEl.querySelector('[data-value]');
        counterEl.querySelectorAll('.calc-counter__btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var dir = parseInt(btn.dataset.dir, 10);
            var next = Math.max(1, cfg[field] + dir);
            cfg[field] = next;
            valueEl.value = next;
          });
        });

        valueEl.addEventListener('input', function () {
          var v = parseInt(valueEl.value, 10);
          if (!isNaN(v) && v >= 1) cfg[field] = v;
        });

        valueEl.addEventListener('blur', function () {
          var v = parseInt(valueEl.value, 10);
          if (isNaN(v) || v < 1) v = 1;
          cfg[field] = v;
          valueEl.value = v;
        });
      });

      configWrap.appendChild(row);
    });
  }

  /* ---------- math (adapted from the provided calculator's formulas) ---------- */

  function getIntensity(mode, participants, perPerson) {
    if (mode === 'company-sessions') {
      var sppm = perPerson / Math.max(participants, 1);
      if (sppm < 0.5) return 0.2;
      if (sppm < 1) return 0.4;
      if (sppm < 2) return 0.6 + (sppm - 1) * 0.2;
      if (sppm < 3) return 0.8 + (sppm - 2) * 0.15;
      if (sppm < 4) return 0.95 + (sppm - 3) * 0.05;
      return 1.05;
    }
    if (mode === 'group-sessions') {
      if (perPerson <= 1) return 0.4;
      if (perPerson <= 2) return 0.6;
      if (perPerson <= 4) return 0.8;
      if (perPerson <= 8) return 1.0;
      return 1.05;
    }
    // per-person-monthly: perPerson = sessions per participant per month
    var perYear = perPerson * 12;
    if (perYear < 6) return 0.2;
    if (perYear < 12) return 0.5;
    if (perYear < 18) return 0.8;
    if (perYear <= 25) return 1.0;
    return 0.9; // above the golden zone, extra sessions stop adding value
  }

  function computeCost(svc, participants, perPerson) {
    if (svc.mode === 'group-sessions') {
      return svc.price * perPerson * 12;
    }
    if (svc.mode === 'company-sessions') {
      return svc.price * perPerson * 12;
    }
    // per-person-monthly: total annual sessions = participants * perPerson(sessions/month) * 12
    return svc.price * participants * perPerson * 12;
  }

  function calculate() {
    var salaryMonthly = parseFloat(document.getElementById('calcSalary').value) || 0;
    var salary = salaryMonthly * 12;
    var employees = parseFloat(document.getElementById('calcEmployees').value) || 0;
    var turnoverRate = (parseFloat(document.getElementById('calcTurnover').value) || 0) / 100;
    var dailyRate = salary / 247;

    var sickSavings = 0, turnoverSavings = 0, prodGain = 0, programCost = 0;
    var salaryBase = 0, leaversBase = 0;
    var breakdown = [];

    Object.keys(SERVICES).forEach(function (key) {
      if (!state.enabled[key]) return;
      var svc = SERVICES[key];
      var cfg = state.config[key];
      var participants = cfg.a;
      var perPerson = cfg.b;

      var intensity = getIntensity(svc.mode, participants, perPerson);
      var cost = computeCost(svc, participants, perPerson);
      programCost += cost;

      var sickEff = svc.effects.sick * intensity;
      var turnEff = svc.effects.turnover * intensity;
      var prodEff = svc.effects.prod * intensity;

      var svcSick = participants * SICK_DAYS_PER_PERSON * dailyRate * sickEff;
      sickSavings += svcSick;

      var leavers = participants * turnoverRate;
      var svcTurnover = leavers * salary * REPLACE_COST_FACTOR * turnEff;
      turnoverSavings += svcTurnover;
      leaversBase += leavers * salary * REPLACE_COST_FACTOR;

      var svcProd = participants * salary * prodEff;
      prodGain += svcProd;
      salaryBase += participants * salary;

      breakdown.push({
        label: svc.label,
        participants: participants,
        leavers: leavers,
        sickEff: sickEff,
        turnEff: turnEff,
        prodEff: prodEff,
        sick: svcSick,
        turnover: svcTurnover,
        prod: svcProd,
        cost: cost
      });
    });

    var totalBenefit = sickSavings + turnoverSavings + prodGain;

    var sickLossTotal = employees * SICK_DAYS_PER_PERSON * dailyRate;
    var leaversTotal = employees * turnoverRate;
    var turnoverLossTotal = leaversTotal * salary * REPLACE_COST_FACTOR;
    var productivityLossTotal = employees * salary * 0.10;
    var totalLoss = sickLossTotal + turnoverLossTotal + productivityLossTotal;

    var productivityPct = salaryBase > 0 ? (prodGain / salaryBase * 100) : 0;
    var costReductionPct = totalLoss > 0 ? Math.min(100, totalBenefit / totalLoss * 100) : 0;
    var turnoverReductionPct = leaversBase > 0 ? (turnoverSavings / leaversBase * 100) : 0;

    return {
      totalBenefit: totalBenefit,
      sickSavings: sickSavings,
      turnoverSavings: turnoverSavings,
      prodGain: prodGain,
      programCost: programCost,
      productivityPct: productivityPct,
      costReductionPct: costReductionPct,
      turnoverReductionPct: turnoverReductionPct,
      breakdown: breakdown,
      dailyRate: dailyRate,
      salary: salary,
      employees: employees,
      turnoverRate: turnoverRate,
      salaryBase: salaryBase,
      leaversBase: leaversBase,
      totalLoss: totalLoss,
      sickLossTotal: sickLossTotal,
      turnoverLossTotal: turnoverLossTotal,
      productivityLossTotal: productivityLossTotal
    };
  }

  function renderResults() {
    var r = calculate();

    resultsWrap.innerHTML =
      '<div class="calc-stat">' +
        '<div class="calc-stat__head"><img src="assets/icons/icon-massage-cream.svg" alt="" class="calc-stat__icon"></div>' +
        '<div class="calc-stat__value">' + fmtMoney(r.totalBenefit) + '</div>' +
        '<div class="calc-stat__label">Потенциальная экономия в год</div>' +
        '<div class="calc-stat__hint">Больничные ' + fmtMoney(r.sickSavings) + ' + текучесть ' + fmtMoney(r.turnoverSavings) + ' + продуктивность ' + fmtMoney(r.prodGain) + '</div>' +
      '</div>' +
      '<div class="calc-stat">' +
        '<div class="calc-stat__head"><span class="calc-stat__trend calc-stat__trend--up">↑</span></div>' +
        '<div class="calc-stat__value">' + Math.round(r.productivityPct) + '%</div>' +
        '<div class="calc-stat__label">Рост продуктивности</div>' +
        '<div class="calc-stat__hint">' + fmtMoney(r.prodGain) + ' ÷ ФОТ участников ' + fmtMoney(r.salaryBase) + '</div>' +
      '</div>' +
      '<div class="calc-stat">' +
        '<div class="calc-stat__head"><span class="calc-stat__trend calc-stat__trend--down">↓</span></div>' +
        '<div class="calc-stat__value">' + Math.round(r.costReductionPct) + '%</div>' +
        '<div class="calc-stat__label">Потенциальное снижение расходов</div>' +
        '<div class="calc-stat__hint">' + fmtMoney(r.totalBenefit) + ' ÷ потери без программы ' + fmtMoney(r.totalLoss) + '</div>' +
      '</div>' +
      '<div class="calc-stat">' +
        '<div class="calc-stat__head"><span class="calc-stat__trend calc-stat__trend--down">↓</span></div>' +
        '<div class="calc-stat__value">' + Math.round(r.turnoverReductionPct) + '%</div>' +
        '<div class="calc-stat__label">Снижение текучести</div>' +
        '<div class="calc-stat__hint">' + fmtMoney(r.turnoverSavings) + ' ÷ потери от текучести ' + fmtMoney(r.leaversBase) + '</div>' +
      '</div>';
  }

  function buildPrintable() {
    var r = calculate();
    var salaryMonthly = parseFloat(document.getElementById('calcSalary').value) || 0;
    var employees = parseFloat(document.getElementById('calcEmployees').value) || 0;
    var turnoverPercent = parseFloat(document.getElementById('calcTurnover').value) || 0;

    var serviceRows = '';
    var programCost = 0;

    Object.keys(SERVICES).forEach(function (key) {
      if (!state.enabled[key]) return;
      var svc = SERVICES[key];
      var cfg = state.config[key];
      var cost = computeCost(svc, cfg.a, cfg.b);
      programCost += cost;

      serviceRows +=
        '<div class="print-service">' +
          '<div class="print-service__title">' + svc.label + '</div>' +
          '<div class="print-service__row"><span>' + svc.fieldA.label.replace('?', '') + '</span><span>' + fmtInt(cfg.a) + '</span></div>' +
          '<div class="print-service__row"><span>' + svc.fieldB.label.replace('?', '') + '</span><span>' + fmtInt(cfg.b) + '</span></div>' +
          '<div class="print-service__row print-service__row--cost"><span>Стоимость в год</span><span>' + fmtMoney(cost) + '</span></div>' +
        '</div>';
    });

    var printHtml =
      '<section class="print-page">' +
        '<div class="print-header">' +
          '<div class="print-logo">BodyWay</div>' +
          '<div class="print-date">' + new Date().toLocaleDateString('ru-RU') + '</div>' +
        '</div>' +
        '<h1 class="print-title">Расчёт выгоды от&nbsp;внедрения well-being услуг</h1>' +

        '<h2 class="print-section-title">Данные о&nbsp;компании</h2>' +
        '<div class="print-facts">' +
          '<div class="print-fact"><span>Средняя зарплата сотрудника</span><span>' + fmtMoney(salaryMonthly) + '</span></div>' +
          '<div class="print-fact"><span>Количество сотрудников</span><span>' + fmtInt(employees) + ' человек</span></div>' +
          '<div class="print-fact"><span>Текучесть кадров в год</span><span>' + turnoverPercent + '%</span></div>' +
        '</div>' +

        '<h2 class="print-section-title">Выбранная программа</h2>' +
        '<div class="print-services">' + (serviceRows || '<p class="print-empty">Услуги не выбраны</p>') + '</div>' +

        '<div class="print-total"><span>Стоимость программы в год</span><span>' + fmtMoney(programCost) + '</span></div>' +
      '</section>' +

      '<section class="print-page print-page--results">' +
        '<h1 class="print-title print-title--center">Результат для&nbsp;вашей компании</h1>' +
        '<div class="print-stats">' +
          '<div class="print-stat"><div class="print-stat__value">' + fmtMoney(r.totalBenefit) + '</div><div class="print-stat__label">Потенциальная экономия в&nbsp;год</div></div>' +
          '<div class="print-stat"><div class="print-stat__value">' + Math.round(r.productivityPct) + '%</div><div class="print-stat__label">Рост продуктивности</div></div>' +
          '<div class="print-stat"><div class="print-stat__value">' + Math.round(r.costReductionPct) + '%</div><div class="print-stat__label">Потенциальное снижение расходов</div></div>' +
          '<div class="print-stat"><div class="print-stat__value">' + Math.round(r.turnoverReductionPct) + '%</div><div class="print-stat__label">Снижение текучести</div></div>' +
        '</div>' +
      '</section>' +

      buildFormulaPage(r);

    printWrap.innerHTML = printHtml;
  }

  function pct1(x) {
    return (x * 100).toFixed(1).replace('.', ',') + '%';
  }

  function buildFormulaPage(r) {
    var sickLines = r.breakdown.map(function (item) {
      return '<div class="print-formula-line"><span>' + item.label + '</span><span>' +
        fmtInt(item.participants) + ' чел. × 10 дней × ' + fmtMoney(r.dailyRate) + '/день × ' + pct1(item.sickEff) +
        ' = ' + fmtMoney(item.sick) + '</span></div>';
    }).join('');

    var turnoverLines = r.breakdown.map(function (item) {
      return '<div class="print-formula-line"><span>' + item.label + '</span><span>' +
        item.leavers.toFixed(1).replace('.', ',') + ' чел. × ' + fmtMoney(r.salary) + '/год × 50% × ' + pct1(item.turnEff) +
        ' = ' + fmtMoney(item.turnover) + '</span></div>';
    }).join('');

    var prodLines = r.breakdown.map(function (item) {
      return '<div class="print-formula-line"><span>' + item.label + '</span><span>' +
        fmtInt(item.participants) + ' чел. × ' + fmtMoney(r.salary) + '/год × ' + pct1(item.prodEff) +
        ' = ' + fmtMoney(item.prod) + '</span></div>';
    }).join('');

    return (
      '<section class="print-page print-page--formula">' +
        '<h1 class="print-title">Как мы считаем</h1>' +

        '<h2 class="print-section-title">1. Потенциальная экономия в&nbsp;год — ' + fmtMoney(r.totalBenefit) + '</h2>' +
        '<p class="print-formula-intro">Больничные ' + fmtMoney(r.sickSavings) + ' + текучесть ' + fmtMoney(r.turnoverSavings) + ' + продуктивность ' + fmtMoney(r.prodGain) + '</p>' +

        '<div class="print-formula-item">' +
          '<div class="print-formula-item__title">Экономия на&nbsp;больничных — ' + fmtMoney(r.sickSavings) + '</div>' +
          '<div class="print-formula-item__formula">Участники × 10 дней в&nbsp;год × дневная ставка (' + fmtMoney(r.dailyRate) + '/день) × коэффициент эффективности услуги</div>' +
          sickLines +
        '</div>' +

        '<div class="print-formula-item">' +
          '<div class="print-formula-item__title">Экономия на&nbsp;текучести — ' + fmtMoney(r.turnoverSavings) + '</div>' +
          '<div class="print-formula-item__formula">Число увольнений среди участников (текучесть ' + Math.round(r.turnoverRate * 100) + '% × участники) × годовая зарплата (' + fmtMoney(r.salary) + ') × 50% (стоимость найма и&nbsp;адаптации) × коэффициент эффективности услуги</div>' +
          turnoverLines +
        '</div>' +

        '<div class="print-formula-item">' +
          '<div class="print-formula-item__title">Рост продуктивности — ' + fmtMoney(r.prodGain) + '</div>' +
          '<div class="print-formula-item__formula">Участники × годовая зарплата (' + fmtMoney(r.salary) + ') × коэффициент роста продуктивности услуги</div>' +
          prodLines +
        '</div>' +

        '<h2 class="print-section-title">2. Рост продуктивности — ' + Math.round(r.productivityPct) + '%</h2>' +
        '<div class="print-formula-item">' +
          '<div class="print-formula-item__formula">Рост продуктивности в&nbsp;деньгах ÷ ФОТ участников программы × 100</div>' +
          '<div class="print-formula-line"><span>Расчёт</span><span>' + fmtMoney(r.prodGain) + ' ÷ ' + fmtMoney(r.salaryBase) + ' × 100 = ' + Math.round(r.productivityPct) + '%</span></div>' +
        '</div>' +

        '<h2 class="print-section-title">3. Потенциальное снижение расходов — ' + Math.round(r.costReductionPct) + '%</h2>' +
        '<div class="print-formula-item">' +
          '<div class="print-formula-item__formula">Потенциальная экономия ÷ потери компании без&nbsp;программы (на&nbsp;всех ' + fmtInt(r.employees) + ' сотрудниках) × 100</div>' +
          '<div class="print-formula-line"><span>Потери без программы</span><span>больничные ' + fmtMoney(r.sickLossTotal) + ' + текучесть ' + fmtMoney(r.turnoverLossTotal) + ' + продуктивность ' + fmtMoney(r.productivityLossTotal) + ' = ' + fmtMoney(r.totalLoss) + '</span></div>' +
          '<div class="print-formula-line"><span>Расчёт</span><span>' + fmtMoney(r.totalBenefit) + ' ÷ ' + fmtMoney(r.totalLoss) + ' × 100 = ' + Math.round(r.costReductionPct) + '%</span></div>' +
        '</div>' +

        '<h2 class="print-section-title">4. Снижение текучести — ' + Math.round(r.turnoverReductionPct) + '%</h2>' +
        '<div class="print-formula-item">' +
          '<div class="print-formula-item__formula">Экономия на&nbsp;текучести ÷ потери от&nbsp;текучести среди участников программы × 100</div>' +
          '<div class="print-formula-line"><span>Расчёт</span><span>' + fmtMoney(r.turnoverSavings) + ' ÷ ' + fmtMoney(r.leaversBase) + ' × 100 = ' + Math.round(r.turnoverReductionPct) + '%</span></div>' +
        '</div>' +

        '<p class="print-formula-note">Дневная ставка = годовая зарплата ÷ 247 (рабочих дней в&nbsp;году). Потери от&nbsp;больничных — на&nbsp;основе данных ФСС РФ и&nbsp;производственного календаря. Оценка потерь продуктивности от&nbsp;выгорания и&nbsp;презентеизма — ~10% ФОТ (Gallup, Deloitte). Коэффициент эффективности услуги зависит от&nbsp;интенсивности её использования (частота сеансов на&nbsp;участника).</p>' +
      '</section>'
    );
  }

  /* ---------- PDF download confirmation ---------- */

  var pdfModal = document.getElementById('pdfConfirmModal');
  var pdfOverlay = document.getElementById('pdfConfirmOverlay');
  var pdfConfirmBtn = document.getElementById('pdfConfirmDownload');
  var pdfCancelBtn = document.getElementById('pdfConfirmCancel');

  function closePdfModal() {
    pdfModal.hidden = true;
  }

  if (pdfBtn && pdfModal) {
    pdfBtn.addEventListener('click', function () {
      pdfModal.hidden = false;
    });

    pdfOverlay.addEventListener('click', closePdfModal);
    pdfCancelBtn.addEventListener('click', closePdfModal);

    pdfConfirmBtn.addEventListener('click', function () {
      closePdfModal();
      buildPrintable();
      window.print();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !pdfModal.hidden) closePdfModal();
    });
  }

  goTo(1);
}
