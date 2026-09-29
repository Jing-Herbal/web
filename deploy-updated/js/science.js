/* aura — science page. Renders the dossiers from js/data.js; nav and smooth scroll as on the product page. */
(() => {
  'use strict';
  const { FORMULA, DOSSIER } = window.AURA_DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmtMg = (n) => n.toLocaleString('en-AU', { maximumFractionDigits: 2 });

  // Opener: the six ingredients as specimen plates, each linking to its dossier below
  $('#specimens').innerHTML = FORMULA.filter((f) => !f.excipient).map((f, i) => `
    <a class="plate${f.claim ? ' plate--claim' : ''}" href="#d-${f.name.toLowerCase()}">
      <span class="plate__img"><img src="${f.img}" alt="" loading="eager"></span>
      <span class="plate__cap">
        <span class="plate__fig">Fig. ${String(i + 1).padStart(2, '0')}${f.claim ? ' · Vitamin C' : ''}</span>
        <span class="plate__latin">${f.latin}</span>
        <span class="plate__mg">${fmtMg(f.mg)} mg</span>
      </span>
    </a>`).join('');

  $('#dossiers').innerHTML = FORMULA.filter((f) => !f.excipient).map((f, i) => {
    const d = DOSSIER[f.name];
    return `
    <article class="dossier" id="d-${f.name.toLowerCase()}">
      <div class="dossier__img">${f.img ? `<img src="${f.img}" alt="${f.name}, as the whole ingredient." loading="lazy">` : ''}</div>
      <div class="dossier__head">
        <span class="label">Fig. ${String(i + 1).padStart(2, '0')} · <span class="latin" style="text-transform:none;letter-spacing:0">${f.latin}</span></span>
        <h3 class="display d-md">${f.name}${f.zh ? ` <span class="zh">${f.zh}</span>` : ''}</h3>
        <div class="dossier__dose">${fmtMg(f.mg)}<small>mg / stick</small></div>
        <span class="grade-chip grade-chip--${d.grade.toLowerCase()}">${d.grade === 'A' ? 'Permitted claim · vitamin C' : 'Traditional use'}</span>
      </div>
      <dl class="dossier__body">
        <dt class="label">What it is</dt><dd>${d.what}</dd>
        <dt class="label">What’s in it</dt><dd>${d.inIt}</dd>
        <dt class="label">${d.grade === 'A' ? 'Why it is here' : 'The tradition'}</dt><dd>${f.text}</dd>
        ${d.grade === 'A' ? `<dt class="label">About the claim</dt><dd>${d.noClaim}</dd>` : ''}
        <dt class="label">Form</dt><dd>${f.form}</dd>
      </dl>
    </article>`;
  }).join('');

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
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  if (!reduced && window.Lenis) {
    const lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  try { const n = (JSON.parse(localStorage.getItem('aura-cart')) || []).reduce((s, l) => s + l.qty, 0); $$('[data-cart-count]').forEach((c) => (c.textContent = n)); } catch { /* storage unavailable */ }
  const news = $('#news');
  if (news) news.addEventListener('submit', (e) => e.preventDefault());
})();
