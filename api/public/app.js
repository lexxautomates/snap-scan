// Retailer landing page JS — renders plans, populates state dropdown, runs the demo check.
const API_BASE = location.origin; // same-origin

async function j(url, opts) { const r = await fetch(url, opts); return r.json(); }

async function loadPlans() {
  const { plans = [] } = await j(`${API_BASE}/api/plans`);
  const el = document.getElementById("plans");
  const featured = "pro";
  el.innerHTML = plans.map(p => `
    <div class="plan ${p.code === featured ? 'featured' : ''}">
      <h3>${p.name}</h3>
      <div class="price">$${p.price_usd}<small>/mo</small></div>
      <div class="calls">${p.monthly_calls.toLocaleString()} API calls / month</div>
      <ul>${(p.features || []).map(f => `<li>${f}</li>`).join("")}</ul>
      <button class="btn btn-primary" data-plan="${p.code}">Start 14-day trial</button>
    </div>
  `).join("");
  el.querySelectorAll("button[data-plan]").forEach(b => b.addEventListener("click", () => startCheckout(b.dataset.plan)));
}

async function startCheckout(plan) {
  const email = prompt("Your business email (for billing + API key):");
  if (!email) return;
  const businessName = prompt("Business name (optional):") || "";
  const res = await j(`${API_BASE}/api/billing/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, plan, businessName })
  });
  if (res.url) { location.href = res.url; return; }
  alert(res.message || res.error || "Checkout unavailable. The API is running in demo mode — add Stripe keys to enable real billing.");
}

async function loadStates() {
  const { states = [] } = await j(`${API_BASE}/api/states`);
  const sel = document.getElementById("tryState");
  sel.innerHTML = states
    .sort((a,b)=>a.name.localeCompare(b.name))
    .map(s => `<option value="${s.code}" ${s.code==='FL'?'selected':''}>${s.name}</option>`).join("");
}

async function runTry() {
  const upc = document.getElementById("tryUPC").value.trim();
  const state = document.getElementById("tryState").value;
  const out = document.getElementById("tryOut");
  out.textContent = "Checking…";
  try {
    const res = await j(`${API_BASE}/api/eligibility?upc=${encodeURIComponent(upc)}&state=${state}&api_key=demo_landing`);
    out.textContent = JSON.stringify(res, null, 2);
  } catch (e) {
    out.textContent = `Error: ${e.message}`;
  }
}

document.getElementById("tryBtn").addEventListener("click", runTry);
loadPlans();
loadStates();
