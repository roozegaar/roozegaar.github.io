/*
  ----------------------------------------------------------------------------
  © 2026 Mehdi Dimyadi
  Roozegaar Projects Collection
  All rights reserved.

  Author: Mehdi Dimyadi
  GitHub: https://github.com/MEHDIMYADI

  Description:
  This file is part of the Roozegaar Projects, including web, JSON,
  CSS, and JavaScript files. You may use, modify, and distribute this code
  in accordance with the project license.

  ----------------------------------------------------------------------------

  enhance.js — Additive behavior layer for Roozegaar
  Runs after main.js and tracks elements that main.js builds dynamically.
  Load after main.js:
    <script src="js/enhance.js"></script>
*/

document.addEventListener('DOMContentLoaded', () => {
  setupScrollReveal();
  setupRipple();
  setupThemeLangSpin();
  setupCardSpotlight();
  setupBackToTop();
});

/* ---------- 1) Staggered scroll-reveal for cards ---------- */
function setupScrollReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  function markAndObserve(el, index) {
    el.classList.add('reveal');
    el.style.transitionDelay = `${Math.min(index * 70, 420)}ms`;
    io.observe(el);
  }

  function revealContainer(container) {
    if (!container) return;
    Array.from(container.children).forEach((child, i) => markAndObserve(child, i));
  }

  // Project/feature cards are injected dynamically, so wait for them via MutationObserver
  ['#projectsGrid', '.features'].forEach(sel => {
    const target = document.querySelector(sel);
    if (!target) return;

    if (target.children.length) revealContainer(target);

    const mo = new MutationObserver(() => revealContainer(target));
    mo.observe(target, { childList: true });
  });

  // Section titles get a soft entrance too
  document.querySelectorAll('.section-title').forEach((el, i) => markAndObserve(el, i));
}

/* ---------- 2) Button ripple effect ---------- */
function setupRipple() {
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.cta-button, .download-btn');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });
}

/* ---------- 3) Soft spin for the theme icon and language toggle ---------- */
function setupThemeLangSpin() {
  const themeBtn = document.querySelector('.theme-toggle');
  const langBtn = document.querySelector('.lang-toggle');

  themeBtn?.addEventListener('click', () => {
    themeBtn.classList.remove('spin');
    void themeBtn.offsetWidth; // restart the CSS animation
    themeBtn.classList.add('spin');
  });

  langBtn?.addEventListener('click', () => {
    langBtn.classList.remove('spin');
    void langBtn.offsetWidth;
    langBtn.classList.add('spin');
  });
}

/* ---------- 4) Mouse-following spotlight on cards ---------- */
function setupCardSpotlight() {
  document.body.addEventListener('mousemove', (e) => {
    const card = e.target.closest('.project-card, .feature-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    card.style.setProperty('--my', `${e.clientY - rect.top}px`);
  });
}

/* ---------- 5) Back-to-top button ---------- */
function setupBackToTop() {
  const btn = document.createElement('button');
  btn.id = 'backToTop';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 400);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
