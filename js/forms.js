document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-ajax-form]').forEach(initAjaxForm);
});

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
        statusEl.textContent = 'Спасибо! Заявка отправлена, мы скоро свяжемся с вами.';
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
