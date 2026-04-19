// Open Food Facts lookup with Supabase-backed cache.
import { supabase, hasDB } from "./db.mjs";

const FIELDS = [
  "code","product_name","brands","image_front_small_url","image_front_url",
  "categories_tags","categories","nova_group","nutriments","ingredients_text",
  "quantity","labels_tags"
].join(",");

export async function lookupUPC(upc) {
  const clean = String(upc).replace(/\D/g, "");
  if (!clean) return null;

  // 1) Cache hit?
  if (hasDB) {
    const { data } = await supabase
      .from("upc_cache")
      .select("product, expires_at")
      .eq("upc", clean)
      .maybeSingle();
    if (data && new Date(data.expires_at) > new Date()) {
      return data.product;
    }
  }

  // 2) OFF
  const url = `https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=${FIELDS}`;
  let product = null;
  try {
    const r = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "SnapScan/1.0 (+https://github.com/lexxautomates/snap-scan)" } });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`OFF ${r.status}`);
    const j = await r.json();
    if (j.status === 1 && j.product) product = j.product;
  } catch (e) {
    console.error("OFF lookup error:", e.message);
    return null;
  }

  // 3) Cache it
  if (product && hasDB) {
    const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    supabase.from("upc_cache").upsert({
      upc: clean,
      product,
      source: "off",
      fetched_at: new Date().toISOString(),
      expires_at: expires
    }).then(() => {});
  }

  return product;
}

// Brand-name search via search-a-licious (OFF's newer search API). The legacy
// /cgi/search.pl endpoint 503s Node clients, so we use search.openfoodfacts.org.
const UA = "SnapScan/1.0 (+https://github.com/lexxautomates/snap-scan; contact@snapscan.app)";
export async function searchByName(q, limit = 12) {
  const query = String(q || "").trim();
  if (!query) return [];
  const n = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 24);
  const url = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(query)}&page_size=${n}&sort_by=-unique_scans_n`;
  try {
    const r = await fetch(url, { headers: { Accept: "application/json", "User-Agent": UA } });
    if (!r.ok) throw new Error(`OFF search ${r.status}`);
    const j = await r.json();
    const hits = Array.isArray(j.hits) ? j.hits : [];
    // Normalize search-a-licious hit shape to match lookupUPC product shape.
    return hits
      .filter(h => h && h.code && (h.product_name || h.brands))
      .map(h => ({
        code: h.code,
        product_name: Array.isArray(h.product_name) ? h.product_name[0] : (h.product_name || ""),
        brands: Array.isArray(h.brands) ? h.brands.join(", ") : (h.brands || ""),
        image_front_small_url: h.image_front_small_url || h.image_small_url || "",
        image_front_url: h.image_front_url || h.image_url || "",
        categories_tags: h.categories_tags || [],
        categories: Array.isArray(h.categories) ? h.categories.join(", ") : (h.categories || ""),
        nova_group: h.nova_group || null,
        labels_tags: h.labels_tags || [],
        ingredients_text: h.ingredients_text || ""
      }));
  } catch (e) {
    console.error("OFF search error:", e.message);
    return [];
  }
}
