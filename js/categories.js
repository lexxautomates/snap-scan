// Categories used across all states. Each state's waiver picks a subset of these.
// `match` functions run against Open Food Facts product data and return true if the product fits.

window.SNAP_CATEGORIES = {
  soda: {
    label: "Soda",
    tone: "bad",
    blurb: "Carbonated beverages sweetened with added sugar or artificial sweeteners. Plain/naturally flavored sparkling water and drinks >50% real juice are exempt.",
    match: (p) => {
      const cats = (p.categories_tags || []).join(" ");
      const name = (p.product_name || "").toLowerCase();
      if (/carbonated-soft-drinks|sodas|colas|soft-drinks/.test(cats)) return true;
      if (/\b(cola|soda|pop|root beer|cream soda|dr pepper|mountain dew|sprite|fanta|pepsi|coke)\b/.test(name)) return true;
      return false;
    }
  },
  energy: {
    label: "Energy Drink",
    tone: "bad",
    blurb: "Beverages with ≥65mg caffeine per 8oz marketed for energy or stimulation. Coffee and tea are exempt.",
    match: (p) => {
      const cats = (p.categories_tags || []).join(" ");
      const name = (p.product_name || "").toLowerCase();
      if (/energy-drinks|energy-shots/.test(cats)) return true;
      if (/\b(red bull|monster|rockstar|bang|reign|celsius|alani|ghost energy|nos|amp|5[- ]hour|c4)\b/.test(name)) return true;
      return false;
    }
  },
  candy: {
    label: "Candy",
    tone: "bad",
    blurb: "Sugar/artificial-sweetener products combined with chocolate, fruit, nuts, caramel, gum, or hard candy in bars, drops, or pieces.",
    match: (p) => {
      const cats = (p.categories_tags || []).join(" ");
      const name = (p.product_name || "").toLowerCase();
      if (/candies|confectioneries|chocolate-candies|gummy|hard-candies|licorice|lollipops|chocolate-bars/.test(cats)) return true;
      if (/\b(snickers|kitkat|reese|hershey|m&m|milky way|twix|skittles|starburst|sour patch|haribo|jolly rancher|twizzlers|swedish fish|nerds|laffy taffy)\b/.test(name)) return true;
      return false;
    }
  },
  dessert: {
    label: "Prepared Dessert",
    tone: "bad",
    blurb: "Shelf-stable, ready-to-eat packaged sweet foods: snack cakes, packaged cookies, donuts, toaster pastries, brownies.",
    match: (p) => {
      const cats = (p.categories_tags || []).join(" ");
      const name = (p.product_name || "").toLowerCase();
      if (/snack-cakes|packaged-cookies|toaster-pastries|donuts|pastries|biscuits-and-cakes/.test(cats)) return true;
      if (/\b(oreo|chips ahoy|twinkie|ho ho|ding dong|pop[- ]tart|little debbie|entenmann|hostess|honey bun|moon pie)\b/.test(name)) return true;
      return false;
    }
  },
  sweet_bev: {
    label: "Sweetened Beverage",
    tone: "bad",
    blurb: "Drinks with ≥5g added sugar per serving (sweet tea, lemonade, sports drinks, fruit punch).",
    match: (p) => {
      const cats = (p.categories_tags || []).join(" ");
      const name = (p.product_name || "").toLowerCase();
      if (/sweetened-beverages|sports-drinks|sweet-tea|lemonades|fruit-punch/.test(cats)) return true;
      if (/\b(gatorade|powerade|snapple|arizona|kool[- ]aid|sunny[- ]?d|hi[- ]c|capri sun|tampico)\b/.test(name)) return true;
      // Fallback: sugars >=5g per 100ml for a beverage
      if ((p.nutriments && p.nutriments.sugars_100g >= 5) && /beverages|drinks/.test(cats)) return true;
      return false;
    }
  },
  juice_drink: {
    label: "Juice Drink (<50% juice)",
    tone: "bad",
    blurb: "Fruit/vegetable drinks that are less than 50% real juice by volume.",
    match: (p) => {
      const name = (p.product_name || "").toLowerCase();
      if (/\b(juice drink|juice cocktail|punch|ade)\b/.test(name) && !/100%/.test(name)) return true;
      return false;
    }
  },
  processed_food: {
    label: "Ultra-Processed Food",
    tone: "warn",
    blurb: "Highly processed foods with additives, sweeteners, and minimal whole-food content (Tennessee only).",
    match: (p) => {
      return (p.nova_group === 4);
    }
  },
  taxable: {
    label: "Taxable Food (Iowa)",
    tone: "warn",
    blurb: "Iowa's waiver restricts ALL taxable food items — any processed item beyond basic groceries is likely ineligible in Iowa.",
    match: (p) => {
      const cats = (p.categories_tags || []).join(" ");
      // Rough heuristic: if it's NOT a basic staple, it may be taxable in Iowa.
      if (/fresh-vegetables|fresh-fruits|raw-meat|eggs|milks|plain-yogurts|breads|rices|pastas|flours|dried-beans/.test(cats)) return false;
      return true; // assume taxable until proven otherwise
    }
  }
};

// Shortcut: given a product + a state object, return {eligible, reasons[]}.
window.evaluateProduct = function (product, state) {
  const reasons = [];
  if (!state || !state.categories) return { eligible: true, reasons };
  state.categories.forEach((catId) => {
    const cat = window.SNAP_CATEGORIES[catId];
    if (cat && cat.match(product)) {
      reasons.push({ id: catId, label: cat.label, blurb: cat.blurb, tone: cat.tone });
    }
  });
  return { eligible: reasons.length === 0, reasons };
};
