/* ============================================================
   TAKKOU DIAKKA — Script principal
   Carousel · Compte à rebours · Partage · Reveal on scroll
   ============================================================ */

(function () {
  'use strict';

  /* ==========================================================
     1) SPLASH — ÉCRAN D'OUVERTURE
     ========================================================== */
  const splash = document.getElementById('splash');
  const enterBtn = document.getElementById('enterBtn');

  function closeSplash() {
    splash.classList.add('is-hidden');
    // Libère le scroll + relance les révélations après la fermeture
    document.body.style.overflow = '';
    setTimeout(() => {
      revealAllInView();
    }, 400);
  }

  // Bloque le scroll pendant l'ouverture
  document.body.style.overflow = 'hidden';
  enterBtn.addEventListener('click', closeSplash);

  // Sécurité : ferme automatiquement après 8s si jamais
  setTimeout(() => {
    if (!splash.classList.contains('is-hidden')) closeSplash();
  }, 8000);


  /* ==========================================================
     2) CAROUSEL
     ========================================================== */
  const carousel = document.getElementById('carousel');
  const track = document.getElementById('track');
  const viewport = document.getElementById('viewport');
  const slides = Array.from(track.children);
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsWrap = document.getElementById('dots');
  const progressBar = document.getElementById('progressBar');

  const AUTOPLAY_DELAY = 6000; // ms
  const RESUME_DELAY = 9000;   // reprise après interaction

  let currentIndex = 0;
  let autoplayTimer = null;
  let resumeTimer = null;
  let isTransitioning = false;

  /* --- Construction des indicateurs --- */
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel__dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Aller à la slide ${i + 1}`);
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => goTo(i, true));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  /* --- Aller à une slide --- */
  function goTo(index, userInitiated = false) {
    if (isTransitioning && !userInitiated) return;

    // Boucle infinie
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;

    currentIndex = index;
    isTransitioning = true;

    track.style.transform = `translate3d(-${currentIndex * 100}%, 0, 0)`;

    // Indicateurs
    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === currentIndex);
      d.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
    });

    // Progression
    progressBar.style.width = ((currentIndex + 1) / slides.length) * 100 + '%';

    // Débloque après transition
    setTimeout(() => {
      isTransitioning = false;
    }, 760);

    // Autoplay
    if (userInitiated) pauseAutoplay(RESUME_DELAY);
  }

  const next = (user = false) => goTo(currentIndex + 1, user);
  const prev = (user = false) => goTo(currentIndex - 1, user);

  /* --- Autoplay --- */
  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => next(false), AUTOPLAY_DELAY);
  }
  function stopAutoplay() {
    if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
  }
  function pauseAutoplay(resumeAfter = 0) {
    stopAutoplay();
    if (resumeTimer) clearTimeout(resumeTimer);
    if (resumeAfter > 0) {
      resumeTimer = setTimeout(startAutoplay, resumeAfter);
    }
  }

  /* --- Boutons --- */
  prevBtn.addEventListener('click', () => prev(true));
  nextBtn.addEventListener('click', () => next(true));

  /* --- Clavier --- */
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { prev(true); }
    if (e.key === 'ArrowRight') { next(true); }
  });

  /* --- Pause au survol (desktop) --- */
  carousel.addEventListener('mouseenter', () => stopAutoplay());
  carousel.addEventListener('mouseleave', () => startAutoplay());

  /* --- Swipe tactile --- */
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;
  let didSwipe = false;

  viewport.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    isSwiping = true;
    didSwipe = false;
    stopAutoplay();
  }, { passive: true });

  viewport.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;

    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
      didSwipe = true;
    }
  }, { passive: true });

  viewport.addEventListener('touchend', (e) => {
    if (!isSwiping) return;
    isSwiping = false;

    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const SWIPE_THRESHOLD = 50;

    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next(true);
      else prev(true);
    }

    pauseAutoplay(RESUME_DELAY);
    setTimeout(() => { didSwipe = false; }, 50);
  }, { passive: true });

  // Bloque le clic "fantôme" après un swipe
  viewport.addEventListener('click', (e) => {
    if (didSwipe) { e.stopPropagation(); e.preventDefault(); }
  }, true);

  /* --- Démarrage --- */
  progressBar.style.width = (1 / slides.length) * 100 + '%';
  startAutoplay();

  // Pause quand l'onglet n'est pas visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });


  /* ==========================================================
     3) COMPTE À REBOURS
     ========================================================== */
  const targetDate = new Date('2026-10-10T17:00:00+00:00').getTime();
  // Note : heure locale du Sénégal = GMT+0 (UTC+0)
  // Le fuseau sénégalais n'a pas d'heure d'été. 17h00 à Dakar = 17h00 UTC.

  const elDays = document.getElementById('cd-days');
  const elHours = document.getElementById('cd-hours');
  const elMinutes = document.getElementById('cd-minutes');
  const elSeconds = document.getElementById('cd-seconds');
  const elDone = document.getElementById('countdownDone');
  const countdownWrap = document.getElementById('countdown');

  function pad(n) { return String(n).padStart(2, '0'); }

  function updateCountdown() {
    const now = Date.now();
    const diff = targetDate - now;

    if (diff <= 0) {
      countdownWrap.hidden = true;
      elDone.hidden = false;
      clearInterval(countdownInterval);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    elDays.textContent = pad(days);
    elHours.textContent = pad(hours);
    elMinutes.textContent = pad(minutes);
    elSeconds.textContent = pad(seconds);
  }

  updateCountdown();
  const countdownInterval = setInterval(updateCountdown, 1000);


  /* ==========================================================
     4) REVEAL ON SCROLL
     ========================================================== */
  const revealElements = document.querySelectorAll('.reveal');

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach((el) => io.observe(el));

  function revealAllInView() {
    revealElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95) {
        el.classList.add('is-visible');
        io.unobserve(el);
      }
    });
  }


  /* ==========================================================
     5) PARTAGE / COPIE DU LIEN
     ========================================================== */
  const toast = document.getElementById('toast');
  const shareBtn = document.getElementById('shareBtn');
  const copyBtn = document.getElementById('copyBtn');

  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }

  const SHARE_DATA = {
    title: 'Takkou Diakka — François NDIAYE & Aissatou Bouna BA',
    text: 'Invitation au mariage religieux du samedi 10 octobre 2026 à 17h00 — Mosquée de l’Unité 12, Parcelles Assainies, Dakar.',
    url: window.location.href
  };

  async function shareInvitation() {
    if (navigator.share) {
      try {
        await navigator.share(SHARE_DATA);
      } catch (err) {
        // Utilisateur a annulé → on ne fait rien
        if (err && err.name !== 'AbortError') {
          copyLink();
        }
      }
    } else {
      copyLink();
    }
  }

  async function copyLink() {
    const url = window.location.href;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback legacy
        const temp = document.createElement('textarea');
        temp.value = url;
        temp.setAttribute('readonly', '');
        temp.style.position = 'absolute';
        temp.style.left = '-9999px';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }
      showToast('Lien copié ✓');
    } catch (err) {
      showToast('Impossible de copier le lien');
    }
  }

  shareBtn.addEventListener('click', shareInvitation);
  copyBtn.addEventListener('click', copyLink);

  /* ==========================================================
     6) ÉTOILES FILANTES — Section couple dorée
     ========================================================== */
  const coupleStars = document.getElementById('coupleStars');

  if (coupleStars && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {

    function spawnCoupleStar() {
      const star = document.createElement('div');
      star.className = 'couple-star';

      // Départ en haut, vers la droite
      const startX = 30 + Math.random() * 60;   // 30% → 90%
      const startY = 5 + Math.random() * 25;    // 5% → 30%
      star.style.left = startX + '%';
      star.style.top = startY + '%';

      const duration = 1.8 + Math.random() * 1.2;
      star.style.animationDuration = duration + 's';

      coupleStars.appendChild(star);
      setTimeout(() => star.remove(), duration * 1000 + 300);
    }

    function loopCoupleStar() {
      spawnCoupleStar();

      // Parfois 2 étoiles en même temps pour l'effet magique
      if (Math.random() > 0.6) {
        setTimeout(spawnCoupleStar, 300 + Math.random() * 400);
      }

      setTimeout(loopCoupleStar, 1500 + Math.random() * 2500);
    }

    // Démarre quand la section devient visible
    let starsStarted = false;
    const starObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !starsStarted) {
          starsStarted = true;
          setTimeout(spawnCoupleStar, 400);
          setTimeout(loopCoupleStar, 1400);
        }
      });
    }, { threshold: 0.15 });

    const coupleSection = document.getElementById('epoux');
    if (coupleSection) starObserver.observe(coupleSection);
  }
    /* ==========================================================
     7) SHOWCASE — Galerie horizontale premium
     ========================================================== */
  const showcase = document.getElementById('showcase');
  const showcaseTrack = document.getElementById('showcaseTrack');
  const showcaseProgress = document.getElementById('showcaseProgress');
  const showcaseCards = showcaseTrack ? Array.from(showcaseTrack.children) : [];

  if (showcase && showcaseCards.length > 0) {

    /* --- Active la carte centrale --- */
    function updateActiveCard() {
      const center = showcase.scrollLeft + showcase.clientWidth / 2;

      let closest = null;
      let closestDist = Infinity;
      let closestIdx = 0;

      showcaseCards.forEach((card, idx) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(cardCenter - center);

        if (dist < closestDist) {
          closestDist = dist;
          closest = card;
          closestIdx = idx;
        }
      });

      showcaseCards.forEach((c) => c.classList.remove('is-active'));
      if (closest) closest.classList.add('is-active');

      // Barre de progression
      if (showcaseProgress) {
        const maxScroll = showcase.scrollWidth - showcase.clientWidth;
        const percent = maxScroll > 0 ? (showcase.scrollLeft / maxScroll) * 100 : 0;
        showcaseProgress.style.width = Math.max(8, percent) + '%';
      }

      return closestIdx;
    }

    /* --- Scroll avec rAF throttle --- */
    let ticking = false;
    showcase.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveCard();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    /* --- AUTO-SCROLL doux --- */
    let autoScrollPaused = false;
    let autoScrollTimer = null;
    let userInteracted = false;

    function startAutoScroll() {
      stopAutoScroll();
      autoScrollTimer = setInterval(() => {
        if (autoScrollPaused || !showcaseCards.length) return;

        const currentIdx = updateActiveCard();
        const nextIdx = (currentIdx + 1) % showcaseCards.length;
        const nextCard = showcaseCards[nextIdx];

        showcase.scrollTo({
          left: nextCard.offsetLeft - (showcase.clientWidth - nextCard.offsetWidth) / 2,
          behavior: 'smooth'
        });
      }, 4500);
    }

    function stopAutoScroll() {
      if (autoScrollTimer) {
        clearInterval(autoScrollTimer);
        autoScrollTimer = null;
      }
    }

    // Pause au survol
    showcase.addEventListener('mouseenter', () => { autoScrollPaused = true; });
    showcase.addEventListener('mouseleave', () => { autoScrollPaused = false; });

    // Pause au toucher
    showcase.addEventListener('touchstart', () => {
      autoScrollPaused = true;
      userInteracted = true;
    }, { passive: true });

    showcase.addEventListener('touchend', () => {
      setTimeout(() => {
        autoScrollPaused = false;
        // Snap sur la carte centrale après le toucher
        snapToCenter();
      }, 120);
    }, { passive: true });

    /* --- Snap vers la carte centrale --- */
    function snapToCenter() {
      const center = showcase.scrollLeft + showcase.clientWidth / 2;
      let closest = null;
      let closestDist = Infinity;

      showcaseCards.forEach((card) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(cardCenter - center);
        if (dist < closestDist) {
          closestDist = dist;
          closest = card;
        }
      });

      if (closest) {
        showcase.scrollTo({
          left: closest.offsetLeft - (showcase.clientWidth - closest.offsetWidth) / 2,
          behavior: 'smooth'
        });
      }
    }

    /* --- Clic sur une carte = lightbox --- */
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.innerHTML = `
      <button class="lightbox__close" aria-label="Fermer"></button>
      <button class="lightbox__nav lightbox__nav--prev" aria-label="Photo précédente"></button>
      <button class="lightbox__nav lightbox__nav--next" aria-label="Photo suivante"></button>
      <img class="lightbox__img" alt="">
      <div class="lightbox__counter"></div>
    `;
    document.body.appendChild(lightbox);

    const lbImg = lightbox.querySelector('.lightbox__img');
    const lbClose = lightbox.querySelector('.lightbox__close');
    const lbPrev = lightbox.querySelector('.lightbox__nav--prev');
    const lbNext = lightbox.querySelector('.lightbox__nav--next');
    const lbCounter = lightbox.querySelector('.lightbox__counter');
    const total = showcaseCards.length;

    let currentIdx = 0;

    function openLightbox(idx) {
      currentIdx = idx;
      const img = showcaseCards[idx].querySelector('img');
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lbCounter.textContent = (idx + 1) + ' / ' + total;
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      autoScrollPaused = true;
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
      autoScrollPaused = false;
    }

    function nextPhoto() {
      currentIdx = (currentIdx + 1) % total;
      openLightbox(currentIdx);
    }

    function prevPhoto() {
      currentIdx = (currentIdx - 1 + total) % total;
      openLightbox(currentIdx);
    }

    showcaseCards.forEach((card, idx) => {
      card.addEventListener('click', () => openLightbox(idx));
    });

    lbClose.addEventListener('click', closeLightbox);
    lbNext.addEventListener('click', (e) => { e.stopPropagation(); nextPhoto(); });
    lbPrev.addEventListener('click', (e) => { e.stopPropagation(); prevPhoto(); });

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    });

    // Swipe dans la lightbox
    let lbTouchStart = 0;
    lightbox.addEventListener('touchstart', (e) => {
      lbTouchStart = e.touches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - lbTouchStart;
      if (Math.abs(dx) > 50) {
        if (dx < 0) nextPhoto();
        else prevPhoto();
      }
    }, { passive: true });

    /* --- Initialisation --- */
    window.addEventListener('load', () => {
      setTimeout(() => {
        // Centre la 1ère carte
        const firstCard = showcaseCards[0];
        if (firstCard) {
          showcase.scrollTo({
            left: firstCard.offsetLeft - (showcase.clientWidth - firstCard.offsetWidth) / 2,
            behavior: 'auto'
          });
        }
        updateActiveCard();
        startAutoScroll();
      }, 300);
    });

    // Démarrage immédiat si déjà chargé
    if (document.readyState === 'complete') {
      setTimeout(() => {
        const firstCard = showcaseCards[0];
        if (firstCard) {
          showcase.scrollTo({
            left: firstCard.offsetLeft - (showcase.clientWidth - firstCard.offsetWidth) / 2,
            behavior: 'auto'
          });
        }
        updateActiveCard();
        startAutoScroll();
      }, 300);
    }

    // Pause quand l'onglet est caché
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAutoScroll();
      else startAutoScroll();
    });
  }})();