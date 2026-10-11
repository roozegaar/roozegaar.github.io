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

  enhance.js: scroll and pointer behavior.
  Reads the DOM that main.js renders and never writes application state.
*/

(() => {
  'use strict';

  const doc = document;
  const root = doc.documentElement;
  const $ = (s, c = doc) => c.querySelector(s);
  const $$ = (s, c = doc) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  root.classList.add('js-ready');

  /* ---------------------------------------------------------------- */
  /* Scroll reveal                                                    */
  /* ---------------------------------------------------------------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  function observeReveals() {
    $$('[data-reveal]:not(.in-view):not([data-observed])').forEach((el) => {
      el.dataset.observed = '1';
      revealObserver.observe(el);
    });
  }
  doc.addEventListener('rz:render', observeReveals);
  doc.addEventListener('rz:ready', observeReveals);

  /* ---------------------------------------------------------------- */
  /* Button ripple                                                    */
  /* ---------------------------------------------------------------- */
  doc.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn, .download-btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const dot = doc.createElement('span');
    dot.className = 'ripple';
    dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove());
  });

  /* ---------------------------------------------------------------- */
  /* Card light and tilt                                              */
  /* ---------------------------------------------------------------- */
  let tiltFrame = 0;
  doc.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !finePointer.matches) return;
    const card = e.target.closest('[data-tilt]');
    if (!card) return;

    cancelAnimationFrame(tiltFrame);
    tiltFrame = requestAnimationFrame(() => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
      if (card.dataset.tilt !== 'soft' && !reduceMotion.matches) {
        card.style.setProperty('--rx', `${((0.5 - py) * 7).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${((px - 0.5) * 9).toFixed(2)}deg`);
      }
    });
  }, { passive: true });

  doc.addEventListener('pointerout', (e) => {
    const card = e.target.closest?.('[data-tilt]');
    if (!card || card.contains(e.relatedTarget)) return;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  });

  /* ---------------------------------------------------------------- */
  /* Back to top (with a progress ring)                               */
  /* ---------------------------------------------------------------- */
  const topBtn = doc.createElement('button');
  topBtn.id = 'backToTop';
  topBtn.type = 'button';
  topBtn.innerHTML = `
    <svg viewBox="0 0 52 52" aria-hidden="true"><circle class="ring-bg" cx="26" cy="26" r="23"/><circle class="ring-fg" cx="26" cy="26" r="23"/></svg>
    <i class="fa-solid fa-arrow-up" aria-hidden="true"></i>`;
  doc.body.appendChild(topBtn);
  topBtn.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' }));

  const syncTopLabel = () => topBtn.setAttribute('aria-label', (window.RZ && RZ.dict.back_to_top) || 'Back to top');
  doc.addEventListener('rz:render', syncTopLabel);

  /* ---------------------------------------------------------------- */
  /* Scroll-driven state (single rAF-throttled handler)               */
  /* ---------------------------------------------------------------- */
  let ticking = false;

  function update() {
    ticking = false;
    const y = scrollY;
    const max = Math.max(1, root.scrollHeight - innerHeight);
    root.style.setProperty('--scroll', clamp(y / max).toFixed(4));

    $('.site-header')?.classList.toggle('scrolled', y > 24);
    topBtn.classList.toggle('show', y > 520);

    // Timeline progress line and passed nodes
    const wrap = $('.timeline-wrap');
    if (wrap) {
      const r = wrap.getBoundingClientRect();
      const line = innerHeight * 0.6;
      wrap.style.setProperty('--tl-progress', `${clamp((line - r.top) / r.height) * 100}%`);
      $$('.tl-node', wrap).forEach((n) => {
        n.classList.toggle('is-passed', n.getBoundingClientRect().top + 24 < line);
      });
    }

    // Scroll spy for in-page navigation links
    const links = $$('.nav-links a[href^="#"]');
    if (links.length) {
      let current = null;
      const probe = innerHeight * 0.35;
      links.forEach((a) => {
        const t = $(a.getAttribute('href'));
        if (t && t.getBoundingClientRect().top <= probe) current = a;
      });
      links.forEach((a) => a.classList.toggle('active', a === current));
    }
  }

  function request() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  doc.addEventListener('rz:render', request);
  doc.addEventListener('rz:ready', request);
  request();
})();
