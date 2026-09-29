/* aura — pre-launch gate. Loaded first in <head> so a gated visitor never sees the page.
   A SOFT gate: it runs in the browser, so it keeps the site out of casual view but is not
   security. For a hard lock, use the host's password protection instead.

   Active only on the domains in HOSTS (so drafts and previews stay open), or when a page is
   opened with ?gate=on to try it. Set ON = false at launch.
   The early-access code is checked in js/coming-soon.js against a SHA-256 hash; to change it,
   run:  python tools/set-access-code.py NEWCODE */
(function () {
  var ON = true;
  var HOSTS = ['jingherbal.com', 'www.jingherbal.com'];
  var OPEN = ['coming-soon', 'privacy', 'terms', 'shipping-returns', '404'];
  var KEY = 'aura-early-access';

  // Works with both 'science.html' and Cloudflare's clean '/science' addresses
  var page = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '');
  var q = location.search;
  try {
    if (/[?&]gate=on\b/.test(q)) sessionStorage.setItem('aura-gate-test', '1');
    if (/[?&]gate=off\b/.test(q)) { sessionStorage.removeItem('aura-gate-test'); localStorage.removeItem(KEY); }
  } catch (e) { /* storage unavailable */ }

  var testing = false, unlocked = false;
  try { testing = sessionStorage.getItem('aura-gate-test') === '1'; unlocked = localStorage.getItem(KEY) === 'yes'; } catch (e) {}
  var active = ON && (HOSTS.indexOf(location.hostname) !== -1 || testing);

  if (active && !unlocked && OPEN.indexOf(page) === -1) {
    location.replace('coming-soon.html?next=' + encodeURIComponent(page + '.html' + location.hash));
  }
})();
