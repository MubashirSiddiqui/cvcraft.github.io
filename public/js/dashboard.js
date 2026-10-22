(function () {
  const $ = id => document.getElementById(id);
  const ACC = { navy: '#1f3a5f', emerald: '#0f766e', burgundy: '#8b1e3f', charcoal: '#2f3237', royal: '#2a55d6', gold: '#9a6b12', ocean: '#0e7490', plum: '#6b3fa0', forest: '#2f6b3a', slate: '#475569', crimson: '#b3261e', copper: '#b45309' };
  const REG = { gulf: 'Middle East', us: 'USA / Canada', uk: 'UK / Ireland', eu: 'Europe', au: 'Australia / NZ', sa: 'South Asia' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const api = (url, method, body) => fetch(url, { method: method || 'GET', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
    .then(r => r.json().then(j => { if (r.status === 401) { location.href = '/login'; throw new Error('auth'); } if (!r.ok) throw new Error(j.error || 'Something went wrong.'); return j; }));
  const toast = t => { const d = document.createElement('div'); d.className = 'toast2'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 3200); };
  const ago = s => { const d = new Date(s.replace(' ', 'T') + 'Z'), m = Math.round((Date.now() - d) / 6e4);
    return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); };
  let max = 25;

  function renderMe(u) {
    $('me').innerHTML = (u.picture ? '<img alt="" referrerpolicy="no-referrer" src="' + esc(u.picture) + '">' : '<span class="av">' + esc((u.name || u.email)[0].toUpperCase()) + '</span>') +
      '<span>' + esc(u.name || u.email) + '</span><span class="badge' + (u.premium ? ' pro' : '') + '">' + (u.premium ? 'Premium' : 'Free') + '</span>' +
      '<button class="lnk" id="out">Sign out</button>';
    $('out').onclick = () => api('/api/auth/logout', 'POST', {}).then(() => location.href = '/');
  }

  function render(cvs) {
    $('count').textContent = cvs.length ? cvs.length + ' of ' + max + ' saved' : 'Nothing here yet';
    const cards = cvs.map(c => '<article class="cv-card" data-id="' + c.id + '">' +
      '<a class="cv-thumb" href="/editor?id=' + c.id + '" aria-label="Open ' + esc(c.title) + '"><div class="cv-paper" style="--c:' + (ACC[c.palette] || '#0f766e') + '"><b>' + esc(c.name || 'Your name') + '</b><i style="width:55%"></i><i></i><i style="width:85%"></i><i style="width:70%"></i></div></a>' +
      '<div class="cv-info"><a href="/editor?id=' + c.id + '">' + esc(c.title) + '</a><small>' + (REG[c.region] ? REG[c.region] + ' · ' : '') + 'Edited ' + ago(c.updated_at) + '</small></div>' +
      '<div class="cv-act"><button class="lnk" data-a="rename">Rename</button><button class="lnk" data-a="dup">Duplicate</button><button class="lnk del" data-a="del">Delete</button></div></article>').join('');
    $('grid').innerHTML = '<button class="new-card" id="newCard"><div><span>+</span>New CV</div></button>' + cards +
      (cvs.length ? '' : '<p class="empty">Create your first CV. Pick a region and the form adapts to it.</p>');
    $('newCard').onclick = create;
  }

  function load() { return api('/api/cvs').then(d => { max = d.max; render(d.cvs); }).catch(e => e.message !== 'auth' && toast(e.message)); }
  function create() { api('/api/cvs', 'POST', { title: 'Untitled CV' }).then(r => location.href = '/editor?id=' + r.id).catch(e => toast(e.message)); }

  $('newBtn').onclick = create;
  $('grid').addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const id = b.closest('.cv-card').dataset.id, title = b.closest('.cv-card').querySelector('.cv-info a').textContent;
    if (b.dataset.a === 'rename') { const t = prompt('Rename CV', title); if (t && t.trim()) api('/api/cvs/' + id, 'PUT', { title: t }).then(load).catch(x => toast(x.message)); }
    if (b.dataset.a === 'dup') api('/api/cvs/' + id + '/duplicate', 'POST', {}).then(load).catch(x => toast(x.message));
    if (b.dataset.a === 'del' && confirm('Delete “' + title + '”? This can’t be undone.')) api('/api/cvs/' + id, 'DELETE').then(() => { toast('CV deleted'); load(); }).catch(x => toast(x.message));
  });

  api('/api/me').then(d => { if (!d.user) { location.href = '/login'; return; } renderMe(d.user); load(); }).catch(() => {});
})();
