/*
 * Region profiles. A profile decides which fields appear, how sections are ordered,
 * page size, length guidance, labels and country-specific tips.
 * To add a region, add a makeProfile({...}) entry to PROFILES — templates, exporters,
 * health check and SEO pages all read from it.
 */
(function (root) {
  'use strict';

  const MARITAL = ['', 'Single', 'Married', 'Divorced', 'Widowed'];

  /* Every personal-data field the app knows. Profiles choose which ones to use. */
  const FIELD_DEFS = {
    email: { label: 'Email', type: 'email', ph: 'name@email.com' },
    phone: { label: 'Phone', ph: '+000 00 000 0000' },
    whatsapp: { label: 'WhatsApp (optional)', ph: 'Same as phone?', cvLabel: 'WhatsApp' },
    city: { label: 'Current location', ph: 'City, Country', cvLabel: 'Location' },
    nationality: { label: 'Nationality', ph: 'e.g. Pakistani', cvLabel: 'Nationality' },
    dob: { label: 'Date of birth', type: 'date', cvLabel: 'Date of Birth' },
    marital: { label: 'Marital status', select: MARITAL, cvLabel: 'Marital Status' },
    visa: { label: 'Visa status', datalist: true, ph: 'Choose or type your own', cvLabel: 'Visa Status' },
    license: { label: 'Driving license', ph: 'e.g. Category B – valid', cvLabel: 'Driving License' },
    notice: { label: 'Notice period / availability', ph: 'Immediate / 30 days', cvLabel: 'Notice Period' },
    workAuth: { label: 'Work authorization', ph: 'e.g. Authorized to work in the US', cvLabel: 'Work Authorization', full: true },
    fatherName: { label: "Father's name", cvLabel: "Father's Name" },
    linkedin: { label: 'LinkedIn (optional)', ph: 'linkedin.com/in/yourname', cvLabel: 'LinkedIn', full: true },
    website: { label: 'Website / portfolio (optional)', ph: 'yourname.com', cvLabel: 'Website', full: true }
  };

  const INDUSTRIES = [
    { id: 'general', label: 'General / Other' },
    { id: 'it', label: 'IT & Software' },
    { id: 'engineering', label: 'Engineering & Construction', extra: ['licenses'] },
    { id: 'oilgas', label: 'Oil, Gas & Energy', extra: ['licenses'] },
    { id: 'healthcare', label: 'Healthcare & Medical', extra: ['licenses'] },
    { id: 'finance', label: 'Finance, Banking & Accounting' },
    { id: 'sales', label: 'Sales & Marketing' },
    { id: 'hospitality', label: 'Hospitality, Tourism & Retail' },
    { id: 'education', label: 'Education', extra: ['licenses'] },
    { id: 'logistics', label: 'Logistics & Supply Chain' },
    { id: 'admin', label: 'Admin, HR & Customer Service' }
  ];

  const LEVELS = [
    { id: 'fresh', label: 'Fresh graduate (0–1 yr)' },
    { id: 'mid', label: 'Experienced (2–9 yrs)' },
    { id: 'senior', label: 'Senior / Manager (10+ yrs)' }
  ];

  const BASE_LABELS = {
    summary: 'Professional Profile', exp: 'Work Experience', edu: 'Education', skills: 'Key Skills',
    certs: 'Certifications & Training', licenses: 'Licenses & Registrations', langs: 'Languages',
    refs: 'References', refsText: 'Available upon request.', details: 'Personal Details', contact: 'Contact',
    declaration: 'Declaration',
    declarationText: 'I hereby declare that the information furnished above is true and correct to the best of my knowledge and belief.'
  };

  const GENERIC_LICENSE_HINT = 'e.g. professional body membership, national / state license or registration number';

  function makeProfile(p) {
    p.industries = INDUSTRIES;
    p.levels = LEVELS;
    p.labels = Object.assign({}, BASE_LABELS, p.labels || {});
    p.fields = {};
    Object.keys(FIELD_DEFS).forEach(function (k) {
      p.fields[k] = Object.assign({}, FIELD_DEFS[k], (p.fieldOverrides && p.fieldOverrides[k]) || {});
    });
    p.contactFields = p.contactFields || ['email', 'phone'];
    p.contactPrefix = p.contactPrefix || ['whatsapp'];
    p.detailOrder = p.detailOrder || [];
    p.licenseHints = p.licenseHints || {};
    p.licenseHint = function (industryId) { return p.licenseHints[industryId] || GENERIC_LICENSE_HINT; };
    p.pageW = p.paper === 'Letter' ? 816 : 794;
    p.pageH = p.paper === 'Letter' ? 1056 : 1122;
    p.paperLabel = p.paper === 'Letter' ? 'US Letter' : 'A4';
    return p;
  }

  function std(level, extras, middle) { // helper to assemble section orders
    return { level: level, extras: extras, middle: middle };
  }

  const PROFILES = {};

  /* ================= MIDDLE EAST (GCC) ================= */
  PROFILES.gulf = makeProfile({
    id: 'gulf', label: 'Middle East (GCC)', paper: 'A4', maxPages: 2, photo: 'recommended',
    recommended: ['classic', 'sidebar', 'banner'],
    countries: {
      UAE: { name: 'United Arab Emirates', slug: 'uae', short: 'UAE', photoDefault: true,
        visa: ['Residence visa – transferable', 'Employment visa – employer sponsored', 'Golden Visa', 'Visit visa', 'Cancelled visa – ready to join', 'UAE National'],
        license: 'e.g. UAE license – valid',
        tips: ['If you hold a UAE driving license, say so — many employers ask.', 'State your visa status and notice period clearly (e.g. “Visit visa – can join immediately”).', 'Free-zone or Dubai / Abu Dhabi experience is worth listing.'] },
      KSA: { name: 'Saudi Arabia', slug: 'saudi-arabia', short: 'Saudi Arabia', photoDefault: true,
        visa: ['Iqama – transferable', 'Iqama – employer sponsored', 'Final exit – ready to join', 'Visit visa', 'Saudi National'],
        license: 'e.g. Saudi license – valid',
        tips: ['Mention whether your Iqama is transferable and any previous Saudi experience.', 'List both Arabic and English; Saudi employers value both.', 'Add professional accreditation if relevant to your field (e.g. SCE, SCFHS).'] },
      QAT: { name: 'Qatar', slug: 'qatar', short: 'Qatar', photoDefault: true,
        visa: ['Residence permit (QID) – transferable', 'Residence permit – employer sponsored', 'Visit visa', 'Qatari National'],
        license: 'e.g. Qatar license – valid',
        tips: ['State whether you can transfer without an NOC and your notice period.', 'Mention Qatar or GCC project experience first.', 'Add professional registrations (e.g. QCHP for healthcare) if relevant.'] },
      KWT: { name: 'Kuwait', slug: 'kuwait', short: 'Kuwait', photoDefault: true,
        visa: ['Residency – transferable', 'Residency – employer sponsored', 'Visit visa', 'Kuwaiti National'],
        license: 'e.g. Kuwait license – valid',
        tips: ['Mention your residency status and notice period.', 'Include Arabic and English language levels.', 'Regional experience and project scale (budget, team size) strengthen the CV.'] },
      BHR: { name: 'Bahrain', slug: 'bahrain', short: 'Bahrain', photoDefault: true,
        visa: ['Residence permit – transferable', 'Residence permit – employer sponsored', 'Visit visa', 'Bahraini National'],
        license: 'e.g. Bahrain license – valid',
        tips: ['Mention your residence status and availability.', 'Banking, finance and healthcare employers often want certifications listed clearly.', 'Add professional registrations if relevant (e.g. NHRA for healthcare).'] },
      OMN: { name: 'Oman', slug: 'oman', short: 'Oman', photoDefault: true,
        visa: ['Residence – transferable', 'Residence – employer sponsored', 'Visit visa', 'Omani National'],
        license: 'e.g. Oman license – valid',
        tips: ['State your residency status and notice period.', 'Mention Arabic ability if you have it — it is valued locally.', 'Oil & gas, construction and logistics roles value site / project experience.'] },
      MENA: { name: 'Other Middle East (Jordan, Egypt, Iraq, Lebanon...)', slug: 'middle-east', short: 'the Middle East', photoDefault: true,
        visa: ['Citizen / resident', 'Work permit – employer sponsored', 'Visit visa', 'Ready to relocate'],
        license: 'e.g. Valid license',
        tips: ['Photo, nationality and date of birth are commonly included in the region.', 'Say if you are willing to relocate to the Gulf and your notice period.'] }
    },
    generalTips: [
      'Use a professional passport-style photo on a plain background — it is expected in the Gulf.',
      'Keep the CV to 1–2 pages. Put your most relevant, most recent role first.',
      'Recruiters expect nationality, date of birth, marital status, visa status and notice period.',
      'List languages (Arabic / English) and your driving license if you hold one.',
      'Mention any GCC / regional experience prominently and quantify achievements with numbers.'
    ],
    formFields: ['email', 'phone', 'whatsapp', 'city', 'nationality', 'dob', 'marital', 'visa', 'license', 'notice', 'linkedin'],
    contactFields: ['email', 'phone', 'whatsapp', 'linkedin'],
    detailOrder: ['nationality', 'dob', 'marital', 'visa', 'license', 'notice', 'city'],
    expected: ['photo', 'nationality', 'dob', 'marital', 'visa', 'notice'],
    discouraged: [],
    labels: { licenses: 'Professional Licenses & Registrations', summary: 'Professional Profile' },
    licenseHints: {
      engineering: 'e.g. Society of Engineers UAE, Saudi Council of Engineers (SCE), PMP',
      oilgas: 'e.g. NEBOSH, IOSH, API, NCCER',
      healthcare: 'e.g. DHA, DOH, MOH, SCFHS, QCHP, NHRA license',
      education: 'e.g. teaching license / KHDA / MOE registration'
    },
    closing: function (c) { return 'Seeking a role in ' + c + '.'; },
    sectionOrder: function (level, extras) {
      const lic = extras && extras.indexOf('licenses') > -1 ? ['licenses'] : [];
      if (level === 'fresh') return ['summary', 'edu', 'exp', 'skills', 'certs'].concat(lic, ['langs', 'refs']);
      return ['summary', 'exp', 'edu'].concat(lic, ['certs', 'skills', 'langs', 'refs']);
    }
  });

  /* ================= USA / CANADA ================= */
  PROFILES.us = makeProfile({
    id: 'us', label: 'USA / Canada', paper: 'Letter', maxPages: 2, photo: 'avoid',
    recommended: ['ats', 'classic', 'compact'],
    countries: {
      USA: { name: 'United States', slug: 'usa', short: 'the USA', photoDefault: false,
        tips: ['One page is the norm under ~10 years of experience; never more than two.', 'Leave out photo, date of birth, marital status and nationality — US employers avoid them for anti-discrimination reasons.', 'Mirror keywords from the job posting; most employers screen CVs with ATS software.', 'Use standard headings and a simple layout — avoid tables, graphics and text boxes in the file you upload.'] },
      CAN: { name: 'Canada', slug: 'canada', short: 'Canada', photoDefault: false,
        tips: ['Keep it to 1–2 pages on US Letter paper; no photo, date of birth or marital status.', 'State your work eligibility if you are not a citizen (permanent resident, work permit).', 'Use Canadian spelling where natural (e.g. “organization” and “centre” both appear — be consistent).', 'Quantify achievements and tailor keywords to each posting for ATS.'] }
    },
    generalTips: [
      'Use US Letter paper size and a clean, ATS-friendly layout.',
      'Do not include photo, date of birth, marital status or nationality.',
      'Start each bullet with an action verb and add numbers where you can.',
      'Put your summary and skills first for career changers; education first only for recent graduates.'
    ],
    formFields: ['email', 'phone', 'city', 'workAuth', 'linkedin', 'website'],
    contactFields: ['email', 'phone', 'city', 'linkedin', 'website', 'workAuth'],
    detailOrder: [],
    expected: [],
    discouraged: ['photo', 'dob', 'marital', 'nationality'],
    labels: { summary: 'Professional Summary', exp: 'Professional Experience', skills: 'Skills', licenses: 'Licenses & Certifications', certs: 'Certifications & Training' },
    licenseHints: {
      engineering: 'e.g. PE / EIT license, P.Eng., PMP', healthcare: 'e.g. RN license (state / province), BLS, ACLS, NPI',
      education: 'e.g. state teaching certificate', finance: 'e.g. CPA, CFA, Series 7'
    },
    closing: function () { return ''; },
    sectionOrder: function (level, extras) {
      const lic = extras && extras.indexOf('licenses') > -1 ? ['licenses'] : [];
      if (level === 'fresh') return ['summary', 'edu', 'exp', 'skills', 'certs'].concat(lic, ['langs']);
      return ['summary', 'skills', 'exp', 'edu', 'certs'].concat(lic, ['langs']);
    }
  });

  /* ================= UK / IRELAND ================= */
  PROFILES.uk = makeProfile({
    id: 'uk', label: 'UK / Ireland', paper: 'A4', maxPages: 2, photo: 'avoid',
    recommended: ['classic', 'executive', 'ats'],
    countries: {
      GBR: { name: 'United Kingdom', slug: 'uk', short: 'the UK', photoDefault: false,
        tips: ['Two A4 pages is the standard; one page is fine for school leavers and graduates.', 'Open with a short personal statement (3–4 lines).', 'Do not include photo, date of birth or marital status.', 'Say “References available on request” or list two referees if asked.', 'If you need sponsorship, state your right-to-work status clearly.'] },
      IRL: { name: 'Ireland', slug: 'ireland', short: 'Ireland', photoDefault: false,
        tips: ['Two pages maximum on A4; open with a short career profile.', 'No photo, date of birth or marital status.', 'State your right to work in Ireland if you are not an EU / EEA citizen.', 'Referees are normally given on request — “References available on request” is fine.'] }
    },
    generalTips: [
      'Open with a personal statement, then employment history (most recent first).',
      'Two A4 pages is standard; do not pad to fill them.',
      'No photo, date of birth or marital status.',
      'Use British spelling (organisation, programme, licence).'
    ],
    formFields: ['email', 'phone', 'city', 'workAuth', 'linkedin', 'website'],
    contactFields: ['email', 'phone', 'city', 'linkedin', 'website', 'workAuth'],
    detailOrder: [],
    fieldOverrides: { workAuth: { label: 'Right to work (optional)', ph: 'e.g. Full right to work in the UK', cvLabel: 'Right to Work' } },
    expected: [],
    discouraged: ['photo', 'dob', 'marital'],
    labels: { summary: 'Personal Statement', exp: 'Employment History', edu: 'Education & Qualifications', skills: 'Key Skills', refsText: 'References available on request.', licenses: 'Professional Registrations' },
    licenseHints: { healthcare: 'e.g. NMC / GMC / HCPC registration number', engineering: 'e.g. CEng, IMechE, ICE membership', education: 'e.g. QTS, GTCNI' },
    closing: function () { return ''; },
    sectionOrder: function (level, extras) {
      const lic = extras && extras.indexOf('licenses') > -1 ? ['licenses'] : [];
      if (level === 'fresh') return ['summary', 'edu', 'exp', 'skills', 'certs'].concat(lic, ['langs', 'refs']);
      return ['summary', 'exp', 'edu', 'skills', 'certs'].concat(lic, ['langs', 'refs']);
    }
  });

  /* ================= EUROPE ================= */
  PROFILES.eu = makeProfile({
    id: 'eu', label: 'Europe (DE / FR / NL / ES / IT)', paper: 'A4', maxPages: 2, photo: 'optional',
    recommended: ['europass', 'compact', 'classic'],
    countries: {
      DEU: { name: 'Germany', slug: 'germany', short: 'Germany', photoDefault: true,
        tips: ['German CVs (Lebenslauf) are tabular and reverse-chronological, usually 1–2 pages.', 'A professional photo is common but not mandatory; date of birth and nationality are accepted.', 'Mention language skills with CEFR levels (e.g. German B2).', 'Keep certificates (Zeugnisse) as separate attachments.'] },
      FRA: { name: 'France', slug: 'france', short: 'France', photoDefault: true,
        tips: ['One page is typical for under ~10 years of experience.', 'A photo is optional and still common; mention the type of contract sought if relevant.', 'List languages with CEFR levels.', 'Hobbies (“centres d’intérêt”) are common but keep them short.'] },
      NLD: { name: 'Netherlands', slug: 'netherlands', short: 'the Netherlands', photoDefault: false,
        tips: ['1–2 pages; a photo is optional and increasingly left out.', 'Date of birth and marital status are not needed.', 'Dutch employers like a short profile, clear dates and concrete results.'] },
      ESP: { name: 'Spain', slug: 'spain', short: 'Spain', photoDefault: true,
        tips: ['1–2 pages; a photo is common and accepted.', 'Include language levels (CEFR) and a driving licence if relevant.', 'Reverse-chronological order with clear dates.'] },
      ITA: { name: 'Italy', slug: 'italy', short: 'Italy', photoDefault: true,
        tips: ['1–2 pages, often Europass-style.', 'A photo is accepted; include language levels and a short data-protection consent line if the employer asks.', 'Reverse-chronological order.'] },
      EUR: { name: 'Other Europe / Europass style', slug: 'europe', short: 'Europe', photoDefault: false,
        tips: ['Use a Europass-style layout with clear section labels on the left.', 'Photo and personal details follow local custom — check the country’s norm.', 'Give language levels using CEFR (A1–C2).'] }
    },
    generalTips: [
      'Reverse-chronological order with exact dates and a clear section label for each block.',
      'Add language levels using the CEFR scale (A1–C2).',
      'Photo and date of birth follow local custom — optional in most countries.',
      'Keep it to 1–2 A4 pages.'
    ],
    formFields: ['email', 'phone', 'city', 'dob', 'nationality', 'marital', 'license', 'linkedin', 'website'],
    contactFields: ['email', 'phone', 'city', 'linkedin', 'website'],
    detailOrder: ['dob', 'nationality', 'marital', 'license'],
    expected: [],
    discouraged: [],
    labels: { summary: 'Profile', exp: 'Work Experience', edu: 'Education and Training', skills: 'Skills', langs: 'Languages', certs: 'Certificates & Courses', licenses: 'Professional Registrations' },
    licenseHints: { healthcare: 'e.g. professional registration / chamber membership', engineering: 'e.g. engineering chamber registration' },
    closing: function () { return ''; },
    sectionOrder: function (level, extras) {
      const lic = extras && extras.indexOf('licenses') > -1 ? ['licenses'] : [];
      if (level === 'fresh') return ['summary', 'edu', 'exp', 'skills', 'langs', 'certs'].concat(lic);
      return ['summary', 'exp', 'edu', 'skills', 'langs', 'certs'].concat(lic);
    }
  });

  /* ================= AUSTRALIA / NEW ZEALAND ================= */
  PROFILES.au = makeProfile({
    id: 'au', label: 'Australia / New Zealand', paper: 'A4', maxPages: 3, photo: 'avoid',
    recommended: ['classic', 'ats', 'sidebar'],
    countries: {
      AUS: { name: 'Australia', slug: 'australia', short: 'Australia', photoDefault: false,
        tips: ['2–3 pages is normal; lead with a career summary.', 'State your work rights (citizen, permanent resident or visa subclass).', 'List two referees with contact details, usually at the end.', 'No photo, date of birth or marital status.'] },
      NZL: { name: 'New Zealand', slug: 'new-zealand', short: 'New Zealand', photoDefault: false,
        tips: ['2–3 pages with a short career summary at the top.', 'State your New Zealand work rights.', 'Include two referees with phone / email.', 'No photo, date of birth or marital status.'] }
    },
    generalTips: [
      'Career summary first, then employment history with achievements.',
      'State your work rights and add two referees with contact details.',
      'No photo, date of birth or marital status.',
      'Use Australian / New Zealand spelling (organisation, programme).'
    ],
    formFields: ['email', 'phone', 'city', 'workAuth', 'linkedin', 'website'],
    contactFields: ['email', 'phone', 'city', 'workAuth', 'linkedin', 'website'],
    contactPrefix: ['whatsapp', 'workAuth'],
    detailOrder: [],
    fieldOverrides: { workAuth: { label: 'Work rights', ph: 'e.g. Australian citizen / PR / visa subclass 482', cvLabel: 'Work Rights' } },
    expected: ['workAuth', 'referees'],
    discouraged: ['photo', 'dob', 'marital'],
    referees: true,
    labels: { summary: 'Career Summary', exp: 'Employment History', edu: 'Education & Qualifications', skills: 'Key Skills', refs: 'Referees', refsText: 'Available on request.', licenses: 'Licences & Registrations' },
    licenseHints: { healthcare: 'e.g. AHPRA registration number', engineering: 'e.g. EA / CPEng, RPEQ', education: 'e.g. state teacher registration' },
    closing: function () { return ''; },
    sectionOrder: function (level, extras) {
      const lic = extras && extras.indexOf('licenses') > -1 ? ['licenses'] : [];
      if (level === 'fresh') return ['summary', 'edu', 'skills', 'exp', 'certs'].concat(lic, ['langs', 'refs']);
      return ['summary', 'skills', 'exp', 'edu', 'certs'].concat(lic, ['langs', 'refs']);
    }
  });

  /* ================= SOUTH ASIA ================= */
  PROFILES.sa = makeProfile({
    id: 'sa', label: 'South Asia (PK / IN / BD / LK)', paper: 'A4', maxPages: 2, photo: 'optional',
    recommended: ['classic', 'compact', 'sidebar'],
    countries: {
      PAK: { name: 'Pakistan', slug: 'pakistan', short: 'Pakistan', photoDefault: true,
        tips: ['Open with a short career objective or profile.', 'A passport-style photo and basic personal details (date of birth, nationality, marital status) are common.', 'Keep to 1–2 pages; list degrees with institution and year.', 'Avoid sharing ID card numbers on a CV you upload publicly.'] },
      IND: { name: 'India', slug: 'india', short: 'India', photoDefault: false,
        tips: ['Corporate employers prefer 1–2 pages; photo is usually not needed.', 'A career objective and declaration are traditional; many modern CVs skip them.', 'List academic qualifications with percentage / CGPA and year.', 'Mention notice period.'] },
      BGD: { name: 'Bangladesh', slug: 'bangladesh', short: 'Bangladesh', photoDefault: true,
        tips: ['Include a career objective, personal details and a passport-style photo if the employer asks.', 'List academic qualifications with result and year.', 'Keep to 1–2 pages.'] },
      LKA: { name: 'Sri Lanka', slug: 'sri-lanka', short: 'Sri Lanka', photoDefault: true,
        tips: ['A photo and personal details are common; keep the CV to 1–2 pages.', 'List O/L, A/L and degree qualifications clearly.', 'Add two referees if requested.'] }
    },
    generalTips: [
      'Start with a 2–3 line career objective or profile.',
      'Personal details (date of birth, nationality, marital status) are common; photo is optional.',
      'List qualifications with institution, result and year.',
      'Keep to 1–2 pages and end with a short declaration if the employer expects it.'
    ],
    formFields: ['email', 'phone', 'whatsapp', 'city', 'fatherName', 'dob', 'nationality', 'marital', 'notice', 'linkedin'],
    contactFields: ['email', 'phone', 'whatsapp', 'city', 'linkedin'],
    detailOrder: ['fatherName', 'dob', 'nationality', 'marital', 'notice'],
    expected: [],
    discouraged: [],
    declaration: true,
    labels: { summary: 'Career Objective', exp: 'Work Experience', edu: 'Academic Qualifications', skills: 'Skills', licenses: 'Professional Registrations', refsText: 'Available on request.' },
    licenseHints: { engineering: 'e.g. PEC registration (Pakistan), IEI membership (India)', healthcare: 'e.g. PMDC, MCI / NMC registration', finance: 'e.g. ACCA, ICAP, ICAI membership' },
    closing: function () { return ''; },
    sectionOrder: function (level, extras) {
      const lic = extras && extras.indexOf('licenses') > -1 ? ['licenses'] : [];
      if (level === 'fresh') return ['summary', 'edu', 'skills', 'exp', 'certs'].concat(lic, ['langs', 'declaration']);
      return ['summary', 'exp', 'edu', 'skills', 'certs'].concat(lic, ['langs', 'declaration']);
    }
  });

  const api = {
    PROFILES: PROFILES,
    FIELD_DEFS: FIELD_DEFS,
    MARITAL: MARITAL,
    order: ['gulf', 'us', 'uk', 'eu', 'au', 'sa'],
    get: function (id) { return PROFILES[id] || PROFILES.gulf; }
  };
  root.CVProfiles = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
