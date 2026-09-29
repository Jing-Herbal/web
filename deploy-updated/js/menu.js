/* aura — phone menu: the page links, which the nav bar has no room for on small screens. */
(() => {
  'use strict';
  const btn = document.querySelector('.nav__menu');
  const menu = document.getElementById('menu');
  if (!btn || !menu) return;
  const root = document.documentElement;
  const set = (open) => {
    menu.hidden = false;
    void menu.offsetWidth; // let the panel lay out before it fades in
    root.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Close' : 'Menu';
    if (!open) setTimeout(() => { if (!root.classList.contains('menu-open')) menu.hidden = true; }, 400);
  };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('menu-open')) { set(false); btn.focus(); } });
  addEventListener('resize', () => { if (innerWidth > 860 && root.classList.contains('menu-open')) set(false); });
})();
