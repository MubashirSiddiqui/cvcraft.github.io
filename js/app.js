/* CVCraft app: region-aware wizard form, live preview, health check, helpers and downloads. */
(function () {
  'use strict';

  const CFG = window.CVCRAFT_CONFIG;
  const T = window.CVTemplates;
  const X = window.CVExport;
  const P = window.CVProfiles;
  const STORE = 'cvcraft_v2';
  const OLD_STORE = 'cvcraft_v1';
  const PREMIUM_KEY = 'cvcraft_premium';
  const STEPS = ['Target', 'Personal', 'Profile', 'Experience', 'Education', 'More', 'Design & Download'];
  const LEVEL_OPTS = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic'];
  const esc = T.esc;

  /* ---------------- state ---------------- */
  function newExp() { return { role: '', company: '', loc: '', start: '', end: '', current: false, bullets: '' }; }
  function newEdu() { return { degree: '', school: '', loc: '', year: '', note: '' }; }
  function newCert() { return { name: '', issuer: '', year: '' }; }
  function newReferee() { return { name: '', role: '', contact: '' }; }

  function blank(region) {
    const pr = P.get(region || 'gulf');
    const ck = Object.keys(pr.countries)[0];
    return {
      region: pr.id, country: ck, industry: 'general', level: 'mid',
      p: { fullName: '', title: '', email: '', phone: '', whatsapp: '', city: '', nationality: '', dob: '', marital: '', visa: '', license: '', notice: '', workAuth: '', fatherName: '', linkedin: '', website: '', photo: '' },
      summary: '',
      exp: [newExp()],
      edu: [newEdu()],
      skills: '',
      langs: [{ name: 'English', level: 'Fluent' }],
      certs: [newCert()],
      licenses: [newCert()],
      interests: '',
      referees: [newReferee(), newReferee()],
      design: { template: pr.recommended[0] || 'classic', palette: 'navy', font: 'inter', showPhoto: !!pr.countries[ck].photoDefault, refs: true, declaration: !!pr.declaration, show: {} }
    };
  }

  /* Region-flavoured sample data so every profile can be previewed with realistic content. */
  const SAMPLE_REGION = {
    gulf: { name: 'Ahmed Khan', country: 'UAE', city: 'Dubai, UAE', phone: '+971 50 123 4567', cur: 'AED 120M', save: 'AED 2.3M',
      p: { nationality: 'Pakistani', dob: '1991-04-12', marital: 'Married', visa: 'Residence visa – transferable', license: 'UAE license – valid', notice: '30 days', whatsapp: '+971 50 123 4567' } },
    us: { name: 'Daniel Carter', country: 'USA', city: 'Austin, TX', phone: '+1 512 555 0142', cur: '$35M', save: '$600K',
      p: { workAuth: 'Authorized to work in the US', website: 'danielcarter.com' } },
    uk: { name: 'Oliver Bennett', country: 'GBR', city: 'Manchester, UK', phone: '+44 7700 900123', cur: '£25M', save: '£450K',
      p: { workAuth: 'Full right to work in the UK' } },
    eu: { name: 'Jonas Weber', country: 'DEU', city: 'Berlin, Germany', phone: '+49 30 1234 5678', cur: '€30M', save: '€500K',
      p: { nationality: 'German', dob: '1991-04-12', license: 'Class B' } },
    au: { name: 'Liam Johnson', country: 'AUS', city: 'Sydney, NSW', phone: '+61 412 345 678', cur: 'A$40M', save: 'A$700K',
      p: { workAuth: 'Australian citizen' },
      referees: [{ name: 'Sarah Mitchell', role: 'Project Director, Metro Build', contact: '+61 400 111 222 · sarah.mitchell@email.com' }, { name: 'David Nguyen', role: 'General Manager, Coastal Civil', contact: '+61 400 333 444 · david.nguyen@email.com' }] },
    sa: { name: 'Ahmed Khan', country: 'PAK', city: 'Lahore, Pakistan', phone: '+92 300 1234567', cur: 'PKR 2.5B', save: 'PKR 40M',
      p: { fatherName: 'Muhammad Khan', nationality: 'Pakistani', dob: '1991-04-12', marital: 'Married', notice: '30 days', whatsapp: '+92 300 1234567' } }
  };

  function sample(region) {
    const pr = P.get(region || 'gulf');
    const r = SAMPLE_REGION[pr.id] || SAMPLE_REGION.gulf;
    const s = blank(pr.id);
    s.country = r.country; s.industry = 'engineering'; s.level = 'mid';
    s.design.showPhoto = !!pr.countries[r.country].photoDefault;
    const email = r.name.toLowerCase().replace(/\s+/g, '.') + '@email.com';
    s.p = Object.assign(s.p, { fullName: r.name, title: 'Senior Civil Engineer', email: email, phone: r.phone, city: r.city, linkedin: 'linkedin.com/in/' + r.name.toLowerCase().replace(/\s+/g, '') }, r.p);
    s.summary = 'Chartered civil engineer with 11+ years of experience delivering high-rise and infrastructure projects. Proven record of managing multi-disciplinary teams, controlling budgets up to ' + r.cur + ' and completing projects ahead of schedule.' + (pr.closing(r.city.split(',').pop().trim()) ? ' ' + pr.closing(pr.countries[r.country].short) : '');
    s.exp = [
      { role: 'Senior Civil Engineer', company: 'Skyline Construction', loc: r.city, start: 'Mar 2019', end: '', current: true, bullets: 'Led site execution of a 42-storey residential tower (' + r.cur + ') with a team of 35 engineers and supervisors\nCut rework by 18% by introducing weekly quality audits and digital snagging\nCoordinated with consultants and authorities to secure all approvals on time\nManaged subcontractors and procurement, saving ' + r.save + ' through value engineering' },
      { role: 'Site Engineer', company: 'Metro Engineering', loc: r.city, start: 'Jun 2015', end: 'Feb 2019', current: false, bullets: 'Supervised structural works for commercial buildings up to 15 floors\nPrepared BOQs, progress reports and monthly valuations\nEnsured compliance with HSE standards, achieving 1.2M man-hours without LTI' }
    ];
    s.edu = [{ degree: 'B.Sc. Civil Engineering', school: 'State Technical University', loc: '', year: '2015', note: 'First class honours' }];
    s.skills = 'Project Management, AutoCAD, Primavera P6, MS Project, Contract Administration, Quantity Surveying, Quality Control, HSE Compliance, Team Leadership';
    s.langs = [{ name: 'English', level: 'Fluent' }, { name: 'Urdu', level: 'Native' }, { name: 'Arabic', level: 'Basic' }];
    s.certs = [{ name: 'PMP – Project Management Professional', issuer: 'PMI', year: '2021' }, { name: 'NEBOSH IGC', issuer: 'NEBOSH', year: '2020' }];
    s.licenses = [{ name: 'Professional engineering body – Member', issuer: '', year: '2019' }];
    s.interests = 'Cricket, Mentoring graduates, Photography';
    if (r.referees) s.referees = r.referees;
    return s;
  }

  function hydrate(o) {
    const region = o && P.PROFILES[o.region] ? o.region : 'gulf';
    const b = blank(region);
    const s = Object.assign(b, o || {}, { p: Object.assign(b.p, (o && o.p) || {}), design: Object.assign(b.design, (o && o.design) || {}) });
    s.region = region;
    const pr = P.get(region);
    if (!pr.countries[s.country]) s.country = Object.keys(pr.countries)[0];
    ['exp', 'edu', 'langs', 'certs', 'licenses', 'referees'].forEach(function (k) { if (!Array.isArray(s[k]) || !s[k].length) s[k] = b[k]; });
    if (typeof s.interests !== 'string') s.interests = '';
    if (!s.design.show || typeof s.design.show !== 'object') s.design.show = {};
    return s;
  }

  let state = load();
  let step = 0;
  let lastPages = 1;
  let summaryVariant = 0;

  function load() {
    try {
      const raw = localStorage.getItem(STORE) || localStorage.getItem(OLD_STORE);
      if (raw) return hydrate(JSON.parse(raw));
    } catch (e) { /* ignore */ }
    return blank('gulf');
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* quota */ } }

  function profile() { return P.get(state.region); }
  function country() { const pr = profile(); return pr.countries[state.country] || pr.countries[Object.keys(pr.countries)[0]]; }
  function industry() { return profile().industries.find(function (x) { return x.id === state.industry; }) || profile().industries[0]; }

  function getPath(path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, state); }
  function setPath(path, v) {
    const keys = path.split('.');
    let o = state;
    for (let i = 0; i < keys.length - 1; i++) {
      if (o[keys[i]] == null) o[keys[i]] = {};
      o = o[keys[i]];
    }
    o[keys[keys.length - 1]] = v;
  }

  function isPremium() { return !CFG.paywallEnabled || localStorage.getItem(PREMIUM_KEY) === '1'; }

  function applyRegion(id) {
    const pr = P.get(id);
    state.region = pr.id;
    state.country = Object.keys(pr.countries)[0];
    state.design.template = pr.recommended[0] || 'classic';
    state.design.showPhoto = !!pr.countries[state.country].photoDefault;
    state.design.declaration = !!pr.declaration;
    state.design.show = {};
  }

  /* ---------------- form helpers ---------------- */
  function field(label, path, o) {
    o = o || {};
    const v = getPath(path);
    const cls = 'fld' + (o.full ? ' full' : '');
    let input;
    if (o.select) {
      input = '<select data-bind="' + path + '">' + o.select.map(function (opt) {
        const val = typeof opt === 'string' ? opt : opt.id;
        const lab = typeof opt === 'string' ? (opt || '—') : opt.label;
        return '<option value="' + esc(val) + '"' + (val === v ? ' selected' : '') + '>' + esc(lab) + '</option>';
      }).join('') + '</select>';
    } else if (o.area) {
      input = '<textarea data-bind="' + path + '" rows="' + (o.rows || 4) + '" placeholder="' + esc(o.ph || '') + '">' + esc(v || '') + '</textarea>';
    } else {
      input = '<input type="' + (o.type || 'text') + '" data-bind="' + path + '" value="' + esc(v || '') + '" placeholder="' + esc(o.ph || '') + '"' + (o.list ? ' list="' + o.list + '"' : '') + '>';
    }
    return '<label class="' + cls + '"><span>' + esc(label) + '</span>' + input + (o.hint ? '<small class="hint">' + esc(o.hint) + '</small>' : '') + '</label>';
  }

  function check(label, path, def) {
    const v = getPath(path);
    const on = v === undefined ? def : (def ? v !== false : !!v);
    return '<label class="check"><input type="checkbox" data-bind="' + path + '"' + (on ? ' checked' : '') + '> ' + esc(label) + '</label>';
  }

  function repeatCard(title, listName, i, body, canDelete) {
    return '<div class="card"><div class="card-head"><span>' + esc(title) + ' ' + (i + 1) + '</span>' +
      (canDelete ? '<button class="link-btn" data-action="del" data-list="' + listName + '" data-i="' + i + '">Remove</button>' : '') + '</div>' + body + '</div>';
  }

  function tipsBox(title, arr) {
    if (!arr || !arr.length) return '';
    return '<div class="tips"><h4>' + esc(title) + '</h4><ul>' + arr.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>';
  }

  function pagesText(pr) { return pr.maxPages === 1 ? '1 page' : '1–' + pr.maxPages + ' pages'; }

  /* ---------------- bullet + summary helpers (rule-based, no server needed) ---------------- */
  const WEAK = /^(responsible for|duties (included|include)|worked on|helped (with|to)|tasked with|assisted with|in charge of)/i;
  function bulletLines(text) { return String(text || '').split(/\n+/).map(function (s) { return s.replace(/^\s*[-•*·▪]\s*/, '').trim(); }).filter(Boolean); }

  function bulletHint(text) {
    const ls = bulletLines(text);
    if (!ls.length) return { msg: 'Add 3–6 achievement lines, one per line.', warn: false };
    const nums = ls.filter(function (l) { return /\d/.test(l); }).length;
    const weak = ls.filter(function (l) { return WEAK.test(l); }).length;
    const bits = [ls.length + (ls.length > 1 ? ' bullets' : ' bullet'), nums + ' with numbers'];
    let warn = false;
    if (ls.length < 3) { bits.push('aim for 3–6'); warn = true; }
    if (ls.length > 8) { bits.push('too many — keep your best 6'); warn = true; }
    if (nums === 0) { bits.push('add numbers (%, money, team size)'); warn = true; }
    if (weak) { bits.push(weak + ' weak opener' + (weak > 1 ? 's' : '') + ' (“Responsible for…”) — start with an action verb'); warn = true; }
    return { msg: bits.join(' · '), warn: warn };
  }

  function yearsExp() {
    const y = new Date().getFullYear();
    let min = 9999;
    state.exp.forEach(function (e) { const m = /(19|20)\d{2}/.exec(e.start || ''); if (m) min = Math.min(min, parseInt(m[0], 10)); });
    return min < 9999 ? Math.max(1, y - min) : null;
  }

  function listJoin(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

  function draftSummary() {
    const pr = profile(), c = country();
    const title = (state.p.title || 'professional').trim();
    const years = yearsExp();
    const sk = String(state.skills || '').split(/[,\n]+/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 3);
    const skText = sk.length ? listJoin(sk) : 'core technical and people skills';
    const ind = industry();
    const indText = ind.id === 'general' ? '' : ' in ' + ind.label.replace(/ & /g, ' and ').toLowerCase();
    const close = pr.closing(c.short || c.name);
    const v = summaryVariant % 2;
    summaryVariant++;
    if (pr.id === 'sa') {
      return v === 0
        ? 'To secure a challenging position as ' + title + ' where I can apply my ' + (years ? years + '+ years of ' : '') + 'experience in ' + skText + ' and contribute to the growth of the organisation.'
        : 'Dedicated ' + title + (years ? ' with ' + years + '+ years of experience' : '') + ' seeking a role that offers learning, responsibility and growth. Strong in ' + skText + '.';
    }
    if (state.level === 'fresh') {
      return (v === 0
        ? 'Motivated recent graduate seeking an entry-level ' + title + ' role. Solid foundation in ' + skText + ', with a quick-learning, team-oriented approach and strong attention to detail.'
        : 'Enthusiastic graduate aiming to start a career as ' + title + '. Hands-on with ' + skText + ' through coursework and projects, eager to contribute from day one.') + (close ? ' ' + close : '');
    }
    const yrs = years ? years + '+ years of experience' : (state.level === 'senior' ? '10+ years of experience' : 'proven experience');
    return (v === 0
      ? title + ' with ' + yrs + indText + '. Skilled in ' + skText + '. Known for delivering results on time and within budget while working effectively with teams and stakeholders.'
      : 'Results-driven ' + title + ' with ' + yrs + indText + '. Strengths include ' + skText + ', clear communication and a record of measurable achievements.') + (close ? ' ' + close : '');
  }

  /* ---------------- CV health check ---------------- */
  function health() {
    const pr = profile(), p = state.p;
    const n = T.normalize(state, pr);
    const items = [];
    function add(status, text, tip) { items.push({ status: status, text: text, tip: tip || '' }); }

    add(p.fullName ? 'pass' : 'fail', 'Name added', p.fullName ? '' : 'Add your full name.');
    add(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email || '') ? 'pass' : 'fail', 'Valid email address', 'Recruiters need a working email.');
    add(p.phone ? 'pass' : 'fail', 'Phone number added', 'Add a number recruiters can call or message.');
    add(p.title ? 'pass' : 'warn', 'Target job title added', 'A clear title under your name helps screening.');

    const sl = (state.summary || '').trim().length;
    add(sl === 0 ? 'fail' : (sl < 150 || sl > 700) ? 'warn' : 'pass', pr.labels.summary + ' ' + (sl === 0 ? 'is empty' : 'length (' + sl + ' characters)'), 'Aim for 250–500 characters: title, years, strengths, goal.');

    const exps = state.exp.filter(function (e) { return e.role || e.company; });
    if (state.level === 'fresh') {
      add(exps.length || state.edu.some(function (e) { return e.degree; }) ? 'pass' : 'warn', 'Education or internships listed', 'Add your degree and any internships or projects.');
    } else {
      add(exps.length ? 'pass' : 'fail', 'Work experience added', 'Add at least your most recent role.');
    }
    if (exps.length) {
      const counts = exps.map(function (e) { return bulletLines(e.bullets).length; });
      const thin = counts.filter(function (c) { return c < 3; }).length;
      add(thin === 0 ? 'pass' : 'warn', 'Each role has 3+ achievement bullets', thin + ' role(s) have fewer than 3 bullets.');
      const all = [].concat.apply([], exps.map(function (e) { return bulletLines(e.bullets); }));
      const withNum = all.filter(function (l) { return /\d/.test(l); }).length;
      add(all.length && withNum / all.length >= 0.4 ? 'pass' : 'warn', 'Achievements include numbers (' + withNum + ' of ' + all.length + ')', 'Add %, money, team size or time saved to at least 40% of bullets.');
      const weak = all.filter(function (l) { return WEAK.test(l); }).length;
      add(weak === 0 ? 'pass' : 'warn', 'Bullets start with action verbs', weak + ' bullet(s) start with “Responsible for…” or similar.');
      add(exps.every(function (e) { return e.start; }) ? 'pass' : 'warn', 'Every role has a start date', 'Recruiters scan dates first.');
    }
    add(state.edu.some(function (e) { return e.degree || e.school; }) ? 'pass' : 'warn', 'Education listed', 'Add your highest qualification.');
    const sk = n.skills.length;
    add(sk >= 6 && sk <= 15 ? 'pass' : 'warn', 'Skills list (' + sk + ')', 'Aim for 6–15 skills relevant to the job.');

    add(lastPages <= pr.maxPages ? 'pass' : 'warn', 'Length: ' + lastPages + (lastPages === 1 ? ' page' : ' pages') + ' (' + pr.label + ' norm: ' + pagesText(pr) + ')', 'Trim older roles or shorten bullets.');

    if (pr.photo === 'avoid') {
      add(n.photo ? 'warn' : 'pass', 'No photo (' + pr.label + ' norm)', 'A photo is not expected here and can work against you.');
    } else if (pr.photo === 'recommended') {
      add(n.photo ? 'pass' : 'warn', 'Photo added (expected in ' + pr.label + ')', 'Add a passport-style photo on a plain background.');
    }

    const missing = [];
    (pr.expected || []).forEach(function (k) {
      if (k === 'photo' || k === 'referees') return;
      if (pr.formFields.indexOf(k) > -1 && !String(p[k] || '').trim()) missing.push(pr.fields[k].cvLabel || pr.fields[k].label);
    });
    if ((pr.expected || []).length) {
      add(missing.length ? 'warn' : 'pass', 'Region details complete', missing.length ? 'Missing: ' + missing.join(', ') + '.' : '');
    }
    if ((pr.expected || []).indexOf('referees') > -1) {
      add(n.referees.length >= 2 ? 'pass' : 'warn', 'Two referees listed', 'Australian / NZ employers expect two referees with contact details.');
    }
    if (pr.photo === 'avoid' && ['sidebar', 'banner', 'europass'].indexOf(state.design.template) > -1) {
      add('warn', 'Layout is ATS-friendly', 'Multi-column layouts can confuse applicant tracking systems; “ATS Simple” or “Classic” is safer here.');
    }

    let pts = 0;
    items.forEach(function (it) { pts += it.status === 'pass' ? 1 : it.status === 'warn' ? 0.5 : 0; });
    return { items: items, score: Math.round(100 * pts / items.length) };
  }

  function healthClass(score) { return score >= 80 ? 'good' : score >= 55 ? 'ok' : 'low'; }

  function openInfo(html) {
    document.getElementById('infoBody').innerHTML = html;
    document.getElementById('infoModal').hidden = false;
  }

  function showHealth() {
    const h = health();
    const icon = { pass: '✓', warn: '!', fail: '✕' };
    openInfo('<h3>CV health check</h3><p class="hint" style="margin:0">Quick checks against ' + esc(profile().label) + ' norms.</p>' +
      '<div class="score-bar"><span style="width:' + h.score + '%"></span></div><b>' + h.score + '% ready</b>' +
      '<div style="margin-top:8px">' + h.items.map(function (it) {
        return '<div class="chk ' + it.status + '"><i>' + icon[it.status] + '</i><div>' + esc(it.text) + (it.status !== 'pass' && it.tip ? '<small>' + esc(it.tip) + '</small>' : '') + '</div></div>';
      }).join('') + '</div><div class="modal-actions"><button class="btn primary" data-action="close-info">Close</button></div>');
  }

  /* ---------------- region format guide ---------------- */
  function showGuide() {
    const pr = profile(), c = country();
    const photoText = { recommended: 'Recommended', optional: 'Optional', avoid: 'Leave it out' }[pr.photo] || 'Optional';
    const names = { photo: 'Photo', referees: 'Two referees with contact details' };
    function nm(k) { return names[k] || (pr.fields[k] && (pr.fields[k].cvLabel || pr.fields[k].label)) || k; }
    const extras = industry().extra || [];
    const order = pr.sectionOrder(state.level, extras).map(function (k) { return pr.labels[k] || k; });
    const recNames = pr.recommended.map(function (id) { return T.TEMPLATES[id] ? T.TEMPLATES[id].name : id; });
    openInfo('<h3>' + esc(pr.label) + ' CV format</h3><p class="hint" style="margin:0">Selected country: ' + esc(c.name) + '</p>' +
      '<div class="facts">' +
      '<div class="fact"><small>Paper</small><b>' + esc(pr.paperLabel) + '</b></div>' +
      '<div class="fact"><small>Length</small><b>' + esc(pagesText(pr)) + '</b></div>' +
      '<div class="fact"><small>Photo</small><b>' + photoText + '</b></div>' +
      '<div class="fact"><small>Best layouts</small><b>' + esc(recNames.join(', ')) + '</b></div></div>' +
      '<h4>Recruiters expect</h4>' + ((pr.expected || []).length ? '<ul>' + pr.expected.map(function (k) { return '<li>' + esc(nm(k)) + '</li>'; }).join('') + '</ul>' : '<p style="margin:0;font-size:13.5px">Just your name, contact details and a clear work history.</p>') +
      ((pr.discouraged || []).length ? '<h4>Leave out</h4><ul>' + pr.discouraged.map(function (k) { return '<li>' + esc(nm(k)) + '</li>'; }).join('') + '</ul>' : '') +
      '<h4>Section order for your level</h4><p style="margin:0;font-size:13.5px">' + esc(order.join('  →  ')) + '</p>' +
      '<h4>' + esc(pr.label) + ' essentials</h4><ul>' + pr.generalTips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '<h4>Tips for ' + esc(c.name) + '</h4><ul>' + c.tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '<div class="modal-actions"><button class="btn primary" data-action="close-info">Close</button></div>');
  }

  /* ---------------- steps ---------------- */
  function photoBlock(pr) {
    const note = { recommended: 'Passport-style, plain background, face clearly visible. Expected in ' + pr.label + '.', optional: 'Optional here. Use a plain, professional headshot if you include one.', avoid: '' }[pr.photo];
    const warn = pr.photo === 'avoid' ? '<div class="notice">A photo is <b>not used</b> on ' + esc(pr.label) + ' CVs and can hurt your chances. Leave it off unless an employer asks for one.</div>' : '';
    return warn + '<div class="fld full"><span>Photo' + (pr.photo === 'recommended' ? ' (recommended)' : ' (optional)') + '</span><div class="photo-up"><div class="photo-prev">' +
      (state.p.photo ? '<img src="' + state.p.photo + '" alt="">' : 'No photo') + '</div><div>' +
      '<input type="file" id="photoInput" accept="image/*" hidden><button class="btn small" data-action="pick-photo">Upload photo</button> ' +
      (state.p.photo ? '<button class="btn small ghost" data-action="del-photo">Remove</button>' : '') +
      (note ? '<div class="hint" style="margin-top:6px">' + esc(note) + '</div>' : '') +
      (pr.photo === 'avoid' ? '<div style="margin-top:8px">' + check('Include photo on my CV', 'design.showPhoto', false) + '</div>' : '') +
      '</div></div></div>';
  }

  function personalFields(pr, c) {
    let h = field('Full name', 'p.fullName', { ph: 'e.g. ' + (SAMPLE_REGION[pr.id] || SAMPLE_REGION.gulf).name, full: true }) +
      field('Job title you are applying for', 'p.title', { ph: 'e.g. Senior Civil Engineer', full: true });
    pr.formFields.forEach(function (k) {
      const def = pr.fields[k];
      const o = {};
      if (def.type) o.type = def.type;
      if (def.ph) o.ph = def.ph;
      if (def.full) o.full = true;
      if (def.select) o.select = def.select;
      if (k === 'license' && c.license) o.ph = c.license;
      if (k === 'visa') {
        h += '<label class="fld"><span>' + esc(def.label) + '</span><input data-bind="p.visa" list="visaList" value="' + esc(state.p.visa || '') + '" placeholder="Choose or type your own"><datalist id="visaList">' +
          (c.visa || []).map(function (v) { return '<option value="' + esc(v) + '">'; }).join('') + '</datalist></label>';
      } else {
        h += field(def.label, 'p.' + k, o);
      }
    });
    return h;
  }

  function stepHTML(i) {
    const pr = profile(), c = country(), ind = industry();

    if (i === 0) {
      const countries = Object.keys(pr.countries).map(function (k) { return { id: k, label: pr.countries[k].name }; });
      const regions = P.order.map(function (id) { return { id: id, label: P.get(id).label }; });
      return '<h2>Where are you applying?</h2><p class="lead">We adapt the CV to the job market: fields, section order, paper size and length.</p>' +
        '<div class="grid">' +
        field('Region', 'region', { select: regions, full: true }) +
        field('Target country', 'country', { select: countries, full: true }) +
        field('Industry', 'industry', { select: pr.industries, full: true }) +
        field('Experience level', 'level', { select: pr.levels, full: true }) +
        '</div><div class="row-actions"><button class="btn small" data-action="guide">See the ' + esc(pr.label) + ' format guide</button></div>' +
        '<p class="hint" style="margin-top:10px">Paper: <b>' + esc(pr.paperLabel) + '</b> · Length: <b>' + esc(pagesText(pr)) + '</b> · Photo: <b>' + ({ recommended: 'recommended', optional: 'optional', avoid: 'leave out' }[pr.photo]) + '</b></p>' +
        tipsBox('Tips for ' + c.name, c.tips) + tipsBox(pr.label + ' essentials', pr.generalTips);
    }

    if (i === 1) {
      const sensitive = (pr.expected || []).length ? 'Employers in this region expect these details; you can hide any of them in the Design step.' : 'Only your name and contact details are needed for this region.';
      return '<h2>Personal details</h2><p class="lead">' + esc(sensitive) + '</p>' +
        photoBlock(pr) +
        '<div class="grid" style="margin-top:12px">' + personalFields(pr, c) + '</div>';
    }

    if (i === 2) {
      return '<h2>' + esc(pr.labels.summary) + '</h2><p class="lead">3–4 lines recruiters read first.</p>' +
        '<div class="grid">' + field(pr.labels.summary, 'summary', { area: true, rows: 7, full: true, ph: 'Job title + years of experience + key strengths + what you want next.' }) + '</div>' +
        '<div class="sub-row" style="margin-top:6px"><div class="hint" id="sumCount"></div><button class="btn small" data-action="draft-summary">✨ Draft it for me</button></div>' +
        '<p class="hint">The draft uses your job title, skills, industry and experience. Edit it and add a number-backed achievement.</p>' +
        tipsBox('Write it like this', ['Start with your title and years of experience.', 'Add 2–3 strengths with numbers (team size, budget, savings, targets).', 'End with the role or sector you are targeting.']);
    }

    if (i === 3) {
      return '<h2>' + esc(pr.labels.exp) + '</h2><p class="lead">Most recent first. One achievement per line, numbers make it stronger.</p>' +
        state.exp.map(function (e, k) {
          const bh = bulletHint(e.bullets);
          const body = '<div class="grid">' +
            field('Job title', 'exp.' + k + '.role', { full: true }) +
            field('Company', 'exp.' + k + '.company') + field('Location', 'exp.' + k + '.loc', { ph: 'City, Country' }) +
            field('Start', 'exp.' + k + '.start', { ph: 'Mar 2019' }) + field('End', 'exp.' + k + '.end', { ph: 'Feb 2023' }) +
            '<div class="full">' + check('I currently work here', 'exp.' + k + '.current', false) + '</div>' +
            field('Responsibilities & achievements (one per line)', 'exp.' + k + '.bullets', { area: true, rows: 5, full: true, ph: 'Managed a team of 12 and delivered the project 3 weeks early\nReduced costs by 15%…' }) +
            '<div class="full bhint' + (bh.warn ? ' warn' : '') + '" data-bhint="' + k + '">' + esc(bh.msg) + '</div></div>';
          return repeatCard('Position', 'exp', k, body, state.exp.length > 1);
        }).join('') + '<button class="add-btn" data-action="add" data-list="exp">+ Add another position</button>';
    }

    if (i === 4) {
      return '<h2>' + esc(pr.labels.edu) + '</h2><p class="lead">' + (state.level === 'fresh' ? 'As a fresh graduate, education appears before experience.' : 'Highest qualification first.') + '</p>' +
        state.edu.map(function (e, k) {
          const body = '<div class="grid">' +
            field('Degree / qualification', 'edu.' + k + '.degree', { full: true, ph: 'B.Sc. Computer Science' }) +
            field('University / school', 'edu.' + k + '.school') + field('Location', 'edu.' + k + '.loc') +
            field('Year', 'edu.' + k + '.year', { ph: '2015' }) + field('Grade / note (optional)', 'edu.' + k + '.note', { ph: 'First class honours' }) +
            '</div>';
          return repeatCard('Education', 'edu', k, body, state.edu.length > 1);
        }).join('') + '<button class="add-btn" data-action="add" data-list="edu">+ Add education</button>';
    }

    if (i === 5) {
      const rm = function (list, k, n) { return n > 1 ? '<div style="text-align:right;margin-top:6px"><button class="link-btn" data-action="del" data-list="' + list + '" data-i="' + k + '">Remove</button></div>' : ''; };
      let h = '<h2>Skills, languages & more</h2><p class="lead">Keep skills specific to the job you are applying for.</p>' +
        '<div class="grid">' + field(pr.labels.skills + ' (comma separated)', 'skills', { area: true, rows: 3, full: true, ph: 'Project Management, AutoCAD, Primavera P6, …' }) + '</div>';
      h += '<div class="sub">' + esc(pr.labels.langs) + (pr.id === 'eu' ? ' (add CEFR levels e.g. German B2)' : '') + '</div>' + state.langs.map(function (l, k) {
        return '<div class="card"><div class="grid">' + field('Language', 'langs.' + k + '.name') + field('Level', 'langs.' + k + '.level', { select: LEVEL_OPTS }) + '</div>' + rm('langs', k, state.langs.length) + '</div>';
      }).join('') + '<button class="add-btn" data-action="add" data-list="langs">+ Add language</button>';
      h += '<div class="sub">' + esc(pr.labels.certs) + '</div>' + state.certs.map(function (cc, k) {
        return '<div class="card"><div class="grid">' + field('Certificate', 'certs.' + k + '.name', { full: true }) + field('Issuer', 'certs.' + k + '.issuer') + field('Year', 'certs.' + k + '.year') + '</div>' + rm('certs', k, state.certs.length) + '</div>';
      }).join('') + '<button class="add-btn" data-action="add" data-list="certs">+ Add certificate</button>';
      if (ind.extra && ind.extra.indexOf('licenses') > -1) {
        h += '<div class="sub">' + esc(pr.labels.licenses) + '</div><p class="hint">' + esc(pr.licenseHint(ind.id)) + '</p>' + state.licenses.map(function (cc, k) {
          return '<div class="card"><div class="grid">' + field('License / registration', 'licenses.' + k + '.name', { full: true }) + field('Issuing body', 'licenses.' + k + '.issuer') + field('Year', 'licenses.' + k + '.year') + '</div>' + rm('licenses', k, state.licenses.length) + '</div>';
        }).join('') + '<button class="add-btn" data-action="add" data-list="licenses">+ Add license</button>';
      }
      if (pr.referees) {
        h += '<div class="sub">' + esc(pr.labels.refs) + ' (two are expected)</div>' + state.referees.map(function (r, k) {
          return '<div class="card"><div class="grid">' + field('Name', 'referees.' + k + '.name') + field('Role & company', 'referees.' + k + '.role') + field('Phone / email', 'referees.' + k + '.contact', { full: true }) + '</div>' + rm('referees', k, state.referees.length) + '</div>';
        }).join('') + '<button class="add-btn" data-action="add" data-list="referees">+ Add referee</button>';
      }
      h += '<div class="sub">' + esc(pr.labels.interests || 'Interests') + ' (optional)</div><div class="grid">' + field('Interests (comma separated)', 'interests', { full: true, ph: 'Cricket, Photography, Volunteering', hint: 'Keep it short; skip it if space is tight.' }) + '</div>';
      return h;
    }

    /* design & download */
    const des = state.design;
    const order = pr.sectionOrder(state.level, ind.extra || []);
    const h = health();
    return '<h2>Design & download</h2><p class="lead">Pick a layout, colour and font. ' + Object.keys(T.TEMPLATES).length + ' layouts × ' + T.PALETTES.length + ' colours × ' + T.FONTS.length + ' font pairs = ' + (Object.keys(T.TEMPLATES).length * T.PALETTES.length * T.FONTS.length) + ' looks.</p>' +
      '<div class="sub" style="margin-top:0">Layout</div><div class="thumbs" id="thumbs"></div>' +
      '<div class="sub">Colour</div><div class="swatches">' + T.PALETTES.map(function (p) {
        return '<button class="sw' + (des.palette === p.id ? ' active' : '') + '" style="background:' + p.accent + '" title="' + p.name + '" data-action="palette" data-id="' + p.id + '"></button>';
      }).join('') + '</div>' +
      '<div class="sub">Font</div><div class="fonts">' + T.FONTS.map(function (f) {
        return '<button class="fontbtn' + (des.font === f.id ? ' active' : '') + '" style="font-family:' + f.head + '" data-action="font" data-id="' + f.id + '">' + esc(f.name) + '</button>';
      }).join('') + '</div>' +
      '<div class="sub">Show on CV</div><div class="checks">' +
      check('Photo', 'design.showPhoto', pr.photo !== 'avoid') +
      pr.detailOrder.map(function (k) { return check(pr.fields[k].cvLabel || pr.fields[k].label, 'design.show.' + k, true); }).join('') +
      (order.indexOf('refs') > -1 ? check('“' + pr.labels.refsText.replace(/\.$/, '') + '” line', 'design.refs', true) : '') +
      (pr.declaration ? check('Declaration at the end', 'design.declaration', true) : '') + '</div>' +
      '<div class="dl-box"><div class="sub-row"><div class="sub" style="margin:0">CV health</div><button class="health-badge ' + healthClass(h.score) + '" data-action="health">' + h.score + '% · view checks</button></div>' +
      '<div class="sub">Download</div><div class="dl-row">' +
      '<button class="btn primary" data-action="dl-jpg">JPG <span class="lock">' + (isPremium() ? '' : 'free') + '</span></button>' +
      '<button class="btn" data-action="dl-pdf">PDF ' + (isPremium() ? '' : '<span class="lock">🔒 premium</span>') + '</button>' +
      '<button class="btn" data-action="dl-docx">Word ' + (isPremium() ? '' : '<span class="lock">🔒 premium</span>') + '</button></div>' +
      '<p class="hint" style="margin-top:10px">PDF opens your browser’s print dialog: choose <b>Save as PDF</b> (paper ' + esc(pr.paperLabel) + ', margins None, background graphics on). The PDF keeps real, selectable text so recruiter systems can read it.</p>' +
      '<div class="row-actions"><button class="btn small" data-action="save-file">Save CV file</button><button class="btn small" data-action="open-file">Open CV file</button></div></div>';
  }

  function renderSteps() {
    document.getElementById('steps').innerHTML = STEPS.map(function (s, i) {
      return '<button class="step-tab' + (i === step ? ' active' : '') + '" data-action="goto" data-i="' + i + '"><span class="num">' + (i + 1) + '</span>' + esc(s) + '</button>';
    }).join('');
    document.getElementById('btnPrev').style.visibility = step === 0 ? 'hidden' : 'visible';
    document.getElementById('btnNext').style.visibility = step === STEPS.length - 1 ? 'hidden' : 'visible';
    const sel = document.getElementById('regionSel');
    if (sel && sel.value !== state.region) sel.value = state.region;
  }

  function renderForm() {
    const f = document.getElementById('form');
    f.innerHTML = stepHTML(step);
    f.scrollTop = 0;
    renderSteps();
    if (step === 6) renderThumbs();
    if (step === 2) updateCount();
  }

  function renderThumbs() {
    const box = document.getElementById('thumbs');
    if (!box) return;
    const pr = profile();
    const data = hasContent() ? state : sample(state.region);
    const paper = T.sizeFor(pr, state);
    box.innerHTML = Object.keys(T.TEMPLATES).map(function (id) {
      const html = T.render(Object.assign({}, data, { design: Object.assign({}, data.design, { showPhoto: state.design.showPhoto }) }), pr, { template: id, palette: state.design.palette, font: state.design.font });
      const rec = pr.recommended.indexOf(id) > -1;
      return '<button class="thumb' + (state.design.template === id ? ' active' : '') + '" data-action="template" data-id="' + id + '" title="' + esc(T.TEMPLATES[id].note || '') + '"><div class="t-box" style="aspect-ratio:' + paper.w + '/' + paper.h + '"><div class="t-in">' + html + '</div></div>' +
        (rec ? '<span class="rec">★ Recommended</span>' : '') + '<span>' + esc(T.TEMPLATES[id].name) + '</span></button>';
    }).join('');
    requestAnimationFrame(function () {
      box.querySelectorAll('.t-box').forEach(function (b) {
        const s = b.clientWidth / paper.w;
        const inner = b.firstChild;
        inner.style.transform = 'scale(' + s + ')';
        inner.style.width = paper.w + 'px';
      });
    });
  }

  function hasContent() { return !!(state.p.fullName || state.summary || (state.exp[0] && state.exp[0].role)); }

  function updateCount() {
    const el = document.getElementById('sumCount');
    if (el) el.textContent = (state.summary || '').length + ' characters, aim for 250–500.';
  }

  /* ---------------- preview ---------------- */
  let pvTimer = null;
  function schedulePreview() { clearTimeout(pvTimer); pvTimer = setTimeout(renderPreview, 120); }

  function renderPreview() {
    const pr = profile();
    const paper = T.sizeFor(pr, state);
    const scaleEl = document.getElementById('pageScale');
    const box = document.getElementById('pageBox');
    const scroll = document.getElementById('pvScroll');
    if (!scroll.clientWidth) return; // preview hidden (phone layout): measuring would give wrong page counts
    const data = hasContent() ? state : Object.assign({}, state, { p: Object.assign({}, state.p, { fullName: '' }) });
    scaleEl.style.width = paper.w + 'px';
    scaleEl.innerHTML = T.render(data, pr);
    const page = scaleEl.querySelector('.page');
    scaleEl.style.transform = 'none';
    const pages = T.paginate(page, paper.h);
    lastPages = pages;
    const avail = scroll.clientWidth - 44;
    const s = Math.max(0.3, Math.min(1, avail / paper.w));
    scaleEl.style.transform = 'scale(' + s + ')';
    box.style.width = paper.w * s + 'px';
    box.style.height = pages * paper.h * s + 'px';
    for (let k = 1; k < pages; k++) {
      const g = document.createElement('div');
      g.className = 'page-guide';
      g.style.top = k * paper.h + 'px';
      g.setAttribute('data-label', 'page ' + (k + 1));
      scaleEl.appendChild(g);
    }
    const info = document.getElementById('pageInfo');
    const warn = pages > pr.maxPages;
    info.textContent = pages + (pages === 1 ? ' page' : ' pages') + ' · ' + paper.label + (warn ? ' · ' + pr.label + ' norm is ' + pagesText(pr) : '');
    info.className = 'page-info' + (warn ? ' warn' : '');
    const h = health();
    const hb = document.getElementById('healthBadge');
    hb.textContent = 'CV health ' + h.score + '%';
    hb.className = 'health-badge ' + healthClass(h.score);
  }

  function currentPageEl() { return document.querySelector('#pageScale .page'); }

  /* ---------------- downloads ---------------- */
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 3200);
  }

  function needPremium() {
    document.getElementById('priceLabel').textContent = CFG.priceLabel;
    document.getElementById('demoBtn').hidden = !CFG.demoUnlock;
    document.getElementById('modal').hidden = false;
  }

  function refreshIfDesign() { if (step === 6) { const sc = document.getElementById('form').scrollTop; renderForm(); document.getElementById('form').scrollTop = sc; } }

  async function download(kind) {
    const pr = profile();
    const paper = T.sizeFor(pr, state);
    if (!state.p.fullName) { toast('Add your name first (Personal step) so the file is named properly.'); }
    const name = state.p.fullName || 'My';
    try {
      if (kind === 'jpg') {
        toast('Preparing JPG…');
        const wm = (CFG.paywallEnabled && CFG.freeWatermark && !isPremium()) ? CFG.watermarkText : '';
        const n = await X.exportJPG(currentPageEl(), name, { watermark: wm, paper: paper });
        toast('Downloaded ' + n + ' JPG' + (n > 1 ? ' pages' : ''));
      } else if (kind === 'pdf') {
        if (!isPremium()) return needPremium();
        toast('Choose “Save as PDF” in the print dialog');
        X.exportPDF(currentPageEl(), name, paper);
      } else if (kind === 'docx') {
        if (!isPremium()) return needPremium();
        await X.exportDOCX(state, pr, name);
        toast('Word file downloaded');
      }
    } catch (err) {
      console.error(err);
      toast('Export failed: ' + (err && err.message ? err.message : err));
    }
  }

  /* ---------------- save / open CV file ---------------- */
  function saveFile() {
    const blob = new Blob([JSON.stringify({ app: 'cvcraft', version: 2, data: state })], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = X.safeName(state.p.fullName || 'My') + '_cvcraft.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    toast('CV file saved. Open it later to continue editing.');
  }

  function openFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const o = JSON.parse(reader.result);
        const data = o && o.data ? o.data : o;
        if (!data || typeof data !== 'object' || !data.p) throw new Error('not a CVCraft file');
        state = hydrate(data);
        save(); renderForm(); renderPreview();
        toast('CV file opened');
      } catch (e) {
        toast('That file is not a valid CVCraft CV file.');
      }
    };
    reader.readAsText(file);
  }

  /* ---------------- photo ---------------- */
  function handlePhoto(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      const img = new Image();
      img.onload = function () {
        const size = 400;
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d');
        const m = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, size, size);
        state.p.photo = c.toDataURL('image/jpeg', 0.88);
        save(); renderForm(); schedulePreview();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------------- events ---------------- */
  const NEW_ITEM = { exp: newExp, edu: newEdu, langs: function () { return { name: '', level: 'Fluent' }; }, certs: newCert, licenses: newCert, referees: newReferee };

  function onBind(e) {
    const el = e.target;
    const b = el.getAttribute && el.getAttribute('data-bind');
    if (!b) return;
    const v = el.type === 'checkbox' ? el.checked : el.value;
    if (b === 'region') {
      applyRegion(v); save(); renderForm(); renderPreview();
      return;
    }
    setPath(b, v);
    save();
    if (b === 'country') { state.design.showPhoto = !!country().photoDefault; save(); renderForm(); }
    if (b === 'industry' || b === 'level') { renderForm(); }
    if (b === 'summary') updateCount();
    const m = /^exp\.(\d+)\.bullets$/.exec(b);
    if (m) {
      const hint = document.querySelector('[data-bhint="' + m[1] + '"]');
      if (hint) { const bh = bulletHint(v); hint.textContent = bh.msg; hint.className = 'full bhint' + (bh.warn ? ' warn' : ''); }
    }
    schedulePreview();
    if (b.indexOf('design.') === 0) { refreshIfDesign(); }
  }

  document.addEventListener('input', onBind);
  document.addEventListener('change', function (e) {
    if (e.target.id === 'photoInput') { handlePhoto(e.target.files[0]); return; }
    if (e.target.id === 'openInput') { openFile(e.target.files[0]); e.target.value = ''; return; }
    if (e.target.id === 'regionSel') { applyRegion(e.target.value); save(); renderForm(); renderPreview(); return; }
    if (e.target.tagName === 'SELECT' || e.target.type === 'checkbox') onBind(e);
  });

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const a = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    const list = btn.getAttribute('data-list');
    const i = parseInt(btn.getAttribute('data-i'), 10);

    switch (a) {
      case 'next': step = Math.min(STEPS.length - 1, step + 1); renderForm(); break;
      case 'prev': step = Math.max(0, step - 1); renderForm(); break;
      case 'goto': step = i; renderForm(); break;
      case 'add': state[list].push(NEW_ITEM[list]()); save(); renderForm(); break;
      case 'del': state[list].splice(i, 1); save(); renderForm(); schedulePreview(); break;
      case 'pick-photo': document.getElementById('photoInput').click(); break;
      case 'del-photo': state.p.photo = ''; save(); renderForm(); schedulePreview(); break;
      case 'template': state.design.template = id; save(); renderForm(); schedulePreview(); break;
      case 'palette': state.design.palette = id; save(); refreshIfDesign(); schedulePreview(); break;
      case 'font': state.design.font = id; save(); refreshIfDesign(); schedulePreview(); break;
      case 'draft-summary': {
        if ((state.summary || '').trim() && !confirm('Replace your current text with a new draft?')) break;
        state.summary = draftSummary(); save(); renderForm(); schedulePreview();
        toast('Draft added. Edit it and add a number-backed achievement.');
        break;
      }
      case 'guide': showGuide(); break;
      case 'health': showHealth(); break;
      case 'close-info': document.getElementById('infoModal').hidden = true; break;
      case 'save-file': saveFile(); break;
      case 'open-file': document.getElementById('openInput').click(); break;
      case 'dl-jpg': download('jpg'); break;
      case 'dl-pdf': download('pdf'); break;
      case 'dl-docx': download('docx'); break;
      case 'sample': { const d = state.design; const keepPhoto = state.p.photo; state = sample(state.region); state.design = Object.assign(state.design, { template: d.template, palette: d.palette, font: d.font }); state.p.photo = keepPhoto; save(); renderForm(); schedulePreview(); toast('Sample data loaded. Add your own photo in the Personal step.'); break; }
      case 'reset': if (confirm('Clear everything and start over?')) { state = blank(state.region); save(); step = 0; renderForm(); schedulePreview(); } break;
      case 'toggleView': {
        const on = document.body.classList.toggle('show-preview');
        document.getElementById('viewToggle').textContent = on ? 'Edit' : 'Preview';
        if (on) setTimeout(renderPreview, 30);
        break;
      }
      case 'buy': if (CFG.checkoutUrl) window.open(CFG.checkoutUrl, '_blank', 'noopener'); else toast('Set checkoutUrl in js/config.js to enable payments'); break;
      case 'demo-unlock': localStorage.setItem(PREMIUM_KEY, '1'); document.getElementById('modal').hidden = true; toast('Premium unlocked (demo)'); refreshIfDesign(); break;
      case 'close-modal': document.getElementById('modal').hidden = true; break;
    }
  });

  document.getElementById('modal').addEventListener('click', function (e) { if (e.target.id === 'modal') e.target.hidden = true; });
  document.getElementById('infoModal').addEventListener('click', function (e) { if (e.target.id === 'infoModal') e.target.hidden = true; });
  window.addEventListener('resize', function () { schedulePreview(); });

  /* ---------------- boot ---------------- */
  (function buildRegionSelect() {
    const sel = document.getElementById('regionSel');
    sel.innerHTML = P.order.map(function (id) { return '<option value="' + id + '">' + esc(P.get(id).label) + '</option>'; }).join('');
    sel.value = state.region;
  })();
  renderForm();
  renderPreview();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(renderPreview);
})();
