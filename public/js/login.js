(function () {
  const msg = document.getElementById('msg');
  const say = (t, err) => { msg.textContent = t || ''; msg.className = 'msg' + (err ? ' err' : ''); };
  const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) })
    .then(r => r.json().then(j => { if (!r.ok) throw new Error(j.error || 'Sign-in failed.'); return j; }));
  const done = () => { location.href = '/dashboard'; };

  fetch('/api/config').then(r => r.json()).then(cfg => {
    if (cfg.devLogin) {
      const f = document.getElementById('devForm'); f.hidden = false;
      f.addEventListener('submit', e => { e.preventDefault(); post('/api/auth/dev', { email: document.getElementById('devEmail').value }).then(done).catch(x => say(x.message, 1)); });
    }
    if (!cfg.googleClientId) {
      say('Google sign-in isn’t set up yet. Add GOOGLE_CLIENT_ID to server/.env and restart the server.', true);
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
    s.onload = () => {
      google.accounts.id.initialize({
        client_id: cfg.googleClientId,
        callback: r => { say('Signing you in…'); post('/api/auth/google', { credential: r.credential }).then(done).catch(x => say(x.message, 1)); }
      });
      google.accounts.id.renderButton(document.getElementById('gbtn'), { theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', width: 320 });
    };
    s.onerror = () => say('Couldn’t load Google sign-in. Check your connection and refresh.', true);
    document.head.appendChild(s);
  }).catch(() => say('Couldn’t reach the server. Refresh and try again.', true));
})();
