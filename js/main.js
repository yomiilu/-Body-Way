document.addEventListener('DOMContentLoaded', function () {
  initDropdown();
  initScrollReveal();
  initGallery();
  initMobileMenu();
  initKpFlipCard();
});

function initKpFlipCard() {
  var card = document.getElementById('kpFlipCard');
  var trigger = document.getElementById('kpFlipTrigger');
  var backFace = card ? card.querySelector('.flip-card__face--back') : null;
  if (!card || !trigger) return;

  trigger.addEventListener('click', function () {
    card.classList.add('flip-card--flipped');
  });

  if (backFace) {
    backFace.addEventListener('click', function (e) {
      if (!e.target.closest('input, select, button, label')) {
        card.classList.remove('flip-card--flipped');
      }
    });
  }
}

function initMobileMenu() {
  var header = document.querySelector('.header');
  var burger = document.getElementById('headerBurger');
  if (!header || !burger) return;

  burger.addEventListener('click', function () {
    var isOpen = header.classList.toggle('header--menu-open');
    burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  document.querySelectorAll('.mobile-nav__link, .mobile-nav__sublink').forEach(function (link) {
    link.addEventListener('click', function () {
      header.classList.remove('header--menu-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
}

function initDropdown() {
  var items = document.querySelectorAll('.nav__item--dropdown');

  items.forEach(function (item) {
    var link = item.querySelector('.nav__link');

    link.addEventListener('click', function (e) {
      if (window.matchMedia('(hover: none)').matches) {
        e.preventDefault();
        item.classList.toggle('nav__item--open');
      }
    });
  });

  document.addEventListener('click', function (e) {
    items.forEach(function (item) {
      if (!item.contains(e.target)) {
        item.classList.remove('nav__item--open');
      }
    });
  });
}

function initScrollReveal() {
  var targets = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) {
      el.classList.add('in-view');
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -5% 0px' }
  );

  targets.forEach(function (el) {
    observer.observe(el);
  });
}

function initGallery() {
  var gallery = document.querySelector('.gallery');
  var track = document.querySelector('.gallery__track');
  if (!gallery || !track) return;

  var items = Array.prototype.slice.call(track.querySelectorAll('.gallery__item'));
  var maxTranslate = 0;

  function measure() {
    maxTranslate = Math.max(0, track.scrollWidth - gallery.clientWidth);
  }

  function update() {
    var rect = gallery.getBoundingClientRect();
    var vh = window.innerHeight;
    var progress = (vh - rect.top) / (vh + rect.height);
    progress = Math.max(0, Math.min(1, progress));

    var x = -progress * maxTranslate;
    track.style.transform = 'translateX(' + x + 'px)';

    var centerX = rect.left + rect.width / 2;
    var closest = null;
    var closestDist = Infinity;

    items.forEach(function (item) {
      var r = item.getBoundingClientRect();
      var itemCenter = r.left + r.width / 2;
      var dist = Math.abs(itemCenter - centerX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = item;
      }
    });

    items.forEach(function (item) {
      item.classList.toggle('gallery__item--active', item === closest);
    });
  }

  var ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        update();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    measure();
    update();
  });

  measure();
  update();
}
