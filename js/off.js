// Open Food Facts lookup. v2 API, free, CORS-enabled.
// Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
window.lookupUPC = async function (upc) {
  const clean = String(upc).replace(/\D/g, "");
  if (!clean) throw new Error("Empty UPC");
  const fields = [
    "code","product_name","brands","image_front_small_url","image_front_url",
    "categories_tags","categories","nova_group","nutriments","ingredients_text",
    "quantity","labels_tags"
  ].join(",");
  const url = `https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=${fields}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  // OFF returns 404 when a product isn't indexed — treat that as "not found" rather than an error.
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`OFF ${res.status}`);
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  return data.product;
};
