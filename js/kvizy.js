var QUIZZES = {
  compass: {
    title: 'Экспресс-компас вашего состояния',
    questions: [
      {
        text: 'Как вы чувствуете себя в течение рабочего дня?',
        options: [
          { text: 'Не хватает энергии, клонит в сон', tag: 'energy' },
          { text: 'Сложно сосредоточиться на задачах', tag: 'focus' },
          { text: 'Присутствует тревожность и напряжение', tag: 'calm' },
          { text: 'Тело затекает и ноет', tag: 'body' }
        ]
      },
      {
        text: 'Что мешает вам больше всего?',
        options: [
          { text: 'Постоянная усталость', tag: 'energy' },
          { text: 'Отвлекающие мысли и прокрастинация', tag: 'focus' },
          { text: 'Стресс от коммуникации и дедлайнов', tag: 'calm' },
          { text: 'Боли в спине и шее', tag: 'body' }
        ]
      },
      {
        text: 'Как вы засыпаете вечером?',
        options: [
          { text: 'Быстро, но просыпаюсь разбитым(-ой)', tag: 'energy' },
          { text: 'Долго прокручиваю рабочие задачи в голове', tag: 'focus' },
          { text: 'Тяжело успокоиться и расслабиться', tag: 'calm' },
          { text: 'Мешает физический дискомфорт', tag: 'body' }
        ]
      },
      {
        text: 'Что бы вы выбрали на 30 минут отдыха?',
        options: [
          { text: 'Лёгкий перекус и свежий воздух', tag: 'energy' },
          { text: 'Дыхательную практику для концентрации', tag: 'focus' },
          { text: 'Разговор с психологом или тишину', tag: 'calm' },
          { text: 'Массаж или растяжку', tag: 'body' }
        ]
      },
      {
        text: 'Какая метафора точнее описывает ваше состояние?',
        options: [
          { text: 'Телефон разряжен на 10%', tag: 'energy' },
          { text: 'Слишком много открытых вкладок', tag: 'focus' },
          { text: 'Натянутая струна', tag: 'calm' },
          { text: 'Зажатая пружина', tag: 'body' }
        ]
      }
    ],
    results: {
      energy: {
        title: 'Вам не хватает энергии',
        text: 'Организму сейчас важнее всего восполнение ресурса — поддержка на уровне питания и привычек, которая вернёт бодрость в течение дня.',
        service: 'Услуги нутрициолога',
        href: 'uslugi.html#nutrition'
      },
      focus: {
        title: 'Вам нужна концентрация',
        text: 'Мысли рассеиваются, а фокус ускользает. Короткие тренировки концентрации помогут собраться и работать без лишнего напряжения.',
        service: 'Тренировки концентрации и расслабления',
        href: 'uslugi.html#concentration'
      },
      calm: {
        title: 'Вам нужно спокойствие',
        text: 'Накопилось напряжение и тревожность. Стоит снять эмоциональную нагрузку — с помощью специалиста или мягких расслабляющих практик.',
        service: 'Услуги психолога',
        href: 'uslugi.html#psychology'
      },
      body: {
        title: 'Телу нужно восстановление',
        text: 'Физическое напряжение накопилось и требует внимания. Массаж поможет снять зажимы и вернуть телу лёгкость.',
        service: 'Тонизирующий массаж',
        href: 'uslugi.html#massage'
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', function () {
  initQuizCatalog();
});

function initQuizCatalog() {
  var catalog = document.getElementById('quizCatalog');
  var flow = document.getElementById('quizFlow');
  var backBtn = document.getElementById('quizBackBtn');
  var panelHost = document.getElementById('quizPanelHost');
  var progressFill = document.getElementById('quizProgressFill');
  var progressLabel = document.getElementById('quizProgressLabel');

  if (!catalog || !flow || !panelHost) return;

  var state = null;

  document.querySelectorAll('.quiz-card__start[data-quiz]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var quizId = btn.getAttribute('data-quiz');
      var quiz = QUIZZES[quizId];
      if (!quiz) return;

      state = { quiz: quiz, index: 0, answers: [], selected: null };
      catalog.hidden = true;
      flow.hidden = false;
      window.scrollTo({ top: flow.offsetTop - 100, behavior: 'instant' in window ? 'instant' : 'auto' });
      renderQuestion();
    });
  });

  backBtn.addEventListener('click', function () {
    flow.hidden = true;
    catalog.hidden = false;
    state = null;
  });

  function updateProgress(current, total) {
    var pct = Math.round((current / total) * 100);
    progressFill.style.width = pct + '%';
    progressLabel.textContent = 'Вопрос ' + current + ' из ' + total;
  }

  function renderQuestion() {
    var q = state.quiz.questions[state.index];
    var total = state.quiz.questions.length;
    updateProgress(state.index + 1, total);

    var optionsHtml = q.options.map(function (opt, i) {
      var selectedClass = state.selected === i ? ' quiz-option--selected' : '';
      return '<button type="button" class="quiz-option' + selectedClass + '" data-option="' + i + '">' + opt.text + '</button>';
    }).join('');

    panelHost.innerHTML =
      '<h2 class="quiz-question__title">' + q.text + '</h2>' +
      '<div class="quiz-options">' + optionsHtml + '</div>' +
      '<div class="quiz-flow__actions">' +
        '<button type="button" class="quiz-flow__prev" id="quizPrevBtn"' + (state.index === 0 ? ' disabled' : '') + '>Назад</button>' +
        '<button type="button" class="btn btn--navy quiz-flow__next" id="quizNextBtn" disabled>' +
          '<span>' + (state.index === total - 1 ? 'Показать результат' : 'Далее') + '</span>' +
          '<img src="assets/icons/arrow-light.svg" alt="" class="btn__arrow">' +
        '</button>' +
      '</div>';

    if (state.selected !== null) {
      panelHost.querySelector('#quizNextBtn').disabled = false;
    }

    panelHost.querySelectorAll('.quiz-option').forEach(function (el) {
      el.addEventListener('click', function () {
        state.selected = parseInt(el.getAttribute('data-option'), 10);
        panelHost.querySelectorAll('.quiz-option').forEach(function (o) {
          o.classList.remove('quiz-option--selected');
        });
        el.classList.add('quiz-option--selected');
        panelHost.querySelector('#quizNextBtn').disabled = false;
      });
    });

    panelHost.querySelector('#quizPrevBtn').addEventListener('click', function () {
      if (state.index === 0) return;
      state.index -= 1;
      state.selected = state.answers[state.index] != null ? state.answers[state.index] : null;
      state.answers = state.answers.slice(0, state.index);
      renderQuestion();
    });

    panelHost.querySelector('#quizNextBtn').addEventListener('click', function () {
      if (state.selected === null) return;
      state.answers[state.index] = state.selected;

      if (state.index < total - 1) {
        state.index += 1;
        state.selected = null;
        renderQuestion();
      } else {
        renderResult();
      }
    });
  }

  function renderResult() {
    var q = state.quiz;
    var counts = {};

    state.answers.forEach(function (optionIndex, questionIndex) {
      var tag = q.questions[questionIndex].options[optionIndex].tag;
      counts[tag] = (counts[tag] || 0) + 1;
    });

    var topTag = Object.keys(counts).reduce(function (a, b) {
      return counts[a] >= counts[b] ? a : b;
    });

    var result = q.results[topTag];
    progressFill.style.width = '100%';
    progressLabel.textContent = 'Готово';

    panelHost.innerHTML =
      '<div class="quiz-result">' +
        '<span class="quiz-result__label">Ваш результат</span>' +
        '<h2 class="quiz-result__title">' + result.title + '</h2>' +
        '<p class="quiz-result__text">' + result.text + '</p>' +
        '<a href="' + result.href + '" class="quiz-result__link">' +
          '<span class="quiz-result__service">' + result.service + '</span>' +
          '<span class="quiz-result__arrow"><img src="assets/icons/icon-arrow-right-cream.svg" alt=""></span>' +
        '</a>' +
        '<div class="quiz-flow__actions">' +
          '<button type="button" class="quiz-flow__prev" id="quizRetakeBtn">Пройти ещё раз</button>' +
        '</div>' +
      '</div>';

    panelHost.querySelector('#quizRetakeBtn').addEventListener('click', function () {
      state = { quiz: q, index: 0, answers: [], selected: null };
      renderQuestion();
    });
  }
}
