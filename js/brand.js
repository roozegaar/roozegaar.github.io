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

  brand.js: hero behavior shared by the home page and project pages.
  Requires main.js (window.RZ).
*/

(() => {
  'use strict';

  const doc = document;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => a + Math.random() * (b - a);

  let hero = null;
  let visible = true;
  let generation = 0;

  RZ.ready.then(init);

  function init() {
    hero = RZ.$('.hero');
    if (!hero) return;

    mountIcons();
    mountTags();
    startClock();
    fitHero();
    watchVisibility();
    bindParallax();

    doc.addEventListener('rz:langchange', () => {
      tickClock();
      runTags();
      requestAnimationFrame(fitHero);
    });
  }

  /* ---------------------------------------------------------------- */
  /* Fit: keeps the hero content inside one screen on any device      */
  /* ---------------------------------------------------------------- */
  function fitHero() {
    const content = RZ.$('.hero-content', hero);
    if (!content) return;

    const measure = () => {
      const cs = getComputedStyle(hero);
      const room = hero.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const need = content.offsetHeight;
      const scale = need > 0 ? Math.min(1, Math.max(0.55, room / need)) : 1;
      content.style.setProperty('--fit', scale.toFixed(3));
    };

    measure();
    const ro = new ResizeObserver(() => {
      measure();
      RZ.$$('.hero-tag.is-on', hero).forEach(updateBlocked);
    });
    ro.observe(hero);
    ro.observe(content);
    addEventListener('orientationchange', () => setTimeout(measure, 250));
    if (doc.fonts?.ready) doc.fonts.ready.then(measure);
  }

  function watchVisibility() {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      hero.classList.toggle('is-paused', !visible);
    }, { threshold: 0 }).observe(hero);
  }

  /* ---------------------------------------------------------------- */
  /* Floating product icons (taken from the project data)             */
  /* ---------------------------------------------------------------- */
  const ICON_SLOTS = [
    { x: '7%', y: '15%' }, { x: '30%', y: '9%' }, { x: '62%', y: '12%' },
    { x: '9%', y: '66%' }, { x: '36%', y: '78%' }, { x: '68%', y: '76%' }, { x: '90%', y: '58%' },
  ];

  async function mountIcons() {
    const wrap = RZ.$('.hero-icons', hero);
    if (!wrap) return;
    const { projects } = await RZ.getJSON('data/projects.json');
    const icons = [...new Set(projects.filter(RZ.isPublished).map((p) => p.icon).filter(Boolean))];

    wrap.innerHTML = '';
    icons.slice(0, ICON_SLOTS.length).forEach((cls, i) => {
      const el = doc.createElement('i');
      el.className = cls;
      el.style.setProperty('--x', ICON_SLOTS[i].x);
      el.style.setProperty('--y', ICON_SLOTS[i].y);
      el.style.setProperty('--s', `${rand(1.5, 2.4).toFixed(2)}rem`);
      el.style.setProperty('--dx', `${rand(-16, 16).toFixed(0)}px`);
      el.style.setProperty('--dy', `${rand(-18, 18).toFixed(0)}px`);
      el.style.setProperty('--dr', `${rand(-8, 8).toFixed(0)}deg`);
      el.style.animationDuration = `${rand(7, 11).toFixed(1)}s`;
      el.style.animationDelay = `${(-rand(0, 8)).toFixed(1)}s`;
      wrap.appendChild(el);
    });
  }

  function bindParallax() {
    if (!finePointer.matches || RZ.reduceMotion()) return;
    const layer = RZ.$('.hero-icons', hero);
    if (!layer) return;
    let frame = 0;
    hero.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        layer.style.transform = `translate(${(px * -22).toFixed(1)}px, ${(py * -22).toFixed(1)}px)`;
      });
    });
    hero.addEventListener('pointerleave', () => { layer.style.transform = ''; });
  }

  /* ---------------------------------------------------------------- */
  /* Collision check: capsules never cover the hero text              */
  /* ---------------------------------------------------------------- */
  function contentRects() {
    const content = RZ.$('.hero-content', hero);
    if (!content) return [];
    return Array.from(content.children).map((el) => {
      if (/^(H1|P)$/.test(el.tagName)) {
        const range = doc.createRange();
        range.selectNodeContents(el);
        return range.getBoundingClientRect();
      }
      return el.getBoundingClientRect();
    }).filter((r) => r.width && r.height);
  }

  function updateBlocked(tag) {
    if (!tag.offsetParent && getComputedStyle(tag).display === 'none') return true;
    const box = tag.getBoundingClientRect();
    const pad = 16;
    const hit = contentRects().some((r) =>
      box.left < r.right + pad && box.right > r.left - pad && box.top < r.bottom + pad && box.bottom > r.top - pad);
    tag.classList.toggle('is-blocked', hit);
    return hit;
  }

  /* ---------------------------------------------------------------- */
  /* Typing capsules (feature lines)                                  */
  /* ---------------------------------------------------------------- */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async function featureLines(lang) {
    const slug = doc.body.dataset.projectSection;
    let features = [];
    if (slug) {
      features = (await RZ.getJSON(`page/${slug}.json`)).features || [];
    } else {
      const { projects } = await RZ.getJSON('data/projects.json');
      features = projects.filter(RZ.isPublished).flatMap((p) => p.features || []);
    }
    const lines = features.map((f) => RZ.pick(f, lang)).filter(Boolean);
    const short = lines.filter((l) => l.length <= 58);
    return shuffle(short.length >= 4 ? short : lines);
  }

  function mountTags() {
    const wrap = RZ.$('.hero-tags', hero);
    if (!wrap) return;
    wrap.innerHTML = [1, 2, 3, 4].map((n) =>
      `<div class="hero-tag t${n}"><span class="typed"></span><i class="caret" aria-hidden="true"></i><span class="rest"></span></div>`
    ).join('');
    runTags();
  }

  async function runTags() {
    const run = ++generation;
    const tags = RZ.$$('.hero-tag', hero);
    if (!tags.length) return;
    const lines = await featureLines(RZ.lang);
    if (!lines.length || run !== generation) return;

    tags.forEach((tag, i) => cycle(tag, i, lines, run));
  }

  async function cycle(tag, slot, lines, run) {
    const typed = RZ.$('.typed', tag);
    const rest = RZ.$('.rest', tag);
    const alive = () => run === generation;
    const waitVisible = async () => { while (!visible && alive()) await sleep(400); };
    const instant = RZ.reduceMotion();

    let index = (slot * Math.max(1, Math.floor(lines.length / 4))) % lines.length;

    tag.classList.remove('is-on', 'is-done');
    typed.textContent = '';
    rest.textContent = '';
    await sleep(500 + slot * 900);

    while (alive()) {
      const text = lines[index % lines.length];
      typed.textContent = '';
      rest.textContent = text;
      tag.classList.remove('is-done');

      if (updateBlocked(tag)) {
        tag.classList.remove('is-on');
        await sleep(900);
        index++;
        continue;
      }
      tag.classList.add('is-on');

      if (instant) {
        typed.textContent = text;
        rest.textContent = '';
      } else {
        for (let n = 1; n <= text.length && alive(); n++) {
          await waitVisible();
          typed.textContent = text.slice(0, n);
          rest.textContent = text.slice(n);
          await sleep(rand(38, 78));
        }
      }
      if (!alive()) return;

      tag.classList.add('is-done');
      await sleep(instant ? 6500 : rand(3200, 4600));

      if (!instant) {
        for (let n = text.length; n >= 0 && alive(); n--) {
          await waitVisible();
          typed.textContent = text.slice(0, n);
          rest.textContent = text.slice(n);
          await sleep(rand(12, 24));
        }
      }
      tag.classList.remove('is-on');
      await sleep(550);
      index++;
    }
  }

  /* ---------------------------------------------------------------- */
  /* Clock badge (home page)                                          */
  /* ---------------------------------------------------------------- */
  const pad = new Intl.NumberFormat('en-US', { minimumIntegerDigits: 2, useGrouping: false });
  const padFa = new Intl.NumberFormat('fa-IR', { minimumIntegerDigits: 2, useGrouping: false });
  const weekdayFmt = {
    fa: new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    en: new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  };
  let clockTimer = 0;

  function startClock() {
    if (!RZ.$('.hero-clock', hero)) return;
    tickClock();
    clearInterval(clockTimer);
    clockTimer = setInterval(() => { if (visible && !doc.hidden) tickClock(); }, 1000);
  }

  function tickClock() {
    const clock = RZ.$('.hero-clock', hero);
    if (!clock) return;
    const lang = RZ.lang;
    const now = new Date();
    const nf = lang === 'fa' ? padFa : pad;

    RZ.$('.hc-date', clock).textContent = weekdayFmt[lang].format(now);
    const parts = { h: now.getHours(), m: now.getMinutes(), s: now.getSeconds() };
    Object.entries(parts).forEach(([key, value]) => {
      const el = RZ.$(`[data-p="${key}"]`, clock);
      const text = nf.format(value);
      if (el.textContent === text) return;
      el.textContent = text;
      if (key === 's') {
        el.classList.remove('tick');
        void el.offsetWidth;
        el.classList.add('tick');
      }
    });
  }
})();
