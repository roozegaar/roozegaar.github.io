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

  project.js: screenshot lightbox and image loading on project pages.
*/

(() => {
  'use strict';

  const doc = document;
  let box, img, count, items = [], index = 0, opener = null, touchX = null;

  RZ.ready.then(() => {
    box = RZ.$('#imageModal');
    if (!box) return;
    img = RZ.$('#modalImage', box);
    count = RZ.$('.lb-count', box);

    doc.addEventListener('click', onClick);
    doc.addEventListener('keydown', onKey);
    box.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', (e) => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    });
    doc.addEventListener('load', markLoaded, true);
    RZ.$$('#icon').forEach((el) => { if (el.complete && el.naturalWidth) el.classList.add('loaded'); });
    doc.addEventListener('rz:render', () => {
      RZ.$$('#icon').forEach((el) => { if (el.complete && el.naturalWidth) el.classList.add('loaded'); });
    });
  });

  function markLoaded(e) {
    if (e.target.id === 'icon') e.target.classList.add('loaded');
  }

  function onClick(e) {
    const shot = e.target.closest('.shot');
    if (shot) {
      items = RZ.$$('.shot img').map((i) => i.currentSrc || i.src);
      opener = shot;
      open(Number(shot.dataset.index) || 0);
      return;
    }
    if (box.hidden) return;
    if (e.target.closest('.lb-close') || e.target === box) close();
    else if (e.target.closest('.lb-prev')) step(-1);
    else if (e.target.closest('.lb-next')) step(1);
  }

  function onKey(e) {
    if (!box || box.hidden) return;
    const rtl = doc.documentElement.dir === 'rtl';
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') step(rtl ? -1 : 1);
    else if (e.key === 'ArrowLeft') step(rtl ? 1 : -1);
  }

  function open(i) {
    index = i;
    show();
    box.hidden = false;
    doc.body.classList.add('no-scroll');
    requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('open')));
    RZ.$('.lb-close', box).focus({ preventScroll: true });
  }

  function close() {
    box.classList.remove('open');
    doc.body.classList.remove('no-scroll');
    setTimeout(() => { box.hidden = true; }, 300);
    opener?.focus({ preventScroll: true });
  }

  function step(dir) {
    index = (index + dir + items.length) % items.length;
    show();
  }

  function show() {
    img.src = items[index];
    count.textContent = `${index + 1} / ${items.length}`;
    const multi = items.length > 1;
    RZ.$('.lb-prev', box).hidden = !multi;
    RZ.$('.lb-next', box).hidden = !multi;
  }
})();
