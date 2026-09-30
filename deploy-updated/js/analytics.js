/* aura — Google Analytics 4 and the Meta Pixel, with one cookie notice.
   Off until HOSTS lists the live domain, so drafts and previews send nothing.
   Notice with opt-out (decided 2026-09-30): tracking runs by default and a small notice says so,
   with an Opt out button that stops it (remembered per browser, reopened from "Cookie settings").
   Visitors whose time zone is in Europe (EU/EEA/UK rules) get the opt-in version instead: nothing
   runs until Accept. Browsers sending Global Privacy Control start opted out.
   Events (GA4 name → Meta name):
     page views (automatic)            → PageView
     view_item      (shop seen)        → ViewContent
     add_to_cart                       → AddToCart
     begin_checkout                    → InitiateCheckout
     sign_up        (each email form)  → Lead
     select_content (recipe cards)     → (GA4 only)
   Purchases happen on the checkout platform; track them there (Shopify's Google & YouTube
   and Facebook & Instagram apps) with the same GA4 property and the same pixel. */
(() => {
  'use strict';
  const GA_ID = 'G-0C4XD13P14';              // GA4 Measurement ID (supplied 2026-09-29)
  const META_PIXEL = '1781988629603035';    // Meta Pixel ID (supplied 2026-09-29)
  const HOSTS = ['jingherbal.com', 'www.jingherbal.com'];
  const KEY = 'aura-consent';               // 'granted' | 'denied', kept in this browser only

  const on = HOSTS.includes(location.hostname) && (GA_ID || META_PIXEL);
  const META_EVENTS = { view_item: 'ViewContent', add_to_cart: 'AddToCart', begin_checkout: 'InitiateCheckout', sign_up: 'Lead' };
  let consent = null;
  try { consent = localStorage.getItem(KEY); } catch { /* storage unavailable */ }
  // Europe: opt-in. Judged from the time zone, which needs no request and errs towards Europe
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { /* no Intl */ }
  const optIn = /^Europe\/|^Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe)/.test(tz);
  const gpc = navigator.globalPrivacyControl === true;
  // No stored choice: on by default, except in Europe or with Global Privacy Control
  const tracking = () => consent ? consent === 'granted' : !(optIn || gpc);

  // One call site for the whole site: sends to GA4, and to Meta once consent is given
  window.auraTrack = (name, params) => {
    if (!on) return;
    params = params || {};
    if (GA_ID && window.gtag) window.gtag('event', name, params);
    const m = META_EVENTS[name];
    if (m && META_PIXEL && window.fbq && tracking()) {
      const items = params.items || [];
      window.fbq('track', m, items.length ? {
        currency: params.currency || 'AUD',
        value: params.value,
        content_ids: items.map((i) => i.item_id),
        content_type: 'product',
      } : {});
    }
  };
  if (!on) return;

  // Google: Consent Mode, set from the visitor's current choice
  if (GA_ID) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    const g = tracking() ? 'granted' : 'denied';
    gtag('consent', 'default', { analytics_storage: g, ad_storage: g, ad_user_data: g, ad_personalization: g, wait_for_update: 500 });
    gtag('js', new Date());
    const shop = window.AURA_DATA && window.AURA_DATA.SHOP && window.AURA_DATA.SHOP.domain;
    gtag('config', GA_ID, shop ? { linker: { domains: HOSTS.concat(shop) } } : {});
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
  }

  // Meta: the pixel script is only fetched while tracking is on
  let metaLoaded = false;
  const loadMeta = () => {
    if (metaLoaded || !META_PIXEL) return;
    metaLoaded = true;
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', META_PIXEL);
    window.fbq('track', 'PageView');
  };
  if (tracking()) loadMeta();

  // Cookie notice. Opt-out version by default; opt-in version for Europe
  const note = document.createElement('div');
  note.className = 'consent';
  note.setAttribute('role', 'dialog');
  note.setAttribute('aria-label', 'Cookies');
  const text = 'We use cookies to see how the site is used, and to measure and show our ads on Facebook and Instagram.';
  const render = () => {
    const btns = optIn
      ? '<button type="button" class="btn btn--outline" data-consent="denied">Decline</button><button type="button" class="btn" data-consent="granted">Accept</button>'
      : tracking()
        ? '<button type="button" class="btn btn--outline" data-consent="denied">Opt out</button><button type="button" class="btn" data-consent="granted">OK</button>'
        : '<button type="button" class="btn btn--outline" data-consent="close">Keep off</button><button type="button" class="btn" data-consent="granted">Turn on</button>';
    const state = optIn || tracking() || !consent ? '' : ' They are off for you now.';
    note.innerHTML = `<p>${text}${state} <a href="privacy.html">Privacy</a></p><div class="consent__btns">${btns}</div>`;
  };
  const show = () => { render(); document.body.appendChild(note); requestAnimationFrame(() => note.classList.add('is-in')); };
  const hide = () => { note.classList.remove('is-in'); setTimeout(() => note.remove(), 400); };
  const choose = (v) => {
    const was = tracking();
    consent = v;
    try { localStorage.setItem(KEY, v); } catch { /* storage unavailable */ }
    if (GA_ID) gtag('consent', 'update', { analytics_storage: v, ad_storage: v, ad_user_data: v, ad_personalization: v });
    if (v === 'granted') { if (window.fbq && !was) window.fbq('consent', 'grant'); loadMeta(); }
    else if (window.fbq) window.fbq('consent', 'revoke');
    hide();
  };
  note.addEventListener('click', (e) => {
    const b = e.target.closest('[data-consent]');
    if (!b) return;
    if (b.dataset.consent === 'close') hide(); else choose(b.dataset.consent);
  });
  // Shown once until answered; Global Privacy Control visitors outside Europe aren't asked
  if (!consent && !(gpc && !optIn)) addEventListener('load', show);
  document.addEventListener('click', (e) => { if (e.target.closest('[data-cookie-settings]')) { e.preventDefault(); show(); } });

  // Shop seen
  const shop = document.getElementById('shop');
  if (shop && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      if (es.some((x) => x.isIntersecting)) {
        io.disconnect();
        auraTrack('view_item', { currency: 'AUD', items: [{ item_id: 'AU-01', item_name: 'aura · 30 sticks' }] });
      }
    }, { threshold: 0.4 });
    io.observe(shop);
  }

  // Recipe cards (GA4 only)
  document.addEventListener('click', (e) => {
    const c = e.target.closest('.vcard');
    if (!c) return;
    const t = c.querySelector('.vcard__title');
    auraTrack('select_content', { content_type: 'recipe', item_id: t ? t.textContent.trim() : '' });
  });
})();
