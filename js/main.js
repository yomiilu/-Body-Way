document.addEventListener('DOMContentLoaded', function () {
  initDropdown();
  initScrollReveal();
  initGallery();
  initMobileMenu();
  initKpFlipCard();
  initGuaranteesFlipCard();
  initEventsFlip();
  initReviewPhotos();
});

function initReviewPhotos() {
  var wrap = document.getElementById('reviewFormPhotos');
  if (!wrap) return;

  var imgs = wrap.querySelectorAll('.review-form-photos__img');
  if (imgs.length < 2) return;

  var index = 0;
  setInterval(function () {
    imgs[index].classList.remove('review-form-photos__img--active');
    index = (index + 1) % imgs.length;
    imgs[index].classList.add('review-form-photos__img--active');
  }, 3000);
}

function initEventsFlip() {
  var grid = document.getElementById('eventsGrid');
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.event-flip-card'));

  function measureHeight(el, width) {
    var clone = el.cloneNode(true);
    clone.style.position = 'static';
    clone.style.visibility = 'hidden';
    clone.style.transform = 'none';
    clone.style.height = 'auto';
    clone.style.width = width + 'px';
    document.body.appendChild(clone);
    var h = clone.getBoundingClientRect().height;
    document.body.removeChild(clone);
    return h;
  }

  var sharedFrontH = 0;
  var sharedBackH = 0;

  function sizeAllCards() {
    sharedFrontH = 0;
    sharedBackH = 0;

    cards.forEach(function (card) {
      var front = card.querySelector('.event-card');
      var back = card.querySelector('.event-card-back');
      var width = card.getBoundingClientRect().width;
      sharedFrontH = Math.max(sharedFrontH, measureHeight(front, width));
      sharedBackH = Math.max(sharedBackH, measureHeight(back, width));
    });

    cards.forEach(function (card) {
      card.style.height = (card.classList.contains('flip-card--flipped') ? sharedBackH : sharedFrontH) + 'px';
    });
  }

  cards.forEach(function (card) {
    var front = card.querySelector('.flip-card__face--front');
    var closeBtn = card.querySelector('.event-card-back__close');
    var track = card.querySelector('.event-card-back__gallery-track');
    var slides = card.querySelectorAll('.event-card-back__gallery-img');
    var dots = card.querySelectorAll('.event-card-back__gallery-dot');
    var prevBtn = card.querySelector('.event-card-back__gallery-arrow--prev');
    var nextBtn = card.querySelector('.event-card-back__gallery-arrow--next');
    var slideIndex = 0;

    function goToSlide(i) {
      slideIndex = (i + slides.length) % slides.length;
      if (track) track.style.transform = 'translateX(-' + (slideIndex * 100) + '%)';
      dots.forEach(function (dot, di) {
        dot.classList.toggle('event-card-back__gallery-dot--active', di === slideIndex);
      });
    }

    front.addEventListener('click', function () {
      card.classList.add('flip-card--flipped');
      card.style.height = sharedBackH + 'px';
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        card.classList.remove('flip-card--flipped');
        card.style.height = sharedFrontH + 'px';
        goToSlide(0);
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        goToSlide(slideIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        goToSlide(slideIndex + 1);
      });
    }
  });

  sizeAllCards();

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      sizeAllCards();
    }, 150);
  });
}

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

function initGuaranteesFlipCard() {
  var card = document.getElementById('guaranteesFlipCard');
  var trigger = document.getElementById('guaranteesFlipTrigger');
  var backFace = card ? card.querySelector('.flip-card__face--back') : null;
  if (!card || !trigger || !backFace) return;

  function measureHeight(el, width) {
    var clone = el.cloneNode(true);
    clone.style.position = 'static';
    clone.style.visibility = 'hidden';
    clone.style.transform = 'none';
    clone.style.height = 'auto';
    clone.style.width = width + 'px';
    document.body.appendChild(clone);
    var h = clone.getBoundingClientRect().height;
    document.body.removeChild(clone);
    return h;
  }

  var frontH = 0;

  function sizeCard() {
    card.style.height = '';
    var width = card.getBoundingClientRect().width;

    var siblingMax = 0;
    var row = card.parentElement;
    if (row) {
      Array.prototype.forEach.call(row.children, function (child) {
        if (child !== card) {
          siblingMax = Math.max(siblingMax, child.getBoundingClientRect().height);
        }
      });
    }

    frontH = Math.max(measureHeight(trigger, width), siblingMax);
    card.style.height = frontH + 'px';
  }

  sizeCard();

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(sizeCard, 150);
  });

  trigger.addEventListener('click', function () {
    card.classList.add('flip-card--flipped');
  });

  backFace.addEventListener('click', function (e) {
    if (!e.target.closest('input, select, button, label')) {
      card.classList.remove('flip-card--flipped');
    }
  });
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
    var slowdown = window.matchMedia('(max-width: 900px)').matches ? 2.2 : 1;
    var progress = (vh - rect.top) / ((vh + rect.height) * slowdown);
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
