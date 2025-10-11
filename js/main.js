/*
  ----------------------------------------------------------------------------
  © 2025 Mehdi Dimyadi
  Roozegaar Projects Collection
  All rights reserved.

  Author: Mehdi Dimyadi
  GitHub: https://github.com/MEHDIMYADI

  Description:
  This file is part of the Roozegaar Projects, including web, JSON,
  CSS, and JavaScript files. You may use, modify, and distribute this code
  in accordance with the project license.

  ----------------------------------------------------------------------------
*/

document.addEventListener('DOMContentLoaded', () => {
    const htmlEl = document.documentElement;
    
    const hash = window.location.hash.replace('#', '').toLowerCase();
    const isLangHash = hash === 'fa' || hash === 'en';

    const currentLang = isLangHash
        ? hash
        : localStorage.getItem('language') || 'en';
        
    htmlEl.lang = currentLang;
    htmlEl.dir = currentLang === 'fa' ? 'rtl' : 'ltr';

    if (isLangHash) localStorage.setItem('language', currentLang);

    loadAllComponents();
});

async function fetchLatestRelease(repo) {
    const tagsUrl = `https://api.github.com/repos/${repo}/tags`;
    const releasesUrl = `https://api.github.com/repos/${repo}/releases/latest`;

    try {
        const res = await fetch(tagsUrl);
        if (res.ok) {
            const data = await res.json();
            if (data && data.length) return data[0].name || null;
        }
    } catch (err) {
        console.warn(`fetchLatestRelease(tags) ${repo} →`, err.message);
    }

    try {
        const res = await fetch(releasesUrl);
        if (res.ok) {
            const data = await res.json();
            return data.tag_name || null;
        }
    } catch (err) {
        console.warn(`fetchLatestRelease(releases) ${repo} →`, err.message);
    }

    return null;
}

async function loadFooterLinks(lang = 'en', section = 'main', ulId = 'footer-links') {
    try {
        const res = await fetch('data/footer.json');
        const data = await res.json();
        const links = data.quick_links[section];

        const ul = document.getElementById(ulId);
        if (!ul || !links) return;

        ul.innerHTML = '';

        links.forEach(link => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = link.href;
            a.textContent = link.text[lang] || link.text['en'];
            li.appendChild(a);
            ul.appendChild(li);
        });
    } catch (err) {
        console.error('Error loading footer links:', err);
    }
}

async function loadAllComponents() {
  const components = [];

  if (document.getElementById('header')) 
    components.push({ id: 'header', url: 'components/header.html' });

  if (document.getElementById('projects')) 
    components.push({ id: 'projects', url: 'components/projects.html' });

  if (document.getElementById('project')) 
    components.push({ id: 'project', url: 'components/project.html' });

  if (document.getElementById('features')) 
    components.push({ id: 'features', url: 'components/features.html' });

  if (document.getElementById('footer')) 
    components.push({ id: 'footer', url: 'components/footer.html' });

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

    const savedLang = localStorage.getItem('language');
    if (savedLang) {
        currentLang = savedLang;
        htmlElement.lang = currentLang;
        htmlElement.dir = currentLang === 'fa' ? 'rtl' : 'ltr';
    }
    
    const headerSection = document.body.dataset.headerSection || 'main';
    const projectSection = document.body.dataset.projectSection;
        
    updateLangToggle();
    loadTranslations(currentLang);
    loadHeader(currentLang, headerSection);
    waitForElement('#projectsGrid').then(() => {
        loadProjects(currentLang);
    });
    waitForElement('#features').then(() => {
        loadFeatures(currentLang);
    });
    
    loadProject(projectSection, currentLang);
    
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

    loadGiscus(currentLang);
    
    langToggle.addEventListener('click', function() {
        currentLang = currentLang === 'fa' ? 'en' : 'fa';
        htmlElement.lang = currentLang;
        htmlElement.dir = currentLang === 'fa' ? 'rtl' : 'ltr';
        localStorage.setItem('language', currentLang);        
        updateLangToggle();
        loadTranslations(currentLang);
        loadHeader(currentLang, headerSection);
        loadProjects(currentLang);
        loadFeatures(currentLang);
        loadProject(projectSection, currentLang);
        
        loadGiscus(currentLang);

        updateCopyright(currentLang);
    });

    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        loadGiscus(currentLang);
    });

    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
    });

    const projectImages = document.querySelectorAll('.project-image');
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const closeModal = document.querySelector('.close-modal');

    projectImages.forEach(image => {
        image.addEventListener('click', function() {
            modal.style.display = 'flex';
            modalImage.src = this.src;
            modalImage.alt = this.alt;
        });
    });

    closeModal?.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    modal?.addEventListener('click', function(e) {
        if (e.target === modal) modal.style.display = 'none';
    });

    function updateLangToggle() {
        const langText = langToggle.querySelector('span');
        langText.textContent = currentLang === 'fa' ? 'EN' : 'فا';
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

                    const tooltipKey = el.getAttribute('data-i18n-tooltip');
                    if (tooltipKey && data[tooltipKey]) {
                        el.title = data[tooltipKey];
                    }
                });

            })
            .catch(err => console.error('Error loading translation:', err));
    }

    async function loadProjects(lang) {
        const projectsGrid = document.getElementById('projectsGrid');
        if (!projectsGrid) {
            console.warn('No projects section provided, skipping projects list load');
            return;
        }
      
        try {
            const projectsRes = await fetch('data/projects.json');
            const data = await projectsRes.json();
            const translations = data.translations;
            const projects = data.projects;

            projectsGrid.innerHTML = '';

            for (let project of projects) {
                const card = document.createElement('div');
                card.className = 'project-card';
                card.innerHTML = `
                <div class="ribbon"><span>${project.platform[lang]}</span></div>
                <a href="${project.overview_link}"><img class="project-image" src="${project.image}" alt="${project.title[lang]}"></a>
                <div class="project-content">
                    <h3 class="project-title">${project.title[lang]}</h3>
                    <p class="project-description">${project.desc[lang]}</p>
                    <ul class="project-features">
                        ${project.features.map(f => `<li>${f[lang]}</li>`).join('')}
                    </ul>
                    <div class="download-info">
                        <span class="project-version">
                            <span data-i18n="version">${translations.version[lang]}</span>: 
                            <span class="ver-text">...</span>
                        </span>
                        <a href="${project.overview_link}" class="download-btn" title="${translations.overview_tooltip[lang]}">
                            <i class="fas fa-file-lines"></i>
                        </a>
                        <a href="${project.details_link}" class="download-btn" title="${translations.learn_more_tooltip[lang]}">
                            <i class="fas fa-info-circle"></i>
                        </a>
                        <a href="${project.download_link}" class="download-btn" title="${translations.download_tooltip[lang]}">
                            <i class="fas fa-download"></i>
                        </a>
                    </div>
                </div>
            `;
            projectsGrid.appendChild(card);

            if (project.repo) {
                fetchLatestRelease(project.repo)
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
                if (verEl) verEl.textContent = project.version || '—';
            }
        }
            
            loadFooterLinks(lang, 'main');
    } catch (err) {
        console.error('Error loading projects:', err);
    }
}

