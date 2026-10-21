# CVCraft – region-ready CV builder

Static website (no server needed). Open `index.html`, or `CVCraft.html` (everything in one file). Deploy free on Cloudflare Pages / Netlify / Vercel.

## Regions (js/profiles.js)
Middle East (GCC), USA / Canada (US Letter), UK / Ireland, Europe (DE/FR/NL/ES/IT), Australia / NZ (referees), South Asia (PK/IN/BD/LK).
Each profile controls form fields, labels, section order per experience level, paper size, page length, photo policy, country tips and recommended layouts. Add a region by adding a `makeProfile({...})` entry.

## Features
- 7 layouts (Classic, Sidebar Pro, Modern Banner, Executive Serif, Compact Timeline, ATS Simple, Europass Style) x 12 colours x 5 font pairs = 420 looks
- Live A4 / Letter preview with page-break guides; blocks never cut across pages
- CV health check (region-aware score), summary drafter, bullet-quality hints, region format guide
- Save / open CV as a .json file (works on any device, no account needed)
- Free: JPG with watermark. Premium: PDF (selectable text), Word (.docx), clean JPG

## Files
- `js/profiles.js` region rules · `js/templates.js` + `css/templates.css` layouts · `js/export.js` JPG/PDF/Word
- `js/app.js` wizard and features · `js/config.js` price, watermark, checkout link, paywall switch

## Before going live
1. Payments: set `checkoutUrl` and set `demoUnlock:false`. The paywall is browser-side and can be bypassed; real enforcement needs a small backend that verifies payment. Check Paddle / Lemon Squeezy / Safepay availability for Pakistan.
2. Accounts, cloud-saved CVs and AI-written text also need a backend; this version saves to the browser and to .json files.
3. Fonts load from Google Fonts (needs internet).
4. Word export is one clean single-column layout (colour and font follow your choice).
5. PDF: in the print dialog choose the paper size shown, margins None, background graphics on.
