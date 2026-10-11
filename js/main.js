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

  main.js: application core.
  Exposes window.RZ and dispatches these events on document:
    rz:ready       first render finished
    rz:render      dynamic content was (re)rendered
    rz:langchange  detail: { lang }
    rz:themechange detail: { theme }
*/

(() => {
  'use strict';

  const SITE_REPO = 'roozegaar/roozegaar.github.io';
  const TAG_TTL = 6 * 60 * 60 * 1000;
  const THEME_COLORS = { light: '#f3f7f7', dark: '#08111b' };

  const doc = document;
  const root = doc.documentElement;
  const $ = (sel, ctx = doc) => ctx.querySelector(sel);
  const $$ = (sel, ctx = doc) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pick = (obj, lang) => (obj && (obj[lang] ?? obj.en ?? obj.fa)) ?? '';

  /* ------------------------------------------------------------------ */
  /* Shared state and helpers                                           */
  /* ------------------------------------------------------------------ */
  const jsonCache = new Map();
  const dictCache = new Map();
  let dict = {};
  let firstRender = true;

  let resolveReady;
  const RZ = (window.RZ = {
    ready: new Promise((r) => (resolveReady = r)),
    get lang() { return root.lang === 'fa' ? 'fa' : 'en'; },
    get theme() { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; },
    get dict() { return dict; },
    esc, pick, $, $$, reduceMotion,
    getJSON,
    formatDate,
    latestTag,
    isPublished,
  });

  function emit(name, detail) { doc.dispatchEvent(new CustomEvent(name, { detail })); }

  function getJSON(url) {
    if (!jsonCache.has(url)) {
      jsonCache.set(url, fetch(url).then((r) => {
        if (!r.ok) throw new Error(`${url}: ${r.status}`);
        return r.json();
      }).catch((err) => { jsonCache.delete(url); throw err; }));
    }
    return jsonCache.get(url);
  }

  async function getDict(lang) {
    if (!dictCache.has(lang)) dictCache.set(lang, await getJSON(`lang/${lang}.json`));
    return dictCache.get(lang);
  }

  function isPublished(p) { return String(p.publish ?? 'true').toLowerCase() !== 'false'; }

  /* ------------------------------------------------------------------ */
  /* Dates: the browser's own Intl engine handles the Persian calendar  */
  /* ------------------------------------------------------------------ */
  const dateFormatters = {
    fa: {
      full: new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }),
      year: new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'UTC', year: 'numeric' }),
    },
    en: {
      full: new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }),
      year: new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', year: 'numeric' }),
    },
  };

  function parseDate(iso) {
    if (!iso) return null;
    const d = new Date(String(iso).length <= 10 ? `${iso}T12:00:00Z` : iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function formatDate(iso, lang = RZ.lang) {
    const d = parseDate(iso);
    if (!d) return null;
    const f = dateFormatters[lang] || dateFormatters.en;
    return { iso: d.toISOString().slice(0, 10), full: f.full.format(d), year: f.year.format(d), time: d.getTime() };
  }

  /* ------------------------------------------------------------------ */
  /* Latest release tag (highest semantic version, cached)              */
  /* ------------------------------------------------------------------ */
  const tagInflight = new Map();
  const nums = (tag) => (String(tag).match(/\d+/g) || []).map(Number);

  function compareVersions(a, b) {
    const x = nums(a), y = nums(b);
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
      const diff = (x[i] || 0) - (y[i] || 0);
      if (diff) return diff;
    }
    return 0;
  }

  function readTagCache(repo) {
    try { return JSON.parse(localStorage.getItem(`rz:tag:${repo}`)); } catch { return null; }
  }

  function latestTag(repo) {
    if (!repo) return Promise.resolve(null);
    const cached = readTagCache(repo);
    if (cached && Date.now() - cached.t < TAG_TTL) return Promise.resolve(cached.v);
    if (tagInflight.has(repo)) return tagInflight.get(repo);

    const job = (async () => {
      let tag = null;
      try {
        const res = await fetch(`https://api.github.com/repos/${repo}/tags?per_page=100`);
        if (res.ok) {
          const tags = (await res.json()).map((t) => t.name).filter((n) => nums(n).length);
          if (tags.length) tag = tags.sort(compareVersions).pop();
        }
      } catch (err) { console.warn('latestTag(tags):', repo, err.message); }

      if (!tag) {
        try {
          const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
          if (res.ok) tag = (await res.json()).tag_name || null;
        } catch (err) { console.warn('latestTag(releases):', repo, err.message); }
      }

      if (tag) {
        try { localStorage.setItem(`rz:tag:${repo}`, JSON.stringify({ v: tag, t: Date.now() })); } catch {}
        return tag;
      }
      return cached ? cached.v : null;
    })().finally(() => tagInflight.delete(repo));

    tagInflight.set(repo, job);
    return job;
  }

  const cleanTag = (t) => (t ? String(t).replace(/^v/i, '') : '—');

  /* ------------------------------------------------------------------ */
  /* Components                                                         */
  /* ------------------------------------------------------------------ */
  function setProgress(p) {
    const bar = $('#progress-bar');
    if (!bar) return;
    bar.style.opacity = '1';
    bar.style.width = `${p}%`;
    if (p >= 100) {
      setTimeout(() => {
        bar.style.opacity = '0';
        setTimeout(() => { bar.style.width = '0'; }, 400);
      }, 250);
    }
  }

  async function loadComponents() {
    const slots = $$('[data-component]');
    let done = 0;
    await Promise.all(slots.map(async (slot) => {
      try {
        const res = await fetch(slot.dataset.component);
        if (!res.ok) throw new Error(res.status);
        slot.innerHTML = await res.text();
      } catch (err) {
        console.error('Component failed:', slot.dataset.component, err);
      }
      setProgress((++done / slots.length) * 100);
    }));
  }

  /* ------------------------------------------------------------------ */
  /* i18n                                                               */
  /* ------------------------------------------------------------------ */
  // "{word}" inside a translated string becomes a highlighted span.
  function setRich(el, value) {
    if (value.includes('{')) el.innerHTML = esc(value).replace(/\{(.+?)\}/g, '<span class="hl">$1</span>');
    else el.textContent = value;
  }

  function applyI18n(scope = doc) {
    $$('[data-i18n]', scope).forEach((el) => {
      const v = dict[el.dataset.i18n];
      if (v != null) setRich(el, v);
    });
    $$('[data-i18n-title]', scope).forEach((el) => { const v = dict[el.dataset.i18nTitle]; if (v) el.title = v; });
    $$('[data-i18n-label]', scope).forEach((el) => { const v = dict[el.dataset.i18nLabel]; if (v) el.setAttribute('aria-label', v); });
  }

  /* ------------------------------------------------------------------ */
  /* Header, footer                                                     */
  /* ------------------------------------------------------------------ */
  async function renderHeader() {
    const header = $('.site-header');
    if (!header) return;
    const section = doc.body.dataset.headerSection || 'main';
    const data = (await getJSON('data/header.json'))[section];
    if (!data) return;
    const lang = RZ.lang;

    $('.logo-text', header).textContent = pick(data.title, lang);

    const ul = $('.nav-links', header);
    ul.innerHTML = data.links.map((l) => `<li><a href="${esc(l.href)}">${esc(l[lang])}</a></li>`).join('');

    const toggle = $('.lang-toggle span', header);
    if (toggle) toggle.textContent = lang === 'fa' ? 'EN' : 'فا';
  }

  async function renderFooter() {
    const logo = $('.footer-logo-text');
    if (logo) logo.textContent = RZ.lang === 'fa' ? 'روزگار' : 'ROOZEGAAR';

    const ul = $('#footer-links');
    if (ul) {
      const section = doc.body.dataset.headerSection === 'blog' ? 'project' : 'main';
      const links = (await getJSON('data/footer.json')).quick_links[section] || [];
      ul.innerHTML = links.map((l) => `<li><a href="${esc(l.href)}">${esc(pick(l.text, RZ.lang))}</a></li>`).join('');
    }

    // The browser converts the current year to the Persian calendar.
    const p = $('#footer-copyright');
    if (p) {
      const year = new Intl.DateTimeFormat(RZ.lang === 'fa' ? 'fa-IR-u-ca-persian' : 'en-US', { year: 'numeric' }).format(new Date());
      p.textContent = `${dict.copyright || ''} © ${year}`;
    }
  }

  async function renderSiteVersion() {
    const badge = $('#site-version');
    if (!badge) return;
    const tag = await latestTag(SITE_REPO);
    if (!tag) { badge.hidden = true; return; }
    $('.vb-text', badge).textContent = tag.startsWith('v') ? tag : `v${tag}`;
    badge.hidden = false;
  }

  /* ------------------------------------------------------------------ */
  /* Home: timeline of projects                                         */
  /* ------------------------------------------------------------------ */
  function sortedProjects(list) {
    return list
      .map((p, i) => ({ p, i, t: parseDate(p.date)?.getTime() ?? -Infinity }))
      .filter(({ p }) => isPublished(p))
      .sort((a, b) => b.t - a.t || a.i - b.i)
      .map(({ p }) => p);
  }

  async function renderTimeline() {
    const list = $('#projectsGrid');
    if (!list) return;

    const data = await getJSON('data/projects.json');
    const lang = RZ.lang;
    const tr = data.translations;
    const items = sortedProjects(data.projects);

    let lastYear = null;
    let side = 0;
    let order = 0;
    const html = [];

    items.forEach((p) => {
      const d = formatDate(p.date, lang);
      if (d && d.year !== lastYear) {
        lastYear = d.year;
        html.push(`<li class="tl-year" data-reveal="fade"><span>${esc(d.year)}</span></li>`);
      }

      const feats = p.features || [];
      const shown = feats.slice(0, 4);
      const extra = feats.length - shown.length;
      const title = pick(p.title, lang);
      const cls = side++ % 2 ? 'side-b' : 'side-a';

      html.push(`
        <li class="tl-item ${cls}" data-reveal style="--d:${order++ % 3}" data-repo="${esc(p.repo || '')}">
          <div class="tl-date">${d ? `<time datetime="${esc(d.iso)}"><i class="fa-regular fa-calendar" aria-hidden="true"></i>${esc(d.full)}</time>` : ''}</div>
          <div class="tl-node"><i class="${esc(p.icon || 'fa-solid fa-cube')}" aria-hidden="true"></i></div>
          <article class="tl-card" data-tilt>
            <a class="tl-media" href="${esc(p.overview_link)}" tabindex="-1" aria-hidden="true">
              <img src="${esc(p.image)}" alt="${esc(title)}" loading="lazy" decoding="async">
              <span class="media-fallback"><i class="${esc(p.icon || 'fa-solid fa-cube')}"></i></span>
              <span class="chip">${esc(pick(p.platform, lang))}</span>
            </a>
            <div class="tl-body">
              <h3 class="tl-title"><a href="${esc(p.overview_link)}">${esc(title)}</a></h3>
              <p class="tl-desc">${esc(pick(p.desc, lang))}</p>
              <ul class="tl-features">
                ${shown.map((f) => `<li>${esc(pick(f, lang))}</li>`).join('')}
                ${extra > 0 ? `<li class="more">${esc(pick(tr.more_features, lang).replace('{n}', new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(extra)))}</li>` : ''}
              </ul>
              <div class="download-info">
                <span class="project-version">${esc(pick(tr.version, lang))}: <span class="ver-text is-loading">…</span></span>
                <a href="${esc(p.overview_link)}" class="download-btn" title="${esc(pick(tr.overview_tooltip, lang))}" aria-label="${esc(pick(tr.overview_tooltip, lang))}"><i class="fas fa-file-lines"></i></a>
                <a href="${esc(p.details_link)}" class="download-btn" title="${esc(pick(tr.learn_more_tooltip, lang))}" aria-label="${esc(pick(tr.learn_more_tooltip, lang))}" target="_blank" rel="noopener noreferrer"><i class="fas fa-info-circle"></i></a>
                <a href="${esc(p.download_link)}" class="download-btn primary" title="${esc(pick(tr.download_tooltip, lang))}" aria-label="${esc(pick(tr.download_tooltip, lang))}" target="_blank" rel="noopener noreferrer"><i class="fas fa-download"></i></a>
              </div>
            </div>
          </article>
        </li>`);
    });

    list.innerHTML = html.join('');
    if (!firstRender) $$('[data-reveal]', list).forEach((el) => el.classList.add('in-view'));

    items.forEach((p, i) => {
      const card = $$('.tl-item', list)[i];
      const verEl = card && $('.ver-text', card);
      if (!verEl) return;
      const finish = (v) => { verEl.textContent = v; verEl.classList.remove('is-loading'); };
      if (p.repo) latestTag(p.repo).then((t) => finish(cleanTag(t ?? p.version)));
      else finish(p.version || '—');
    });
  }

  async function renderFeatures() {
    const grid = $('#featuresGrid');
    if (!grid) return;
    const lang = RZ.lang;
    const { features } = await getJSON('data/features.json');
    grid.innerHTML = features.map((f, i) => `
      <div class="feature-card" data-reveal style="--d:${i % 3}" data-tilt="soft">
        <div class="feature-icon"><i class="${esc(f.icon)}" aria-hidden="true"></i></div>
        <h3 class="feature-title">${esc(pick(f.title, lang))}</h3>
        <p class="feature-description">${esc(pick(f.desc, lang))}</p>
      </div>`).join('');
    if (!firstRender) $$('[data-reveal]', grid).forEach((el) => el.classList.add('in-view'));
  }

  /* ------------------------------------------------------------------ */
  /* Project page                                                       */
  /* ------------------------------------------------------------------ */
  let currentProject = null;

  async function renderProject() {
    const slug = doc.body.dataset.projectSection;
    if (!slug) return;
    const lang = RZ.lang;

    const [project, all] = await Promise.all([getJSON(`page/${slug}.json`), getJSON('data/projects.json')]);
    const meta = all.projects.find((p) => p.id === slug || p.overview_link === `${slug}.html`) || {};
    const t = project.translations || {};
    currentProject = { project, meta };

    const title = pick(project.title, lang);
    doc.title = `${title} | ${lang === 'fa' ? 'روزگار' : 'ROOZEGAAR'}`;

    // Hero
    const heroTitle = $('#project-title');
    if (heroTitle) heroTitle.textContent = title;
    const heroIcon = $('#heroBadge i');
    if (heroIcon) heroIcon.className = meta.icon || 'fa-solid fa-cube';

    const date = formatDate(meta.date, lang);
    const platform = pick(meta.platform, lang) || project.platform;
    const category = dict[`cat_${project.category}`] || project.category || '';
    const chips = $('#heroChips');
    if (chips) {
      chips.innerHTML = [
        platform && `<span class="hero-chip"><i class="fa-solid fa-layer-group" aria-hidden="true"></i>${esc(platform)}</span>`,
        category && `<span class="hero-chip"><i class="fa-solid fa-folder-open" aria-hidden="true"></i>${esc(category)}</span>`,
        date && `<span class="hero-chip"><i class="fa-regular fa-calendar" aria-hidden="true"></i>${esc(date.full)}</span>`,
      ].filter(Boolean).join('');
    }

    const intro = pick(project.meta_description, lang) || (project.description?.[lang] || [])[0] || '';
    const heroDesc = $('#hero-desc');
    if (heroDesc) heroDesc.textContent = intro;

    const dl = pick(t.download_tooltip, lang);
    const more = pick(t.learn_more_tooltip, lang);
    ['#hero-download', '#download-btn'].forEach((sel) => { const a = $(sel); if (a) { a.href = project.download_link; a.title = dl; } });
    ['#hero-repo', '#repo-btn'].forEach((sel) => { const a = $(sel); if (a) { a.href = project.repo_link; a.title = more; } });

    // Body
    const desc = $('#project-description');
    if (desc) desc.innerHTML = (project.description?.[lang] || []).map((p) => `<p>${esc(p)}</p>`).join('');

    const feats = $('#project-features');
    if (feats) feats.innerHTML = (project.features || []).map((f) => `<li>${esc(pick(f, lang))}</li>`).join('');

    const icon = $('#icon');
    if (icon) { icon.src = project.icon; icon.alt = title; }

    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('#meta-date', date ? date.full : '—');
    set('#meta-platform', platform || '—');
    set('#meta-category', category || '—');

    const sTitle = $('#screenshots'); if (sTitle) sTitle.textContent = pick(t.screenshots_title, lang);
    const cTitle = $('#comment'); if (cTitle) cTitle.textContent = pick(t.comments_title, lang);

    const gallery = $('#project-screenshots');
    if (gallery) {
      const shots = project.screenshots?.[lang] || [];
      gallery.innerHTML = shots.map((src, i) =>
        `<button type="button" class="shot" style="--i:${i}" data-index="${i}" aria-label="${esc(title)} ${i + 1}"><img src="${esc(src)}" alt="${esc(title)}" loading="lazy" decoding="async"></button>`
      ).join('');
      gallery.hidden = !shots.length;
      if (sTitle) sTitle.hidden = !shots.length;
    }

    $$('.is-loading.panel').forEach((el) => el.classList.remove('is-loading'));

    // Version resolves in the background
    const verEl = $('#project-version-text');
    if (verEl) {
      verEl.classList.add('is-loading');
      const done = (v) => { verEl.textContent = v; verEl.classList.remove('is-loading'); };
      if (project.repo) latestTag(project.repo).then((tag) => done(cleanTag(tag ?? project.version)));
      else done(project.version || '—');
    }

    injectSEO(project, meta, lang, intro);
    loadGiscus(slug, lang);
  }

  function injectSEO(project, meta, lang, intro) {
    let desc = $('meta[name="description"]');
    if (!desc) { desc = doc.createElement('meta'); desc.name = 'description'; doc.head.appendChild(desc); }
    desc.content = intro.slice(0, 200);

    const schema = project.seoData?.[lang]?.schema || project.seoData?.en?.schema || {};
    const data = {
      '@context': schema['@context'] || 'https://schema.org',
      '@type': schema['@type'] || 'SoftwareApplication',
      name: pick(project.title, lang),
      description: intro,
      inLanguage: lang === 'fa' ? 'fa-IR' : 'en-US',
      applicationCategory: schema.applicationCategory || project.category || 'Software',
      operatingSystem: schema.operatingSystem || project.platform || 'Windows',
      softwareVersion: project.version,
      image: project.icon,
      author: schema.author,
      downloadUrl: project.download_link,
      url: project.repo_link,
      datePublished: meta.date || schema.datePublished,
    };
    Object.keys(data).forEach((k) => (data[k] == null || data[k] === '') && delete data[k]);

    let script = $('#ld-json');
    if (!script) { script = doc.createElement('script'); script.id = 'ld-json'; script.type = 'application/ld+json'; doc.head.appendChild(script); }
    script.textContent = JSON.stringify(data);
  }

  /* ------------------------------------------------------------------ */
  /* Comments (giscus)                                                  */
  /* ------------------------------------------------------------------ */
  const giscusTheme = () => `https://roozegaar.ir/css/giscus-theme-${RZ.theme}.css`;

  function giscusMessage(config) {
    const frame = $('iframe.giscus-frame');
    if (!frame) return false;
    frame.contentWindow.postMessage({ giscus: { setConfig: config } }, 'https://giscus.app');
    return true;
  }

  function loadGiscus(slug, lang) {
    const box = $('#comments');
    if (!box) return;
    if (giscusMessage({ lang, theme: giscusTheme() })) return;
    if ($('script[src*="giscus.app"]', box)) return;

    const loading = $('#giscus-loading');
    const s = doc.createElement('script');
    s.src = 'https://giscus.app/client.js';
    s.async = true;
    s.crossOrigin = 'anonymous';
    Object.entries({
      'data-repo': 'roozegaar/roozegaar.github.io',
      'data-repo-id': 'R_kgDOP6luHw',
      'data-category': 'Q&A',
      'data-category-id': 'DIC_kwDOP6luH84CwZKt',
      'data-mapping': 'specific',
      'data-term': slug,
      'data-strict': '0',
      'data-reactions-enabled': '1',
      'data-emit-metadata': '0',
      'data-input-position': 'bottom',
      'data-theme': giscusTheme(),
      'data-lang': lang,
      'data-loading': 'lazy',
    }).forEach(([k, v]) => s.setAttribute(k, v));
    s.onload = () => { if (loading) setTimeout(() => (loading.style.display = 'none'), 1200); };
    s.onerror = () => { if (loading) loading.textContent = lang === 'fa' ? '❌ بارگذاری دیدگاه‌ها با خطا مواجه شد!' : '❌ Failed to load comments!'; };
    box.appendChild(s);
  }

  /* ------------------------------------------------------------------ */
  /* Theme                                                              */
  /* ------------------------------------------------------------------ */
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch {}
    const meta = $('#themeColor');
    if (meta) meta.content = THEME_COLORS[theme];
    emit('rz:themechange', { theme });
    giscusMessage({ theme: giscusTheme() });
  }

  // Circular reveal that expands from the toggle button.
  function toggleTheme(origin) {
    const next = RZ.theme === 'dark' ? 'light' : 'dark';
    if (!doc.startViewTransition || reduceMotion()) { applyTheme(next); return; }

    const r = origin.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    const transition = doc.startViewTransition(() => applyTheme(next));
    transition.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 800, easing: 'cubic-bezier(0.65, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {});
  }

  /* ------------------------------------------------------------------ */
  /* Language                                                           */
  /* ------------------------------------------------------------------ */
  async function setLang(lang, { persist = true } = {}) {
    root.lang = lang;
    root.dir = lang === 'fa' ? 'rtl' : 'ltr';
    if (persist) { try { localStorage.setItem('language', lang); } catch {} }
    dict = await getDict(lang);
    await renderAll();
    emit('rz:langchange', { lang });
  }

  async function renderAll() {
    applyI18n();
    if (!currentProject) doc.title = dict.title || doc.title;
    await Promise.all([renderHeader(), renderFooter(), renderTimeline(), renderFeatures(), renderProject()]);
    applyI18n();
    renderSiteVersion();
    firstRender = false;
    emit('rz:render');
  }

  /* ------------------------------------------------------------------ */
  /* Header interactions                                                */
  /* ------------------------------------------------------------------ */
  function bindHeader() {
    const header = $('.site-header');
    if (!header) return;
    const menuBtn = $('.mobile-menu-btn', header);

    const closeMenu = () => { header.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', 'false'); };
    menuBtn.addEventListener('click', () => {
      const open = header.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    doc.addEventListener('click', (e) => { if (!e.target.closest('.site-header')) closeMenu(); });
    doc.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    addEventListener('resize', () => { if (innerWidth > 860) closeMenu(); });

    $('.theme-toggle', header).addEventListener('click', (e) => toggleTheme(e.currentTarget));
    $('.lang-toggle', header).addEventListener('click', () => setLang(RZ.lang === 'fa' ? 'en' : 'fa'));

    // In-page anchors scroll smoothly without touching the URL.
    doc.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
      closeMenu();
    });

    // The logo scrolls to the top when already on the home page.
    $('.logo', header).addEventListener('click', (e) => {
      if (doc.body.dataset.page === 'home') { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); closeMenu(); }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                               */
  /* ------------------------------------------------------------------ */
  async function boot() {
    const hash = location.hash.slice(1).toLowerCase();
    const lang = hash === 'fa' || hash === 'en' ? hash : RZ.lang;
    const persist = hash === 'fa' || hash === 'en';

    const theme = RZ.theme;
    const meta = $('#themeColor');
    if (meta) meta.content = THEME_COLORS[theme];

    root.lang = lang;
    root.dir = lang === 'fa' ? 'rtl' : 'ltr';
    if (persist) { try { localStorage.setItem('language', lang); } catch {} }

    dict = await getDict(lang);
    await loadComponents();
    bindHeader();
    await renderAll();

    resolveReady();
    emit('rz:ready');
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
