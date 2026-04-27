(() => {
  'use strict';

  const STORAGE = {
    lang: 'ayemanebdr.lang',
    theme: 'ayemanebdr.theme',
  };

  const state = {
    lang: 'fr',
    dark: true,
    currentProjectId: null,
    lightbox: {
      open: false,
      items: [],
      index: 0,
    },
  };

  const byId = (id) => document.getElementById(id);
  const all = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const readStorage = (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  };

  const writeStorage = (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      // Local storage can be blocked; keep runtime behavior functional.
    }
  };

  const setBodyScrollLocked = (locked) => {
    document.body.style.overflow = locked ? 'hidden' : '';
  };

  function initCursor() {
    const cursor = byId('cursor');
    const ring = byId('cring');
    if (!window.matchMedia('(pointer:fine)').matches || !cursor || !ring) {
      return;
    }

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;

    document.addEventListener('mousemove', (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      cursor.style.left = mouseX + 'px';
      cursor.style.top = mouseY + 'px';
    });

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';
      requestAnimationFrame(animateRing);
    };
    animateRing();

    all('a,button,.pc,.tchip,.stag').forEach((element) => {
      element.addEventListener('mouseenter', () => {
        cursor.classList.add('hov');
        ring.classList.add('hov');
      });
      element.addEventListener('mouseleave', () => {
        cursor.classList.remove('hov');
        ring.classList.remove('hov');
      });
    });
  }

  function initNavScroll() {
    const nav = byId('nav');
    if (!nav) {
      return;
    }

    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function closeMobileMenu() {
    const ham = byId('ham');
    const menu = byId('mmenu');
    if (ham) {
      ham.classList.remove('open');
      ham.setAttribute('aria-expanded', 'false');
    }
    if (menu) {
      menu.classList.remove('open');
    }
    if (!state.currentProjectId && !state.lightbox.open) {
      setBodyScrollLocked(false);
    }
  }

  function initMobileMenu() {
    const ham = byId('ham');
    const menu = byId('mmenu');
    if (!ham || !menu) {
      return;
    }

    ham.setAttribute('aria-expanded', 'false');
    ham.addEventListener('click', () => {
      const isOpen = ham.classList.toggle('open');
      menu.classList.toggle('open', isOpen);
      ham.setAttribute('aria-expanded', String(isOpen));
      setBodyScrollLocked(isOpen);
    });

    all('[data-close-mobile-menu]', menu).forEach((link) => {
      link.addEventListener('click', closeMobileMenu);
    });

    // Kept for backward compatibility if some inline handlers remain.
    window.closeMM = closeMobileMenu;
  }

  function initRevealAnimations() {
    if (!('IntersectionObserver' in window)) {
      all('.rv, .pc').forEach((element) => element.classList.add('on'));
      return;
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('on');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );
    all('.rv').forEach((element) => revealObserver.observe(element));

    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('on');
          }
        });
      },
      { threshold: 0.06, rootMargin: '0px 0px -30px 0px' },
    );
    all('.pc').forEach((element) => cardObserver.observe(element));
  }

  function setLang(lang) {
    state.lang = lang === 'en' ? 'en' : 'fr';
    document.body.classList.toggle('en', state.lang === 'en');
    document.documentElement.lang = state.lang;

    all('#lang-btn, #m-lang-btn').forEach((button) => {
      button.textContent = state.lang === 'fr' ? 'EN' : 'FR';
    });

    const selectPrompt = byId('fopt');
    const selectOther = byId('fopt-other');
    const textarea = byId('ftextarea');

    if (selectPrompt) {
      selectPrompt.textContent =
        state.lang === 'fr' ? 'Sélectionnez un service' : 'Select a service';
    }
    if (selectOther) {
      selectOther.textContent = state.lang === 'fr' ? 'Autre' : 'Other';
    }
    if (textarea) {
      textarea.placeholder =
        state.lang === 'fr'
          ? 'Décrivez votre projet...'
          : 'Describe your project...';
    }

    writeStorage(STORAGE.lang, state.lang);
  }

  function initLanguage() {
    all('#lang-btn, #m-lang-btn').forEach((button) => {
      button.addEventListener('click', () => {
        setLang(state.lang === 'fr' ? 'en' : 'fr');
      });
    });

    const savedLang = readStorage(STORAGE.lang);
    setLang(savedLang === 'en' ? 'en' : 'fr');
  }

  function setTheme(isDark) {
    state.dark = Boolean(isDark);
    document.body.classList.toggle('light', !state.dark);

    all('#theme-btn, #m-theme-btn').forEach((button) => {
      button.textContent = state.dark ? '☀' : '☾';
    });

    writeStorage(STORAGE.theme, state.dark ? 'dark' : 'light');
  }

  function initTheme() {
    all('#theme-btn, #m-theme-btn').forEach((button) => {
      button.addEventListener('click', () => {
        setTheme(!state.dark);
      });
    });

    const savedTheme = readStorage(STORAGE.theme);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme === 'dark');
      return;
    }

    setTheme(true);
  }

  function initFilters() {
    const filterButtons = all('.fb');
    const cards = all('.pc');
    if (!filterButtons.length || !cards.length) {
      return;
    }

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        filterButtons.forEach((item) => item.classList.remove('on'));
        button.classList.add('on');

        const filter = button.dataset.filter || 'all';
        cards.forEach((card) => {
          const visible = filter === 'all' || card.dataset.cat === filter;
          card.style.display = visible ? '' : 'none';
        });
      });
    });
  }

  function animateCounter(element, target, duration) {
    const raw = element.dataset.target || '';
    const isPlus = raw.trim().startsWith('+');
    const suffix = element.dataset.suffix || '';
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) {
        startTime = timestamp;
      }

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);

      element.textContent = (isPlus ? '+' : '') + current + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = (isPlus ? '+' : '') + target + suffix;
      }
    };

    requestAnimationFrame(step);
  }

  function initCounters() {
    const counters = all('.stat-n');
    if (!counters.length) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      counters.forEach((counter) => {
        const raw = counter.textContent || '';
        const value = Number.parseInt(raw.replace(/\D/g, ''), 10);
        if (!Number.isNaN(value)) {
          counter.textContent = raw;
        }
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const counter = entry.target;
          if (!entry.isIntersecting || counter.classList.contains('counted')) {
            return;
          }

          counter.classList.add('counted');
          const raw = counter.dataset.target || counter.textContent || '';
          const value = Number.parseInt(raw.replace(/\D/g, ''), 10);
          if (Number.isNaN(value)) {
            return;
          }

          counter.dataset.target = raw;
          counter.dataset.suffix = raw.includes('%') ? '%' : '';
          animateCounter(counter, value, 1800);
        });
      },
      { threshold: 0.5 },
    );

    counters.forEach((counter) => {
      counter.dataset.target = counter.textContent || '';
      observer.observe(counter);
    });
  }

  function getProjectElement(projectId) {
    return byId('pp-' + projectId);
  }

  function openProjectPage(projectId, options = {}) {
    if (!projectId) {
      return;
    }

    const projectElement = getProjectElement(projectId);
    if (!projectElement) {
      return;
    }

    if (state.currentProjectId && state.currentProjectId !== projectId) {
      const current = getProjectElement(state.currentProjectId);
      if (current) {
        current.classList.remove('open');
      }
    }

    projectElement.classList.add('open');
    projectElement.scrollTop = 0;
    state.currentProjectId = projectId;
    setBodyScrollLocked(true);

    if (options.updateHistory !== false) {
      window.history.pushState({ pp: projectId }, '', '#project/' + projectId);
    }
  }

  function closeProjectPage(options = {}) {
    if (!state.currentProjectId) {
      return;
    }

    const projectElement = getProjectElement(state.currentProjectId);
    if (projectElement) {
      projectElement.classList.remove('open');
    }

    state.currentProjectId = null;
    if (!state.lightbox.open) {
      setBodyScrollLocked(false);
    }

    if (options.updateHistory !== false) {
      window.history.replaceState(
        {},
        '',
        window.location.pathname + window.location.search,
      );
    }

    if (options.scrollToWork !== false) {
      const work = byId('work');
      if (work) {
        work.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  function initProjectPages() {
    all('.pc').forEach((card) => {
      card.addEventListener('click', (event) => {
        if (event.target.closest('.pc-open-page')) {
          return;
        }
        openProjectPage(card.dataset.project);
      });
    });

    all('[data-open-project]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        openProjectPage(trigger.dataset.openProject);
      });
    });

    all('[data-close-project]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const isAnchor = trigger.tagName === 'A';
        const href = isAnchor ? trigger.getAttribute('href') || '' : '';
        const keepAnchorNav = href.startsWith('#') && href.length > 1;

        closeProjectPage({
          scrollToWork: !keepAnchorNav,
        });
      });
    });

    window.addEventListener('popstate', (event) => {
      const popProject = event.state && event.state.pp;
      if (popProject) {
        openProjectPage(popProject, { updateHistory: false });
        return;
      }

      closeProjectPage({
        updateHistory: false,
        scrollToWork: false,
      });
    });

    const hashMatch = window.location.hash.match(/^#project\/([a-z0-9-]+)$/i);
    if (hashMatch) {
      openProjectPage(hashMatch[1], { updateHistory: false });
    }

    // Keep compatibility with older HTML attributes.
    window.openProjectPage = (id) => openProjectPage(id);
    window.closeProjectPage = () => closeProjectPage();
  }

  function openLightbox(images, startIndex, overlay, imageElement) {
    if (!images.length) {
      return;
    }

    state.lightbox.items = images;
    state.lightbox.index = startIndex;
    state.lightbox.open = true;
    imageElement.src = images[startIndex];
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';
  }

  function closeLightbox(overlay) {
    state.lightbox.open = false;
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    if (!state.currentProjectId) {
      setBodyScrollLocked(false);
    }
  }

  function navigateLightbox(direction, imageElement) {
    if (!state.lightbox.items.length) {
      return;
    }

    state.lightbox.index =
      (state.lightbox.index + direction + state.lightbox.items.length) %
      state.lightbox.items.length;
    imageElement.src = state.lightbox.items[state.lightbox.index];
  }

  function initLightbox() {
    const overlay = byId('pp-lightbox');
    const imageElement = byId('pp-lb-img');
    if (!overlay || !imageElement) {
      return;
    }

    all('.pp-gitem').forEach((item) => {
      item.addEventListener('click', () => {
        const image = item.querySelector('img');
        if (!image) {
          return;
        }

        const projectId = item.dataset.proj;
        const index = Number.parseInt(item.dataset.idx || '0', 10);
        const images = all(`.pp-gitem[data-proj="${projectId}"]`)
          .map((entry) => entry.querySelector('img'))
          .filter(Boolean)
          .map((entry) => entry.src);

        openLightbox(
          images,
          Number.isNaN(index) ? 0 : index,
          overlay,
          imageElement,
        );
      });
    });

    all('[data-lightbox-close]').forEach((button) => {
      button.addEventListener('click', () => closeLightbox(overlay));
    });

    all('[data-lightbox-nav]').forEach((button) => {
      button.addEventListener('click', () => {
        const direction = Number.parseInt(
          button.dataset.lightboxNav || '0',
          10,
        );
        navigateLightbox(Number.isNaN(direction) ? 0 : direction, imageElement);
      });
    });

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closeLightbox(overlay);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (state.lightbox.open) {
        closeLightbox(overlay);
        return;
      }

      if (state.currentProjectId) {
        closeProjectPage();
        return;
      }

      closeMobileMenu();
    });

    // Keep compatibility with older HTML attributes.
    window.closePPLB = () => closeLightbox(overlay);
    window.ppLBNav = (direction) => navigateLightbox(direction, imageElement);
  }

  function init() {
    initCursor();
    initNavScroll();
    initMobileMenu();
    initRevealAnimations();
    initLanguage();
    initTheme();
    initFilters();
    initCounters();
    initProjectPages();
    initLightbox();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
