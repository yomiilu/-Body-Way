document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-ajax-form]').forEach(initContactMethod);
  document.querySelectorAll('[data-ajax-form]').forEach(initAjaxForm);
});

// «Где с вами связаться?» идёт первым, а поле с контактом появляется под ним
// и подстраивается под выбранный способ (телефон / email / Telegram / Max).
function initContactMethod(form) {
  var sel = form.querySelector('select[name="contact"]');
  if (!sel) return;

  var selField = sel.closest('.form-card__field');
  var input = form.querySelector('input[name="phone"], input[name="email"]');
  var field;
  if (input) {
    field = input.closest('.form-card__field');
  } else {
    // в коротких формах (карточки на главной) поля с контактом нет — создаём его
    field = document.createElement('label');
    field.className = 'form-card__field';
    input = document.createElement('input');
    input.className = 'form-card__input';
    field.appendChild(input);
  }
  selField.parentNode.insertBefore(field, selField.nextSibling);

  var label = field.querySelector('.request-form__label');
  var modes = {
    phone:    { name: 'phone', type: 'tel',   ph: 'Ваш номер телефона',             label: 'Телефон',            ac: 'tel' },
    telegram: { name: 'telegram', type: 'text', ph: 'Ваш никнейм в Telegram через @', label: 'Никнейм в Telegram', ac: 'off' },
    max:      { name: 'phone', type: 'tel',   ph: 'Ваш номер телефона в Max',       label: 'Телефон в Max',      ac: 'tel' },
    email:    { name: 'email', type: 'email', ph: 'Ваш email',                      label: 'Email',              ac: 'email' }
  };

  function apply() {
    var m = modes[sel.value];
    if (!m) {
      field.hidden = true;
      input.required = false;
      return;
    }
    input.name = m.name;
    input.type = m.type;
    input.placeholder = m.ph;
    input.setAttribute('autocomplete', m.ac);
    input.required = true;
    if (label) label.textContent = m.label;
    field.hidden = false;
  }

  // никнейм в Telegram: если забыли «@» — добавляем сами
  input.addEventListener('blur', function () {
    if (input.name === 'telegram') {
      var v = input.value.trim();
      if (v && v.charAt(0) !== '@') input.value = '@' + v;
    }
  });

  sel.required = true;
  sel.addEventListener('change', function () {
    input.value = '';
    apply();
  });
  form.addEventListener('reset', function () {
    setTimeout(apply, 0);
  });
  apply();
}

function initAjaxForm(form) {
  var loadedAt = Date.now();
  var submitBtn = form.querySelector('button[type="submit"]');

  var statusEl = document.createElement('p');
  statusEl.className = 'form-status';
  statusEl.hidden = true;
  form.appendChild(statusEl);

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (submitBtn) {
      submitBtn.disabled = true;
    }
    statusEl.hidden = true;
    statusEl.classList.remove('form-status--success', 'form-status--error');

    var formData = new FormData(form);
    formData.append('form_loaded_at', loadedAt);

    fetch(form.getAttribute('action') || 'send-form.php', {
      method: 'POST',
      body: formData
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (!data.ok) {
          throw new Error(data.error || 'unknown');
        }
        statusEl.textContent = form.dataset.successMessage || 'Спасибо! Заявка отправлена, мы скоро свяжемся с вами.';
        statusEl.classList.add('form-status--success');
        form.reset();
      })
      .catch(function () {
        statusEl.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз или напишите нам напрямую.';
        statusEl.classList.add('form-status--error');
      })
      .finally(function () {
        statusEl.hidden = false;
        if (submitBtn) {
          submitBtn.disabled = false;
        }
      });
  });
}
