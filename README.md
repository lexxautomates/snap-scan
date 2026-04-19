# SnapScan

**SNAP/EBT eligibility scanner — check any product before you reach the register.**

Starting in 2026, 22 U.S. states are restricting what SNAP benefits can be spent on, with different rules per state. Rules range from West Virginia's narrow soda-only restriction to Iowa's blanket ban on all taxable food items. Retailer POS systems are inconsistent, and shoppers are getting surprised at checkout.

SnapScan is a barcode-scanning PWA that:

1. Detects your state (or lets you pick one)
2. Reads any product barcode with your phone camera (ZXing, fully on-device)
3. Looks the product up in [Open Food Facts](https://world.openfoodfacts.org)
4. Tells you instantly whether SNAP will cover it in **your** state

## Features

- **Barcode scanning** via [ZXing](https://github.com/zxing-js/library) — UPC-A, UPC-E, EAN-13, EAN-8
- **Manual UPC entry** fallback
- **22-state coverage** with correct per-state rules (AR, CO, FL, HI, ID, IN, IA, KS, LA, MO, NE, NV, ND, OH, OK, SC, TN, TX, UT, VA, WV, WY)
- **Auto-detect your state** via IP geolocation (ipapi.co) with geolocation fallback
- **Offline-first PWA** — installable, works after first load
- **Directory view** — browse restricted item groups per state with brand examples
- **No account, no tracking** — fully client-side

## How eligibility is decided

Each state's waiver specifies restricted *categories* (e.g. soda, energy drinks, candy, prepared desserts, sweetened beverages, juice drinks, processed foods, taxable food). SnapScan maps Open Food Facts product tags, product names, and nutrition data to these categories. See [`js/categories.js`](js/categories.js) for the matcher definitions and [`js/states.js`](js/states.js) for the state-by-state rule set.

A verdict is computed as:

```js
evaluateProduct(product, state)
// => { eligible: boolean, reasons: [{ id, label, blurb, tone }] }
```

If any of the state's restricted categories match the product, `eligible` is `false` and `reasons` explains why.

## Stack

- Vanilla HTML / CSS / JS (no framework, no build step)
- [ZXing-JS](https://github.com/zxing-js/library) for barcode decoding (loaded via unpkg CDN)
- [Open Food Facts v2 API](https://openfoodfacts.github.io/openfoodfacts-server/api/) for product data
- [ipapi.co](https://ipapi.co) for IP-based state detection (no key required)
- Service worker with cache-first shell, network-first OFF API

## Project structure

```
snap-scan/
├── index.html
├── styles.css
├── sw.js                    # Service worker
├── manifest.webmanifest     # PWA manifest
├── icons/
│   ├── icon.svg
│   ├── icon-192.png
│   └── icon-512.png
└── js/
    ├── states.js            # 22 state waivers + geo centroids
    ├── categories.js        # category definitions + matcher logic
    ├── data-items.js        # directory item groups with brand examples
    ├── off.js               # Open Food Facts lookup
    ├── scanner.js           # ZXing barcode scanner wrapper
    └── app.js               # main app controller
```

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

The camera API requires HTTPS (or localhost). Deploy behind HTTPS for production camera access.

## Extending

**Add a new state**: append an entry to `SNAP_STATES` in `js/states.js` with `code`, `name`, `effective`, and `categories[]`. That's it — the UI and directory pick it up automatically.

**Add a new restricted category**: add a definition to `SNAP_CATEGORIES` in `js/categories.js` with a `match(product)` predicate that returns `true` when an OFF product fits. Then reference the category id in the relevant states' `categories` arrays.

**Add brand examples**: append entries to `SNAP_ITEMS` in `js/data-items.js` tagged with the category id — they'll appear in the directory whenever a state restricts that category.

## Roadmap

- Retailer-facing B2B API: `GET /api/eligibility?upc=...&state=FL`
- Community-submitted product corrections (with moderation)
- UPC cache via IndexedDB for fully offline scans of previously-seen items
- Multi-language UI (Spanish, Haitian Creole for Florida)
- iOS / Android native wrappers via Capacitor

## Sources

- [USDA FNS — State SNAP Food Restriction Waivers](https://www.fns.usda.gov/snap/waivers/foodrestriction)
- [Florida DCF — Healthy SNAP](https://healthysnap.myflfamilies.com)
- [Open Food Facts](https://world.openfoodfacts.org)

## License

MIT. Not affiliated with USDA or any state agency. Verdicts are informational; retailer POS systems are the authoritative source at checkout.
