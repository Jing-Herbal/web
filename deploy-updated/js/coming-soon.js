/* aura — coming-soon page: launch notify form and the early-access code. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  // SHA-256 of the code in capitals. Change with: python tools/set-access-code.py NEWCODE
  const CODE_HASH = '901df555dd1487f2447207f48bae08a426167429c3b384d08a4b15faa0606152';
  const KEY = 'aura-early-access';
  const next = new URLSearchParams(location.search).get('next') || 'index.html';
  const safeNext = /^[\w\-]+(\.html)?(#[\w\-]*)?$/.test(next) ? next : 'index.html';
  const say = (el, text, ok) => { el.textContent = text; el.classList.toggle('is-ok', !!ok); el.hidden = !text; };

  // Launch notify: posts to Brevo (js/signup.js)
  window.auraWireSignup($('#notify'), $('#notifyEmail'), 'waitlist', (t, ok) => {
    say($('#notifyMsg'), ok ? 'Thank you. We’ll email you the day aura is ready.' : t, ok);
  });

  // Early access
  const toggle = $('#earlyToggle'), panel = $('#early');
  toggle.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) $('#earlyCode').focus();
  });
  const sha256 = async (s) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  };
  $('#early').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = $('#earlyCode').value.trim().toUpperCase();
    const msg = $('#earlyMsg');
    if (!code) return;
    if ((await sha256(code)) === CODE_HASH) {
      try { localStorage.setItem(KEY, 'yes'); } catch { /* storage unavailable */ }
      say(msg, 'You’re in.', true);
      setTimeout(() => location.replace(safeNext), 500);
    } else {
      say(msg, 'That code doesn’t match. Check it and try again.');
    }
  });
})();
