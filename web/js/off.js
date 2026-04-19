// Open Food Facts client — UPC lookup + brand/product name search.
// v2 API, free, CORS-enabled. Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
//
// For brand search, we prefer the SnapScan API (which uses a stable backend and our Supabase
// cache) and fall back to hitting OFF directly when no API base URL is configured.
(function () {
  const FIELDS = [
    "code","product_name","brands","image_front_small_url","image_front_url",
    "categories_tags","categories","nova_group","nutriments","ingredients_text",
    "quantity","labels_tags"
  ].join(",");

  // Window-level config. Set window.SNAPSCAN_API_BASE = "https://api.example.com" to route
  // search through your SnapScan API deployment. Leave unset to hit OFF directly (may 503).
  function apiBase() {
    return (typeof window !== "undefined" && window.SNAPSCAN_API_BASE) || "";
  }
  function apiKey() {
    return (typeof window !== "undefined" && window.SNAPSCAN_API_KEY) || "demo_pwa";
  }

  async function lookupUPC(upc) {
    const clean = String(upc).replace(/\D/g, "");
    if (!clean) throw new Error("Empty UPC");
    const url = `https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=${FIELDS}`;
    const res = await fetch(url);
    // OFF returns 404 when a product isn't indexed — treat that as "not found".
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`OFF ${res.status}`);
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    return data.product;
  }

  // Brand / product-name search. Preferred path: SnapScan API (/api/search) which uses
  // the modern OFF search backend and caches results. Fallback: OFF legacy /cgi/search.pl.
  async function searchByName(query, limit) {
    const q = String(query || "").trim();
    if (!q) return [];
    const n = Math.min(Math.max(parseInt(limit || 12, 10), 1), 24);

    // Path 1: SnapScan API if configured.
    const base = apiBase();
    if (base) {
      try {
        const u = `${base.replace(/\/$/, "")}/api/search?q=${encodeURIComponent(q)}&limit=${n}&api_key=${encodeURIComponent(apiKey())}`;
        const res = await fetch(u);
        if (res.ok) {
          const data = await res.json();
          const results = Array.isArray(data.results) ? data.results : [];
          // Normalize API response (flat shape) back to OFF-style product for evaluateProduct.
          return results.map(r => ({
            code: r.upc,
            product_name: r.name || "",
            brands: r.brand || "",
            image_front_small_url: r.image || "",
            image_front_url: r.image || "",
            categories_tags: r.categories_tags || [],
            categories: r.categories || "",
            nova_group: r.nova_group || null,
            labels_tags: r.labels_tags || [],
            ingredients_text: r.ingredients_text || "",
            // Pre-computed verdict for faster rendering (not used by evaluateProduct but kept for ref)
            _apiVerdict: { eligible: r.eligible, reasons: r.reasons || [] }
          }));
        }
      } catch (e) {
        // fall through to OFF
      }
    }

    // Path 2: Direct OFF legacy search. Manually build the query string — OFF's search
    // backend doesn't tolerate URL-encoded commas in `fields`, and adding any custom
    // headers (e.g. Accept) triggers a CORS preflight that the endpoint rejects.
    const qs =
      `search_terms=${encodeURIComponent(q)}` +
      `&search_simple=1&action=process&json=1` +
      `&page_size=${n}&sort_by=unique_scans_n` +
      `&fields=${FIELDS}`;
    const url = `https://world.openfoodfacts.org/cgi/search.pl?${qs}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OFF search ${res.status}`);
    const data = await res.json();
    const products = Array.isArray(data.products) ? data.products : [];
    return products.filter(p => p && p.code && (p.product_name || p.brands));
  }

  window.lookupUPC = lookupUPC;
  window.searchOFF = searchByName;
})();
