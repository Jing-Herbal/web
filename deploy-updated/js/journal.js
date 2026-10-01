/* aura — journal pages: nav, smooth scroll, and tag filters on the listing. */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  // The site ignores the device's Reduce Motion setting: everyone gets the full motion (owner, 2026-10-01)
  const reduced = false;

  // Nav: stick, hide on the way down, return on the way up, recolour over clay
  const nav = $('#nav');
  const dark = $$('[data-nav="dark"]');
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY, vh = innerHeight;
    nav.classList.toggle('is-stuck', y > 30);
    if (y > vh * 0.9 && y > lastY + 4) nav.classList.add('is-hidden');
    if (y < lastY - 4 || y < vh * 0.9) nav.classList.remove('is-hidden');
    lastY = y;
    nav.classList.toggle('is-light', !dark.some((z) => { const r = z.getBoundingClientRect(); return r.top <= 44 && r.bottom >= 44; }));
    if (draw) drawHerbs();
    if (letter) readLetter();
    if (counts.length) countUp();
    if (tl) fillTimeline();
    ticking = false;
  };

  // Our story, mission: each botanical draws in turn while the section is pinned
  const draw = $('[data-draw]');
  const herbs = draw ? $$('.herb', draw).map((g) => ({ g, strokes: $$('path, circle, ellipse', g) })) : [];
  herbs.forEach(({ strokes }) => strokes.forEach((s) => { s.style.strokeDasharray = '1 1'; s.style.strokeDashoffset = reduced ? '0' : '1'; }));
  if (reduced) herbs.forEach(({ g }) => g.classList.add('is-done'));
  // Our story: the founders' letter lights up word by word as you scroll through it
  const letter = $('[data-letter]');
  let words = [], sign = null;
  if (letter) {
    sign = $('.sign', letter);
    $$('p:not(.sign)', letter).forEach((p) => {
      const walk = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walk.nextNode()) nodes.push(walk.currentNode);
      nodes.forEach((n) => {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const w = document.createElement('span');
          w.className = 'w';
          w.textContent = part;
          frag.append(w);
        });
        n.replaceWith(frag);
      });
    });
    words = $$('.w', letter);
    if (reduced) { words.forEach((w) => w.classList.add('is-lit')); sign.classList.add('is-signed'); }
  }
  // Our story: stats count up the first time they reach the screen (or are scrolled past)
  const counts = $$('[data-count]').map((el) => ({ el, done: reduced }));
  if (!reduced) counts.forEach(({ el }) => (el.textContent = '0'));
  const countUp = () => counts.forEach((c) => {
    if (c.done || c.el.getBoundingClientRect().top > innerHeight * 0.85) return;
    c.done = true;
    const to = +c.el.dataset.count, t0 = performance.now(), dur = 1600;
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      c.el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString('en-AU');
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  // Our story: the timeline line fills as it passes the reading line, lighting each step
  const tl = $('[data-tl]');
  const tlSteps = tl ? $$('li', tl) : [];
  const fillTimeline = () => {
    const r = tl.getBoundingClientRect();
    const p = reduced ? 1 : Math.min(1, Math.max(0, (innerHeight * 0.8 - r.top) / Math.max(r.height, innerHeight * 0.5)));
    tl.style.setProperty('--tl', p.toFixed(3));
    tlSteps.forEach((li, i) => li.classList.toggle('is-on', p >= i / (tlSteps.length - 1) * 0.98));
  };

  const readLetter = () => {
    if (reduced || !letter) return;
    const r = letter.getBoundingClientRect(), vh = innerHeight;
    // The reading line sits at 70% of the screen: words above it are lit
    const p = Math.min(1, Math.max(0, (vh * 0.7 - r.top) / (r.height * 0.9)));
    const lit = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
    if (p >= 1) sign.classList.add('is-signed');
  };

  const drawHerbs = () => {
    if (reduced) return;
    const r = draw.getBoundingClientRect();
    const span = r.height - innerHeight;
    // Finish at 85% of the pinned travel, so the complete drawing holds before the section leaves
    const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span) / 0.85) : 1;
    herbs.forEach(({ g, strokes }, i) => {
      const start = i * 0.16, local = Math.min(1, Math.max(0, (p - start) / 0.36));
      strokes.forEach((s) => { s.style.strokeDashoffset = String(1 - local); });
      g.classList.toggle('is-done', local >= 1);
    });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  if (!reduced && window.Lenis) {
    const lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  // Listing: filter cards by tag
  const grid = $('#jgrid');
  if (grid) {
    $$('.jfilter').forEach((b) => b.addEventListener('click', () => {
      const f = b.dataset.filter;
      $$('.jfilter').forEach((x) => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-selected', String(x === b)); });
      $$('.jcard', grid).forEach((c) => { c.hidden = f !== 'All' && !c.dataset.tags.split(' ').includes(f); });
    }));
  }

  // Looping background videos: play while on screen, in case autoplay was interrupted
  const vids = $$('video[autoplay]');
  if (vids.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) e.target.play().catch(() => {}); else e.target.pause();
    }), { threshold: 0.2 });
    vids.forEach((v) => io.observe(v));
  }

  try { const n = (JSON.parse(localStorage.getItem('aura-cart')) || []).reduce((s, l) => s + l.qty, 0); $$('[data-cart-count]').forEach((c) => (c.textContent = n)); } catch { /* storage unavailable */ }
  if (window.auraWireSignup) window.auraWireSignup($('#news'), $('#newsEmail'), 'footer');
})();
