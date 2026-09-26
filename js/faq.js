document.addEventListener('DOMContentLoaded', function () {
  var items = document.querySelectorAll('.faq-item');

  items.forEach(function (item) {
    var btn = item.querySelector('.faq-item__question');

    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('faq-item--open');

      items.forEach(function (other) {
        other.classList.remove('faq-item--open');
        other.querySelector('.faq-item__question').setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('faq-item--open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
});
