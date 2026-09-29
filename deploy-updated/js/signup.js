/* aura — email sign-ups go to Brevo ("Join the Jing Community" list).
   Used by every email field on the site: coming-soon, footer, closing section, bloom card.
   Brevo's own embed is not used; the site's fields post to the same form endpoint so the
   design stays ours. Brevo does not validate the address, so we do, before sending. */
(() => {
  'use strict';
  const ACTION = 'https://91b1bfc9.sibforms.com/serve/MUIFAE2j0NTI905dJ163yyDTrlGdRTnnKmKySUnfr7Y0GgKZnhnSAcu0I3Xt9zP6X1sU4Efr8x1UXo6RESffmsD5DahS-n-AqGlpukD9JNC7JYe3enl_eZnYJ7XcnC4i2rZsPl5w1RnzNs9VwatGk6j-mI4zBkYQurI7MDsdeOpSqbrp1SHqub9PeEsTH-iwD7Vh6lEJbUuilq4aFw==';
  const VALID = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Resolves to 'ok', 'invalid' or 'error'
  window.auraSubscribe = async (email, source) => {
    email = (email || '').trim();
    if (!VALID.test(email)) return 'invalid';
    const body = new URLSearchParams({ EMAIL: email, email_address_check: '', locale: 'en' });
    try {
      const r = await fetch(`${ACTION}?isAjax=1`, { method: 'POST', body, mode: 'cors' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.success) return 'error';
      if (window.auraTrack) window.auraTrack('sign_up', { method: source || 'form' });
      return 'ok';
    } catch {
      return 'error';
    }
  };

  // Wire a form: input, button and a message element (or a toast function)
  window.auraWireSignup = (form, input, source, say) => {
    if (!form || !input) return;
    if (!say) {
      const msg = document.createElement('p');
      msg.className = 'form-msg label';
      msg.setAttribute('role', 'status');
      msg.hidden = true;
      form.insertAdjacentElement('afterend', msg);
      say = (t, ok) => { msg.textContent = t; msg.classList.toggle('is-ok', !!ok); msg.hidden = false; };
    }
    const btn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }
      const res = await window.auraSubscribe(input.value, source);
      if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); }
      if (res === 'ok') { say('Thank you. You’re on the list.', true); form.reset(); }
      else if (res === 'invalid') say('That email doesn’t look right.');
      else say('That didn’t go through. Please try again in a moment.');
    });
  };
})();
