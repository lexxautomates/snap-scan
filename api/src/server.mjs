// SnapScan retailer API.
// Endpoints:
//   GET  /api/health
//   GET  /api/plans
//   GET  /api/states
//   GET  /api/eligibility?upc=<upc>&state=<code>        (auth)
//   GET  /api/search?q=<text>&state=<code>              (auth)
//   POST /api/batch                                     (auth)   body: { upcs: [...], state }
//   GET  /api/usage                                     (auth)
//   POST /api/billing/checkout    body: { email, plan, businessName }
//   POST /api/billing/portal      body: { customerId }
//   POST /api/billing/webhook     (raw body, Stripe signature)

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { SNAP_STATES } from "../../shared/states.mjs";
import { SNAP_CATEGORIES, evaluateProduct } from "../../shared/categories.mjs";
import { supabase, hasDB } from "./db.mjs";
import { authenticate, enforceQuota, recordUsage } from "./auth.mjs";
import { lookupUPC, searchByName } from "./off.mjs";
import { createCheckoutSession, createPortalSession, stripe, hasStripe, handleWebhookEvent } from "./billing.mjs";

const app = express();
const PORT = process.env.PORT || 8787;

// CORS — open by default, retailers will call from their own origins.
app.use(cors({ origin: true, credentials: true }));

// Webhook needs RAW body. Mount it BEFORE express.json().
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!hasStripe) return res.status(501).json({ error: "stripe_not_configured" });
  const sig = req.headers["stripe-signature"];
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, whSecret);
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    await handleWebhookEvent(event);
    res.json({ received: true });
  } catch (e) {
    console.error("Webhook handler error:", e);
    res.status(500).json({ error: "handler_failed" });
  }
});

// All other routes use JSON.
app.use(express.json({ limit: "256kb" }));

// Serve the tiny retailer portal (pricing, success page, dashboard stub).
app.use("/retailers", express.static(new URL("../public", import.meta.url).pathname));

// Basic IP rate-limit as a backstop (in addition to plan quotas).
const ipLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false });
app.use("/api", ipLimiter);

// --------- PUBLIC ----------
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    time: new Date().toISOString(),
    db: hasDB,
    stripe: hasStripe,
    states: SNAP_STATES.length
  });
});

app.get("/api/states", (req, res) => {
  res.json({ states: SNAP_STATES });
});

app.get("/api/plans", async (req, res) => {
  if (!hasDB) {
    return res.json({
      plans: [
        { code: "starter", name: "Starter", monthly_calls: 10000, price_usd: 29, features: ["Single state", "1 API key", "30-day cache", "Email support"] },
        { code: "pro", name: "Pro", monthly_calls: 100000, price_usd: 99, features: ["All 22 states", "5 API keys", "Audit log", "Priority email support", "CSV export"] },
        { code: "enterprise", name: "Enterprise", monthly_calls: 1000000, price_usd: 299, features: ["All 22 states", "Unlimited keys", "Audit log", "Webhook events", "99.9% SLA", "Dedicated Slack"] }
      ]
    });
  }
  const { data } = await supabase.from("plans").select("*").order("price_usd");
  res.json({ plans: data || [] });
});

// --------- AUTHED ----------
app.get("/api/eligibility", authenticate, enforceQuota, async (req, res) => {
  const upc = String(req.query.upc || "").replace(/\D/g, "");
  const stateCode = String(req.query.state || "").toUpperCase();
  if (!upc) return res.status(400).json({ error: "missing_upc" });
  const state = SNAP_STATES.find(s => s.code === stateCode);
  if (!state) return res.status(400).json({ error: "unknown_state", message: `State '${stateCode}' not covered.` });

  const product = await lookupUPC(upc);
  if (!product) {
    recordUsage(req);
    return res.json({
      upc, state: stateCode, found: false,
      eligible: null,
      message: "Product not found in Open Food Facts. Consider community-contributing the UPC."
    });
  }
  const { eligible, reasons } = evaluateProduct(product, state);

  // Optional audit log
  if (hasDB && req.customer.id !== "demo") {
    supabase.from("eligibility_log").insert({
      customer_id: req.customer.id, upc, state: stateCode, eligible, reasons
    }).then(() => {});
  }

  recordUsage(req);
  res.json({
    upc, state: stateCode, found: true, eligible, reasons,
    product: {
      name: product.product_name, brand: product.brands,
      image: product.image_front_small_url || product.image_front_url || null,
      nova_group: product.nova_group
    },
    quota: req.quota
  });
});

