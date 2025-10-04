/*
  ----------------------------------------------------------------------------
  © 2025 Mehdi Dimyadi
  Roozegaar Apps Collection
  All rights reserved.

  Author: Mehdi Dimyadi
  GitHub: https://github.com/MEHDIMYADI

  Description:
  This file is part of the Roozegaar Apps projects, including web, JSON,
  CSS, and JavaScript files. You may use, modify, and distribute this code
  in accordance with the project license.

  ----------------------------------------------------------------------------
*/
document.addEventListener('DOMContentLoaded', () => {
    loadAllComponents();
});

async function loadAllComponents() {
    const components = [{
        id: 'header',
        url: 'components/header.html'
    }, {
        id: 'apps',
        url: 'components/apps.html'
    }, {
        id: 'features',
        url: 'components/features.html'
    }, {
        id: 'footer',
        url: 'components/footer.html'
    }];

    let progress = 0;
    const step = 100 / components.length;

    for (const c of components) {
        await loadComponent(c.id, c.url);
        progress += step;
        updateProgressBar(progress);
    }

    updateProgressBar(100);
    initPage();
}

function loadComponent(id, url) {
    return fetch(url)
        .then(res => res.text())
        .then(html => {
            document.getElementById(id).innerHTML = html;
        });
}

function initPage() {
    const langToggle = document.querySelector('.lang-toggle');
    const htmlElement = document.documentElement;
    let currentLang = 'en';

    // Check the saved language
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
        currentLang = savedLang;
        htmlElement.lang = currentLang;
        htmlElement.dir = currentLang === 'fa' ? 'rtl' : 'ltr';
    }

    updateLangToggle();
    loadTranslations(currentLang);
    waitForElement('#appsGrid').then(() => {
        loadApps(currentLang);
    });
    waitForElement('#features').then(() => {
        loadFeatures(currentLang);
    });
    updateCopyright(currentLang);

    const themeToggle = document.querySelector('.theme-toggle');
    const themeIcon = themeToggle.querySelector('i');

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcon('dark');
    }

    // Change theme
    langToggle.addEventListener('click', function() {
        currentLang = currentLang === 'fa' ? 'en' : 'fa';
        htmlElement.lang = currentLang;
        htmlElement.dir = currentLang === 'fa' ? 'rtl' : 'ltr';
        localStorage.setItem('language', currentLang);
        updateLangToggle();
        loadTranslations(currentLang);
        loadApps(currentLang);
        loadFeatures(currentLang);
        updateCopyright(currentLang);
    });

    // Change theme
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    // Mobile menu
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
    });

    // Images modal
    const appImages = document.querySelectorAll('.app-image');
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const closeModal = document.querySelector('.close-modal');

    appImages.forEach(image => {
        image.addEventListener('click', function() {
            modal.style.display = 'flex';
            modalImage.src = this.src;
            modalImage.alt = this.alt;
        });
    });

    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.style.display = 'none';
    });

    function updateLangToggle() {
        const langText = langToggle.querySelector('span');
        langText.textContent = currentLang === 'fa' ? 'EN' : 'FA';
    }

    function updateThemeIcon(theme) {
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    function loadTranslations(lang) {
        fetch(`lang/${lang}.json`)
            .then(response => response.json())
            .then(data => {
                document.querySelectorAll('[data-i18n]').forEach(el => {
                    const key = el.getAttribute('data-i18n');
                    if (data[key]) {
                        const span = el.querySelector('span');
                        if (span) {
                            span.textContent = data[key];
                        } else {
                            el.textContent = data[key];
                        }
                    }

                    // tooltip
                    const tooltipKey = el.getAttribute('data-i18n-tooltip');
                    if (tooltipKey && data[tooltipKey]) {
                        el.title = data[tooltipKey];
                    }
                });

            })
            .catch(err => console.error('Error loading translation:', err));
    }

    async function fetchLatestRelease(repo) {
        // repo = "username/repo" e.g. "octocat/Hello-World"
        try {
            const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
            if (!res.ok) throw new Error('خطا در گرفتن ریلیز');
            const data = await res.json();
            return data.tag_name;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    async function loadApps(lang) {
        try {
            const appsRes = await fetch('data/apps.json');
            const data = await appsRes.json();
            const translations = data.translations;
            const apps = data.apps;

            const appsGrid = document.getElementById('appsGrid');
            if (!appsGrid) return console.error('appsGrid پیدا نشد');
            appsGrid.innerHTML = '';

            for (let app of apps) {
                const card = document.createElement('div');
                card.className = 'app-card';
                card.innerHTML = `
                <img src="${app.image}" alt="${app.title[lang]}" class="app-image">
                <div class="app-content">
                    <h3 class="app-title">${app.title[lang]}</h3>
                    <p class="app-description">${app.desc[lang]}</p>
                    <ul class="app-features">
                        ${app.features.map(f => `<li>${f[lang]}</li>`).join('')}
                    </ul>
                    <div class="download-info">
                        <span class="app-version">
                            <span data-i18n="version">${translations.version[lang]}</span>: 
                            <span class="ver-text">...</span>
                        </span>
                        <a href="${app.details_link}" class="download-btn" title="${translations.learn_more_tooltip[lang]}">
                            <i class="fas fa-info-circle"></i>
                        </a>
                        <a href="${app.download_link}" class="download-btn" title="${translations.download_tooltip[lang]}">
                            <i class="fas fa-download"></i>
                        </a>
                    </div>
                </div>
            `;
            appsGrid.appendChild(card);

            if (app.repo) {
                fetchLatestRelease(app.repo)
                    .then(latestTag => {
                        const versionText = latestTag ? latestTag.replace(/^v/, '') : '—';
                        const verEl = card.querySelector('.ver-text');
                        if (verEl) verEl.textContent = versionText;
                    })
                    .catch(() => {
                        const verEl = card.querySelector('.ver-text');
                        if (verEl) verEl.textContent = '—';
                    });
            } else {
                const verEl = card.querySelector('.ver-text');
                if (verEl) verEl.textContent = app.version || '—';
            }
        }
    } catch (err) {
        console.error('Error loading apps:', err);
    }
}

document.querySelectorAll('a[href^="#"], .hero .cta-button').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const targetSelector = link.getAttribute('href');
        const target = document.querySelector(targetSelector);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});
}

