// Express middleware for API key authentication + quota enforcement.
import { supabase, hasDB } from "./db.mjs";
import { hashKey } from "./keys.mjs";

// Reads "Authorization: Bearer <key>" or "?api_key=<key>".
export function getKeyFromRequest(req) {
  const h = req.headers.authorization || "";
  if (h.toLowerCase().startsWith("bearer ")) return h.slice(7).trim();
  if (req.query && req.query.api_key) return String(req.query.api_key);
  return null;
}

export async function authenticate(req, res, next) {
  const raw = getKeyFromRequest(req);
  if (!raw) {
    return res.status(401).json({
      error: "missing_api_key",
      message: "Pass your API key as `Authorization: Bearer ss_live_...` or `?api_key=...`."
    });
  }

  // DEMO mode: accept any key starting with "demo_"
  if (!hasDB) {
    if (raw.startsWith("demo_") || raw === "test") {
      req.customer = { id: "demo", plan: "pro", status: "active" };
      req.apiKey = { id: "demo", prefix: raw.slice(0, 16) };
      return next();
    }
    return res.status(401).json({ error: "invalid_api_key", message: "Demo mode: use a key starting with 'demo_'." });
  }

  const keyHash = hashKey(raw);
  const { data: keyRow, error } = await supabase
    .from("api_keys")
    .select("id, customer_id, revoked_at, key_prefix, customers(id, plan, status, trial_ends_at)")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (error || !keyRow) {
    return res.status(401).json({ error: "invalid_api_key", message: "That key isn't valid." });
  }
  if (keyRow.revoked_at) {
    return res.status(401).json({ error: "revoked_api_key", message: "This key has been revoked." });
  }
  const customer = keyRow.customers;
  if (!customer) return res.status(401).json({ error: "no_customer" });

  const trialing = customer.status === "trialing" && new Date(customer.trial_ends_at) > new Date();
  if (!["active", "trialing"].includes(customer.status) || (customer.status === "trialing" && !trialing)) {
    return res.status(402).json({
      error: "payment_required",
      message: "Your subscription is inactive. Visit the dashboard to update billing."
    });
  }

  // Update last_used_at (fire-and-forget)
  supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id).then(() => {});

  req.customer = customer;
  req.apiKey = { id: keyRow.id, prefix: keyRow.key_prefix };
  next();
}

// Enforces monthly quota. Called AFTER authenticate.
export async function enforceQuota(req, res, next) {
  if (!hasDB || req.customer.id === "demo") return next();

  const { data: plan } = await supabase.from("plans").select("monthly_calls").eq("code", req.customer.plan).maybeSingle();
  const limit = plan?.monthly_calls ?? 10000;

  // Sum usage for current month
  const firstOfMonth = new Date();
  firstOfMonth.setUTCDate(1);
  firstOfMonth.setUTCHours(0, 0, 0, 0);

  const { data: rows } = await supabase
    .from("usage")
    .select("count")
    .eq("customer_id", req.customer.id)
    .gte("day", firstOfMonth.toISOString().slice(0, 10));

  const used = (rows || []).reduce((s, r) => s + r.count, 0);
  if (used >= limit) {
    return res.status(429).json({
      error: "quota_exceeded",
      message: `You've used ${used}/${limit} calls this month on the ${req.customer.plan} plan. Upgrade to continue.`,
      plan: req.customer.plan,
      limit,
      used
    });
  }
  req.quota = { limit, used, remaining: limit - used };
  res.setHeader("X-RateLimit-Limit", String(limit));
  res.setHeader("X-RateLimit-Remaining", String(limit - used - 1));
  next();
}

// Increments usage. Safe-to-fail (won't break the response).
export async function recordUsage(req) {
  if (!hasDB || req.customer?.id === "demo") return;
  const today = new Date().toISOString().slice(0, 10);
  try {
    // Try to increment existing row; fall back to insert.
    const { data: existing } = await supabase
      .from("usage")
      .select("id, count")
      .eq("customer_id", req.customer.id)
      .eq("api_key_id", req.apiKey.id)
      .eq("day", today)
      .maybeSingle();
    if (existing) {
      await supabase.from("usage").update({ count: existing.count + 1 }).eq("id", existing.id);
    } else {
      await supabase.from("usage").insert({
        customer_id: req.customer.id,
        api_key_id: req.apiKey.id,
        day: today,
        count: 1
      });
    }
  } catch (e) {
    console.error("recordUsage error:", e.message);
  }
}
