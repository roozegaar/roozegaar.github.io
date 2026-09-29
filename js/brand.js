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

  brand.js — Roozegaar brand identity behavior (homepage hero only)
  Load after enhance.js:
    <script src="js/brand.js"></script>
  Does not modify main.js or enhance.js; only adds elements inside .intro.
*/

document.addEventListener('DOMContentLoaded', () => {
    waitForIntro().then((container) => {
        injectHeroIcons(container);
        injectHeroClock(container);
        injectTypewriter(container);
        watchLangChanges();
    });
});

function waitForIntro() {
    return new Promise((resolve) => {
        const el = document.querySelector('.intro .container');
        if (el) return resolve(el);
        const mo = new MutationObserver(() => {
            const found = document.querySelector('.intro .container');
            if (found) { mo.disconnect(); resolve(found); }
        });
        mo.observe(document.body, { childList: true, subtree: true });
    });
}

/* ---------- Floating icons for the real product lineup ---------- */
function injectHeroIcons(container) {
    const intro = container.closest('.intro');
    if (!intro || intro.querySelector('.hero-icons')) return;

    const wrap = document.createElement('div');
    wrap.className = 'hero-icons';

    const icons = [
        'fa-solid fa-calendar-days',
        'fa-solid fa-sack-dollar',
        'fa-solid fa-microphone-lines',
        'fa-solid fa-shield-halved',
        'fa-solid fa-file-excel',
    ];
    const positions = [
        { top: '12%', left: '8%' }, { top: '70%', left: '12%' },
        { top: '20%', left: '85%' }, { top: '75%', left: '88%' },
        { top: '45%', left: '50%' },
    ];

    icons.forEach((cls, i) => {
        const el = document.createElement('i');
        el.className = cls;
        const pos = positions[i] || { top: '50%', left: '50%' };
        el.style.top = pos.top;
        el.style.left = pos.left;
        el.style.setProperty('--dx', `${(Math.random() * 24 - 12).toFixed(0)}px`);
        el.style.setProperty('--dy', `${(Math.random() * 24 - 12).toFixed(0)}px`);
        el.style.setProperty('--dr', `${(Math.random() * 10 - 5).toFixed(0)}deg`);
        el.style.animationDuration = `${6 + Math.random() * 4}s`;
        el.style.animationDelay = `${(Math.random() * 2).toFixed(2)}s`;
        wrap.appendChild(el);
    });

    intro.insertBefore(wrap, intro.firstChild);

    // Gentle mouse-parallax on the floating icons
    intro.addEventListener('mousemove', (e) => {
        const rect = intro.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        wrap.style.transform = `translate(${px * 14}px, ${py * 14}px)`;
    });
    intro.addEventListener('mouseleave', () => {
        wrap.style.transform = 'translate(0, 0)';
    });
}

/* ---------- Live clock / date badge ---------- */
let clockTimer = null;

// Built once and reused every tick — the browser's own ICU engine handles
// the Persian calendar (including leap years) accurately, with no extra
// custom math needed on every interval.
const jalaliDateFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

function formatJalaliDate(now) {
    const parts = jalaliDateFormatter.formatToParts(now);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return `${map.weekday} ${map.day} ${map.month} ${map.year}`;
}

function injectHeroClock(container) {
    // Positioned as an absolute corner badge on .intro itself, not inline
    // with the hero text, so it sits in the bottom corner (see CSS).
    const intro = container.closest('.intro');
    if (!intro) return;

    let clock = intro.querySelector('.hero-clock');
    if (!clock) {
        clock = document.createElement('div');
        clock.className = 'hero-clock';
        // dir="ltr" on .hc-time prevents the RTL bidi algorithm from
        // reordering the H/M/S number runs inside an RTL (fa) page.
        clock.innerHTML = `
      <span class="hc-date"></span>
      <span class="hc-time" dir="ltr">
        <span class="hc-digit" data-p="h">00</span><span class="hc-sep">:</span>
        <span class="hc-digit" data-p="m">00</span><span class="hc-sep">:</span>
        <span class="hc-digit" data-p="s">00</span>
      </span>
    `;
        intro.appendChild(clock);
    }

    if (clockTimer) clearInterval(clockTimer);
    tickClock(clock);
    clockTimer = setInterval(() => tickClock(clock), 1000);
}

function tickClock(clock) {
    if (!clock) return;
    const lang = document.documentElement.lang === 'fa' ? 'fa' : 'en';
    const now = new Date();

    const dateEl = clock.querySelector('.hc-date');
    const hEl = clock.querySelector('[data-p="h"]');
    const mEl = clock.querySelector('[data-p="m"]');
    const sEl = clock.querySelector('[data-p="s"]');

    const hh = pad2(now.getHours());
    const mm = pad2(now.getMinutes());
    const ss = pad2(now.getSeconds());

    if (sEl.textContent !== (lang === 'fa' ? toFa(ss) : ss)) {
        sEl.classList.remove('tick');
        void sEl.offsetWidth; // restart the CSS animation
        sEl.classList.add('tick');
    }

    if (lang === 'fa') {
        dateEl.textContent = formatJalaliDate(now);
        hEl.textContent = toFa(hh);
        mEl.textContent = toFa(mm);
        sEl.textContent = toFa(ss);
    } else {
        const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = now.toLocaleDateString('en-US', opts);
        hEl.textContent = hh;
        mEl.textContent = mm;
        sEl.textContent = ss;
    }
}

