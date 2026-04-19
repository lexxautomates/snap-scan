// Stripe integration: checkout, portal, webhooks.
import Stripe from "stripe";
import { supabase, hasDB } from "./db.mjs";
import { generateKey } from "./keys.mjs";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
export const stripe = stripeSecret ? new Stripe(stripeSecret) : null;
export const hasStripe = Boolean(stripe);

if (!hasStripe) console.warn("⚠️  Stripe not configured — /api/billing endpoints run in demo mode.");

const PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE
};

export async function createCheckoutSession({ email, plan, businessName }) {
  if (!hasStripe) throw new Error("Stripe not configured");
  const priceId = PRICES[plan];
  if (!priceId) throw new Error(`Unknown plan: ${plan}`);
  const webBase = process.env.WEB_BASE_URL || "http://localhost:5173";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    subscription_data: { trial_period_days: 14 },
    allow_promotion_codes: true,
    metadata: { plan, businessName: businessName || "" },
    success_url: `${webBase}/retailers/success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${webBase}/retailers/`
  });
  return session;
}

export async function createPortalSession({ customerId }) {
  if (!hasStripe) throw new Error("Stripe not configured");
  const webBase = process.env.WEB_BASE_URL || "http://localhost:5173";
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${webBase}/retailers/`
  });
}

// Webhook handler — see server.mjs for the raw-body wiring.
export async function handleWebhookEvent(event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const email = session.customer_details?.email || session.customer_email;
      const plan = session.metadata?.plan || "starter";
      const businessName = session.metadata?.businessName || null;
      const stripeCustomerId = session.customer;
      const stripeSubId = session.subscription;
      if (!hasDB) { console.log("DB off — would create customer for", email); return; }

      // Upsert customer + issue first API key
      const { data: customer, error } = await supabase
        .from("customers")
        .upsert({
          email, business_name: businessName,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubId,
          plan, status: "trialing",
          updated_at: new Date().toISOString()
        }, { onConflict: "email" })
        .select()
        .single();
      if (error) { console.error(error); return; }

      const { raw, hash, prefix } = generateKey({ livemode: true });
      await supabase.from("api_keys").insert({
        customer_id: customer.id, key_hash: hash, key_prefix: prefix, name: "Primary key"
      });
      console.log(`✓ Created customer ${email} on ${plan}, key prefix ${prefix}`);
      // TODO: email the raw key to the retailer (they can only see it once).
      return { customer, rawKey: raw };
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      if (!hasDB) return;
      const status = sub.status === "active" ? "active"
                   : sub.status === "trialing" ? "trialing"
                   : sub.status === "past_due" ? "past_due"
                   : "canceled";
      await supabase.from("customers")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", sub.id);
      return;
    }

    default:
      return;
  }
}
