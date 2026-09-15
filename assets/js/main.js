/**
 * Aquatic Store — main.js
 * Vanilla ES6+. No frameworks, no build step required.
 * Sections:
 *   1. Theme (dark/light) switching
 *   2. Compact header on scroll
 *   3. Mobile off-canvas navigation
 *   4. Scroll-reveal animations
 *   5. Filter drawer (catalog pages)
 *   6. Form validation (contact / special order / newsletter)
 *   7. Countdown (coming-soon page)
 */
(() => {
  'use strict';

  const root = document.documentElement;

  /**
   * 1. THEME SWITCHING
   * Reads localStorage first, falls back to system preference.
   * Persists the user's explicit choice so it survives across pages.
   */
  const ThemeModule = {
    KEY: 'aquatic-theme',
    init() {
      const saved = localStorage.getItem(this.KEY);
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = saved || (systemDark ? 'dark' : 'light');
      root.setAttribute('data-theme', theme);

      document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
        btn.addEventListener('click', () => this.toggle());
        btn.setAttribute('aria-pressed', theme === 'dark');
      });
    },
    toggle() {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem(this.KEY, next);
      document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
        btn.setAttribute('aria-pressed', next === 'dark');
      });
    },
  };

  /**
   * 2. COMPACT HEADER ON SCROLL
   */
  const HeaderModule = {
    init() {
      this.header = document.querySelector('.site-header');
      if (!this.header) return;
      window.addEventListener('scroll', () => this.onScroll(), { passive: true });
      this.onScroll();
    },
    onScroll() {
      this.header.classList.toggle('is-compact', window.scrollY > 40);
    },
  };

  /**
   * 3. MOBILE OFF-CANVAS NAVIGATION
   */
  const MobileNavModule = {
    init() {
      this.panel = document.querySelector('.mobile-nav');
      this.openBtn = document.querySelector('[data-menu-open]');
      this.closeBtn = document.querySelector('[data-menu-close]');
      if (!this.panel || !this.openBtn) return;

      this.openBtn.addEventListener('click', () => this.open());
      this.closeBtn?.addEventListener('click', () => this.close());
      this.panel.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => this.close()));
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
      });
    },
    open() {
      this.panel.classList.add('is-open');
      this.openBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      this.panel.querySelector('a')?.focus();
    },
    close() {
      this.panel.classList.remove('is-open');
      this.openBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    },
  };

  /**
   * 3b. HEADER NAVIGATION
   * Desktop dropdown (the Home-layout switcher), the slide-down search
   * panel, and the mobile submenu accordion. Hover alone opens the
   * dropdown via CSS; this adds click/keyboard parity for touch and
   * keyboard users.
   */
  const NavModule = {
    init() {
      this.dropdowns = Array.from(document.querySelectorAll('.nav-item.has-dropdown'));
      this.dropdowns.forEach((item) => {
        const toggle = item.querySelector('[data-dropdown-toggle]');
        if (!toggle) return;
        toggle.addEventListener('click', (e) => {
          e.preventDefault();
          const open = item.classList.contains('is-open');
          this.closeAll();
          if (!open) {
            item.classList.add('is-open');
            toggle.setAttribute('aria-expanded', 'true');
          }
        });
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-item.has-dropdown')) this.closeAll();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.closeAll();
      });

      // Slide-down search
      const searchPanel = document.querySelector('[data-search-panel]');
      document.querySelectorAll('[data-search-toggle]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (!searchPanel) return;
          const open = searchPanel.classList.toggle('is-open');
          btn.setAttribute('aria-expanded', String(open));
          if (open) searchPanel.querySelector('input')?.focus();
        });
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchPanel?.classList.contains('is-open')) {
          searchPanel.classList.remove('is-open');
          document.querySelector('[data-search-toggle]')?.setAttribute('aria-expanded', 'false');
        }
      });

      // Mobile submenu accordion
      document.querySelectorAll('[data-sub-toggle]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const panel = btn.nextElementSibling;
          const open = panel?.classList.toggle('is-open');
          btn.setAttribute('aria-expanded', String(!!open));
        });
      });
    },
    closeAll() {
      this.dropdowns.forEach((item) => {
        item.classList.remove('is-open');
        item.querySelector('[data-dropdown-toggle]')?.setAttribute('aria-expanded', 'false');
      });
    },
  };

  /**
   * 4. SCROLL-REVEAL
   * Respects prefers-reduced-motion by simply skipping the observer
   * (elements default to visible via the reduced-motion CSS block).
   */
  const RevealModule = {
    init() {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const items = document.querySelectorAll('.reveal');
      if (prefersReduced || !('IntersectionObserver' in window)) {
        items.forEach((el) => el.classList.add('is-visible'));
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
      );
      items.forEach((el) => io.observe(el));
    },
  };

  /**
   * 5. CATALOG FILTER DRAWER (mobile)
   */
  const FilterDrawerModule = {
    init() {
      const openBtn = document.querySelector('[data-filter-open]');
      const drawer = document.querySelector('[data-filter-drawer]');
      const closeBtn = document.querySelector('[data-filter-close]');
      if (!openBtn || !drawer) return;
      openBtn.addEventListener('click', () => drawer.classList.add('is-open'));
      closeBtn?.addEventListener('click', () => drawer.classList.remove('is-open'));
    },
  };

  /**
   * 6. FORM VALIDATION
   * Works for the contact form and special-order enquiry form.
   * Compatible with Formspree/Netlify: the fetch call below is
   * a TODO stub — replace the action URL and uncomment fetch to
   * go live without changing markup.
   */
  const FormModule = {
    init() {
      document.querySelectorAll('form[data-validate]').forEach((form) => this.bind(form));
    },
    bind(form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        let valid = true;
        form.querySelectorAll('[required]').forEach((field) => {
          const group = field.closest('.form-field');
          const ok = field.type === 'checkbox' ? field.checked : field.value.trim().length > 0;
          const emailOk = field.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
          if (!ok || !emailOk) {
            group?.classList.add('has-error');
            valid = false;
          } else {
            group?.classList.remove('has-error');
          }
        });

        if (!valid) {
          form.querySelector('.has-error input, .has-error select, .has-error textarea')?.focus();
          return;
        }

        // TODO: point this at your Formspree endpoint or Netlify Forms
        // e.g. fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        const successEl = form.parentElement.querySelector('.form-success');
        if (successEl) {
          successEl.classList.add('is-visible');
          successEl.setAttribute('role', 'status');
        }
        form.reset();
      });
    },
  };

  /**
   * 7. COUNTDOWN (coming-soon page)
   */
  const CountdownModule = {
    init() {
      const el = document.querySelector('[data-countdown]');
      if (!el) return;
      const target = new Date(el.dataset.countdown).getTime();
      const dEl = el.querySelector('[data-days]');
      const hEl = el.querySelector('[data-hours]');
      const mEl = el.querySelector('[data-mins]');
      const sEl = el.querySelector('[data-secs]');

      const tick = () => {
        const diff = Math.max(0, target - Date.now());
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        if (dEl) dEl.textContent = String(d).padStart(2, '0');
        if (hEl) hEl.textContent = String(h).padStart(2, '0');
        if (mEl) mEl.textContent = String(m).padStart(2, '0');
        if (sEl) sEl.textContent = String(s).padStart(2, '0');
      };
      tick();
      setInterval(tick, 1000);
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    ThemeModule.init();
    HeaderModule.init();
    MobileNavModule.init();
    NavModule.init();
    RevealModule.init();
    FilterDrawerModule.init();
    FormModule.init();
    CountdownModule.init();
  });
})();
