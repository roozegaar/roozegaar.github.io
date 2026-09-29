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

  project.js — Behavior for project detail pages
  Load after main.js, on project pages only:
    <script src="js/project.js"></script>
  Does not modify main.js; only observes the changes main.js makes.
*/

document.addEventListener('DOMContentLoaded', () => {
  waitForEl('#project-title').then(() => {
    injectSkeletons();
    setupIconPop();
    setupGalleryReveal();
    setupModalPop();
  });
});

function waitForEl(selector) {
  return new Promise((resolve) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);
    const mo = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) { mo.disconnect(); resolve(found); }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  });
}

/* ---------- Skeleton until data arrives, then a soft card entrance ---------- */
function injectSkeletons() {
  const cards = document.querySelectorAll('.project-page-card');
  if (!cards.length) return;

  cards.forEach((card) => {
    const overlay = document.createElement('div');
    overlay.className = 'sk-overlay';

    if (card.querySelector('#icon')) {
      overlay.innerHTML = `<div class="sk-bar sk-bar-icon"></div><div class="sk-bar" style="width:60%"></div>`;
    } else {
      overlay.innerHTML = `
        <div class="sk-bar sk-bar-title"></div>
        <div class="sk-bar"></div>
        <div class="sk-bar" style="width:92%"></div>
        <div class="sk-bar" style="width:88%"></div>
        <div class="sk-bar" style="width:70%"></div>
      `;
    }
    card.appendChild(overlay);
  });

  const titleEl = document.getElementById('project-title');
  if (!titleEl) return;

  const reveal = () => {
    document.querySelectorAll('.sk-overlay').forEach((o) => {
      o.classList.add('sk-fade-out');
      setTimeout(() => o.remove(), 420);
    });
    document.querySelectorAll('.project-page-card').forEach((card, i) => {
      card.classList.add('card-in');
      card.style.animationDelay = `${i * 110}ms`;
    });
  };

  const mo = new MutationObserver(() => {
    if (titleEl.textContent.trim()) {
      mo.disconnect();
      reveal();
    }
  });
  mo.observe(titleEl, { childList: true, characterData: true, subtree: true });

  // Handles the (rare) case where data was already present before the observer attached
  if (titleEl.textContent.trim()) {
    mo.disconnect();
    reveal();
  }
}

/* ---------- Project icon pop-in ---------- */
function setupIconPop() {
  const icon = document.getElementById('icon');
  if (!icon) return;

  const markLoaded = () => icon.classList.add('loaded');
  icon.addEventListener('load', markLoaded);
  if (icon.complete && icon.naturalWidth) markLoaded();
}

/* ---------- Staggered entrance for screenshot thumbnails ---------- */
function setupGalleryReveal() {
  const gallery = document.getElementById('project-screenshots');
  if (!gallery) return;

  const mo = new MutationObserver(() => {
    Array.from(gallery.children).forEach((img, i) => {
      if (img.dataset.revealed) return;
      img.dataset.revealed = '1';
      requestAnimationFrame(() => {
        img.style.transitionDelay = `${i * 65}ms`;
        img.classList.add('shot-in');
      });
    });
  });
  mo.observe(gallery, { childList: true });
}

/* ---------- Scale + fade for the screenshot lightbox modal ---------- */
function setupModalPop() {
  const modal = document.getElementById('imageModal');
  if (!modal) return;

  const mo = new MutationObserver(() => {
    if (modal.style.display === 'flex') {
      modal.classList.add('modal-pop');
    } else {
      modal.classList.remove('modal-pop');
    }
  });
  mo.observe(modal, { attributes: true, attributeFilter: ['style'] });
}
