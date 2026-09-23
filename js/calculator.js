document.addEventListener('DOMContentLoaded', function () {
  var calc = document.getElementById('calcStepper');
  if (!calc) return;
  initCalculator();
});

function initCalculator() {
  var SICK_DAYS_PER_PERSON = 10;
  var REPLACE_COST_FACTOR = 0.5;

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

    backBtn.hidden = step === 1;
    nextBtn.hidden = step === 4;
    actionsWrap.classList.toggle('calc__actions--split', step > 1);

    if (step === 3) renderConfigStep();
    if (step === 4) renderResults();
  }

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
        '</div>' +
        '<div class="calc-counter" data-field="a">' +
          '<span class="calc-counter__label">' + svc.fieldA.label + '</span>' +
          '<div class="calc-counter__control">' +
            '<span class="calc-counter__btn" data-dir="-1">−</span>' +
            '<span class="calc-counter__value" data-value>' + cfg.a + '</span>' +
            '<span class="calc-counter__btn" data-dir="1">+</span>' +
          '</div>' +
        '</div>' +
        '<div class="calc-counter" data-field="b">' +
          '<span class="calc-counter__label">' + svc.fieldB.label + '</span>' +
          '<div class="calc-counter__control">' +
            '<span class="calc-counter__btn" data-dir="-1">−</span>' +
            '<span class="calc-counter__value" data-value>' + cfg.b + '</span>' +
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
            valueEl.textContent = next;
          });
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

      sickSavings += participants * SICK_DAYS_PER_PERSON * dailyRate * sickEff;

      var leavers = participants * turnoverRate;
      turnoverSavings += leavers * salary * REPLACE_COST_FACTOR * turnEff;
      leaversBase += leavers * salary * REPLACE_COST_FACTOR;

      prodGain += participants * salary * prodEff;
      salaryBase += participants * salary;
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
      turnoverReductionPct: turnoverReductionPct
    };
  }

  function renderResults() {
    var r = calculate();

    resultsWrap.innerHTML =
      '<div class="calc-stat">' +
        '<div class="calc-stat__head"><img src="assets/icons/icon-massage-cream.svg" alt="" class="calc-stat__icon"></div>' +
        '<div class="calc-stat__value">' + fmtMoney(r.totalBenefit) + '</div>' +
        '<div class="calc-stat__label">Потенциальная экономия в год</div>' +
      '</div>' +
      '<div class="calc-stat">' +
        '<div class="calc-stat__head"><span class="calc-stat__trend calc-stat__trend--up">↑</span></div>' +
        '<div class="calc-stat__value">' + Math.round(r.productivityPct) + '%</div>' +
        '<div class="calc-stat__label">Рост продуктивности</div>' +
      '</div>' +
      '<div class="calc-stat">' +
        '<div class="calc-stat__head"><span class="calc-stat__trend calc-stat__trend--down">↓</span></div>' +
        '<div class="calc-stat__value">' + Math.round(r.costReductionPct) + '%</div>' +
        '<div class="calc-stat__label">Потенциальное снижение расходов</div>' +
      '</div>' +
      '<div class="calc-stat">' +
        '<div class="calc-stat__head"><span class="calc-stat__trend calc-stat__trend--down">↓</span></div>' +
        '<div class="calc-stat__value">' + Math.round(r.turnoverReductionPct) + '%</div>' +
        '<div class="calc-stat__label">Снижение текучести</div>' +
      '</div>';
  }

  if (pdfBtn) {
    pdfBtn.addEventListener('click', function () {
      window.print();
    });
  }

  goTo(1);
}
