// Shared between API and PWA. Edit here; both surfaces pick it up.
// Source: https://www.fns.usda.gov/snap/waivers/foodrestriction (verified April 2026)

export const SNAP_STATES = [
  { code: "AR", name: "Arkansas",       effective: "2026-07-01", categories: ["soda", "juice_drink", "sweet_bev", "candy"], note: "Restricts soda, fruit/veg drinks under 50% juice, other unhealthy drinks, and candy." },
  { code: "CO", name: "Colorado",       effective: null,         categories: ["soda"], note: "Restricts soft drinks. Implementation date TBD." },
  { code: "FL", name: "Florida",        effective: "2026-04-20", categories: ["soda", "energy", "candy", "dessert"], note: "Restricts soda, energy drinks, candy, and ultra-processed prepared desserts. Statewide." },
  { code: "HI", name: "Hawaii",         effective: "2026-08-01", categories: ["soda"], note: "Restricts soft drinks." },
  { code: "ID", name: "Idaho",          effective: "2026-02-15", categories: ["soda", "candy"], note: "Restricts soda and candy." },
  { code: "IN", name: "Indiana",        effective: "2026-01-01", categories: ["soda", "candy"], note: "Restricts soft drinks and candy." },
  { code: "IA", name: "Iowa",           effective: "2026-01-01", categories: ["taxable"], note: "Strictest: restricts ALL taxable food items as defined by the Iowa Dept. of Revenue. Food-producing plants and seeds remain eligible." },
  { code: "KS", name: "Kansas",         effective: "2027-02-15", categories: ["candy", "soda"], note: "Restricts candy and soft drinks." },
  { code: "LA", name: "Louisiana",      effective: "2026-02-18", categories: ["soda", "energy", "candy"], note: "Restricts soft drinks, energy drinks, and candy." },
  { code: "MO", name: "Missouri",       effective: "2026-10-01", categories: ["candy", "dessert", "sweet_bev"], note: "Restricts candy, prepared desserts, and certain unhealthy beverages." },
  { code: "NE", name: "Nebraska",       effective: "2026-01-01", categories: ["soda", "energy"], note: "Restricts soda and energy drinks." },
  { code: "NV", name: "Nevada",         effective: "2028-02-01", categories: ["candy", "sweet_bev", "soda"], note: "Restricts candy and sugar-sweetened beverages." },
  { code: "ND", name: "North Dakota",   effective: "2026-09-01", categories: ["soda", "energy", "candy"], note: "Restricts soft drinks, energy drinks, and candy." },
  { code: "OH", name: "Ohio",           effective: "2026-10-01", categories: ["sweet_bev", "soda"], note: "Restricts sugar-sweetened beverages." },
  { code: "OK", name: "Oklahoma",       effective: "2026-02-15", categories: ["soda", "candy"], note: "Restricts soft drinks and candy." },
  { code: "SC", name: "South Carolina", effective: "2026-08-31", categories: ["candy", "energy", "soda", "sweet_bev"], note: "Restricts candy, energy drinks, soft drinks, and sweetened beverages." },
  { code: "TN", name: "Tennessee",      effective: "2026-07-31", categories: ["processed_food", "soda", "energy", "candy"], note: "Restricts processed foods and beverages such as soda, energy drinks, and candy." },
  { code: "TX", name: "Texas",          effective: "2026-04-01", categories: ["sweet_bev", "soda", "candy"], note: "Restricts sweetened drinks and candy." },
  { code: "UT", name: "Utah",           effective: "2026-01-01", categories: ["soda"], note: "Restricts soft drinks." },
  { code: "VA", name: "Virginia",       effective: "2026-10-01", categories: ["sweet_bev", "soda"], note: "Restricts sweetened beverages." },
  { code: "WV", name: "West Virginia",  effective: "2026-01-01", categories: ["soda"], note: "Restricts soda." },
  { code: "WY", name: "Wyoming",        effective: "2027-02-01", categories: ["soda", "sweet_bev"], note: "Restricts sweetened, carbonated beverages." }
];
