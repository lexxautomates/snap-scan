# Deploying SnapScan to Cloudflare Pages

This guide takes the consumer PWA (`web/`) from the GitHub repo to a live, HTTPS-enabled custom domain on Cloudflare's global edge — for **$0/month** on the free tier. Once live on a real domain, you can submit the site to Google AdSense for approval.

**Time required:** ~15 minutes (first time).
**What you need:** a GitHub account (you have `lexxautomates`), a Cloudflare account (free), and a domain you own.

---

## Quick path — one-click deploy

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/lexxautomates/snap-scan)

Clicking the button opens Cloudflare, forks/imports the repo, and creates a Pages project. You still need to set:

- **Build output directory:** `web`
- **Build command:** *(leave empty — it's a static site)*
- **Root directory:** `/`

Then jump to [Step 4 — Custom domain](#step-4--attach-your-custom-domain).

---

## Manual step-by-step

### Step 1 — Create the Cloudflare Pages project

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → sign up / log in (free)
2. Left sidebar → **Workers & Pages** → **Create** → **Pages** tab → **Connect to Git**
3. Authorize Cloudflare to read GitHub → pick the `lexxautomates/snap-scan` repo → **Begin setup**

### Step 2 — Configure the build

SnapScan's PWA is pure static files (no bundler), so the "build" is just "publish the `web/` folder".

| Field | Value |
|-------|-------|
| Project name | `snapscan` *(this becomes `snapscan.pages.dev`)* |
| Production branch | `main` |
| Framework preset | **None** |
| Build command | *(leave empty)* |
| Build output directory | `web` |
| Root directory (advanced) | `/` *(the repo root)* |

Click **Save and Deploy**. First deploy takes ~30 seconds.

You now have a live preview at `https://snapscan.pages.dev`. Every push to `main` auto-deploys. Every PR gets its own preview URL.

### Step 3 — Verify the deploy works

Open `https://snapscan.pages.dev` and check:

- [ ] The language switcher, brand search, and scanner all load
- [ ] `/privacy.html` renders in all three languages
- [ ] The consent banner appears on first visit (open in a private window to reset)
- [ ] The service worker registers (DevTools → Application → Service Workers shows `snapscan-v4` active)
- [ ] AdSense script loads without console errors (network tab: `pagead2.googlesyndication.com` returns 200)

### Step 4 — Attach your custom domain

1. In Cloudflare: **Workers & Pages** → your `snapscan` project → **Custom domains** tab → **Set up a domain**
2. Enter your domain or subdomain (e.g. `snapscan.com` or `snap.lexxautomates.com`)
3. Cloudflare walks you through DNS:
   - **Domain registered at Cloudflare:** DNS is auto-added. Done.
   - **Domain registered elsewhere:** you'll need to either transfer DNS to Cloudflare's nameservers (free), or add the CNAME record they show you at your existing registrar. CNAME is faster; nameserver transfer is more robust and lets you use Cloudflare's other free features (caching, WAF, analytics).
4. Cloudflare provisions a TLS certificate automatically (~2 minutes). Site is live on HTTPS.

### Step 5 — Point the PWA's relative paths at the new domain

Nothing to change. All paths in the PWA are relative (`./privacy.html`, `./js/...`) so it works on any domain out of the box.

If you've deployed the B2B API on Railway / Render / Fly and want the PWA to route brand searches through it, set `window.SNAPSCAN_API_BASE` in `web/index.html` (see main README).

### Step 6 — Submit to Google AdSense

1. [google.com/adsense](https://www.google.com/adsense) → **Sites** → **Add site**
2. Enter your new custom domain (e.g. `snapscan.com`)
3. AdSense crawls the site. With the privacy policy + consent banner already in place, approval typically lands in 1–14 days.

---

## Environment variables (if needed)

The PWA itself needs zero env vars. If you add any later (e.g. a public analytics key), set them in **Pages → Settings → Environment variables**. Anything prefixed `PUBLIC_` is safe to expose in static HTML; anything secret should live on the API, not on Pages.

---

## Updating the deployed site

Just push to `main`:

```bash
cd /home/user/workspace/snap-scan
git add -A
git commit -m "Update privacy wording"
git push origin main
```

Cloudflare detects the push and redeploys in ~30 seconds. Returning users pick up the new service worker (`snapscan-v5`, `v6`, …) on their next visit, which invalidates the old cache automatically.

---

## Rolling back

**Pages → Deployments** tab → find a previous green deploy → **⋯** → **Rollback to this deployment**. Instant, zero downtime.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "404 on /privacy.html" | Build output directory is wrong — should be `web`, not `/` or `dist` |
| "Service worker not registering" | Pages serves over HTTPS by default. If you see a mixed-content error, check the AdSense script tag uses `https://` |
| "Camera doesn't turn on" | Custom domain must be HTTPS. Cloudflare provides this automatically — wait 2–5 min after adding the domain for the cert to provision |
| "AdSense rejected — low-quality or insufficient content" | This is about content volume, not deploy config. Add more state-specific content pages or a blog section |
| "Consent banner never appears" | You already accepted it — open DevTools → Application → Local Storage → delete `snapScanAdsConsent`, then refresh |

---

## Why Cloudflare Pages over Netlify / Vercel

All three are free and work fine. Cloudflare wins for SnapScan because:

- **Unlimited bandwidth** on the free tier (Netlify caps at 100 GB/mo, Vercel at 100 GB/mo)
- **Unlimited requests** (Netlify free tier throttles after 125k/mo)
- **Native integration** with Cloudflare Registrar (cheapest domains at cost, no markup)
- **Free analytics** without a cookie (good for a privacy-focused app)
- **Global edge** — 300+ cities, faster than Netlify's single-region free tier
