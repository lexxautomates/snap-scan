# SnapScan — ChatGPT App Build Specification

**Version:** 1.0 · **Date:** May 1, 2026 · **Owner:** Lexx Automates (lexxautomates@gmail.com)
**Repo:** https://github.com/lexxautomates/snap-scan
**Audience:** the LLM/engineer (Claude, etc.) implementing this app from a clean slate

This document is a complete handoff. Anyone reading it should be able to scope, build, and submit the SnapScan ChatGPT app to OpenAI's App Directory without needing additional context. Copy-paste-friendly. Where decisions are open, this doc states the recommended choice and why.

---

## 1. App Overview & Purpose

### Core purpose

SnapScan answers one question, in any conversation, in any language: **"Can I buy this with my SNAP/EBT card in my state?"** The app extends ChatGPT with a real-time eligibility checker keyed to the 22 U.S. state waivers approved under the federal MAHA initiative (effective Jan 2026 onward), starting with Florida's April 20, 2026 enforcement date.

### The problem it solves

In December 2025 the USDA approved a wave of state waivers that, for the first time in SNAP's 60-year history, let individual states restrict which foods qualify for benefits. By Q2 2026, 22 states have diverged from the federal baseline — Florida bans soda/energy drinks/candy/prepared desserts, Iowa bans all taxable food items, West Virginia restricts only soda. These rules differ by category, by effective date, and by retailer enforcement readiness.

The result: **41 million SNAP recipients now face checkout-line surprises.** Retailer POS systems are inconsistent, the Walmart and Amazon apps only check their own catalogs, and existing eligibility tools are English-only or iOS-only. There is no independent, cross-retailer, cross-language, state-aware eligibility checker that works in a conversation. SnapScan is that.

### The 5 primary capabilities

1. **Barcode-driven eligibility check** — given a UPC and a state, return `eligible: true|false|unknown` with a plain-language reason and the underlying state rule that applied.
2. **Product name / brand search** — given a free-text query and a state, return the top 10 matching products from Open Food Facts, each annotated with eligibility for that state.
3. **State rules lookup** — given a state code, return the active ruleset: which categories are restricted, the effective date, source citation, and a multilingual summary.
4. **Shopping list / batch eligibility** — given a list of items (free text or UPCs) and a state, return a structured response sorting them into "eligible," "not eligible," "unknown," with totals and substitution suggestions for ineligible items.
5. **Cross-state travel / move advisor** — given two state codes, surface what's different between them ("you're moving from FL to TX, here's what's now eligible/ineligible that wasn't before").

### Non-goals (explicitly out of scope for v1)

- Not a balance checker — Propel and ebtEDGE handle that.
- Not a fulfillment tool — Instacart, Walmart, and Amazon apps handle that. SnapScan returns affiliate hand-off links to them, not its own checkout.
- Not a SNAP eligibility *enrollment* screener — that's [SnapScreener.com](https://www.snapscreener.com).

---

## 2. Target Audience

### Primary users (consumer)

- **Demographic:** 41M SNAP recipients in the U.S., heavily weighted to single parents, seniors, and lower-income households. Skews Android (~65%+), 13%+ Spanish-speaking, with concentrated Haitian Creole pockets in Florida (~200k+ speakers).
- **Mental model:** they're standing in a grocery aisle, holding a product, asking "can I buy this?" They don't care about category taxonomy. They want a one-word answer with a sentence of reasoning.
- **Technical skill:** assume low-to-moderate. The app must work without account creation, without copying API keys, without reading documentation. ChatGPT's chat surface is the entire UI.
- **Devices:** mostly mobile (iOS Safari + Android Chrome), some desktop. ChatGPT's iOS and Android apps are the dominant touchpoints.

### Secondary users (B2B / advanced)

