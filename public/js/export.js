/*
 * Exporters: JPG (html2canvas), PDF (browser print -> real selectable text), Word (docx library).
 */
(function (root) {
  'use strict';

  const T = (typeof module !== 'undefined' && module.exports && typeof require === 'function') ? require('./templates.js') : root.CVTemplates;

  function safeName(s) {
    return String(s || 'CV').replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '') || 'CV';
  }

  function saveBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  /* ---------------- JPG ---------------- */
  async function pageCanvases(pageEl, scale, paper) {
    const PAGE_W = paper.w, PAGE_H = paper.h;
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-20000px;top:0;width:' + PAGE_W + 'px;background:#fff;pointer-events:none';
    const clone = pageEl.cloneNode(true);
    clone.style.transform = 'none';
    clone.style.margin = '0';
    host.appendChild(clone);
    document.body.appendChild(host);
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const full = await window.html2canvas(clone, { scale: scale, backgroundColor: '#ffffff', useCORS: true, logging: false, width: PAGE_W, windowWidth: PAGE_W });
      const pages = Math.max(1, Math.round(clone.offsetHeight / PAGE_H));
      const out = [];
      for (let i = 0; i < pages; i++) {
        const c = document.createElement('canvas');
        c.width = PAGE_W * scale;
        c.height = PAGE_H * scale;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(full, 0, i * PAGE_H * scale, PAGE_W * scale, PAGE_H * scale, 0, 0, PAGE_W * scale, PAGE_H * scale);
        out.push(c);
      }
      return out;
    } finally {
      host.remove();
    }
  }

  async function exportJPG(pageEl, name, opts) {
    opts = opts || {};
    const scale = 2;
    const canvases = await pageCanvases(pageEl, scale, opts.paper || { w: 794, h: 1122 });
    for (let i = 0; i < canvases.length; i++) {
      const c = canvases[i];
      if (opts.watermark) {
        const ctx = c.getContext('2d');
        ctx.font = (11 * scale) + 'px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(60,60,60,0.55)';
        ctx.fillText(opts.watermark, c.width / 2, c.height - 12 * scale);
      }
      const blob = await new Promise(function (res) { c.toBlob(res, 'image/jpeg', 0.93); });
      const suffix = canvases.length > 1 ? '_page' + (i + 1) : '';
      saveBlob(blob, safeName(name) + '_CV' + suffix + '.jpg');
      if (i < canvases.length - 1) await new Promise(function (r) { setTimeout(r, 350); });
    }
    return canvases.length;
  }

  /* ---------------- PDF (print dialog -> Save as PDF; text stays selectable for ATS) ---------------- */
  function exportPDF(pageEl, name, paper) {
    let root_ = document.getElementById('printRoot');
    if (root_) root_.remove();
    root_ = document.createElement('div');
    root_.id = 'printRoot';
    const clone = pageEl.cloneNode(true);
    clone.style.transform = 'none';
    root_.appendChild(clone);
    document.body.appendChild(root_);
    let ps = document.getElementById('printPage');
    if (ps) ps.remove();
    ps = document.createElement('style');
    ps.id = 'printPage';
    ps.textContent = '@media print{@page{size:' + ((paper && paper.css) || 'A4') + ';margin:0}}';
    document.head.appendChild(ps);
    const oldTitle = document.title;
    document.title = safeName(name) + '_CV';
    const cleanup = function () {
      document.title = oldTitle;
      const r = document.getElementById('printRoot');
      if (r) r.remove();
      const q = document.getElementById('printPage');
      if (q) q.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(function () { window.print(); }, 150);
  }

  /* ---------------- Word ---------------- */
  function dataUrlToBytes(url) {
    const b64 = String(url).split(',')[1] || '';
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  function buildDocx(docx, d, profile) {
    const n = T.normalize(d, profile);
    const des = d.design || {};
    const pal = T.byId(T.PALETTES, des.palette);
    const font = T.byId(T.FONTS, des.font);
    const accent = pal.accent.slice(1).toUpperCase();
    const soft = T.mixWhite(pal.accent, 0.9).slice(1).toUpperCase();
    const HEAD = font.word.head;
    const BODY = font.word.body;
    const PW = n.paper.docx.w;
    const W = PW - 1440; // content width in twips (0.5" margins)
    const C1 = 1900;
    const C2 = Math.floor((W - 2 * C1) / 2);

    const D = docx;
    const NONE = { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE };
    const thin = { style: D.BorderStyle.SINGLE, size: 4, color: 'D5D9E0' };
    const thinBorders = { top: thin, bottom: thin, left: thin, right: thin };

    function run(text, o) { return new D.TextRun(Object.assign({ text: text, font: BODY, size: 20 }, o || {})); }

    function heading(text) {
      return new D.Paragraph({
        spacing: { before: 260, after: 90 },
        keepNext: true,
        border: { bottom: { style: D.BorderStyle.SINGLE, size: 8, color: accent, space: 2 } },
        children: [new D.TextRun({ text: text.toUpperCase(), bold: true, font: HEAD, size: 22, color: accent })]
      });
    }

    function itemHead(left, right, sub) {
      const kids = [new D.TextRun({ text: left.bold, bold: true, font: BODY, size: 21 })];
      if (left.rest) kids.push(new D.TextRun({ text: left.rest, font: BODY, size: 20, color: accent, bold: true }));
      if (right) kids.push(new D.TextRun({ children: [new D.Tab(), right], font: BODY, size: 19, color: '666666' }));
      return new D.Paragraph({
        tabStops: [{ type: D.TabStopType.RIGHT, position: W }],
        spacing: { before: 90, after: 20 },
        keepNext: true,
        children: kids
      });
    }

    function bullet(text) {
      return new D.Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: { after: 20 }, children: [run(text)] });
    }

    const body = [];

    /* header */
    const nameParas = [
      new D.Paragraph({ spacing: { after: 20 }, children: [new D.TextRun({ text: n.name, bold: true, font: HEAD, size: 56, color: accent })] })
    ];
    if (n.title) nameParas.push(new D.Paragraph({ spacing: { after: 40 }, children: [new D.TextRun({ text: n.title, bold: true, font: BODY, size: 26, color: '444444' })] }));
    if (n.contacts.length) nameParas.push(new D.Paragraph({ spacing: { after: 20 }, children: [run(n.contacts.join('   |   '), { color: '555555', size: 19 })] }));

    if (n.photo) {
      body.push(new D.Table({
        width: { size: W, type: D.WidthType.DXA },
        columnWidths: [W - 1800, 1800],
        borders: Object.assign({ insideHorizontal: NONE, insideVertical: NONE }, noBorders),
        rows: [new D.TableRow({
          children: [
            new D.TableCell({ width: { size: W - 1800, type: D.WidthType.DXA }, borders: noBorders, verticalAlign: D.VerticalAlign.CENTER, children: nameParas }),
            new D.TableCell({
              width: { size: 1800, type: D.WidthType.DXA }, borders: noBorders, verticalAlign: D.VerticalAlign.CENTER,
              children: [new D.Paragraph({
                alignment: D.AlignmentType.RIGHT,
                children: [new D.ImageRun({ data: dataUrlToBytes(n.photo), type: 'jpg', transformation: { width: 95, height: 95 } })]
              })]
            })
          ]
        })]
      }));
    } else {
      nameParas.forEach(function (p) { body.push(p); });
    }
    body.push(new D.Paragraph({ spacing: { after: 60 }, border: { bottom: { style: D.BorderStyle.SINGLE, size: 18, color: accent, space: 4 } }, children: [] }));

    /* personal details table (label | value | label | value) */
    if (n.details.length) {
      const rows = [];
      for (let i = 0; i < n.details.length; i += 2) {
        const a = n.details[i];
        const b = n.details[i + 1];
        const cell = function (txt, label) {
          return new D.TableCell({
            width: { size: label ? C1 : C2, type: D.WidthType.DXA },
            borders: thinBorders,
            shading: label ? { type: D.ShadingType.CLEAR, fill: soft, color: 'auto' } : undefined,
            margins: { top: 50, bottom: 50, left: 100, right: 100 },
            children: [new D.Paragraph({ children: [run(txt || '', { bold: label, size: 19, color: label ? '333333' : '111111' })] })]
          });
        };
        rows.push(new D.TableRow({ children: [cell(a[0], true), cell(a[1], false), cell(b ? b[0] : '', true), cell(b ? b[1] : '', false)] }));
      }
      body.push(new D.Paragraph({ spacing: { before: 80, after: 0 }, children: [] }));
      body.push(new D.Table({ width: { size: W, type: D.WidthType.DXA }, columnWidths: [C1, C2, C1, C2], rows: rows }));
    }

    /* sections */
    n.order.forEach(function (key) {
      const L = n.labels;
      if (key === 'summary' && n.summary) {
        body.push(heading(L.summary));
        body.push(new D.Paragraph({ spacing: { after: 40 }, children: [run(n.summary)] }));
      }
      if (key === 'exp' && n.exp.length) {
        body.push(heading(L.exp));
        n.exp.forEach(function (e) {
          const rest = e.company ? '  —  ' + e.company + (e.loc ? ', ' + e.loc : '') : '';
          body.push(itemHead({ bold: e.role, rest: rest }, e.date));
          e.bullets.forEach(function (b) { body.push(bullet(b)); });
        });
      }
      if (key === 'edu' && n.edu.length) {
        body.push(heading(L.edu));
        n.edu.forEach(function (e) {
          const rest = e.school ? '  —  ' + e.school + (e.loc ? ', ' + e.loc : '') : '';
          body.push(itemHead({ bold: e.degree, rest: rest }, e.year));
          if (e.note) body.push(new D.Paragraph({ spacing: { after: 20 }, children: [run(e.note, { color: '555555', size: 19 })] }));
        });
      }
      if (key === 'skills' && n.skills.length) {
        body.push(heading(L.skills));
        body.push(new D.Paragraph({ children: [run(n.skills.join('   •   '))] }));
      }
      if ((key === 'certs' && n.certs.length) || (key === 'licenses' && n.licenses.length)) {
        const list = key === 'certs' ? n.certs : n.licenses;
        body.push(heading(key === 'certs' ? L.certs : L.licenses));
        list.forEach(function (c) {
          body.push(new D.Paragraph({
            tabStops: [{ type: D.TabStopType.RIGHT, position: W }],
            spacing: { after: 30 },
            children: [run(c.name, { bold: true }), run(c.issuer ? '  —  ' + c.issuer : '', { color: accent }), new D.TextRun({ children: [new D.Tab(), c.year || ''], font: BODY, size: 19, color: '666666' })]
          }));
        });
      }
      if (key === 'langs' && n.langs.length) {
        body.push(heading(L.langs));
        body.push(new D.Paragraph({ children: [run(n.langs.map(function (l) { return l.name + (l.level ? ' (' + l.level + ')' : ''); }).join('   •   '))] }));
      }
      if (key === 'interests' && n.interests.length) {
        body.push(heading(L.interests));
        body.push(new D.Paragraph({ children: [run(n.interests.join('   •   '))] }));
      }
      if (key === 'declaration' && n.declaration) {
        body.push(heading(L.declaration));
        body.push(new D.Paragraph({ children: [run(L.declarationText)] }));
      }
      if (key === 'refs') {
        if (n.referees.length) {
          body.push(heading(L.refs));
          n.referees.forEach(function (r) {
            body.push(new D.Paragraph({ spacing: { after: 10 }, children: [run(r.name, { bold: true }), run(r.role ? '  —  ' + r.role : '', { color: accent })] }));
            if (r.contact) body.push(new D.Paragraph({ spacing: { after: 50 }, children: [run(r.contact, { color: '555555', size: 19 })] }));
          });
        } else if (n.refs) {
          body.push(heading(L.refs));
          body.push(new D.Paragraph({ children: [run(L.refsText)] }));
        }
      }
    });

    return new D.Document({
      creator: 'CVCraft',
      title: n.name + ' – CV',
      styles: { default: { document: { run: { font: BODY, size: 20 } } } },
      numbering: {
        config: [{
          reference: 'bul',
          levels: [{ level: 0, format: D.LevelFormat.BULLET, text: '•', alignment: D.AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } } } }]
        }]
      },
      sections: [{
        properties: { page: { size: { width: n.paper.docx.w, height: n.paper.docx.h }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
        children: body
      }]
    });
  }

  async function exportDOCX(d, profile, name) {
    const doc = buildDocx(window.docx, d, profile);
    const blob = await window.docx.Packer.toBlob(doc);
    saveBlob(blob, safeName(name) + '_CV.docx');
  }

  const api = { exportJPG: exportJPG, exportPDF: exportPDF, exportDOCX: exportDOCX, buildDocx: buildDocx, safeName: safeName };
  root.CVExport = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
