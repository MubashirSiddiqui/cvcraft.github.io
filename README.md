# CVCraft – landing page, Google sign-in, dashboard and CV builder

```
public/            landing (index.html), login.html, dashboard.html, editor.html (your builder), css/, js/, vendor/
server/            Node + Express API, SQLite database, Google sign-in
```

## Run it locally
```bash
cd server
npm install
cp .env.example .env        # then edit .env
npm run dev                 # needs Node 22.13 or newer (uses its built-in SQLite). Dev mode: shows a "test user" login so you can try everything without Google
```
Open http://localhost:3000

## Turn on real Google sign-in
1. Google Cloud Console → APIs & Services → Credentials → Create credentials → **OAuth client ID** → type **Web application**.
2. Under **Authorized JavaScript origins** add `http://localhost:3000` (and your real domain later, e.g. `https://yourdomain.com`).
3. Put the client ID in `server/.env` as `GOOGLE_CLIENT_ID=...`, set `APP_URL` to your site URL, and run `npm start`.
   (You may need to configure the OAuth consent screen first; "External" + "Testing" with your own email as a test user is enough to start.)

## How it works
- `/` landing → `/login` (Google) → `/dashboard` (your CVs) → `/editor?id=…` (your builder).
- The editor autosaves to the server as you type. The old "Save file / Open file" buttons still work.
- Database: one SQLite file at `server/data/cvcraft.db` (tables: users, sessions, cvs). Back this file up; on a host, put it on a persistent disk or set `DB_PATH`.
- Sessions use a random token in an HttpOnly cookie (30 days); only a hash is stored.

## Premium / payments
Premium status is now stored per account on the server. To grant it after a payment:
`npm run grant-premium -- someone@gmail.com` (add `off` to remove).
For automatic upgrades, add your payment provider's webhook endpoint in `server/server.js` that sets `premium = 1` for the buyer's email.
Note: PDF/Word/JPG are still generated in the browser, so a technical user could bypass the paywall. Real enforcement means generating the files on the server.
Set `ALLOW_DEMO_UNLOCK=false` (default) in production. Set `checkoutUrl` and the price in `public/js/config.js`.

## Deploying
Any host that runs Node (Render, Railway, Fly.io, a VPS). Set the env vars from `.env.example`, keep `ALLOW_DEV_LOGIN` and `ALLOW_DEMO_UNLOCK` off, and serve over HTTPS.
Cloudflare Pages / Netlify alone won't work now, because the app needs the server.

(Original builder notes: `README.old.md`.)
