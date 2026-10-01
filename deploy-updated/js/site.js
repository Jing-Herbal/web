/* aura — product site behaviour. No dependencies. */
(() => {
  const auraTrack = (n, p) => { if (window.auraTrack) window.auraTrack(n, p); };
  'use strict';

  // ---------------------------------------------------------------------------
  // Data
  // Doses: 01-Products/Aura/formulation.md (CMO spec RC2026057 V0D7). Change there first.
  // Prices: js/data.js (A$69, set 2026-09-28; subscription discount TBC).
  // ---------------------------------------------------------------------------
  const { PRICE, SHOP, FORMULA } = window.AURA_DATA; // js/data.js
  const UNIT_MG = 5000;
  
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmtMg = (n) => n.toLocaleString('en-AU', { maximumFractionDigits: 2 });
  const fmtA = (n) => 'A$' + (Number.isInteger(n) ? n : n.toFixed(2));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };

  // ---------------------------------------------------------------------------
  // Prices into the page
  // ---------------------------------------------------------------------------
  $$('[data-price="single"]').forEach((el) => (el.textContent = fmtA(PRICE.single)));
  $$('[data-price="sub"]').forEach((el) => (el.textContent = fmtA(PRICE.sub)));
  $$('[data-price-was]').forEach((el) => (el.textContent = fmtA(PRICE.single)));
  const saving = PRICE.single - PRICE.sub;
  $$('[data-price-save]').forEach((el) => { el.textContent = 'Saves ' + fmtA(saving); el.hidden = saving <= 0; });
  $$('[data-price-was]').forEach((el) => { el.hidden = saving <= 0; });

  // ---------------------------------------------------------------------------
  // Marquee, formula steps, bar, panel
  // ---------------------------------------------------------------------------
  const marquee = $('#marquee');
  const mItems = FORMULA.filter((f) => !f.excipient).map((f) =>
    `<span class="marquee__item"><span class="n">${f.name}</span>${f.zh ? `<span class="zh">${f.zh}</span>` : ''}<span class="mono">${fmtMg(f.mg)} mg</span></span><span class="marquee__dot">·</span>`
  ).join('') + `<span class="marquee__item"><span class="n">Vitamin C</span><span class="mono">60 mg · 133% RDI</span></span><span class="marquee__dot">·</span>`;
  marquee.innerHTML = mItems + mItems;

  // The scroll story shows the six ingredients; the excipients stay in the full ingredient list below
  const STEPS = FORMULA.filter((f) => !f.excipient);
  const steps = $('#steps');
  steps.innerHTML = STEPS.map((f, i) => `
    <article class="step" data-step="${i}">
      ${f.img ? `<img class="step__img" src="${f.img}" alt="${f.name}, as the whole ingredient." loading="lazy">` : ''}
      <span class="label" style="color:var(--ink-600)">${String(i + 1).padStart(2, '0')} / ${String(STEPS.length).padStart(2, '0')}</span>
      <div class="step__head">
        <h3 class="display d-md">${f.name}</h3>${f.zh ? `<span class="zh">${f.zh}</span>` : ''}
      </div>
      <span class="latin step__latin">${f.latin}</span>
      <div class="step__dose">${fmtMg(f.mg)}<small>mg</small></div>
      <p class="body" style="margin:0;max-width:460px">${f.text}</p>
      <dl class="specs label">
        <dt>Form</dt><dd>${f.form}</dd>
      </dl>
    </article>`).join('');

  const bar = $('#stageBar');
  // Each segment is its share of the 5 g stick; the unfilled top is the carrier and flow agent
  const pct = STEPS.map((f) => Math.max((f.mg / UNIT_MG) * 100, 0.6));
  bar.innerHTML = STEPS.map((f, i) => `<span class="seg" style="--h:${pct[i]}%;--c:${f.c};transition-delay:${i * 60}ms"></span>`).join('');
  const segs = $$('.seg', bar);

  const stageMedia = $('#stageMedia');
  stageMedia.innerHTML = STEPS.map((f) => (f.img ? `<img src="${f.img}" alt="" loading="lazy">` : '<span></span>')).join('');
  const stageImgs = [...stageMedia.children];

  $('#panelList').innerHTML = FORMULA.map((f) => `<li><span><strong style="color:var(--ink-900);font-weight:600">${f.name}</strong>${f.zh ? ` <span class="zh">${f.zh}</span>` : ''} · <span class="latin">${f.latin}</span></span><span class="mono">${f.mg ? fmtMg(f.mg) + ' mg' : 'balance'}</span></li>`).join('')
    + `<li><span>Vitamin C, from acerola</span><span class="mono">60 mg · 133% RDI</span></li>`;

  // Stage readout
  let current = -1;
  let countFrom = 0;
  const stageName = $('#stageName');
  const setStage = (i) => {
    if (i === current) return;
    const f = STEPS[i];
    current = i;
    segs.forEach((s, j) => {
      s.classList.toggle('is-filled', j <= i);
      s.classList.toggle('is-current', j === i);
    });
    $$('.step', steps).forEach((s, j) => s.classList.toggle('is-active', j === i));
    stageImgs.forEach((m, j) => m.classList.toggle('is-active', j === i));
    stageName.classList.add('is-swapping');
    setTimeout(() => {
      $('#stageIdx').textContent = `${String(i + 1).padStart(2, '0')} / ${String(STEPS.length).padStart(2, '0')}`;
      $('#stageTitle').innerHTML = f.name + (f.zh ? ` <span class="zh" style="font-size:.7em;color:var(--clay-500)">${f.zh}</span>` : '');
      stageName.classList.remove('is-swapping');
    }, reduced ? 0 : 220);
    const running = STEPS.slice(0, i + 1).reduce((s, x) => s + x.mg, 0);
    $('#stageTotal').textContent = fmtMg(running);
    const target = f.mg;
    tween($('#stageCount'), countFrom, target, 400, (v) => fmtMg(target % 1 ? Math.round(v * 100) / 100 : Math.round(v)));
    countFrom = target;
  };

  function tween(el, from, to, dur, fmt) {
    if (reduced) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    cancelAnimationFrame(el._raf);
    const tick = (now) => {
      const t = clamp((now - t0) / dur);
      el.textContent = fmt(from + (to - from) * ease(t));
      if (t < 1) el._raf = requestAnimationFrame(tick);
    };
    el._raf = requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------------------
  // Reveal + split headings + count-up
  // ---------------------------------------------------------------------------
  // Reveals follow the scroll position rather than a timer (quiet, reversible).
  // Each element gets --p from 0 to 1; CSS maps it to opacity, offset, wipe or line length.
  // The hero is the exception: it plays a short load sequence (see .hero.is-in).
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const reveals = $$('[data-reveal], [data-split], [data-wipe]').filter((el) => !el.closest('.hero'))
    .map((el) => ({ el, off: (parseFloat(el.style.getPropertyValue('--d')) || 0) / 600, last: -1 }));
  const counts = $$('[data-count]').map((el) => ({ el, to: +el.dataset.count, sep: el.hasAttribute('data-sep'), last: -1 }));
  const progress = (el, vh, span) => {
    const top = el.getBoundingClientRect().top;
    return clamp((vh * 0.96 - top) / (vh * span));
  };
  requestAnimationFrame(() => $('.hero').classList.add('is-in'));
  const heroVideo = $('.hero__video');
  if (heroVideo) {
    if (reduced) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }
    else new IntersectionObserver(([e]) => { if (e.isIntersecting) heroVideo.play().catch(() => {}); else heroVideo.pause(); }).observe(heroVideo);
  }

  // ---------------------------------------------------------------------------
  // Unboxing sequence. Frames are drawn to a canvas; scroll position picks the frame.
  // Frames: img/unbox/f_001.webp … (extracted from the generated film, see README).
  // ---------------------------------------------------------------------------
  const UNBOX_FRAMES = 151; // set by tools/build-unbox.py
  const CAPTION_AT = [0, 0.44, 0.8]; // progress where each caption takes over
  const FILM_END = 0.88; // the film finishes here; the last frame holds for the rest
  const uCanvas = $('#unboxCanvas');
  const uCtx = uCanvas.getContext('2d');
  const uFrames = [];
  let uWant = 0, uDrawn = -1, uLoading = false;
  const uSrc = (i) => `img/unbox/f_${String(i + 1).padStart(3, '0')}.webp`;
  const uLoad = () => {
    if (uLoading || !UNBOX_FRAMES) return;
    uLoading = true;
    // First frame, then every 8th, then fill in, so scrubbing works before everything arrives
    const order = [];
    for (let step of [8, 4, 2, 1]) for (let i = 0; i < UNBOX_FRAMES; i += step) if (!order.includes(i)) order.push(i);
    let k = 0;
    const next = () => {
      if (k >= order.length) return;
      const i = order[k++];
      const img = new Image();
      img.decoding = 'async';
      img.onload = img.onerror = () => { uFrames[i] = img.naturalWidth ? img : null; if (uDrawn !== uWant) uDraw(); next(); };
      img.src = uSrc(i);
    };
    for (let c = 0; c < 6; c++) next();
  };
  const uNearest = (i) => {
    for (let d = 0; d < UNBOX_FRAMES; d++) {
      if (uFrames[i - d]) return i - d;
      if (uFrames[i + d]) return i + d;
    }
    return -1;
  };
  const uSize = () => {
    const r = uCanvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    uCanvas.width = Math.round(r.width * dpr);
    uCanvas.height = Math.round(r.height * dpr);
    uDrawn = -1;
    uDraw();
  };
  function uDraw() {
    const i = uNearest(uWant);
    if (i < 0) return;
    const img = uFrames[i];
    const cw = uCanvas.width, ch = uCanvas.height;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight); // cover
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    // On short, wide screens the frame is cropped top and bottom: keep the top of the pack in
    // view (the sleeve lifts out of the top of the frame) and lose the plinth instead
    uCtx.drawImage(img, (cw - w) / 2, (h > ch ? 0 : (ch - h) / 2), w, h);
    uDrawn = i;
    uCanvas.classList.add('is-ready');
  }
  // ?debug=unbox shows the numbers that drive the sequence, for checking on a phone
  const uDebug = /debug=unbox/.test(location.search) ? document.body.appendChild(Object.assign(document.createElement('div'), { style: 'position:fixed;left:8px;right:8px;bottom:8px;z-index:9999;padding:8px 10px;background:#000;color:#0f0;font:11px/1.4 monospace;border-radius:6px;pointer-events:none' })) : null;
  const uCaps = $$('.unbox__cap');
  const uSteps = $$('.unbox__steps > span:not(.unbox__bar)');
  function unboxScroll(vh) {
    if (!UNBOX_FRAMES) return;
    const r = unbox.getBoundingClientRect();
    if (r.top < vh * 2.5 && r.bottom > -vh) uLoad();
    // Scrubbing runs while the frame is pinned: from the section top to its bottom minus one screen
    const p = reduced ? 1 : clamp(-r.top / (r.height - vh));
    uWant = Math.round(clamp(p / FILM_END) * (UNBOX_FRAMES - 1));
    if (uWant !== uDrawn) uDraw();
    let c = 0;
    CAPTION_AT.forEach((t, i) => { if (p >= t) c = i; });
    uCaps.forEach((el, i) => el.classList.toggle('is-active', i === c));
    uSteps.forEach((el, i) => el.classList.toggle('is-active', i <= c));
    $('#unboxBar').style.transform = `scaleX(${p})`;
  }
  // The frame widens as it arrives, so follow its size rather than the window's
  if ('ResizeObserver' in window) new ResizeObserver(uSize).observe(uCanvas);
  else addEventListener('resize', uSize);
  uSize();

  // Statement: split into words, light them with scroll
  const statement = $('[data-words]');
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.append(w); return; }
          const s = document.createElement('span'); s.className = 'word'; s.textContent = w; frag.append(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(statement);
  const words = $$('.word', statement);

  // ---------------------------------------------------------------------------
  // Scroll-driven effects (one rAF-throttled handler)
  // ---------------------------------------------------------------------------
  const nav = $('#nav');
  const darkZones = $$('[data-nav="dark"]');
  const parallax = $$('[data-parallax]');
  const expand = $('#expand');
  // The ritual: the film loops while on screen; the step it is on lights up, its bar fills
  const rstage = $('[data-rstage]');
  if (rstage) {
    const rv = $('video', rstage);
    const steps = $$('.rstep', rstage).map((li) => ({ li, from: +li.dataset.from, to: +li.dataset.to, bar: $('.rstep__bar span', li) }));
    const prog = $$('.rstage__progress i', rstage);
    let raf = 0;
    const paint = () => {
      const t = rv.currentTime;
      steps.forEach((s) => {
        const on = t >= s.from && t < s.to;
        s.li.classList.toggle('is-on', on);
        s.bar.style.setProperty('--p', on ? ((t - s.from) / (s.to - s.from)).toFixed(3) : '0');
      });
      // Phones: one segment per step, filled as the film moves through it
      prog.forEach((bar, i) => {
        const s = steps[i];
        const k = t >= s.to ? 1 : t <= s.from ? 0 : (t - s.from) / (s.to - s.from);
        bar.style.transform = `scaleX(${k.toFixed(3)})`;
      });
      raf = rv.paused ? 0 : requestAnimationFrame(paint);
    };
    rv.addEventListener('play', () => { if (!raf) raf = requestAnimationFrame(paint); });
    rv.addEventListener('seeked', paint);
    // Pick a step to jump the film to it
    steps.forEach((s) => $('.rstep__btn', s.li).addEventListener('click', () => {
      rv.currentTime = s.from + 0.05;
      rv.play().catch(() => {});
    }));
    if (reduced) {
      steps.forEach((s) => s.li.classList.add('is-on'));
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) rv.play().catch(() => {}); else rv.pause();
      }), { threshold: 0.35 }).observe(rv);
    }
  }

  // bloom card: the spinning tin plays over the still on hover; phones have no hover, so it plays
  // while the card is on screen. The film is only fetched the first time it is needed
  const bloomMedia = $('.card__media--bloom');
  const bloomSpin = bloomMedia && $('.card__spin', bloomMedia);
  if (bloomSpin && !reduced) {
    const spin = (on) => {
      if (on) {
        if (!bloomSpin.src) bloomSpin.src = bloomSpin.dataset.src;
        bloomSpin.play().then(() => bloomMedia.classList.add('is-spinning')).catch(() => {});
      } else {
        bloomMedia.classList.remove('is-spinning');
        setTimeout(() => { if (!bloomMedia.classList.contains('is-spinning')) { bloomSpin.pause(); bloomSpin.currentTime = 0; } }, 500);
      }
    };
    const card = bloomMedia.closest('.card');
    if (matchMedia('(hover: hover)').matches) {
      card.addEventListener('mouseenter', () => spin(true));
      card.addEventListener('mouseleave', () => spin(false));
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => es.forEach((e) => spin(e.isIntersecting)), { threshold: 0.5 }).observe(card);
    }
  }

  // Closing section: the morning-light loop plays only while it is on screen
  const finalVid = $('.final2__bg video');
  if (finalVid && !reduced && 'IntersectionObserver' in window) {
    new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) finalVid.play().catch(() => {}); else finalVid.pause();
    }), { threshold: 0.2 }).observe(finalVid);
  }

  const unbox = $('#unbox');
  const hs = $('#kitchenHs');
  const hsSticky = hs && $('.hscroll__sticky', hs);
  const hsRail = $('#kitchenRail');
  let hsOn = false, hsOver = 0;
  const hsSize = () => {
    if (!hs) return;
    hsOn = !reduced;
    hs.classList.toggle('is-on', hsOn);
    hsRail.style.transform = '';
    hsOver = hsOn ? Math.max(0, hsRail.scrollWidth - hsRail.clientWidth) : 0;
    // The section is as tall as the sideways travel, so a scroll of N px moves the rail N px
    hs.style.height = hsOn ? `${hsSticky.offsetHeight + hsOver}px` : '';
  };
  // Only a width change resizes the rail: phone toolbars showing and hiding change the height
  // on every flick, and re-measuring then would make the rail jump
  let hsW = innerWidth;
  addEventListener('resize', () => { if (innerWidth !== hsW) { hsW = innerWidth; hsSize(); } });
  addEventListener('load', hsSize);
  hsSize();
  // What to expect: one dot per stick for the first six boxes of 30; they fill as the section scrolls past
  const field = $('#field');
  const fieldN = $('#fieldN');
  const GIFTS = { 2: 'Gua sha', 4: null, 6: null };
  const DAYS = 180; // six boxes: the stretch where the habit forms
  const dots = [], boxEls = [];
  if (field) {
    const list = $('#fieldBoxes');
    for (let b = 1, day = 1; day <= DAYS; b++) {
      const li = document.createElement('li');
      li.className = 'fbox';
      const n = 30;
      const GIFT_ICON = '<svg class="fbox__icon" viewBox="0 0 20 20" aria-hidden="true"><g class="fbox__lid"><rect x="2.5" y="6" width="15" height="3.5" rx="1"/><path d="M10 6C8.8 3.2 5.6 2.6 5.6 4.6 5.6 5.8 8 6 10 6zM10 6c1.2-2.8 4.4-3.4 4.4-1.4 0 1.2-2.4 1.4-4.4 1.4z"/></g><rect x="3.5" y="9.5" width="13" height="8" rx="1"/><path d="M10 9.5v8"/></svg>';
      const gift = b in GIFTS ? GIFT_ICON + (GIFTS[b] || 'Mystery gift') : '';
      li.innerHTML = `<span class="fbox__label label">Box ${b}</span><span class="fbox__dots"></span>` +
        (gift ? `<span class="fbox__gift${GIFTS[b] ? '' : ' is-mystery'}">${gift}</span>` : '');
      const holder = li.querySelector('.fbox__dots');
      for (let i = 0; i < n; i++, day++) {
        const d = document.createElement('i');
        if (day >= 56 && day <= 84) d.className = 'is-judge';
        holder.append(d);
        dots.push(d);
      }
      boxEls.push({ li, first: dots.length - n });
      list.append(li);
    }
    // The reorder-by date for someone ordering today: 35 days from the order
    const fmt = (d) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long' });
    const today = new Date(), by = new Date(today); by.setDate(by.getDate() + 35);
    $('#fieldStart').innerHTML = `Order today, ${fmt(today)}, and reorder by <strong>${fmt(by)}</strong>: box 2 comes with a gua sha.`;
  }
  let fieldLit = -1;
  const buybar = $('#buybar');
  const hero = $('.hero');
  const shop = $('#shop');
  const finalCta = $('.final2');
  const stepEls = $$('.step', steps);
  const navLinks = $$('.nav__links a');
  const sections = navLinks.map((a) => $(a.getAttribute('href')));
  let lastY = scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = scrollY;
    const vh = innerHeight;

    // Nav: stick, hide on the way down, return on the way up, recolour over clay
    nav.classList.toggle('is-stuck', y > 30);
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    if (y > vh * 0.9 && goingDown) nav.classList.add('is-hidden');
    if (goingUp || y < vh * 0.9) nav.classList.remove('is-hidden');
    lastY = y;
    const probe = 44;
    const overDark = darkZones.some((z) => { const r = z.getBoundingClientRect(); return r.top <= probe && r.bottom >= probe; });
    nav.classList.toggle('is-light', !overDark);

    // Active nav link
    let active = -1;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * 0.4) active = i; });
    navLinks.forEach((a, i) => a.classList.toggle('is-active', i === active));

    if (!reduced) {
      parallax.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        el.style.transform = `translate3d(0, ${(r.top) * -+el.dataset.parallax}px, 0)`;
      });

      // Unboxing: the frame grows to full bleed as it arrives, then pins while scroll plays it
      const ur = unbox.getBoundingClientRect();
      const ep = clamp((vh - ur.top) / vh);
      const minW = innerWidth < 760 ? 88 : 72;
      expand.style.setProperty('--w', `${minW + (100 - minW) * ep}%`);
      expand.style.setProperty('--r', `${22 * (1 - ep)}px`);
    }

    // Scroll-linked reveals and counters
    reveals.forEach((r) => {
      let p = reduced ? 1 : progress(r.el, vh, 0.32);
      p = easeOut(clamp(p * (1 + r.off) - r.off));
      if (Math.abs(p - r.last) < 0.002) return;
      r.last = p;
      r.el.style.setProperty('--p', p.toFixed(3));
    });
    counts.forEach((c) => {
      const p = reduced ? 1 : easeOut(progress(c.el, vh, 0.45));
      const v = Math.round(c.to * p);
      if (v === c.last) return;
      c.last = v;
      c.el.textContent = c.sep ? v.toLocaleString('en-AU') : v;
    });

    unboxScroll(vh);

    // Recipe rail: pinned, and slides sideways as you scroll down, ending on the follow card
    if (hs && hsOn) {
      const r = hs.getBoundingClientRect();
      const span = r.height - hsSticky.offsetHeight;
      const p = span > 0 ? clamp(-r.top / span) : 0;
      hsRail.style.transform = `translate3d(${-p * hsOver}px, 0, 0)`;
    }

    // Statement words
    const sr = statement.getBoundingClientRect();
    const sp = clamp((vh * 0.85 - sr.top) / (sr.height + vh * 0.35));
    const lit = Math.round(sp * words.length);
    words.forEach((w, i) => w.classList.toggle('is-lit', i < lit || reduced));

    // Formula: the step nearest the viewport centre is active
    let best = 0, bestD = Infinity;
    stepEls.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - vh * 0.55);
      if (d < bestD) { bestD = d; best = i; }
    });
    setStage(best);

    // What to expect: light one dot per stick as the field crosses the screen
    if (field) {
      const fr = field.getBoundingClientRect();
      const fp = reduced ? 1 : clamp((vh * 0.9 - fr.top) / (fr.height + vh * 0.45));
      const n = Math.round(fp * DAYS);
      if (n !== fieldLit) {
        dots.forEach((d, i) => d.classList.toggle('is-lit', i < n));
        boxEls.forEach(({ li, first }) => li.classList.toggle('is-reached', n > first));
        fieldN.textContent = Math.max(1, n);
        fieldLit = n;
      }
    }

    // Sticky buy bar: after the hero, not while the shop is on screen
    const hb = hero.getBoundingClientRect().bottom;
    const sb = shop.getBoundingClientRect();
    const fb = finalCta.getBoundingClientRect().top;
    const ubr = unbox.getBoundingClientRect();
    const pinned = ubr.top < vh && ubr.bottom > 0;
    buybar.classList.toggle('is-shown', hb < 0 && !(sb.top < vh && sb.bottom > 0) && fb > vh && !pinned);

    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  // ---------------------------------------------------------------------------
  // Smooth scroll (Lenis, from CDN). Falls back to native scrolling if absent.
  // ---------------------------------------------------------------------------
  const lenis = !reduced && window.Lenis ? new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.9 }) : null;
  let velocity = 0;
  let prevY = scrollY;
  const marqueeTrack = $('#marquee');
  let mx = 0;
  let polledY = -1, polledVh = -1;
  const frame = (t) => {
    if (lenis) { lenis.raf(t); velocity = lenis.velocity || 0; }
    else { velocity = scrollY - prevY; prevY = scrollY; }
    // Everything scroll-linked (reveals, unboxing, counters, nav) follows the scroll position every
    // frame, not just on scroll events: Chrome on iPhone can deliver scroll events late or drop the
    // last one after a flick, which left the film on its last frame and closing CTAs invisible
    if (scrollY !== polledY || innerHeight !== polledVh) { polledY = scrollY; polledVh = innerHeight; onScroll(); }
    const ubr = unbox.getBoundingClientRect();
    if (ubr.top < innerHeight * 2.5 && ubr.bottom > -innerHeight) unboxScroll(innerHeight);
    if (uDebug) uDebug.textContent = `reduced:${reduced} lenis:${!!lenis} vh:${innerHeight} y:${Math.round(scrollY)} top:${Math.round(ubr.top)} h:${Math.round(ubr.height)} frame:${uWant}/${UNBOX_FRAMES - 1} loaded:${uFrames.filter(Boolean).length} cta:${$('.final2__ctas').style.getPropertyValue('--p') || '-'}`;
    // Marquee drifts left; scrolling adds speed, and scrolling up reverses it
    if (!reduced) {
      const half = marqueeTrack.scrollWidth / 2;
      mx -= 0.45 + velocity * 0.35;
      if (mx <= -half) mx += half;
      if (mx > 0) mx -= half;
      marqueeTrack.style.transform = `translate3d(${mx}px, 0, 0)`;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id.length > 1 && $(id);
    if (!target) return;
    e.preventDefault();
    closeCart();
    if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -24, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  });
  addEventListener('resize', onScroll);
  onScroll();

  // ---------------------------------------------------------------------------
  // Announcement rotation
  // ---------------------------------------------------------------------------
  const ann = $('#announce');
  let annI = 0;
  const annN = ann.children.length;
  ann.append(ann.children[0].cloneNode(true));
  if (!reduced) setInterval(() => {
    annI++;
    ann.style.transition = '';
    ann.style.transform = `translateY(${-36 * annI}px)`;
    if (annI === annN) setTimeout(() => { ann.style.transition = 'none'; ann.style.transform = 'translateY(0)'; annI = 0; }, 520);
  }, 4200);

  // ---------------------------------------------------------------------------
  // Accordions
  // ---------------------------------------------------------------------------
  $$('[data-acc]').forEach((acc) => {
    acc.addEventListener('click', (e) => {
      const btn = e.target.closest('.acc__btn');
      if (!btn) return;
      const item = btn.parentElement;
      const open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  // ---------------------------------------------------------------------------
  // Gallery
  // ---------------------------------------------------------------------------
  const SHOTS = [
    { src: 'img/studio-clay.jpg', alt: 'The aura box on a plaster plinth.' },
    { src: 'img/box-powder.jpg', alt: 'The aura box in a mound of powder with sticks.' },
    { src: 'img/stick-pour-wide.jpg', alt: 'Powder swirling through a glass.' },
    { src: 'img/stick-mound.jpg', alt: 'An aura stick on a mound of powder.' },
    { src: 'img/label-panel.jpg', alt: 'The back panel: nutrition information, ingredients with percentages, directions and advisory.' },
  ];
  const thumbs = $('#thumbs');
  const main = $('#galleryMain');
  thumbs.innerHTML = SHOTS.map((s, i) => `<button type="button" class="thumb${i ? '' : ' is-active'}" role="tab" aria-selected="${!i}" aria-label="Image ${i + 1}">${s.slot ? '<span class="gallery__slot is-active label" style="position:static;height:100%;font-size:8px;padding:4px">Soon</span>' : `<img src="${s.src}" alt="" loading="lazy">`}</button>`).join('');
  main.innerHTML = SHOTS.map((s, i) => s.slot
    ? `<div class="gallery__slot label${i ? '' : ' is-active'}">${s.slot}</div>`
    : `<img src="${s.src}" alt="${s.alt}" class="${i ? '' : 'is-active'}" loading="lazy">`).join('');
  const showShot = (i) => {
    $$('.thumb', thumbs).forEach((t, j) => { t.classList.toggle('is-active', j === i); t.setAttribute('aria-selected', String(j === i)); });
    [...main.children].forEach((m, j) => m.classList.toggle('is-active', j === i));
  };
  thumbs.addEventListener('click', (e) => { const t = e.target.closest('.thumb'); if (t) showShot($$('.thumb', thumbs).indexOf(t)); });
  let sx = null;
  main.addEventListener('pointerdown', (e) => (sx = e.clientX));
  main.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) < 40) return;
    const cur = $$('.thumb', thumbs).findIndex((t) => t.classList.contains('is-active'));
    showShot((cur + (dx < 0 ? 1 : -1) + SHOTS.length) % SHOTS.length);
  });

  // ---------------------------------------------------------------------------
  // Buy box
  // ---------------------------------------------------------------------------
  const buy = $('#buy');
  let qty = 1;
  const plan = () => buy.querySelector('input[name="plan"]:checked').value;
  const updateBuy = () => {
    const p = PRICE[plan()];
    $('#qty').textContent = qty;
    $('#addPrice').textContent = fmtA(p * qty);
    const ps = $('#perStick');
    if (ps) ps.textContent = `${fmtA(Math.round((p / PRICE.sticks) * 100) / 100)} per stick`;
  };
  buy.addEventListener('change', updateBuy);
  $$('[data-qty]', buy).forEach((b) => b.addEventListener('click', () => { qty = clamp(qty + +b.dataset.qty, 1, 6); updateBuy(); }));
  updateBuy();

  // ---------------------------------------------------------------------------
  // Cart (per-browser convenience only)
  // ---------------------------------------------------------------------------
  let cart = store.get('aura-cart', []);
  const cartCount = $$('[data-cart-count]');
  const renderCart = () => {
    const n = cart.reduce((s, l) => s + l.qty, 0);
    const total = cart.reduce((s, l) => s + l.qty * PRICE[l.plan], 0);
    cartCount.forEach((c) => (c.textContent = n));
    $('#cartTotal').textContent = fmtA(total);
    const left = PRICE.freeShipOver - total;
    $('#shipMsg').textContent = total === 0 ? `Free AU shipping over ${fmtA(PRICE.freeShipOver)}` : left > 0 ? `${fmtA(left)} from free shipping` : 'Free AU shipping on this order';
    $('#shipBar').style.setProperty('--p', `${clamp(total / PRICE.freeShipOver) * 100}%`);
    $('#cartLines').innerHTML = cart.length ? cart.map((l, i) => `
      <div class="line" style="padding:16px 0;border-bottom:.5px solid var(--line)">
        <div class="line__img"><img src="img/studio-clay.jpg" alt=""></div>
        <div>
          <div style="font-weight:600">aura · 30 sticks</div>
          <div class="label" style="color:var(--ink-600);margin:4px 0 8px">${l.plan === 'sub' ? 'Every 4 weeks' : 'One box'} · Qty ${l.qty}</div>
          <button class="line__rm" data-rm="${i}">Remove</button>
        </div>
        <div class="mono">${fmtA(l.qty * PRICE[l.plan])}</div>
      </div>`).join('') : '<p class="drawer__empty">Nothing here yet.</p>';
    $('#checkout').disabled = !cart.length;
    $('#checkout').style.opacity = cart.length ? 1 : 0.5;
    store.set('aura-cart', cart);
  };
  const openCart = () => { if (lenis) lenis.stop(); document.body.classList.add('cart-open'); $('#drawer').setAttribute('aria-hidden', 'false'); $('.drawer__close').focus({ preventScroll: true }); };
  function closeCart() { if (lenis) lenis.start(); document.body.classList.remove('cart-open'); $('#drawer').setAttribute('aria-hidden', 'true'); }
  $$('[data-open-cart]').forEach((b) => b.addEventListener('click', openCart));
  $$('[data-close-cart]').forEach((b) => b.addEventListener('click', closeCart));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });
  $('#cartLines').addEventListener('click', (e) => { const b = e.target.closest('[data-rm]'); if (b) { cart.splice(+b.dataset.rm, 1); renderCart(); } });
  buy.addEventListener('submit', (e) => {
    e.preventDefault();
    const p = plan();
    const line = cart.find((l) => l.plan === p);
    if (line) line.qty = Math.min(line.qty + qty, 6); else cart.push({ plan: p, qty });
    renderCart();
    auraTrack('add_to_cart', { currency: 'AUD', value: qty * PRICE[p], items: [{ item_id: 'AU-01', item_name: 'aura · 30 sticks', item_variant: p === 'sub' ? 'Every 4 weeks' : 'One box', price: PRICE[p], quantity: qty }] });
    cartCount.forEach((c) => { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); });
    setTimeout(openCart, 250);
  });
  // Checkout: hand the cart to Shopify as a cart permalink (/cart/VARIANT:QTY,...).
  // Shopify then owns payment, shipping, tax, order emails and accounts.
  const checkoutUrl = () => {
    if (!SHOP || !SHOP.domain) return null;
    const lines = cart.map((l) => (SHOP.variants[l.plan] ? `${SHOP.variants[l.plan]}:${l.qty}` : null));
    if (!lines.length || lines.includes(null)) return null;
    const u = new URL(`https://${SHOP.domain}/cart/${lines.join(',')}`);
    if (cart.some((l) => l.plan === 'sub') && SHOP.sellingPlan) u.searchParams.set('selling_plan', SHOP.sellingPlan);
    // Carry campaign tags through so checkout sales are credited to the right source
    new URLSearchParams(location.search).forEach((v, k) => { if (/^utm_/.test(k)) u.searchParams.set(k, v); });
    return u.toString();
  };
  $('#checkout').addEventListener('click', () => {
    auraTrack('begin_checkout', { currency: 'AUD', value: cart.reduce((s, l) => s + l.qty * PRICE[l.plan], 0) });
    const url = checkoutUrl();
    if (!url) { toast('Checkout is not connected in this draft'); return; }
    location.href = url;
  });
  renderCart();

  // Newsletter: every email field posts to Brevo (js/signup.js)
  if (window.auraWireSignup) {
    const say = (t) => toast(t);
    auraWireSignup($('#finalNews'), $('#finalEmail'), 'closing', say);
    auraWireSignup($('#bloomNews'), $('#bloomEmail'), 'bloom', say);
    auraWireSignup($('#news'), $('#newsEmail'), 'footer', say);
  }

  // ---------------------------------------------------------------------------
  // Reviews: real, verified Trustpilot reviews (au.trustpilot.com/review/jingherbal.com), quoted
  // verbatim, typos included. Only reviews that describe no skin or health outcome are used: a
  // customer quote carries the same weight as our own claim (claims register, Testimonials).
  // 6 of the 8 reviews as at 2026-09-28 describe skin results and are excluded; Germ H removed at
  // Tommy's request. All 8 are about the earlier blend (see decisions.md, 2026-09-28).
  const REVIEWS = [
    { rating: 5, name: 'PH', meta: 'Verified · Trustpilot · 5 June 2026', title: 'Great addition to my daily routine', text: 'I’ve been adding this into my morning smoothie, and it blends in really well without leaving any noticeable texture. Tastes great too! Really easy way to improve my diet' },
  ];
  const reviewRail = $('#reviewRail');
  if (reviewRail) {
    reviewRail.innerHTML = REVIEWS.map((r, i) => `
      <article class="rcard2" data-reveal style="--d:${Math.min(i, 3) * 100}ms">
        <div class="rcard2__top">
          <span class="rcard2__rating label">${r.rating} / 5</span>

        </div>
        <p class="rcard2__title">${r.title}</p>
        <p class="rcard2__text">\u201C${r.text}\u201D</p>
        <div class="rcard2__who">
          <span class="rcard2__avatar" aria-hidden="true">${r.name.charAt(0)}</span>
          <span class="rcard2__id"><span style="font-weight:600;color:var(--ink-900)">${r.name}</span>
          <span class="label" style="color:var(--ink-600)">${r.meta}</span></span>
        </div>
      </article>`).join('');
    // New reveal targets were added after setup; register them.
    $$('[data-reveal]', reviewRail).forEach((el) => reveals.push({ el, off: (parseFloat(el.style.getPropertyValue('--d')) || 0) / 600, last: -1 }));
  }

  // ---------------------------------------------------------------------------
  // Rails: arrow buttons, and drag to scroll with a mouse
  // ---------------------------------------------------------------------------
  $$('[data-rail-prev], [data-rail-next]').forEach((b) => b.addEventListener('click', () => {
    const rail = $('#' + (b.dataset.railPrev || b.dataset.railNext));
    const card = rail.firstElementChild;
    const step = card ? card.getBoundingClientRect().width + 20 : 320;
    rail.scrollBy({ left: b.dataset.railPrev ? -step : step, behavior: reduced ? 'auto' : 'smooth' });
  }));
  $$('.rail').forEach((rail) => {
    let down = false, sx = 0, sl = 0, moved = false;
    rail.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add('is-dragging'); });
    addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; rail.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { down = false; rail.classList.remove('is-dragging'); });
    // A drag should not count as a click on a card
    rail.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  });

  // ---------------------------------------------------------------------------
  // Instagram lightbox. Nothing loads from Instagram until a video is opened.
  // The uncaptioned embed is used: captions on these posts are not cleared.
  // ---------------------------------------------------------------------------
  const lb = $('#lightbox');
  const openLb = (id) => {
    $('#lbFrame').innerHTML = `<iframe src="https://www.instagram.com/p/${id}/embed/" title="Instagram video" allowfullscreen loading="eager"></iframe>`;
    $('#lbLink').href = `https://www.instagram.com/p/${id}/`;
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lb-open');
    if (lenis) lenis.stop();
    $('.lightbox__panel .drawer__close').focus({ preventScroll: true });
  };
  const closeLb = () => {
    if (!document.body.classList.contains('lb-open')) return;
    document.body.classList.remove('lb-open');
    lb.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
    setTimeout(() => ($('#lbFrame').innerHTML = ''), 480);
  };
  if (window.AURA_NO_EMBEDS) {
    // Hosts that block embedded sites: each card links out to the post instead
    $$('[data-ig]').forEach((c) => {
      const a = document.createElement('a');
      a.className = c.className;
      a.href = `https://www.instagram.com/p/${c.dataset.ig}/`;
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML = c.innerHTML;
      a.dataset.ig = c.dataset.ig;
      a.style.cssText = c.style.cssText;
      a.style.textDecoration = 'none';
      c.replaceWith(a);
    });
  } else {
    $$('[data-ig]').forEach((c) => c.addEventListener('click', () => openLb(c.dataset.ig)));
  }
  $$('[data-close-lb]').forEach((b) => b.addEventListener('click', closeLb));

  // Recipe cards play their video on hover (on touch screens: while the card is in view).
  // A card whose file is missing simply stays a typeset cover.
  const vcards = $$('.vcard').filter((c) => c.querySelector('.vcard__video'));
  const startVid = (card) => {
    const v = card.querySelector('.vcard__video');
    if (!v || reduced || card.dataset.novideo) return;
    if (!v.src) {
      v.src = v.dataset.src;
      v.addEventListener('error', () => { card.dataset.novideo = '1'; card.classList.remove('is-playing'); }, { once: true });
    }
    card._want = true;
    const go = () => { if (card._want) v.play().then(() => card.classList.add('is-playing')).catch(() => {}); };
    // The first play() can fail while the file is still loading: retry once it can play
    v.play().then(() => card.classList.add('is-playing')).catch(() => v.addEventListener('canplay', go, { once: true }));
  };
  const stopVid = (card) => {
    const v = card.querySelector('.vcard__video');
    card._want = false;
    card.classList.remove('is-playing');
    if (v && v.src) v.pause();
  };
  if (matchMedia('(hover: hover)').matches) {
    vcards.forEach((c) => {
      c.addEventListener('mouseenter', () => startVid(c));
      c.addEventListener('mouseleave', () => stopVid(c));
      c.addEventListener('focus', () => startVid(c));
      c.addEventListener('blur', () => stopVid(c));
    });
  } else if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver((es) => es.forEach((e) => (e.intersectionRatio > 0.7 ? startVid(e.target) : stopVid(e.target))), { threshold: [0, 0.7] });
    vcards.forEach((c) => vio.observe(c));
  }
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-shown');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('is-shown'), 2600);
  }
})();