app.get("/api/search", authenticate, enforceQuota, async (req, res) => {
  const q = String(req.query.q || "").trim();
  const stateCode = String(req.query.state || "").toUpperCase();
  if (!q) return res.status(400).json({ error: "missing_query" });
  const state = SNAP_STATES.find(s => s.code === stateCode);
  const products = await searchByName(q);

  const results = products.slice(0, 10).map(p => {
    const r = state ? evaluateProduct(p, state) : { eligible: null, reasons: [] };
    return {
      upc: p.code, name: p.product_name, brand: p.brands,
      image: p.image_front_small_url || p.image_front_url || null,
      eligible: r.eligible, reasons: r.reasons
    };
  });

  recordUsage(req);
  res.json({ query: q, state: stateCode || null, results, quota: req.quota });
});

app.post("/api/batch", authenticate, enforceQuota, async (req, res) => {
  const { upcs = [], state: stateCode } = req.body || {};
  if (!Array.isArray(upcs) || !upcs.length) return res.status(400).json({ error: "missing_upcs" });
  if (upcs.length > 100) return res.status(400).json({ error: "too_many", message: "Max 100 UPCs per batch." });
  const state = SNAP_STATES.find(s => s.code === stateCode);
  if (!state) return res.status(400).json({ error: "unknown_state" });

  const out = [];
  for (const upc of upcs) {
    const clean = String(upc).replace(/\D/g, "");
    const product = await lookupUPC(clean);
    if (!product) { out.push({ upc: clean, found: false, eligible: null }); continue; }
    const { eligible, reasons } = evaluateProduct(product, state);
    out.push({ upc: clean, found: true, eligible, reasons, name: product.product_name });
    recordUsage(req);
  }
  res.json({ state: stateCode, results: out });
});

app.get("/api/usage", authenticate, async (req, res) => {
  if (!hasDB || req.customer.id === "demo") {
    return res.json({ customer: "demo", plan: "pro", used: 0, limit: 100000 });
  }
  const firstOfMonth = new Date();
  firstOfMonth.setUTCDate(1); firstOfMonth.setUTCHours(0,0,0,0);
  const { data: rows } = await supabase
    .from("usage").select("count")
    .eq("customer_id", req.customer.id)
    .gte("day", firstOfMonth.toISOString().slice(0,10));
  const used = (rows||[]).reduce((s, r) => s + r.count, 0);
  const { data: plan } = await supabase.from("plans").select("monthly_calls").eq("code", req.customer.plan).maybeSingle();
  res.json({ plan: req.customer.plan, used, limit: plan?.monthly_calls ?? 10000 });
});

// --------- BILLING ----------
app.post("/api/billing/checkout", async (req, res) => {
  try {
    const { email, plan = "starter", businessName } = req.body || {};
    if (!email) return res.status(400).json({ error: "missing_email" });
    if (!["starter", "pro", "enterprise"].includes(plan)) return res.status(400).json({ error: "bad_plan" });
    if (!hasStripe) {
      return res.status(501).json({ error: "stripe_not_configured", message: "Add STRIPE_SECRET_KEY and price IDs to enable checkout." });
    }
    const session = await createCheckoutSession({ email, plan, businessName });
    res.json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "checkout_failed", message: e.message });
  }
});

app.post("/api/billing/portal", async (req, res) => {
  try {
    const { customerId } = req.body || {};
    if (!customerId) return res.status(400).json({ error: "missing_customer_id" });
    const session = await createPortalSession({ customerId });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: "portal_failed", message: e.message });
  }
});

// --------- 404 ----------
app.use((req, res) => res.status(404).json({ error: "not_found" }));

app.listen(PORT, () => {
  console.log(`✓ SnapScan API on :${PORT}`);
  console.log(`  DB: ${hasDB ? "supabase" : "demo"}  |  Stripe: ${hasStripe ? "live" : "demo"}`);
});
