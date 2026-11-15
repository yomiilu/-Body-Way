document.addEventListener('DOMContentLoaded', function () {
  initDropdown();
  initScrollReveal();
  initGallery();
  initMobileMenu();
  initKpFlipCard();
  initGuaranteesFlipCard(); initHeroReel(); initServiceCycle();
  initEventsFlip();
  initServiceSliders();
  initCookieBanner();
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

  // on phones the cards are stacked, so each one keeps its own height (square photos)
  function cardH(card, flipped) {
    var own = window.matchMedia('(max-width: 900px)').matches;
    if (flipped) return own ? card._backH : sharedBackH;
    return own ? card._frontH : sharedFrontH;
  }

  function sizeAllCards() {
    sharedFrontH = 0;
    sharedBackH = 0;

    cards.forEach(function (card) {
      var front = card.querySelector('.event-card');
      var back = card.querySelector('.event-card-back');
      var width = card.getBoundingClientRect().width;
      card._frontH = measureHeight(front, width);
      card._backH = measureHeight(back, width);
      sharedFrontH = Math.max(sharedFrontH, card._frontH);
      sharedBackH = Math.max(sharedBackH, card._backH);
    });

    cards.forEach(function (card) {
      card.style.height = cardH(card, card.classList.contains('flip-card--flipped')) + 'px';
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
      card.style.height = cardH(card, true) + 'px';
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        card.classList.remove('flip-card--flipped');
        card.style.height = cardH(card, false) + 'px';
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

function initHeroReel() {
  var vids = Array.prototype.slice.call(document.querySelectorAll('.hero-reel__video'));
  var bars = Array.prototype.slice.call(document.querySelectorAll('.hero-reel__bar'));
  var ambient = Array.prototype.slice.call(document.querySelectorAll('.hero__ambient-img'));
  var btn = document.getElementById('heroSound');
  if (!vids.length) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var current = 0;
  var soundOn = false;

  function safePlay(v) {
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }

  function paintBars(progress) {
    bars.forEach(function (bar, i) {
      var fill = bar.firstElementChild;
      fill.style.width = i < current ? '100%' : i === current ? (progress * 100) + '%' : '0%';
    });
  }

  function activate(i, autoplay) {
    current = i;
    vids.forEach(function (v, k) {
      var on = k === i;
      v.classList.toggle('hero-reel__video--active', on);
      v.muted = !soundOn || !on;
      if (!on) {
        v.pause();
        if (v.readyState > 0) v.currentTime = 0;
      }
    });
    ambient.forEach(function (img, k) {
      img.classList.toggle('hero__ambient-img--active', k === i);
    });
    paintBars(0);
    if (autoplay) {
      if (vids[i].readyState > 0) vids[i].currentTime = 0;
      safePlay(vids[i]);
    }
  }

  vids.forEach(function (v, i) {
    v.addEventListener('timeupdate', function () {
      if (i === current && v.duration) paintBars(v.currentTime / v.duration);
    });
    v.addEventListener('ended', function () {
      if (i === current) activate((i + 1) % vids.length, true);
    });
  });

  bars.forEach(function (bar, i) {
    bar.addEventListener('click', function () {
      activate(i, true);
    });
  });

  var frame = document.querySelector('.hero-reel__frame');
  if (frame) {
    frame.addEventListener('click', function (e) {
      if (e.target.closest('.hero__sound, .hero-reel__bar')) return;
      if (vids.length < 2) return;
      activate((current + 1) % vids.length, true);
    });
  }

  vids[0].addEventListener('playing', function onFirst() {
    vids[0].removeEventListener('playing', onFirst);
    vids.slice(1).forEach(function (v) {
      v.preload = 'auto';
      v.load();
    });
  });

  if (reduce) {
    vids[0].pause();
  } else {
    safePlay(vids[0]);
  }
  paintBars(0);

  if (btn) {
    btn.addEventListener('click', function () {
      soundOn = !soundOn;
      vids.forEach(function (v, k) {
        v.muted = !soundOn || k !== current;
      });
      if (soundOn) {
        vids[current].volume = 1;
        safePlay(vids[current]);
      }
      btn.classList.toggle('hero__sound--on', soundOn);
      btn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
      btn.setAttribute('aria-label', soundOn ? 'Выключить звук' : 'Включить звук');
    });
  }
}

function initServiceCycle() {
  var list = document.querySelector('.service__list');
  if (!list) return;
  var items = Array.prototype.slice.call(list.querySelectorAll('.service__list-item'));
  if (!items.length) return;

  var index = 0;
  var timer = null;

  function show(i) {
    index = i;
    items.forEach(function (el, k) {
      el.classList.toggle('service__list-item--active', k === i);
    });
  }

  function start() {
    stop();
    timer = setInterval(function () {
      show((index + 1) % items.length);
    }, 600);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  items.forEach(function (el, i) {
    el.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse') return;
      stop();
      show(i);
    });
    el.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      start();
    });
  });

  show(0);
  start();
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
    var h = clone.offsetHeight;
    document.body.removeChild(clone);
    return h;
  }

  var frontH = 0;

  function sizeCard() {
    var prevH = card.style.height;
    card.style.height = '';
    var width = card.offsetWidth;

    var siblingMax = 0;
    var row = card.parentElement;
    if (row) {
      Array.prototype.forEach.call(row.children, function (child) {
        if (child !== card) {
          siblingMax = Math.max(siblingMax, child.offsetHeight);
        }
      });
    }

    frontH = Math.max(measureHeight(trigger, width), siblingMax);
    card.style.height = (frontH + 'px' === prevH) ? prevH : frontH + 'px';
  }

  sizeCard();
  window.addEventListener('load', sizeCard);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeCard);
  if (window.ResizeObserver && card.parentElement) {
    var ro = new ResizeObserver(sizeCard);
    Array.prototype.forEach.call(card.parentElement.children, function (child) {
      if (child !== card) ro.observe(child);
    });
  }

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

function initServiceSliders() {
  var INTERVAL = 1500;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.service-slider').forEach(function (box) {
    var track = box.querySelector('.service-slider__track');
    var slides = track ? track.querySelectorAll('img') : [];
    if (!track || slides.length < 2) return;

    var index = 0;
    var elapsed = 0;
    var last = 0;
    var visible = false;
    var held = false;

    var barsWrap = document.createElement('div');
    barsWrap.className = 'service-slider__bars';
    var bars = [];
    var fills = [];
    for (var i = 0; i < slides.length; i++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'service-slider__bar';
      b.setAttribute('aria-label', 'Фото ' + (i + 1));
      var f = document.createElement('span');
      f.className = 'service-slider__bar-fill';
      b.appendChild(f);
      (function (n) {
        b.addEventListener('click', function (e) { e.stopPropagation(); go(n); });
      })(i);
      barsWrap.appendChild(b);
      bars.push(b);
      fills.push(f);
    }
    box.appendChild(barsWrap);

    function paint() {
      var p = Math.min(elapsed / INTERVAL, 1);
      fills.forEach(function (fl, fi) {
        fl.style.width = (fi < index ? 100 : fi === index ? p * 100 : 0) + '%';
      });
    }

    function go(n) {
      index = (n + slides.length) % slides.length;
      elapsed = 0;
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      paint();
    }

    function tick() {
      var now = performance.now();
      visible = inView();
      if (!visible || held || document.hidden || reduceMotion) { last = 0; return; }
      if (last) elapsed += now - last;
      last = now;
      if (elapsed >= INTERVAL) go(index + 1);
      else paint();
    }

    function run() { last = 0; }

    function inView() {
      var r = box.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var h = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      return h > r.height * 0.4;
    }

    setInterval(tick, 40);

    document.addEventListener('visibilitychange', run);

    var startX = 0, startY = 0, dx = 0, down = false, decided = false, swiped = false;

    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      down = true; decided = false; swiped = false; dx = 0;
      startX = e.clientX; startY = e.clientY;
    });
    track.addEventListener('pointermove', function (e) {
      if (!down) return;
      dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (!decided && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        decided = true;
        if (Math.abs(dy) > Math.abs(dx)) { down = false; return; }
        swiped = true;
        held = true;
        track.classList.add('is-dragging');
        try { track.setPointerCapture(e.pointerId); } catch (err) {}
      }
      if (swiped) {
        track.style.transform = 'translateX(' + (-index * box.clientWidth + dx) + 'px)';
      }
    });
    function end() {
      if (!down && !swiped) return;
      down = false;
      if (swiped) {
        track.classList.remove('is-dragging');
        held = false;
        var th = box.clientWidth * 0.15;
        if (dx < -th) go(index + 1);
        else if (dx > th) go(index - 1);
        else go(index);
        run();
      }
    }
    track.addEventListener('pointerup', end);
    track.addEventListener('pointercancel', end);

    box.addEventListener('click', function () {
      if (swiped) { swiped = false; return; }
      go(index + 1);
    });

    go(0);
  });
}

function initCookieBanner() {
  var KEY = 'bw_cookie_ok';
  try {
    if (localStorage.getItem(KEY) === '1') return;
  } catch (e) { /* storage may be blocked — banner just shows each time */ }

  var box = document.createElement('div');
  box.className = 'cookie-banner';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', 'Уведомление об использовании cookie');
  box.innerHTML =
    '<p class="cookie-banner__text">Мы используем файлы cookie для корректной работы сайта и анализа трафика. ' +
    'Продолжая использовать сайт, вы соглашаетесь с <a href="policy.html">Политикой конфиденциальности</a>.</p>' +
    '<button type="button" class="cookie-banner__btn">Понятно</button>';
  document.body.appendChild(box);

  setTimeout(function () { box.classList.add('cookie-banner--visible'); }, 600);

  box.querySelector('.cookie-banner__btn').addEventListener('click', function () {
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
    box.classList.remove('cookie-banner--visible');
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 500);
  });
}
