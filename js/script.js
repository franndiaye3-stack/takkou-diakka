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

})();