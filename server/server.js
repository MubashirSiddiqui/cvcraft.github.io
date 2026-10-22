require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { OAuth2Client } = require('google-auth-library');
const db = require('./db');

const PORT = process.env.PORT || 3000;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const DEV_LOGIN = process.env.ALLOW_DEV_LOGIN === 'true';
const DEMO_UNLOCK = process.env.ALLOW_DEMO_UNLOCK === 'true';
const SECURE = (process.env.APP_URL || '').startsWith('https');
const SESSION_DAYS = 30;
const MAX_CVS = 25;
const COOKIE = 'cvc_session';

const app = express();
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'script-src': ["'self'", 'https://accounts.google.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://accounts.google.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'blob:', 'https://*.googleusercontent.com'],
      'connect-src': ["'self'", 'https://accounts.google.com'],
      'frame-src': ['https://accounts.google.com'],
      'worker-src': ["'self'", 'blob:']
    }
  },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

/* ---------- sessions ---------- */
const hash = t => crypto.createHash('sha256').update(t).digest('hex');
function startSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + SESSION_DAYS * 864e5;
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?,?,?)').run(hash(token), userId, expires);
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: SECURE, maxAge: SESSION_DAYS * 864e5, path: '/' });
}
function currentUser(req) {
  const t = req.cookies[COOKIE];
  if (!t) return null;
  return db.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
                     WHERE s.token_hash = ? AND s.expires_at > ?`).get(hash(t), Date.now()) || null;
}
const publicUser = u => ({ id: u.id, email: u.email, name: u.name, picture: u.picture, premium: !!u.premium });
function requireAuth(req, res, next) {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: 'Please sign in.' });
  req.user = u; next();
}
// Mutating requests must be JSON (blocks plain cross-site form posts)
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT'].includes(req.method) && !req.is('json'))
    return res.status(415).json({ error: 'JSON only.' });
  next();
});
setInterval(() => db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now()), 36e5).unref();

/* ---------- auth ---------- */
const googleClient = new OAuth2Client(CLIENT_ID);
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

function upsertUser({ sub, email, name, picture }) {
  db.prepare(`INSERT INTO users (google_sub, email, name, picture, last_login) VALUES (?,?,?,?,datetime('now'))
              ON CONFLICT(google_sub) DO UPDATE SET email=excluded.email, name=excluded.name,
              picture=excluded.picture, last_login=datetime('now')`).run(sub, email, name || '', picture || '');
  return db.prepare('SELECT * FROM users WHERE google_sub = ?').get(sub);
}

app.get('/api/config', (req, res) => res.json({ googleClientId: CLIENT_ID, devLogin: DEV_LOGIN, demoUnlock: DEMO_UNLOCK }));

app.post('/api/auth/google', authLimit, async (req, res) => {
  if (!CLIENT_ID) return res.status(500).json({ error: 'GOOGLE_CLIENT_ID is not configured on the server.' });
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: String(req.body.credential || ''), audience: CLIENT_ID });
    const p = ticket.getPayload();
    if (!p.email || !p.email_verified) return res.status(403).json({ error: 'Your Google email is not verified.' });
    const user = upsertUser({ sub: p.sub, email: p.email, name: p.name, picture: p.picture });
    startSession(res, user.id);
    res.json({ user: publicUser(user) });
  } catch (e) {
    res.status(401).json({ error: 'Google sign-in could not be verified. Please try again.' });
  }
});

if (DEV_LOGIN) {
  app.post('/api/auth/dev', authLimit, (req, res) => {
    const email = String(req.body.email || 'dev@example.com').slice(0, 120);
    const user = upsertUser({ sub: 'dev:' + email, email, name: email.split('@')[0], picture: '' });
    startSession(res, user.id);
    res.json({ user: publicUser(user) });
  });
}

app.post('/api/auth/logout', (req, res) => {
  const t = req.cookies[COOKIE];
  if (t) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hash(t));
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  const u = currentUser(req);
  res.json({ user: u ? publicUser(u) : null, demoUnlock: DEMO_UNLOCK });
});

app.post('/api/premium/demo-unlock', requireAuth, (req, res) => {
  if (!DEMO_UNLOCK) return res.status(403).json({ error: 'Demo unlock is disabled.' });
  db.prepare('UPDATE users SET premium = 1 WHERE id = ?').run(req.user.id);
  res.json({ premium: true });
});

/* ---------- CVs ---------- */
const summarize = r => {
  let d = {}; try { d = JSON.parse(r.data); } catch (e) {}
  return { id: r.id, title: r.title, updated_at: r.updated_at, name: (d.p && d.p.fullName) || '',
           job: (d.p && d.p.title) || '', region: d.region || '', template: (d.design && d.design.template) || '',
           palette: (d.design && d.design.palette) || '' };
};
const cleanTitle = t => String(t || '').trim().slice(0, 80) || 'Untitled CV';
const validData = d => d && typeof d === 'object' && !Array.isArray(d);

app.get('/api/cvs', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM cvs WHERE user_id = ? ORDER BY updated_at DESC').all(req.user.id);
  res.json({ cvs: rows.map(summarize), max: MAX_CVS });
});

app.post('/api/cvs', requireAuth, (req, res) => {
  const n = db.prepare('SELECT COUNT(*) c FROM cvs WHERE user_id = ?').get(req.user.id).c;
  if (n >= MAX_CVS) return res.status(400).json({ error: `You can keep up to ${MAX_CVS} CVs. Delete one to add another.` });
  const data = validData(req.body.data) ? req.body.data : {};
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO cvs (id, user_id, title, data) VALUES (?,?,?,?)').run(id, req.user.id, cleanTitle(req.body.title), JSON.stringify(data));
  res.status(201).json({ id });
});

const ownCv = (req) => db.prepare('SELECT * FROM cvs WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

app.get('/api/cvs/:id', requireAuth, (req, res) => {
  const r = ownCv(req);
  if (!r) return res.status(404).json({ error: 'CV not found.' });
  res.json({ id: r.id, title: r.title, data: JSON.parse(r.data), updated_at: r.updated_at });
});

app.put('/api/cvs/:id', requireAuth, (req, res) => {
  const r = ownCv(req);
  if (!r) return res.status(404).json({ error: 'CV not found.' });
  const title = req.body.title !== undefined ? cleanTitle(req.body.title) : r.title;
  const data = req.body.data !== undefined ? (validData(req.body.data) ? JSON.stringify(req.body.data) : null) : r.data;
  if (data === null) return res.status(400).json({ error: 'Invalid CV data.' });
  db.prepare("UPDATE cvs SET title = ?, data = ?, updated_at = datetime('now') WHERE id = ?").run(title, data, r.id);
  res.json({ ok: true });
});

app.post('/api/cvs/:id/duplicate', requireAuth, (req, res) => {
  const r = ownCv(req);
  if (!r) return res.status(404).json({ error: 'CV not found.' });
  const n = db.prepare('SELECT COUNT(*) c FROM cvs WHERE user_id = ?').get(req.user.id).c;
  if (n >= MAX_CVS) return res.status(400).json({ error: `You can keep up to ${MAX_CVS} CVs. Delete one to add another.` });
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO cvs (id, user_id, title, data) VALUES (?,?,?,?)').run(id, req.user.id, cleanTitle(r.title + ' (copy)'), r.data);
  res.status(201).json({ id });
});

app.delete('/api/cvs/:id', requireAuth, (req, res) => {
  const r = db.prepare('DELETE FROM cvs WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.status(r.changes ? 200 : 404).json(r.changes ? { ok: true } : { error: 'CV not found.' });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

/* ---------- pages ---------- */
const pub = path.join(__dirname, '..', 'public');
const page = f => (req, res) => res.sendFile(path.join(pub, f));
app.get('/login', (req, res) => currentUser(req) ? res.redirect('/dashboard') : page('login.html')(req, res));
app.get('/dashboard', (req, res) => currentUser(req) ? page('dashboard.html')(req, res) : res.redirect('/login'));
app.get('/editor', (req, res) => currentUser(req) ? page('editor.html')(req, res) : res.redirect('/login'));
app.use(express.static(pub, { extensions: ['html'], index: 'index.html' }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'That CV is too large to save (photo too big?).' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side.' });
});

app.listen(PORT, () => {
  console.log(`CVCraft running at http://localhost:${PORT}`);
  if (!CLIENT_ID) console.log('Note: GOOGLE_CLIENT_ID is empty — Google sign-in is off. Set it in server/.env' + (DEV_LOGIN ? ' (dev login is on).' : ' or run "npm run dev" for local dev login.'));
});
