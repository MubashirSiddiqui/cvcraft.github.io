/* Landing page: region demo + signed-in nav. */
(function () {
  const R = {
    gulf: { name: 'Middle East', paper: 'A4', pages: '1–2 pages', photo: true, sum: 'Professional Profile', det: ['Nationality', 'Date of birth', 'Marital status', 'Visa status', 'Notice period'],
      note: 'A passport-style photo on a plain background is expected. Nationality, visa status and notice period help recruiters shortlist you.' },
    us: { name: 'USA / Canada', paper: 'US Letter', pages: '1–2 pages', photo: false, sum: 'Professional Summary', det: [], contact: 'Work authorization',
      note: 'No photo, date of birth, marital status or nationality. Employers avoid them for anti-discrimination reasons, and ATS software reads a simple layout best.' },
    uk: { name: 'UK / Ireland', paper: 'A4', pages: '2 pages', photo: false, sum: 'Personal Statement', det: [], contact: 'Right to work',
      note: 'Open with a short personal statement. Leave out photo, date of birth and marital status; “References available on request” is fine.' },
    eu: { name: 'Europe', paper: 'A4', pages: '1–2 pages', photo: true, sum: 'Profile', det: ['Date of birth', 'Nationality', 'Marital status', 'Driving licence'],
      note: 'Tabular, reverse-chronological, with language levels in CEFR (for example German B2). A photo is common in Germany, Spain and Italy, and optional elsewhere.' },
    au: { name: 'Australia / NZ', paper: 'A4', pages: '2–3 pages', photo: false, sum: 'Career Summary', det: [], contact: 'Work rights',
      note: 'Longer is normal. Lead with a career summary, state your work rights and list two referees. No photo, date of birth or marital status.' },
    sa: { name: 'South Asia', paper: 'A4', pages: '1–2 pages', photo: true, sum: 'Career Objective', det: ["Father’s name", 'Date of birth', 'Nationality', 'Marital status', 'Notice period'],
      note: 'Start with a short career objective. Personal details are common, a photo is optional, and many CVs end with a short declaration.' }
  };
  const $ = id => document.getElementById(id);
  const tabs = $('tabs');
  if (tabs) {
    tabs.innerHTML = Object.keys(R).map((k, i) => '<button class="tab" role="tab" data-k="' + k + '" aria-selected="' + (i === 0) + '">' + R[k].name + '</button>').join('');
    const show = k => {
      const r = R[k];
      tabs.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.k === k));
      const det = r.det.length ? r.det.map(d => '<span><b>' + d + '</b></span>').join('') : '<span><b>' + (r.contact || '') + '</b></span>';
      $('sheet').innerHTML =
        '<div class="sh-head">' + (r.photo ? '<div class="sh-photo">Photo</div>' : '') +
        '<div><div class="sh-name">Amina Rahman</div><div class="sh-role">Operations Manager</div></div></div>' +
        '<div class="sh-det">' + det + '</div>' +
        '<div class="sh-sec">' + r.sum + '</div><div class="sk"></div><div class="sk" style="width:86%"></div><div class="sk" style="width:70%"></div>' +
        '<div class="sh-sec">Work Experience</div><div class="sk"></div><div class="sk" style="width:90%"></div><div class="sk" style="width:60%"></div>' +
        '<div class="sh-sec">Education</div><div class="sk" style="width:75%"></div>';
      $('side').innerHTML = '<dt>Paper</dt><dd>' + r.paper + '</dd><dt>Length</dt><dd>' + r.pages + '</dd><dt>Photo</dt><dd>' + (r.photo ? 'Included' : 'Left out') + '</dd>';
      $('note').textContent = r.note;
    };
    tabs.addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) show(b.dataset.k); });
    show('gulf');
  }
  if (window.CVCRAFT_CONFIG && $('priceLbl')) $('priceLbl').textContent = window.CVCRAFT_CONFIG.priceLabel;

  fetch('/api/me').then(r => r.json()).then(d => {
    if (!d.user) return;
    $('navRight').innerHTML = '<a class="btn2 solid sm" href="/dashboard">Open dashboard</a>';
    const c = $('heroCta'); if (c) { c.href = '/dashboard'; c.lastChild.textContent = 'Open your dashboard'; }
  }).catch(() => {});
})();
