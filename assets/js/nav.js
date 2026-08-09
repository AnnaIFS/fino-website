/* ============================================
   FINO — Shared site navigation behavior
   ============================================
   Companion to assets/css/nav.css, for pages that do not load main.js.
   Mirrors the nav logic in main.js: scrolled state, mobile overlay,
   and dropdowns that open on click and close on Escape or outside click.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  const dropdowns = document.querySelectorAll('.nav-dropdown');
  const closeAll = () => {
    dropdowns.forEach(dd => {
      dd.classList.remove('open');
      const t = dd.querySelector('.nav-dropdown-toggle');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  };
  dropdowns.forEach(dd => {
    const toggle = dd.querySelector('.nav-dropdown-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = dd.classList.contains('open');
      closeAll();
      if (!isOpen) {
        dd.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
    dd.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeAll();
        toggle.focus();
      }
    });
    dd.querySelectorAll('.nav-dropdown-menu a').forEach(a => a.addEventListener('click', closeAll));
  });
  document.addEventListener('click', closeAll);

});