document.querySelectorAll('a[href^="#"], .intro .cta-button').forEach(link => {
    if (link.classList.contains('logo')) return;
    link.addEventListener('click', e => {
        e.preventDefault();
        const targetSelector = link.getAttribute('href');
        const target = document.querySelector(targetSelector);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});
}

async function loadHeader(lang = 'fa', section = 'main') {
  try {
    const res = await fetch('data/header.json');
    const data = await res.json();
    const sectionData = data[section];
    const header = document.querySelector('header');
    if (!header || !sectionData) return;

    const logo = header.querySelector('.logo');
    logo.textContent = sectionData.title[lang];
    logo.href = 'index.html';

    const navLinks = header.querySelector('.nav-links');
    navLinks.innerHTML = '';
    sectionData.links.forEach(link => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.textContent = link[lang];
      a.href = link.href;
      li.appendChild(a);
      navLinks.appendChild(li);
    });
    
    requestAnimationFrame(() => {
      setupHeaderScrollEffect(header);
    });
  } catch (err) {
    console.error('Error loading header.json:', err);
  }
}

function setupHeaderScrollEffect(header) {
  if (!header) return;
  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  handleScroll();
  window.addEventListener('scroll', handleScroll);
}

async function loadProject(section, lang = 'fa') {
    if (!section || section === 'undefined') {
        console.warn('No project section provided, skipping project details load');
        return;
    }
  
    try {
        const res = await fetch(`page/${section}.json`);
        if (!res.ok) throw new Error('Failed to load JSON');
        const project = await res.json();

        if (!project) return;

        const t = project.translations || {};

        document.title = project.title[lang];

        const titleEl = document.getElementById('project-title');
        if (titleEl) titleEl.textContent = project.title[lang];

        const sectionTitle = document.getElementById('section-title');
        if (sectionTitle) sectionTitle.textContent = project.title[lang];
        
        const sectionScreenshots = document.getElementById('screenshots');
        if (sectionScreenshots) sectionScreenshots.textContent = t.screenshots_title[lang];
    
        const sectionComment = document.getElementById('comment');
        if (sectionComment) sectionComment.textContent = t.comments_title[lang];
        
        const descContainer = document.getElementById('project-description');
        if (descContainer) {
            descContainer.innerHTML = '';
            project.description[lang].forEach(p => {
                const para = document.createElement('p');
                para.textContent = p;
                para.style.textAlign = 'justify';
                para.style.lineHeight = '1.8';
                para.style.marginBottom = '14px';
                para.style.direction = (lang === 'fa') ? 'rtl' : 'ltr';
                descContainer.appendChild(para);
            });
        }

        const featuresEl = document.getElementById('project-features');
        if (featuresEl) {
            featuresEl.innerHTML = '';
            project.features.forEach(f => {
                const li = document.createElement('li');
                li.textContent = f[lang];
                featuresEl.appendChild(li);
            });
        }
        
        const verEl = document.getElementById('version');
        const verTextEl = document.getElementById('project-version-text');
        const downloadBtn = document.getElementById('download-btn');
        const repoBtn = document.getElementById('repo-btn');
        const icon = document.getElementById('icon');
        
        if (verEl) {
           verEl.textContent = t.version[lang];
        }
        
        if (downloadBtn) {
            downloadBtn.href = project.download_link;
            downloadBtn.title = t.download_tooltip[lang];
        }

        if (repoBtn) {
            repoBtn.href = project.repo_link;
            repoBtn.title = t.learn_more_tooltip[lang];
        }
        
        if (icon) {
            icon.src = project.icon;
            icon.alt = project.title[lang] || 'ROOZEGAAR';
        }        

        const gallery = document.getElementById('project-screenshots');
        if (gallery) {
            gallery.innerHTML = '';
            const screenshots = (project.screenshots && project.screenshots[lang]) ? project.screenshots[lang] : [];
            screenshots.forEach(img => {
                const thumb = document.createElement('img');
                thumb.src = img;
                thumb.alt = project.title[lang] || 'ROOZEGAAR';;
                thumb.style.cursor = 'pointer';
                thumb.addEventListener('click', () => openModal(img));
                gallery.appendChild(thumb);
            });
        }
        
        if (project.repo) {
            try {
                const latestTag = await fetchLatestRelease(project.repo);
                const versionText = latestTag ? latestTag.replace(/^v/, '') : '—';
                if (verTextEl) verTextEl.textContent = versionText;
            } catch (err) {
                if (verTextEl) verTextEl.textContent = '—';
            }
        } else {
            if (verTextEl) verTextEl.textContent = project.version || '—';
        }
        
        loadFooterLinks(lang, 'project');

    } catch (err) {
        console.error('Error loading project details:', err);
    }
}

