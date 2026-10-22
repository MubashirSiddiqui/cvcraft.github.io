/*
 * Templates: 7 layouts x 12 colour palettes x 5 font pairs = 420 variants.
 * Add entries to TEMPLATES / PALETTES / FONTS to grow the library.
 * All region rules (fields, labels, section order, paper) come from profiles.js.
 */
(function (root) {
  'use strict';

  const PAGE_PAD = 40; // top/bottom breathing room on every page

  // paper sizes at 96dpi (px) and in Word twips
  const PAPERS = {
    A4: { id: 'A4', label: 'A4', w: 794, h: 1122, css: 'A4', docx: { w: 11906, h: 16838 } },
    Letter: { id: 'Letter', label: 'US Letter', w: 816, h: 1056, css: 'letter', docx: { w: 12240, h: 15840 } }
  };

  function sizeFor(profile, d) {
    const c = profile.countries && d && profile.countries[d.country];
    return PAPERS[(c && c.paper) || profile.paper] || PAPERS.A4;
  }

  // is an optional personal detail visible? (the user can switch any of them off)
  function isShown(profile, des, key) {
    const show = (des && des.show) || {};
    if (show[key] === false) return false;
    if ((profile.defaultOff || []).indexOf(key) > -1 && show[key] !== true) return false;
    return true;
  }

  const PALETTES = [
    { id: 'navy', name: 'Navy', accent: '#1f3a5f' },
    { id: 'emerald', name: 'Emerald', accent: '#0f766e' },
    { id: 'burgundy', name: 'Burgundy', accent: '#8b1e3f' },
    { id: 'charcoal', name: 'Charcoal', accent: '#2f3237' },
    { id: 'royal', name: 'Royal Blue', accent: '#2a55d6' },
    { id: 'gold', name: 'Desert Gold', accent: '#9a6b12' },
    { id: 'ocean', name: 'Ocean', accent: '#0e7490' },
    { id: 'plum', name: 'Plum', accent: '#6b3fa0' },
    { id: 'forest', name: 'Forest', accent: '#2f6b3a' },
    { id: 'slate', name: 'Slate', accent: '#475569' },
    { id: 'crimson', name: 'Crimson', accent: '#b3261e' },
    { id: 'copper', name: 'Copper', accent: '#b45309' }
  ];

  const FONTS = [
    { id: 'inter', name: 'Inter', head: "'Inter','Segoe UI',Arial,sans-serif", body: "'Inter','Segoe UI',Arial,sans-serif", word: { head: 'Calibri', body: 'Calibri' } },
    { id: 'merri', name: 'Merriweather + Open Sans', head: "'Merriweather',Georgia,serif", body: "'Open Sans','Segoe UI',Arial,sans-serif", word: { head: 'Georgia', body: 'Calibri' } },
    { id: 'poppins', name: 'Poppins + Lato', head: "'Poppins','Segoe UI',Arial,sans-serif", body: "'Lato','Segoe UI',Arial,sans-serif", word: { head: 'Arial', body: 'Calibri' } },
    { id: 'playfair', name: 'Playfair + Source Sans', head: "'Playfair Display',Georgia,serif", body: "'Source Sans 3','Segoe UI',Arial,sans-serif", word: { head: 'Georgia', body: 'Calibri' } },
    { id: 'roboto', name: 'Roboto', head: "'Roboto','Segoe UI',Arial,sans-serif", body: "'Roboto','Segoe UI',Arial,sans-serif", word: { head: 'Arial', body: 'Arial' } }
  ];

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function mixWhite(hex, pct) { // pct = share of white, 0..1
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = function (v) { return Math.round(v + (255 - v) * pct); };
    return '#' + [f(r), f(g), f(b)].map(function (v) { return v.toString(16).padStart(2, '0'); }).join('');
  }

  function byId(list, id) { return list.find(function (x) { return x.id === id; }) || list[0]; }

  function formatDob(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return iso || '';
    return parseInt(m[3], 10) + ' ' + MONTHS[parseInt(m[2], 10) - 1] + ' ' + m[1];
  }

  function lines(t) {
    return String(t || '').split(/\n+/).map(function (s) { return s.replace(/^\s*[-•*·▪]\s*/, '').trim(); }).filter(Boolean);
  }

  function fieldLabel(profile, key) {
    const f = profile.fields && profile.fields[key];
    return (f && (f.cvLabel || f.label)) || key;
  }

  /* Turn raw form state into a clean structure shared by HTML templates and the Word exporter. */
  function normalize(d, profile) {
    const p = d.p || {};
    const des = d.design || {};
    const ind = profile.industries.find(function (i) { return i.id === d.industry; });
    const extras = ind && ind.extra ? ind.extra : [];

    const details = [];
    profile.detailOrder.forEach(function (key) {
      if (!isShown(profile, des, key)) return;
      let v = p[key];
      if (key === 'dob') v = formatDob(v);
      if (v && String(v).trim()) details.push([fieldLabel(profile, key), String(v).trim()]);
    });

    const contacts = [];
    (profile.contactFields || ['email', 'phone']).forEach(function (key) {
      const v = String(p[key] || '').trim();
      if (!v) return;
      contacts.push((profile.contactPrefix || []).indexOf(key) > -1 ? fieldLabel(profile, key) + ': ' + v : v);
    });

    const showPhoto = des.showPhoto === undefined ? profile.photo !== 'avoid' : !!des.showPhoto;
    const photo = showPhoto && p.photo && String(p.photo).indexOf('data:image/') === 0 ? p.photo : '';
    const refsOn = des.refs === undefined ? true : !!des.refs;
    const declOn = des.declaration === undefined ? !!profile.declaration : !!des.declaration;

    const order = profile.sectionOrder(d.level || 'mid', extras).filter(function (k) { return k !== 'interests'; });
    const tail = order.findIndex(function (k) { return k === 'refs' || k === 'declaration'; });
    if (tail < 0) order.push('interests'); else order.splice(tail, 0, 'interests');

    return {
      name: (p.fullName || '').trim() || 'Your Name',
      title: (p.title || '').trim(),
      contacts: contacts,
      photo: photo,
      details: details,
      summary: (d.summary || '').trim(),
      exp: (d.exp || []).filter(function (e) { return e.role || e.company; }).map(function (e) {
        return {
          role: e.role || '',
          company: e.company || '',
          loc: e.loc || '',
          date: [e.start, e.current ? 'Present' : e.end].filter(Boolean).join(' – '),
          bullets: lines(e.bullets)
        };
      }),
      edu: (d.edu || []).filter(function (e) { return e.degree || e.school; }).map(function (e) {
        return { degree: e.degree || '', school: e.school || '', loc: e.loc || '', year: e.year || '', note: e.note || '' };
      }),
      skills: String(d.skills || '').split(/[,\n]+/).map(function (s) { return s.trim(); }).filter(Boolean),
      certs: (d.certs || []).filter(function (c) { return c.name; }),
      licenses: extras.indexOf('licenses') > -1 ? (d.licenses || []).filter(function (c) { return c.name; }) : [],
      langs: (d.langs || []).filter(function (l) { return l.name; }),
      interests: String(d.interests || '').split(/[,\n]+/).map(function (s) { return s.trim(); }).filter(Boolean),
      referees: (d.referees || []).filter(function (r) { return r.name; }),
      refs: refsOn,
      declaration: declOn,
      paper: sizeFor(profile, d),
      order: order,
      labels: Object.assign({ interests: 'Interests' }, profile.labels)
    };
  }

  /* ---------- section builders ---------- */
  function bulletsHTML(arr) {
    return arr.length ? '<ul>' + arr.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' : '';
  }

  function expItem(e) {
    const at = e.company ? '<span class="at"> — ' + esc(e.company) + (e.loc ? ', ' + esc(e.loc) : '') + '</span>' : '';
    return '<div class="item keep"><div class="item-date">' + esc(e.date) + '</div><div class="item-body"><div class="item-title"><b>' + esc(e.role) + '</b>' + at + '</div>' + bulletsHTML(e.bullets) + '</div></div>';
  }

  function eduItem(e) {
    const at = e.school ? '<span class="at"> — ' + esc(e.school) + (e.loc ? ', ' + esc(e.loc) : '') + '</span>' : '';
    return '<div class="item keep"><div class="item-date">' + esc(e.year) + '</div><div class="item-body"><div class="item-title"><b>' + esc(e.degree) + '</b>' + at + '</div>' + (e.note ? '<div class="note">' + esc(e.note) + '</div>' : '') + '</div></div>';
  }

  function certItem(c) {
    return '<div class="item keep line"><div class="item-date">' + esc(c.year) + '</div><div class="item-body"><b>' + esc(c.name) + '</b>' + (c.issuer ? '<span class="at"> — ' + esc(c.issuer) + '</span>' : '') + '</div></div>';
  }

  function refereeItem(r) {
    return '<div class="item keep line"><div class="item-body"><b>' + esc(r.name) + '</b>' + (r.role ? '<span class="at"> — ' + esc(r.role) + '</span>' : '') + (r.contact ? '<div class="note">' + esc(r.contact) + '</div>' : '') + '</div></div>';
  }

  /* One section as { title, items[], listy } or null when it has nothing to show. */
  function sectionParts(key, n) {
    const L = n.labels;
    switch (key) {
      case 'summary': return n.summary ? { title: L.summary, items: ['<p class="summary">' + esc(n.summary) + '</p>'], listy: false } : null;
      case 'exp': return n.exp.length ? { title: L.exp, items: n.exp.map(expItem), listy: true } : null;
      case 'edu': return n.edu.length ? { title: L.edu, items: n.edu.map(eduItem), listy: true } : null;
      case 'skills': return n.skills.length ? { title: L.skills, items: ['<div class="tags">' + n.skills.map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('') + '</div>'], listy: false } : null;
      case 'certs': return n.certs.length ? { title: L.certs, items: n.certs.map(certItem), listy: true } : null;
      case 'licenses': return n.licenses.length ? { title: L.licenses, items: n.licenses.map(certItem), listy: true } : null;
      case 'langs': return n.langs.length ? { title: L.langs, items: ['<div class="langs">' + n.langs.map(function (l) { return '<div><b>' + esc(l.name) + '</b>' + (l.level ? '<span> — ' + esc(l.level) + '</span>' : '') + '</div>'; }).join('') + '</div>'], listy: false } : null;
      case 'interests': return n.interests.length ? { title: L.interests, items: ['<p>' + n.interests.map(esc).join(' &nbsp;·&nbsp; ') + '</p>'], listy: false } : null;
      case 'declaration': return n.declaration ? { title: L.declaration, items: ['<p>' + esc(L.declarationText) + '</p>'], listy: false } : null;
      case 'refs':
        if (n.referees.length) return { title: L.refs, items: n.referees.map(refereeItem), listy: true };
        return n.refs ? { title: L.refs, items: ['<p>' + esc(L.refsText) + '</p>'], listy: false } : null;
      default: return null;
    }
  }

  function block(key, p) {
    const head = '<h2>' + esc(p.title) + '</h2>';
    if (p.listy) {
      return '<section class="sec sec-' + key + '"><div class="keep">' + head + p.items[0] + '</div>' + p.items.slice(1).join('') + '</section>';
    }
    return '<section class="sec sec-' + key + ' keep">' + head + p.items.join('') + '</section>';
  }

  function sectionHTML(key, n) {
    const p = sectionParts(key, n);
    return p ? block(key, p) : '';
  }

  /* Europass-style: heading in a left column, content in a right column. */
  function euSectionHTML(key, n) {
    const p = sectionParts(key, n);
    if (!p) return '';
    return '<section class="sec sec-' + key + '">' + p.items.map(function (it, i) {
      return '<div class="eu-row keep"><div class="eu-h">' + (i === 0 ? '<h2>' + esc(p.title) + '</h2>' : '') + '</div><div class="eu-b">' + it + '</div></div>';
    }).join('') + '</section>';
  }

  function sections(keys, n) { return keys.map(function (k) { return sectionHTML(k, n); }).join(''); }

  function detailsGrid(n) {
    if (!n.details.length) return '';
    return '<div class="pd keep">' + n.details.map(function (kv) {
      return '<div><div class="k">' + esc(kv[0]) + '</div><div class="v">' + esc(kv[1]) + '</div></div>';
    }).join('') + '</div>';
  }

  function detailsList(n, title) {
    if (!n.details.length) return '';
    return '<section class="sec keep"><h2>' + esc(title) + '</h2>' + n.details.map(function (kv) {
      return '<div class="li"><span class="k">' + esc(kv[0]) + '</span>' + esc(kv[1]) + '</div>';
    }).join('') + '</section>';
  }

  function contactList(n, title) {
    if (!n.contacts.length) return '';
    return '<section class="sec keep"><h2>' + esc(title) + '</h2>' + n.contacts.map(function (c) { return '<div class="li">' + esc(c) + '</div>'; }).join('') + '</section>';
  }

  function detailsInline(n) {
    return n.details.map(function (kv) { return '<span><b>' + esc(kv[0]) + ':</b> ' + esc(kv[1]) + '</span>'; }).join(' &nbsp;|&nbsp; ');
  }

  function photoHTML(n) { return n.photo ? '<div class="photo"><img src="' + n.photo + '" alt=""></div>' : ''; }
  function contactsLine(n) { return n.contacts.map(esc).join(' &nbsp;•&nbsp; '); }

  function without(order, drop) { return order.filter(function (k) { return drop.indexOf(k) < 0; }); }

  /* ---------- templates ---------- */
  const TEMPLATES = {
    classic: {
      name: 'Classic',
      note: 'Header with optional photo and a details panel',
      render: function (n, style) {
        return '<div class="page tpl-classic" style="' + style + '">' +
          '<header class="hd keep"><div class="hd-main"><h1>' + esc(n.name) + '</h1><div class="role">' + esc(n.title) + '</div><div class="contacts">' + contactsLine(n) + '</div></div>' + photoHTML(n) + '</header>' +
          detailsGrid(n) + sections(n.order, n) + '</div>';
      }
    },
    sidebar: {
      name: 'Sidebar Pro',
      note: 'Coloured sidebar with contact, details and skills',
      render: function (n, style) {
        const side = ['skills', 'langs'];
        return '<div class="page tpl-sidebar" style="' + style + '">' +
          '<aside class="sb">' + photoHTML(n) + contactList(n, n.labels.contact) + detailsList(n, n.labels.details) + sections(n.order.filter(function (k) { return side.indexOf(k) > -1; }), n) + '</aside>' +
          '<main class="mn"><header class="hd keep"><h1>' + esc(n.name) + '</h1><div class="role">' + esc(n.title) + '</div></header>' + sections(without(n.order, side), n) + '</main></div>';
      }
    },
    banner: {
      name: 'Modern Banner',
      note: 'Full-width colour banner, two columns below',
      render: function (n, style) {
        const side = ['skills', 'langs', 'interests', 'refs'];
        return '<div class="page tpl-banner" style="' + style + '">' +
          '<header class="bn keep">' + photoHTML(n) + '<div><h1>' + esc(n.name) + '</h1><div class="role">' + esc(n.title) + '</div><div class="contacts">' + contactsLine(n) + '</div></div></header>' +
          '<div class="cols"><main class="mn">' + sections(without(n.order, side), n) + '</main>' +
          '<aside class="sd">' + detailsList(n, n.labels.details) + sections(n.order.filter(function (k) { return side.indexOf(k) > -1; }), n) + '</aside></div></div>';
      }
    },
    executive: {
      name: 'Executive Serif',
      note: 'Centred, formal, for senior roles',
      render: function (n, style) {
        const line = detailsInline(n);
        return '<div class="page tpl-executive" style="' + style + '">' +
          '<header class="hd keep' + (n.photo ? ' has-photo' : '') + '">' + photoHTML(n) + '<h1>' + esc(n.name) + '</h1><div class="role">' + esc(n.title) + '</div><div class="contacts">' + contactsLine(n) + '</div></header>' +
          (line ? '<div class="pdline keep">' + line + '</div>' : '') + sections(n.order, n) + '</div>';
      }
    },
    compact: {
      name: 'Compact Timeline',
      note: 'Dates in a left column, dense and tidy',
      render: function (n, style) {
        return '<div class="page tpl-compact" style="' + style + '">' +
          '<header class="hd keep"><div class="hd-main"><h1>' + esc(n.name) + '</h1><div class="role">' + esc(n.title) + '</div><div class="contacts">' + contactsLine(n) + '</div></div>' + photoHTML(n) + '</header>' +
          detailsGrid(n) + sections(n.order, n) + '</div>';
      }
    },
    ats: {
      name: 'ATS Simple',
      note: 'Plain single column, no photo, safest for applicant tracking systems',
      render: function (n, style) {
        const line = detailsInline(n);
        return '<div class="page tpl-ats" style="' + style + '">' +
          '<header class="hd keep"><h1>' + esc(n.name) + '</h1>' + (n.title ? '<div class="role">' + esc(n.title) + '</div>' : '') + '<div class="contacts">' + contactsLine(n) + '</div></header>' +
          (line ? '<div class="pdline keep">' + line + '</div>' : '') + sections(n.order, n) + '</div>';
      }
    },
    europass: {
      name: 'Europass Style',
      note: 'Section labels on the left, content on the right',
      render: function (n, style) {
        const line = detailsInline(n);
        return '<div class="page tpl-europass" style="' + style + '">' +
          '<header class="hd keep"><div class="hd-main"><h1>' + esc(n.name) + '</h1><div class="role">' + esc(n.title) + '</div><div class="contacts">' + contactsLine(n) + '</div></div>' + photoHTML(n) + '</header>' +
          (line ? '<div class="pdline keep">' + line + '</div>' : '') +
          n.order.map(function (k) { return euSectionHTML(k, n); }).join('') + '</div>';
      }
    }
  };

  function styleFor(design, paper) {
    const pal = byId(PALETTES, design && design.palette);
    const font = byId(FONTS, design && design.font);
    return '--accent:' + pal.accent + ';--accent-soft:' + mixWhite(pal.accent, 0.9) + ';--font-head:' + font.head + ';--font-body:' + font.body + ';--pw:' + paper.w + 'px;--ph:' + paper.h + 'px;';
  }

  function render(d, profile, overrides) {
    const design = Object.assign({}, d.design || {}, overrides || {});
    const tpl = TEMPLATES[design.template] || TEMPLATES.classic;
    const n = normalize(Object.assign({}, d, { design: Object.assign({}, d.design || {}, design) }), profile);
    return tpl.render(n, styleFor(design, n.paper));
  }

  /*
   * Pagination: push any block that would straddle a page edge onto the next page,
   * so text is never sliced in half in the JPG / printed PDF. Call after inserting HTML.
   * pageH is the paper height in px. Returns the number of pages.
   */
  function paginate(pageEl, pageH) {
    const PAGE_H = pageH || 1122;
    pageEl.style.minHeight = PAGE_H + 'px';
    function topRel(el) {
      let t = 0;
      while (el && el !== pageEl) { t += el.offsetTop; el = el.offsetParent; }
      return t;
    }
    const blocks = pageEl.querySelectorAll('.keep');
    for (let i = 0; i < blocks.length; i++) {
      const el = blocks[i];
      const h = el.offsetHeight;
      if (h > PAGE_H - PAGE_PAD * 2) continue; // taller than a page: let it flow
      const top = topRel(el);
      const bottom = top + h;
      const page = Math.floor((top + 1) / PAGE_H);
      const limit = (page + 1) * PAGE_H - PAGE_PAD;
      if (bottom > limit) {
        const target = (page + 1) * PAGE_H + PAGE_PAD;
        const cur = parseFloat(getComputedStyle(el).marginTop) || 0;
        el.style.marginTop = (cur + (target - top)) + 'px';
      } else if (page > 0 && top < page * PAGE_H + PAGE_PAD) {
        // block sits too close to the top edge of a continuation page
        const cur = parseFloat(getComputedStyle(el).marginTop) || 0;
        el.style.marginTop = (cur + (page * PAGE_H + PAGE_PAD - top)) + 'px';
      }
    }
    const pages = Math.max(1, Math.ceil((pageEl.scrollHeight - 2) / PAGE_H));
    pageEl.style.minHeight = pages * PAGE_H + 'px';
    return pages;
  }

  const api = {
    PAPERS: PAPERS,
    sizeFor: sizeFor,
    isShown: isShown,
    PALETTES: PALETTES,
    FONTS: FONTS,
    TEMPLATES: TEMPLATES,
    render: render,
    paginate: paginate,
    normalize: normalize,
    fieldLabel: fieldLabel,
    formatDob: formatDob,
    byId: byId,
    esc: esc,
    mixWhite: mixWhite
  };
  root.CVTemplates = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