- **Retailer compliance teams** at independent grocery chains (Publix, Winn-Dixie, Sedano's, regional co-ops) testing whether SnapScan's data is good enough to license. They'll talk to the app to understand coverage, then click out to `snapscan.app/pricing` to subscribe via Stripe.
- **POS vendors** (NRS, CHEXIT, Toast, Square engineers) doing technical evaluation. Same flow.
- **State-agency staff** (Florida DCF, Texas HHSC) and **CPG brand managers** evaluating the product as a public-information tool.
- **Researchers and journalists** asking comparative questions across states.

### What makes this audience right for ChatGPT

Most Americans aged 18-45 are now active ChatGPT users (~800M weekly globally per OpenAI, Q1 2026). The SNAP demographic skews younger than Medicare, older than TikTok-only — squarely in the ChatGPT use band. ChatGPT also surfaces apps contextually: when a user types *"is gatorade SNAP-eligible in Texas?"*, ChatGPT can suggest @SnapScan even if they've never installed it. That's free distribution we get nowhere else.

---

## 3. Current State & Assets

### What already exists (production)

A monorepo at `https://github.com/lexxautomates/snap-scan` (private to org `lexxautomates`, MIT licensed). Branch `main`, fully deployed.

```
snap-scan/
├── shared/                  # ✅ COMPLETE — used by both PWA and API
│   ├── states.mjs           # 22 states, codes, names, effective dates, restricted categories
│   └── categories.mjs       # 8 categories with matchers + evaluateProduct(product, state)
│
├── api/                     # ✅ COMPLETE — Express + Stripe + optional Supabase
│   ├── src/
│   │   ├── server.mjs       # 10 routes (see endpoint table below)
│   │   ├── auth.mjs         # API-key auth, supports demo_* keys without DB
│   │   ├── billing.mjs      # Stripe checkout + customer portal + webhook
│   │   ├── db.mjs           # Supabase client (optional)
│   │   ├── keys.mjs         # API key generation + hashing
│   │   └── off.mjs          # Open Food Facts UPC lookup + name search
│   ├── migrations/001_init.sql
│   ├── package.json         # ESM, express@4, @supabase/supabase-js@2, stripe@16
│   └── public/              # Retailer landing page (NOT the consumer PWA)
│
├── web/                     # ✅ COMPLETE — consumer PWA
│   ├── index.html           # AdSense (ca-pub-9946937297371053), brand search CTA, scanner
│   ├── privacy.html         # Trilingual privacy policy (EN/ES/HT)
│   ├── sw.js                # Service worker v4
│   ├── styles.css
│   ├── manifest.webmanifest
│   └── js/
│       ├── i18n.js          # EN + ES + HT dictionary
│       ├── consent.js       # GDPR/CCPA consent banner
│       ├── states.js / categories.js / data-items.js
│       ├── off.js           # Open Food Facts client
│       ├── scanner.js       # ZXing barcode wrapper
│       └── app.js
│
├── README.md                # Includes Cloudflare/Netlify/Vercel one-click deploy buttons
├── DEPLOY_CLOUDFLARE_PAGES.md
├── STRATEGY.md              # Data freshness + monetization roadmap
└── COMPETITION.md           # Competitive landscape + 7-point moat
```

**Live URLs:**
- Consumer PWA (Perplexity preview): https://www.perplexity.ai/computer/a/snapscan-BA_Uc_8.QDerrxNJklCFRw
- Custom domain (planned): `snapscan.app` (not yet purchased)
- API: not yet hosted publicly. Locally runnable with `cd api && npm i && npm start` on port 3001. Recommended deploy target: **Railway** or **Fly.io** (instructions in README).

### Tech stack summary

| Surface | Stack |
|---|---|
| Consumer PWA | Vanilla HTML/CSS/JS, no bundler. PWA with service worker. Fontshare Clash Display + sand/green palette. |
| API | Node.js 20+, Express 4, ESM modules. Optional Supabase (Postgres + RLS) and Stripe. Demo mode works without either — any `demo_*` API key passes auth. |
| Data | Open Food Facts (UPC + product database, public CC-BY-SA). State rules hand-curated in `shared/states.mjs` from USDA FNS sources. |
| Deployment | Cloudflare Pages (PWA), Railway/Render/Fly (API). Both currently deployable in <15 minutes from the README. |

### What's complete vs. incomplete

**Complete:**
- All 22 state rulesets and 8 product-category matchers
- Open Food Facts integration (UPC lookup + name search) with 30-day caching
- 10 REST API endpoints (health, states, plans, eligibility, search, batch, usage, billing checkout/portal/webhook)
- API-key authentication with quotas (Starter 10k/mo, Pro 100k/mo, Enterprise 1M/mo)
- Stripe billing flow end-to-end (checkout → webhook → key issuance → customer portal)
- Trilingual consumer PWA (EN/ES/HT) with barcode scanner, brand search, state selector
- Privacy policy compliant with AdSense + GDPR + CCPA + GPC honoring
- Cookie/ad consent banner
- Daily-deploy CI is not yet set up; pushes to `main` trigger Cloudflare Pages rebuild only.

**Incomplete (this spec is the bridge):**
- ❌ MCP server (the actual ChatGPT app shell)
- ❌ OAuth 2.1 identity provider for ChatGPT app auth (recommendation: noauth for v1, see §6)
- ❌ Versioned ruleset architecture (planned in STRATEGY.md — required before "what was eligible on [date]?" works)
- ❌ Custom domain registration
- ❌ Affiliate hand-off URLs (Instacart/Amazon/Walmart) — buttons exist on PWA but lack tracking IDs
- ❌ Daily data-freshness GitHub Action (planned in STRATEGY.md)

---

## 4. Data & Content

### Two data layers

**Layer A — State rulesets (canonical, hand-curated, slow-changing)**

Source of truth: [USDA FNS Food Restriction Waivers page](https://www.fns.usda.gov/snap/waivers/foodrestriction). Verified April 2026. Stored in `shared/states.mjs` as a static JS module exporting `SNAP_STATES`.

Schema (current — flat):
```js
{ code: "FL", name: "Florida", effective: "2026-04-20",
  categories: ["soda", "energy", "candy", "dessert"],
  note: "Restricts soda, energy drinks, candy, and ultra-processed prepared desserts. Statewide." }
```

Recommended evolution (versioned, see STRATEGY.md):
```js
{ code: "FL", name: "Florida", rulesets: [
  { effective: "2026-04-20", expires: "2027-04-19",
    source: "https://www.fns.usda.gov/snap/waivers/foodrestriction/florida",
    approved: "2025-09-12",
    categories: ["soda", "energy", "candy", "dessert"], notes: "..." }
]}
```

This unlocks the **"what was eligible on [date]?"** audit feature that justifies the $99+ B2B tier.

**Layer B — Product database (live, third-party, fast-changing)**

[Open Food Facts](https://world.openfoodfacts.org) — public, CC-BY-SA-licensed product database with ~3.5M global UPCs. Accessed via two endpoints in `api/src/off.mjs`:

- `GET https://world.openfoodfacts.org/api/v2/product/{upc}.json` — UPC lookup
- `GET https://world.openfoodfacts.org/cgi/search.pl?search_terms={query}&json=1` — name search

Caching: 30 days in-memory (Map-based) on the API. ChatGPT app should rely on the SnapScan API rather than calling OFF directly — keeps the categorization logic centralized.

### State rules — update cadence

- **Daily**: hash the FNS master page; alert on any change (planned GitHub Action).
- **Weekly**: human review of any flagged changes; merge to `main`; PWA + API auto-deploy.
- **Quarterly**: USDA ERS SNAP Policy Database refresh — historical data, lower priority.

Tracking sources beyond FNS itself: [NGA SNAP Tracker](https://www.nationalgrocers.org/snap-waiver-tracker/), [USDA press releases](https://www.usda.gov/about-usda/news/press-releases), individual state DCF/DHHS pages linked from the FNS table.

### Florida-specific content (the launch target)

Florida is the highest-priority state because:
- Effective April 20, 2026 (already enforcing as of this spec date)
- 4M+ SNAP recipients, second-largest state caseload
- Concentrated Haitian Creole + Spanish populations no competitor serves
- Restricts the four most commonly purchased SNAP "junk food" categories: soda, energy drinks, candy, prepared desserts

The Florida-specific page on the PWA (planned per the user's "Florida SNAP Benefit Change Webpage Plan") becomes the **canonical content surface** the ChatGPT app links to for deep dives. Content includes: rule summary, effective date countdown, restricted-brand callouts (Little Debbie, Entenmann's, Tastykake), eligible-substitute suggestions, retailer-specific notes (Publix vs. Walmart vs. Sedano's behavior), Spanish + Haitian Creole versions.

---

## 5. Core Functionality Details

### User workflow A — Single-product check (most common, 80% of traffic)

1. User invokes `@SnapScan` in ChatGPT or asks naturally ("is Pepsi eligible for SNAP in Florida?")
2. ChatGPT extracts: product (Pepsi), state (FL)
3. ChatGPT calls SnapScan tool `check_eligibility` with `{query: "Pepsi", state: "FL"}` *(or `{upc: "049000028256", state: "FL"}` if user supplied a UPC)*
4. SnapScan tool internally:
   - If UPC: call API `/api/eligibility?upc=...&state=FL`
   - If query: call API `/api/search?q=...&state=FL`, take top match
5. Tool returns structured response (see §7).
6. ChatGPT renders the verdict — either inline text or, if app SDK widget is implemented, a styled card.

**Sample input → output:**
```
User: "Is Pepsi covered by SNAP in Florida?"
SnapScan tool returns: {
  product: { name: "Pepsi Cola", brand: "PepsiCo", upc: "012000001031" },
  state: "FL",
  eligible: false,
  reasons: ["Florida restricts soft drinks effective 2026-04-20"],
  effective_date: "2026-04-20",
  source_url: "https://www.fns.usda.gov/snap/waivers/foodrestriction/florida",
  alternatives: [
    { name: "Pepsi Zero Sugar", upc: "012000038686", eligible: false, reason: "Still classified as soda" },
    { name: "Bubly Sparkling Water", upc: "012000174506", eligible: true, reason: "Unsweetened sparkling water is eligible" }
  ]
}
ChatGPT response: "Pepsi Cola isn't SNAP-eligible in Florida as of April 20, 2026 — Florida's new waiver restricts soft drinks. A SNAP-eligible alternative would be Bubly Sparkling Water (unsweetened), or any 100% juice. Want me to check anything else?"
```

### User workflow B — Shopping list / batch (B-tier, 15% of traffic)

1. User pastes a list ("eggs, milk, two cans of red bull, snickers, gatorade")
2. ChatGPT calls SnapScan tool `check_list` with `{items: [...], state: "FL"}`
3. Tool fans out: for each free-text item, runs `/api/search` and takes top match. Returns categorized list.
4. ChatGPT renders a 3-column response: ✅ Eligible · ❌ Not eligible · ❓ Unknown
5. For each ❌ item, tool suggests an eligible substitute.

### User workflow C — State rules lookup (C-tier, 5% of traffic)

1. User asks "what's restricted under SNAP in Texas?"
2. ChatGPT calls SnapScan tool `get_state_rules` with `{state: "TX"}`
3. Tool returns the full ruleset including effective date, restricted categories with examples, source URL, multilingual summaries.
4. ChatGPT renders.

### Logic flow inside the tool layer

```
query/upc + state
        ↓
if UPC → Open Food Facts UPC lookup
if query → Open Food Facts text search → take top result
        ↓
product object (name, brand, categories_tags, nutriments, nova_group, image)
        ↓
evaluateProduct(product, state) [from shared/categories.mjs]
        ↓
for each restricted category in state.categories:
    run category.match(product) → boolean
        ↓
if any match → eligible: false, reasons: [list of matched categories]
if none match → eligible: true
if state has no restrictions → eligible: true (federal default)
        ↓
return verdict + reasons + product metadata + source URL
```

The categorization logic lives in `shared/categories.mjs` and is already battle-tested by the PWA and the B2B API. The ChatGPT app should reuse the API rather than reimplementing it.

---

## 6. ChatGPT Integration Preference

### Recommendation: **Apps SDK with a public MCP server, `noauth` mode for v1**

Rationale:

OpenAI's [Apps SDK](https://developers.openai.com/apps-sdk) (launched Dec 18, 2025) has superseded the older "Custom GPT" and "Plugins" formats for any app intended for the App Directory. Custom GPTs are now positioned as private/personal helpers; Apps SDK apps are the discoverable, public, monetizable surface that gets featured to ChatGPT's 800M weekly users.

Apps SDK uses the **Model Context Protocol (MCP)** standard. This is also Claude's connector format and Anthropic's Cursor/Claude Code format — meaning **the same MCP server we build for ChatGPT also works as a Claude Connector** with zero code changes. Build once, distribute everywhere.

**For v1 specifically: use `noauth` mode.** Per OpenAI's [auth docs](https://developers.openai.com/apps-sdk/build/auth): *"`noauth` — the tool is callable anonymously; ChatGPT can run it immediately."* SnapScan v1 does not need user identity — eligibility checks are stateless, depend only on product + state, and contain no PII. Skipping OAuth makes:
- v1 ship in ~2 weeks instead of ~6
- approval easier (one of the [top rejection reasons](https://www.getchatads.com/blog/chatgpt-app-rejected/) is broken/incomplete OAuth)
- onboarding zero-friction — users just type @SnapScan and it works.

Add OAuth in v2 only when we add user-specific features (saved shopping lists, favorite states, audit history for B2B accounts).

### Alternative considered (and rejected)

| Option | Verdict |
|---|---|
| **Custom GPT with knowledge files** | ❌ Rejected. Static knowledge can't reflect daily rule updates or call Open Food Facts in real time. Caps at ~25k tokens of knowledge — can't fit even half the OFF schema. Also not in the App Directory. |
| **ChatGPT Plugin (legacy)** | ❌ Rejected. Deprecated path. Plugins are being migrated to Apps SDK / MCP. |
| **Custom Action only (no MCP)** | ❌ Rejected. Custom Actions only work inside a Custom GPT — same distribution ceiling problem. |
| **Apps SDK with full OAuth 2.1** | ⚠️ v2 path. Required for B2B audit-log access, saved lists, multi-device sync. Not blocking for v1. |

### Multi-platform reuse (free distribution leverage)

The same MCP server should be submitted to:

1. **OpenAI ChatGPT App Directory** — primary distribution channel
2. **Anthropic Claude Connectors directory** — submit as a Claude Connector (same MCP wire format)
3. **Cursor / Claude Code / Gemini CLI** — local MCP client support; layer an API-key alternative auth path (per the [3MinAPI approach](https://3minapi.com/blog/building-chatgpt-app-with-apps-sdk)) for these clients while keeping `noauth` for ChatGPT
4. **Smithery / MCP registry sites** — submit for discoverability among MCP-curious devs

One server. Four distribution surfaces. Roughly zero marginal effort once #1 ships.

---

## 7. Technical Requirements

### MCP server architecture

The SnapScan MCP server is a thin adapter over the existing SnapScan REST API. It does **not** reimplement business logic.

```
┌─────────────────────┐   MCP/JSON-RPC    ┌──────────────────────┐   HTTPS/REST   ┌────────────────────┐
│  ChatGPT / Claude   │ ────────────────▶ │  SnapScan MCP server │ ─────────────▶ │  SnapScan REST API │
│  (the user's chat)  │                    │  (new — this spec)   │                │  (api/, deployed   │
└─────────────────────┘                    └──────────────────────┘                │   to Railway/Fly)  │
                                                                                    └────────────────────┘
                                                                                              │
                                                                                              ▼
                                                                                    ┌────────────────────┐
                                                                                    │   Open Food Facts  │
                                                                                    │   (UPC + product)  │
                                                                                    └────────────────────┘
```

### Recommended stack for the MCP server

- **Language**: TypeScript or Python (both have official MCP SDKs).
- **MCP SDK**: Use the standard one — `@modelcontextprotocol/sdk` (Node) or `mcp` (Python) — *not* OpenAI's wrapper. Keeps the server portable to Claude/Cursor/etc. ([3MinAPI confirms this approach](https://3minapi.com/blog/building-chatgpt-app-with-apps-sdk).)
- **Transport**: Streamable HTTP (OpenAI's recommendation; SSE also works but HTTP is simpler).
- **Hosting**: Same place as the REST API — **Railway** is the simplest. One Node service, two ports, or two services in one project. Cost: $5-10/mo at v1 traffic.
- **Domain**: `mcp.snapscan.app` (subdomain on the same registered domain).

### MCP tools to expose (v1)

| Tool name | Auth | Purpose | Input | Output |
|---|---|---|---|---|
| `check_eligibility` | noauth | Single-product eligibility check | `{ query?: string, upc?: string, state: string }` | Verdict object (see below) |
| `check_list` | noauth | Batch / shopping list check | `{ items: string[], state: string }` (max 25) | Array of verdicts |
| `get_state_rules` | noauth | Look up a state's active SNAP restrictions | `{ state: string }` | Ruleset object |
| `compare_states` | noauth | Diff two states for travel/move advice | `{ from: string, to: string }` | Diff object |
| `list_states` | noauth | Enumerate all 22 states with effective dates | none | Array of `{code, name, effective, summary}` |

Total: 5 tools. Anything more in v1 risks the [rejection bucket](https://www.getchatads.com/blog/chatgpt-app-rejected/) of "underbaked tools that fail in review."

### Standard verdict response shape

All eligibility tools return this. Keep it identical across tools so ChatGPT learns the shape once.

```json
{
  "product": {
    "name": "Pepsi Cola 12 fl oz can",
    "brand": "PepsiCo",
    "upc": "012000001031",
    "image_url": "https://images.openfoodfacts.org/.../front_en.4.400.jpg",
    "nova_group": 4
  },
  "state": { "code": "FL", "name": "Florida" },
  "eligible": false,
  "confidence": "high",
  "reasons": [
    {
      "category": "soda",
      "label": "Soda",
      "explanation": "Florida restricts soft drinks under its SNAP waiver effective 2026-04-20."
    }
  ],
  "effective_date": "2026-04-20",
  "source_url": "https://www.fns.usda.gov/snap/waivers/foodrestriction/florida",
  "alternatives": [ /* optional, max 3 */ ],
  "checked_at": "2026-05-01T22:59:00Z",
  "_meta": {
    "ui_hint": "verdict_card",
    "i18n_available": ["en", "es", "ht"]
  }
}
```

### Authentication model

- **v1 (noauth)**: no auth. Tools callable anonymously by ChatGPT. The MCP server uses a single hard-coded `demo_chatgpt_app` API key when calling the upstream SnapScan REST API — invisible to the user.
- **v2 (OAuth 2.1 + PKCE)**: required for any tool that touches per-user state. Use Auth0 free tier or Supabase Auth as the identity provider. Implement [the MCP authorization spec](https://developers.openai.com/apps-sdk/build/auth) — `.well-known/oauth-protected-resource` metadata, dynamic client registration, the `resource` parameter echo. Audience: B2B account holders who want their Stripe-billed API key tied to their ChatGPT identity.
- **Local clients (Cursor / Claude Code)**: layer an `Authorization: Bearer <api-key>` path on the same server for power users who want to use their existing SnapScan API key. ChatGPT itself never sees this path.

### Rate limits and quotas

- **Per-user (ChatGPT)**: rely on ChatGPT's built-in throttling. Don't impose anything custom in v1.
- **Per-MCP-server (upstream protection)**: 60 requests/minute global cap on the MCP server; if exceeded, return MCP error with retry hint. Prevents a misbehaving client from melting the upstream SnapScan API.
- **Per-tool (Open Food Facts protection)**: cache OFF responses for 30 days. Already implemented in `api/src/off.mjs` — the MCP server inherits it automatically by going through the REST API.

### Response format requirements

- All tool responses must return MCP `structuredContent` (machine-parseable JSON) AND a human-readable summary string. ChatGPT uses the structured content for reasoning and the string for fallback rendering.
- Set `_meta.ui_hint` so a future Apps SDK widget can be added without changing tool contracts.
- All text supports `lang` parameter (`en` | `es` | `ht`); default to user's ChatGPT locale.

### Required submission collateral

Per [OpenAI's submission guide](https://help.openai.com/en/articles/20001040-submitting-apps-to-the-chatgpt-app-directory):

- ✅ Verified developer account (lexxautomates@gmail.com — needs verification step)
- ✅ App icon (already exists at `web/icons/icon.svg` — needs PNG export at 512x512)
- ✅ App name: `SnapScan`
- ✅ Verified website: `https://snapscan.app` (must be live and HTTPS)
- ✅ Short description (<60 chars): *"Check SNAP/EBT eligibility by state and barcode."*
- ✅ Long description (200-1000 chars): see Appendix A below
- ⚠️ Screenshots (≥3): need to be created showing tool invocation in ChatGPT
- ⚠️ Configured MCP server: this is the build work
- ⚠️ Test cases: at least 10, covering all 5 tools, must pass at submission
- ✅ Privacy policy: live at `https://snapscan.app/privacy.html`
- ✅ Terms of service: needs to be added (does not currently exist — write before submission)

---

## 8. Success Metrics

### North-star metric

**Eligibility checks completed per week, in ChatGPT.** Counts every successful `check_eligibility` or `check_list` call. Single number that tracks usefulness, distribution, and retention simultaneously.

### Tier 1 — Distribution (App Directory health)

| Metric | Target by Day 30 | Target by Day 90 |
|---|---|---|
| App approved by OpenAI | ✅ Yes | n/a |
| Unique installs / activations | 1,000 | 10,000 |
| Featured placement in directory | Submitted | At least one feature slot |
| Daily active conversations using the app | 100 | 1,500 |
| 7-day retention (% of activated users using it again) | 25% | 40% |

### Tier 2 — Engagement (per-user health)

| Metric | Target |
|---|---|
| Avg. eligibility checks per user per session | 2.5+ |
| % of sessions with multi-tool use (`check_eligibility` → `compare_states`) | 15%+ |
| Avg. session length when SnapScan is invoked | >90s (signals real shopping use) |
| % of `check_list` calls with ≥5 items | 30%+ (signals real shopping list use, not toy queries) |

### Tier 3 — Monetization (revenue traction)

| Metric | Target by Day 90 | Target by Day 180 |
|---|---|---|
| Click-throughs to `snapscan.app/pricing` from app | 200 | 1,500 |
| B2B trial sign-ups attributed to ChatGPT | 5 | 30 |
| Paid B2B conversions attributed to ChatGPT | 1 ($99/mo) | 5 ($500-1000 MRR) |
| Affiliate clicks to Instacart/Walmart/Amazon (when added in v1.5) | n/a | 3,000/month |

### Tier 4 — Quality (don't ship a bad product)

| Metric | Threshold |
|---|---|
| Tool error rate (5xx + timeouts) | <1% |
| Median tool response time | <800ms |
| % of `check_eligibility` calls returning `confidence: "low"` | <15% (signals OFF coverage gaps; >15% → invest in fallback database) |
| User-reported corrections via "Report a rule issue" link | <5/week (>5 → human review, may be a real rule change) |
| App Directory rating | ≥4.3 / 5 |

### Tier 5 — Strategic (the real game)

These are leading indicators that SnapScan is winning the category, not just the app:

- **Time to first competitor app**: how long until EBT Benefit Scan or another SNAP-focused app appears in the App Directory? Goal: own the slot for ≥6 months.
- **OpenAI feature mention**: SnapScan referenced in any official OpenAI blog/tweet/talk as an Apps SDK example.
- **B2B inquiry quality**: how many of the inbound B2B leads (Publix, Winn-Dixie, NRS, CHEXIT) cite the ChatGPT app as the discovery surface?
- **Cross-app integration**: SnapScan invoked as part of a multi-app chain (e.g., `@SnapScan` → `@Instacart`) — this is the Holy Grail and the moment OpenAI starts featuring SnapScan organically.

### What "not working" looks like (cancel/rebuild signals)

- <100 weekly active conversations after Day 60 → distribution is broken; revisit listing copy and screenshots, consider paid OpenAI ad placement (when available)
- Tool error rate >5% sustained → infra problem; fix before adding features
- App rejected 3 times → engage OpenAI support directly with case ID, audit per [common rejection list](https://www.getchatads.com/blog/chatgpt-app-rejected/)
- Day 30 retention <10% → product-market fit issue; the app isn't delivering value; survey active users to find what's broken

---

## Build Plan (suggested, ~2 weeks total)

### Week 1 — Server + tools

- **Day 1-2**: scaffold MCP server (TypeScript, `@modelcontextprotocol/sdk`), deploy stub to Railway behind `mcp.snapscan.app`. Health check passes.
- **Day 3-4**: implement `check_eligibility` and `list_states` tools, wired through to existing `/api/eligibility` and `/api/states` REST endpoints. Test from MCP Inspector.
- **Day 5**: implement `check_list`, `get_state_rules`, `compare_states`. Test all five from MCP Inspector.

### Week 2 — Submission + polish

- **Day 6-7**: register `snapscan.app` domain, deploy PWA to Cloudflare Pages on it, deploy MCP to `mcp.snapscan.app`. Verify privacy policy + ToS live.
- **Day 8**: write submission copy (short + long descriptions), generate 5 screenshots showing tool flows in ChatGPT.
- **Day 9**: run OpenAI's [submission test cases](https://help.openai.com/en/articles/20001040-submitting-apps-to-the-chatgpt-app-directory) checklist. All 5 tools must pass. Fix any UI/ergonomic issues.
- **Day 10**: submit to OpenAI App Directory. Get Case ID. Use the same MCP server URL to also submit to Anthropic Claude Connectors directory.
- **Day 11-14**: monitor email for review feedback. Address any rejections and resubmit.

---

## Appendix A — Submission copy

**Short description (≤60 chars):**
> Check SNAP/EBT eligibility by state and barcode.

**Long description (~600 chars):**
> SnapScan tells you what you can buy with SNAP/EBT — instantly, in any state, in English, Spanish, or Haitian Creole. With 22 states now restricting different food categories under the 2026 federal MAHA waivers, eligibility rules vary wildly by state and effective date. SnapScan checks any product (by name or barcode) against your state's active rules, explains why something is or isn't eligible, suggests SNAP-friendly substitutes, and helps you compare rules across states if you travel or move. Built on the public USDA FNS waiver list and Open Food Facts. Independent — not affiliated with any retailer.

**Suggested first-launch tagline:**
> *"Florida just changed the rules. SnapScan is how you keep up — in your aisle, in your language."*

---

## Appendix B — Reference URLs

- OpenAI Apps SDK docs: https://developers.openai.com/apps-sdk
- OpenAI Apps SDK auth: https://developers.openai.com/apps-sdk/build/auth
- App Directory submission guide: https://help.openai.com/en/articles/20001040-submitting-apps-to-the-chatgpt-app-directory
- MCP spec: https://modelcontextprotocol.io
- USDA FNS waivers: https://www.fns.usda.gov/snap/waivers/foodrestriction
- Open Food Facts API: https://world.openfoodfacts.org/data
- This repo: https://github.com/lexxautomates/snap-scan
- Sister docs: [STRATEGY.md](./STRATEGY.md), [COMPETITION.md](./COMPETITION.md), [DEPLOY_CLOUDFLARE_PAGES.md](./DEPLOY_CLOUDFLARE_PAGES.md), [README.md](./README.md)

---

**End of spec.** Questions: `lexxautomates@gmail.com`.
