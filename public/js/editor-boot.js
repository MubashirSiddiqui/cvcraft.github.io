/* Loads the signed-in user + the CV being edited, then starts the original builder. */
(function () {
  const params = new URLSearchParams(location.search), id = params.get('id');
  const go = u => { location.replace(u); };
  if (!id) return go('/dashboard');
  const J = r => r.json().then(j => ({ ok: r.ok, status: r.status, j }));
  Promise.all([fetch('/api/me').then(J), fetch('/api/cvs/' + encodeURIComponent(id)).then(J)]).then(([me, cv]) => {
    if (!me.j.user) return go('/login');
    if (!cv.ok) return go('/dashboard');
    const state = document.getElementById('saveState'), titleEl = document.getElementById('cvTitle');
    let timer = null, pending = null, title = cv.j.title;
    titleEl.value = title;
    const say = (t, err) => { state.textContent = t; state.className = 'save-state' + (err ? ' err' : ''); };
    const put = (body, keepalive) => fetch('/api/cvs/' + encodeURIComponent(id), { method: 'PUT', keepalive: !!keepalive, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(r => { if (r.status === 401) return go('/login'); if (!r.ok) throw 0; });
    function flush(keepalive) {
      clearTimeout(timer); if (!pending) return Promise.resolve();
      const data = pending; pending = null; say('Saving…');
      return put({ data }, keepalive).then(() => { if (!pending) say('Saved'); }).catch(() => { pending = pending || data; say('Not saved. Retrying…', true); timer = setTimeout(flush, 4000); });
    }
    titleEl.addEventListener('change', () => { title = titleEl.value.trim() || 'Untitled CV'; titleEl.value = title; say('Saving…'); put({ title }).then(() => say('Saved')).catch(() => say('Not saved', true)); });
    window.addEventListener('pagehide', () => flush(true));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(true); });

    window.CVBOOT = {
      user: me.j.user, demoUnlock: !!me.j.demoUnlock, cv: { id, title, data: cv.j.data },
      saveRemote: s => { pending = JSON.parse(JSON.stringify(s)); say('Unsaved changes'); clearTimeout(timer); timer = setTimeout(flush, 800); }
    };
    ['js/profiles.js', 'js/templates.js', 'js/export.js', 'js/app.js'].reduce((p, src) => p.then(() => new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.body.appendChild(s);
    })), Promise.resolve()).then(() => say('Saved')).catch(() => say('Failed to load the editor. Refresh the page.', true));
  }).catch(() => go('/dashboard'));
})();