function loadFeatures(lang) {
    fetch('data/features.json')
        .then(res => res.json())
        .then(data => {
            const featuresContainer = document.querySelector('.features');
            if (!featuresContainer) return console.error('features container پیدا نشد');
            featuresContainer.innerHTML = '';

            data.features.forEach(f => {
                const card = document.createElement('div');
                card.className = 'feature-card';
                card.innerHTML = `
                    <div class="feature-icon">
                        <i class="${f.icon}"></i>
                    </div>
                    <h3 class="feature-title">${f.title[lang]}</h3>
                    <p class="feature-description">${f.desc[lang]}</p>
                `;
                featuresContainer.appendChild(card);
            });
        })
        .catch(err => console.error('Error loading features:', err));
}

function waitForElement(selector) {
    return new Promise(resolve => {
        const el = document.querySelector(selector);
        if (el) return resolve(el);
        const observer = new MutationObserver(() => {
            const elNow = document.querySelector(selector);
            if (elNow) {
                observer.disconnect();
                resolve(elNow);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });
}

function updateProgressBar(percent) {
    const bar = document.getElementById('progress-bar');
    if (!bar) return;
    bar.style.width = percent + '%';
    if (percent >= 100) {
        setTimeout(() => {
            bar.style.opacity = '0';
            setTimeout(() => {
                bar.style.width = '0%';
                bar.style.opacity = '1';
            }, 400);
        }, 300);
    }
}

function updateCopyright(lang) {
    const p = document.getElementById('footer-copyright');
    if(!p) return;

    const now = new Date();
    let yearText = '';

    if(lang === 'fa') {
        const jYear = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate()).jy;
        yearText = jYear;
    } else {
        yearText = now.getFullYear();
    }

    const baseText = lang === 'fa' 
        ? "روزگار، همه حقوق محفوظ" 
        : "Roozegaar, all rights reserved";
    p.textContent = `${baseText} © ${yearText}`;
}

function toJalali(gy, gm, gd) {
    const g_d_m = [0,31,59,90,120,151,181,212,243,273,304,334];
    let gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = 355666 + (365 * gy) + Math.floor((gy2 + 3)/4) - Math.floor((gy2 + 99)/100) + Math.floor((gy2 + 399)/400) + gd + g_d_m[gm-1];
    let jy = -1595 + (33 * Math.floor(days/12053));
    days %= 12053;
    jy += 4 * Math.floor(days/1461);
    days %= 1461;
    if(days > 365){
        jy += Math.floor((days-1)/365);
        days = (days-1)%365;
    }
    let jm = (days < 186) ? 1 + Math.floor(days/31) : 7 + Math.floor((days-186)/30);
    let jd = 1 + ((days < 186) ? (days%31) : ((days-186)%30));
    return { jy, jm, jd };
}