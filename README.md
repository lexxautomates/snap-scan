# SnapScan

**SNAP/EBT eligibility for any product — check before you reach the register.**

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/lexxautomates/snap-scan)
&nbsp;[![Deploy with Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/lexxautomates/snap-scan&base=web)
&nbsp;[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/lexxautomates/snap-scan&root-directory=web)

One-click deploy of the consumer PWA. Full walkthrough: [**DEPLOY_CLOUDFLARE_PAGES.md**](./DEPLOY_CLOUDFLARE_PAGES.md).

Starting in 2026, 22 U.S. states are restricting what SNAP benefits can be spent on, with different rules per state. Rules range from West Virginia's narrow soda-only restriction to Iowa's blanket ban on all taxable food items. Retailer POS systems are inconsistent, and shoppers get surprised at checkout.

SnapScan is a monorepo with three products:

- **`web/`** — Consumer PWA. Search by brand or scan any barcode, get an instant per-state verdict. Multilingual (English, Español, Kreyòl Ayisyen).
- **`api/`** — B2B eligibility API for grocery retailers, POS vendors, and fintechs. Stripe-billed, Supabase-backed, `GET /api/eligibility?upc=&state=` style.
- **`shared/`** — Core logic (22 states, 8 restricted categories, `evaluateProduct()`) reused by both the web app and the API server.

---

## The Consumer PWA (`web/`)

What shoppers get:

1. **Search by brand or product name** — type "Coca-Cola", "Red Bull", "Pop-Tarts", and we check it against your state's SNAP rules. No UPC needed.
2. **Scan any barcode** with your phone camera (ZXing, fully on-device). UPC-A, UPC-E, EAN-13, EAN-8.
3. **Manual UPC entry** fallback.
4. **Auto-detect your state** via IP geolocation with geolocation fallback.
5. **22-state coverage** — AR, CO, FL, HI, ID, IN, IA, KS, LA, MO, NE, NV, ND, OH, OK, SC, TN, TX, UT, VA, WV, WY.
6. **Three languages** — English, Spanish, Haitian Creole. Auto-detected from the browser, switchable from the header.
7. **Offline-first PWA** — installable, works after first load.
8. **No account, no tracking.**

### Run locally

```bash
cd web && python3 -m http.server 8000
# open http://localhost:8000
```

The camera API requires HTTPS (or localhost). Deploy behind HTTPS for production camera access.

### Configure the API backend (optional but recommended)

The PWA can route brand search through your deployed SnapScan API (better reliability + caching):

```html
<!-- Add before the other <script> tags in web/index.html -->
<script>
  window.SNAPSCAN_API_BASE = "https://your-api.example.com";
  window.SNAPSCAN_API_KEY = "ss_live_xxx";
</script>
```

Without these, the PWA hits Open Food Facts directly, which is CORS-enabled but occasionally rate-limited.

---

## The Retailer API (`api/`)

A production Express server that offers:

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Public health check |
| `GET /api/plans` | Public — returns the three Stripe price tiers |
| `GET /api/states` | Public — returns all 22 covered states |
| `GET /api/eligibility?upc=&state=` | Authed — eligibility verdict for a UPC in a state |
| `GET /api/search?q=&state=` | Authed — brand/product-name fuzzy search with verdicts |
| `POST /api/batch` | Authed — up to 100 UPCs in one call |
| `GET /api/usage` | Authed — current month usage for the calling key |
| `POST /api/billing/checkout` | Creates a Stripe Checkout Session (14-day trial) |
| `POST /api/billing/portal` | Stripe customer portal |
| `POST /api/billing/webhook` | Stripe webhook; auto-provisions the first API key on `checkout.session.completed` |

Auth: `Authorization: Bearer ss_live_xxx` or `?api_key=ss_live_xxx`. Demo mode accepts any key starting with `demo_`.

### Pricing tiers

| Tier | Monthly calls | Price | Features |
|------|--------------|-------|----------|
| Starter | 10,000 | $29/mo | Single state, 1 key, 30-day cache |
| **Pro** | 100,000 | **$99/mo** | All 22 states, 5 keys, audit log, CSV export |
| Enterprise | 1,000,000 | $299/mo | Unlimited keys, webhooks, 99.9% SLA, Slack support |

All tiers include a 14-day free trial.

### Run locally

```bash
cd api
cp .env.example .env   # edit if you have Supabase / Stripe keys
npm install
node src/server.mjs
# http://localhost:8787/api/health
```

In demo mode (no Supabase, no Stripe), the API:
- Accepts any key starting with `demo_`
- Skips usage recording and quota enforcement
- Returns hardcoded plan data
- Still proxies Open Food Facts for real product lookups

### Retailer landing page

Static landing page with try-it-now demo lives at `api/public/`. Served automatically by the Express app. Pricing tiles pull live from `/api/plans`.

### Supabase setup (production)

1. Create a new Supabase project
2. Run `api/migrations/001_init.sql` in the SQL editor (creates `customers`, `api_keys`, `usage`, `upc_cache`, `eligibility_log`, `plans`)
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your env

### Stripe setup (production)

1. Create three products in Stripe (Starter, Pro, Enterprise)
2. Copy each product's price ID into `api/.env` as `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE`
3. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
4. Point your Stripe webhook at `POST /api/billing/webhook` listening for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

On successful checkout, the webhook creates a `customers` row, issues the first API key (shown once via the session metadata), and emails the retailer.

---

## Deploying the API

All three providers below support Node 20+, env vars, and free tiers that work fine for early traffic.

### Railway (recommended for first deploy)

```bash
cd api
railway login
railway init
railway up
# Add env vars in the dashboard, then:
railway domain
```

Set `PORT=8787`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`, and `PUBLIC_BASE_URL` (your eventual domain).

### Render

1. New → Web Service → point at the `snap-scan` repo, root = `api`
2. Build: `npm install` · Start: `node src/server.mjs`
3. Add env vars
4. Every push to `main` redeploys

### Fly.io

```bash
cd api
fly launch --no-deploy
# Edit fly.toml — set PORT = 8787, internal_port = 8787
fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... STRIPE_SECRET_KEY=...
fly deploy
```

After deploying, update `window.SNAPSCAN_API_BASE` in `web/index.html` to your API URL, then redeploy the PWA.

---

## Deploying the PWA (`web/`) to a custom domain

The consumer PWA is pure static files (no bundler), which means any static host works. **Cloudflare Pages** is recommended — unlimited bandwidth on free tier, auto HTTPS, auto-deploys on every `git push`.

**One-click:**

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/lexxautomates/snap-scan)

**Manual setup** (~15 min end to end, including domain + TLS):

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pick `lexxautomates/snap-scan`
2. Set **Build output directory** = `web`, leave **Build command** empty
3. Deploy → site is live at `snapscan.pages.dev` in ~30s
4. **Custom domains** tab → add your domain → Cloudflare provisions TLS automatically
5. Submit the new domain to [Google AdSense](https://www.google.com/adsense) for approval

Alternatives: [Netlify](https://app.netlify.com/start/deploy?repository=https://github.com/lexxautomates/snap-scan&base=web) · [Vercel](https://vercel.com/new/clone?repository-url=https://github.com/lexxautomates/snap-scan&root-directory=web) — same concept (connect the repo, set root to `web/`). Both are free tier–friendly with lower bandwidth caps than Cloudflare.

Full walkthrough with DNS steps, troubleshooting, rollback, and why Cloudflare over the others: see [**DEPLOY_CLOUDFLARE_PAGES.md**](./DEPLOY_CLOUDFLARE_PAGES.md).

---

## How eligibility is decided

Each state's waiver specifies restricted *categories* (soda, energy drinks, candy, prepared desserts, sweetened beverages, juice drinks, processed foods, taxable food). SnapScan maps Open Food Facts product tags, product names, and nutrition data to these categories. See [`shared/categories.mjs`](shared/categories.mjs) and [`shared/states.mjs`](shared/states.mjs) for the full rule set.

A verdict is computed as:

```js
evaluateProduct(product, state)
// => { eligible: boolean, reasons: [{ id, label, blurb, tone }] }
```

If any of the state's restricted categories match the product, `eligible` is `false` and `reasons` explains why.

---

## Project structure

```
snap-scan/
├── shared/                  # ESM modules, source of truth for state + category logic
│   ├── states.mjs
│   └── categories.mjs
├── api/                     # Express B2B API
│   ├── src/{server,auth,billing,db,keys,off}.mjs
│   ├── migrations/001_init.sql
│   ├── public/              # Retailer landing page
│   ├── .env.example
│   └── package.json
└── web/                     # Consumer PWA
    ├── index.html, styles.css, sw.js, manifest.webmanifest
    ├── js/
    │   ├── i18n.js          # EN / ES / HT translations + switcher
    │   ├── states.js, categories.js, data-items.js
    │   ├── off.js           # OFF client (UPC lookup + brand search)
    │   ├── scanner.js       # ZXing wrapper
    │   └── app.js           # Main controller
    └── icons/
```

---

## Extending

**Add a new state**: append an entry to `SNAP_STATES` in `web/js/states.js` (and `shared/states.mjs`) with `code`, `name`, `effective`, and `categories[]`. The UI, directory, and API pick it up automatically.

**Add a restricted category**: add a definition to `SNAP_CATEGORIES` in `web/js/categories.js` (and `shared/categories.mjs`) with a `match(product)` predicate that returns `true` when an OFF product fits. Then reference the category id in the relevant states.

**Add a translation**: extend the `DICT` object in `web/js/i18n.js` with the new locale code and add it to `SUPPORTED`. Add an `<option>` to the `#langSelect` in `web/index.html`.

---

## Sources

- [USDA FNS — State SNAP Food Restriction Waivers](https://www.fns.usda.gov/snap/waivers/foodrestriction)
- [Florida DCF — Healthy SNAP](https://healthysnap.myflfamilies.com)
- [Open Food Facts](https://world.openfoodfacts.org)
- [ZXing-JS barcode library](https://github.com/zxing-js/library)

## License

MIT. Not affiliated with USDA or any state agency. Verdicts are informational; retailer POS systems are the authoritative source at checkout.