function openModal(src) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    modalImage.src = src;
    modal.style.display = 'flex';
}

document.querySelector('.close-modal')?.addEventListener('click', () => {
    document.getElementById('imageModal').style.display = 'none';
});

document.getElementById('imageModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'imageModal') {
        e.currentTarget.style.display = 'none';
    }
});

function loadFeatures(lang) {
    fetch('data/features.json')
        .then(res => res.json())
        .then(data => {
            const featuresContainer = document.querySelector('.features');
            if (!featuresContainer) return console.warn('Features container not found!');
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

function loadGiscus(giscusLang) {
    const container = document.getElementById('comments');
    if (!container) return;

    const oldGiscus = container.querySelector('iframe.giscus-frame');
    if (oldGiscus) oldGiscus.remove();
    const oldScript = container.querySelector('script[src*="giscus.app"]');
    if (oldScript) oldScript.remove();

    const loadingElement = document.getElementById('giscus-loading');
    const projectSection = document.body.dataset.projectSection || 'main';
    //const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

    const script = document.createElement('script');
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", "roozegaar/roozegaar.github.io");
    script.setAttribute("data-repo-id", "R_kgDOP6luHw");
    script.setAttribute("data-category", "Q&A");
    script.setAttribute("data-category-id", "DIC_kwDOP6luH84CwZKt");
    script.setAttribute("data-mapping", "specific");
    script.setAttribute("data-term", projectSection);
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    //script.setAttribute("data-theme", currentTheme);
    script.setAttribute("data-theme", `https://roozegaar.github.io/css/giscus-theme-${theme}.css`);
    script.setAttribute("data-lang", giscusLang); 
    container.appendChild(script);

    const successMessage = giscusLang === 'fa' 
      ? "✅ دیدگاه‌ها با موفقیت بارگذاری شد!" 
      : "✅ Comments loaded successfully!";
    const errorMessage = giscusLang === 'fa' 
      ? "❌ بارگذاری دیدگاه‌ها با خطا مواجه شد!" 
      : "❌ Failed to load comments!";

    script.onload = () => {
      if (loadingElement) loadingElement.textContent = successMessage;
      setTimeout(() => {
       if (loadingElement) loadingElement.style.display = 'none';
      }, 10000);
    };

    script.onerror = (err) => {
      console.error("❌ Failed to load script:", err);
      if (loadingElement) loadingElement.textContent = errorMessage;
    };
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
        ? "کپی‌برداری از بخش یا کل مطالب روزگار تنها با کسب مجوز کتبی امکان‌پذیر است." 
        : "Copying any part or all of Roozegaar’s content is only permitted with written authorization.";
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