function pad2(n) { return n < 10 ? `0${n}` : `${n}`; }

function toFa(input) {
    const map = { '0':'۰','1':'۱','2':'۲','3':'۳','4':'۴','5':'۵','6':'۶','7':'۷','8':'۸','9':'۹' };
    return String(input).replace(/[0-9]/g, (d) => map[d]);
}

/* ---------- Rotating typewriter tagline, sourced live from projects.json ---------- */

// Small built-in safety net, used only if data/projects.json can't be fetched.
const FALLBACK_TAGLINES = {
    fa: ['مجموعه‌ای از ابزارهای کاربردی روزگار', 'ساده، سریع، قابل‌اعتماد'],
    en: ['A collection of useful Roozegaar tools', 'Simple, fast, reliable'],
};

let projectsDataCache = null;
const taglinesCache = { fa: null, en: null };

async function getProjectTaglines(lang) {
    if (taglinesCache[lang]) return taglinesCache[lang];

    if (!projectsDataCache) {
        try {
            const res = await fetch('data/projects.json');
            projectsDataCache = await res.json();
        } catch (err) {
            console.warn('getProjectTaglines: failed to load projects.json —', err.message);
            return FALLBACK_TAGLINES[lang];
        }
    }

    const projects = (projectsDataCache.projects || []).filter(p => p.publish !== 'false');

    // Pick one random feature line (or fall back to the title) per project,
    // so the tagline pool reflects real, current project content.
    const lines = projects
        .map((p) => {
            const features = p.features || [];
            const pick = features.length
                ? features[Math.floor(Math.random() * features.length)]
                : p.title;
            return pick?.[lang] || pick?.fa || '';
        })
        .filter(Boolean);

    // Shuffle (Fisher–Yates) so the order is different on every page load.
    for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lines[i], lines[j]] = [lines[j], lines[i]];
    }

    taglinesCache[lang] = lines.length ? lines : FALLBACK_TAGLINES[lang];
    return taglinesCache[lang];
}

let twTimer = null;

function injectTypewriter(container) {
    const intro = container.closest('.intro');
    if (!intro) return;

    if (intro.querySelector('.hero-typewriters')) return;

    const wrap = document.createElement('div');
    wrap.className = 'hero-typewriters';

    const positions = [
        { top: '18%', left: '17%' },
        { top: '38%', left: '78%' },
        { top: '68%', left: '18%' },
        { top: '76%', left: '72%' },
    ];

    positions.forEach((pos, index) => {
        const item = document.createElement('div');
        item.className = 'hero-typewriter';
        item.dataset.index = index;

        item.style.top = pos.top;
        item.style.left = pos.left;

        item.style.setProperty(
            '--float-x',
            `${(Math.random() * 16 - 8).toFixed(0)}px`
        );

        item.style.setProperty(
            '--float-y',
            `${(Math.random() * 16 - 8).toFixed(0)}px`
        );

        item.style.animationDelay = `${(Math.random() * 2).toFixed(2)}s`;

        item.innerHTML = `
            <span class="typewriter-text"></span>
            <span class="typewriter-cursor"></span>
        `;

        wrap.appendChild(item);
    });

    intro.insertBefore(wrap, intro.firstChild);

    runMultipleTypewriters(intro);
}

let twTimers = [];

async function runMultipleTypewriters(intro) {
    twTimers.forEach(clearTimeout);
    twTimers = [];

    const lang = document.documentElement.lang === 'fa' ? 'fa' : 'en';
    const lines = await getProjectTaglines(lang);

    const items = [...intro.querySelectorAll('.hero-typewriter')];

    if (!items.length || !lines.length) return;

    items.forEach((item, index) => {
        const textEl = item.querySelector('.typewriter-text');
        if (!textEl) return;

        let lineIndex = (index * 2) % lines.length;
        let charIndex = 0;
        let deleting = false;

        setTimeout(() => {
            function step() {
                const full = lines[lineIndex] || '';

                if (!deleting) {
                    charIndex++;
                    textEl.textContent = full.slice(0, charIndex);

                    if (charIndex >= full.length) {
                        deleting = true;

                        const timer = setTimeout(step, 4500);
                        twTimers.push(timer);
                        return;
                    }
                } else {
                    charIndex--;
                    textEl.textContent = full.slice(0, charIndex);

                    if (charIndex <= 0) {
                        deleting = false;
                        lineIndex = (lineIndex + 1) % lines.length;
                    }
                }

                const speed = deleting
                    ? 28 + Math.random() * 20
                    : 45 + Math.random() * 35;

                const timer = setTimeout(step, speed);
                twTimers.push(timer);
            }

            step();
        }, index * 900);
    });
}

/* ---------- Keep everything in sync when the language toggle is used ---------- */
function watchLangChanges() {
    const htmlEl = document.documentElement;
    let lastLang = htmlEl.lang;
    const mo = new MutationObserver(() => {
        if (htmlEl.lang !== lastLang) {
            lastLang = htmlEl.lang;
            const container = document.querySelector('.intro .container');
            if (container) {
                const intro = container.closest('.intro');
                tickClock(intro?.querySelector('.hero-clock'));
                runMultipleTypewriters(container.closest('.intro'));
            }
        }
    });
    mo.observe(htmlEl, { attributes: true, attributeFilter: ['lang'] });
}
