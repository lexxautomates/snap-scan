// All USDA-approved SNAP Food Restriction Waivers.
// Source: https://www.fns.usda.gov/snap/waivers/foodrestriction (verified April 2026)
// categories reference the tag ids used by data-items.js (soda, energy, candy, dessert, sweet_bev, juice_drink, processed_food, taxable).
//
// "effective" is the implementation date (ISO). "status" is derived at runtime:
//   active   -> effective <= today
//   upcoming -> effective >  today
//   tbd      -> no date set

window.SNAP_STATES = [
  {
    code: "AR", name: "Arkansas", effective: "2026-07-01",
    categories: ["soda", "juice_drink", "sweet_bev", "candy"],
    note: "Restricts soda, fruit/veg drinks under 50% juice, other unhealthy drinks, and candy."
  },
  {
    code: "CO", name: "Colorado", effective: null,
    categories: ["soda"],
    note: "Restricts soft drinks. Implementation date TBD."
  },
  {
    code: "FL", name: "Florida", effective: "2026-04-20",
    categories: ["soda", "energy", "candy", "dessert"],
    note: "Restricts soda, energy drinks, candy, and ultra-processed prepared desserts. Statewide."
  },
  {
    code: "HI", name: "Hawaii", effective: "2026-08-01",
    categories: ["soda"],
    note: "Restricts soft drinks."
  },
  {
    code: "ID", name: "Idaho", effective: "2026-02-15",
    categories: ["soda", "candy"],
    note: "Restricts soda and candy."
  },
  {
    code: "IN", name: "Indiana", effective: "2026-01-01",
    categories: ["soda", "candy"],
    note: "Restricts soft drinks and candy."
  },
  {
    code: "IA", name: "Iowa", effective: "2026-01-01",
    categories: ["taxable"],
    note: "Strictest: restricts ALL taxable food items as defined by the Iowa Dept. of Revenue. Food-producing plants and seeds remain eligible."
  },
  {
    code: "KS", name: "Kansas", effective: "2027-02-15",
    categories: ["candy", "soda"],
    note: "Restricts candy and soft drinks."
  },
  {
    code: "LA", name: "Louisiana", effective: "2026-02-18",
    categories: ["soda", "energy", "candy"],
    note: "Restricts soft drinks, energy drinks, and candy."
  },
  {
    code: "MO", name: "Missouri", effective: "2026-10-01",
    categories: ["candy", "dessert", "sweet_bev"],
    note: "Restricts candy, prepared desserts, and certain unhealthy beverages."
  },
  {
    code: "NE", name: "Nebraska", effective: "2026-01-01",
    categories: ["soda", "energy"],
    note: "Restricts soda and energy drinks."
  },
  {
    code: "NV", name: "Nevada", effective: "2028-02-01",
    categories: ["candy", "sweet_bev", "soda"],
    note: "Restricts candy and sugar-sweetened beverages."
  },
  {
    code: "ND", name: "North Dakota", effective: "2026-09-01",
    categories: ["soda", "energy", "candy"],
    note: "Restricts soft drinks, energy drinks, and candy."
  },
  {
    code: "OH", name: "Ohio", effective: "2026-10-01",
    categories: ["sweet_bev", "soda"],
    note: "Restricts sugar-sweetened beverages."
  },
  {
    code: "OK", name: "Oklahoma", effective: "2026-02-15",
    categories: ["soda", "candy"],
    note: "Restricts soft drinks and candy."
  },
  {
    code: "SC", name: "South Carolina", effective: "2026-08-31",
    categories: ["candy", "energy", "soda", "sweet_bev"],
    note: "Restricts candy, energy drinks, soft drinks, and sweetened beverages."
  },
  {
    code: "TN", name: "Tennessee", effective: "2026-07-31",
    categories: ["processed_food", "soda", "energy", "candy"],
    note: "Restricts processed foods and beverages such as soda, energy drinks, and candy."
  },
  {
    code: "TX", name: "Texas", effective: "2026-04-01",
    categories: ["sweet_bev", "soda", "candy"],
    note: "Restricts sweetened drinks and candy."
  },
  {
    code: "UT", name: "Utah", effective: "2026-01-01",
    categories: ["soda"],
    note: "Restricts soft drinks."
  },
  {
    code: "VA", name: "Virginia", effective: "2026-10-01",
    categories: ["sweet_bev", "soda"],
    note: "Restricts sweetened beverages."
  },
  {
    code: "WV", name: "West Virginia", effective: "2026-01-01",
    categories: ["soda"],
    note: "Restricts soda."
  },
  {
    code: "WY", name: "Wyoming", effective: "2027-02-01",
    categories: ["soda", "sweet_bev"],
    note: "Restricts sweetened, carbonated beverages."
  }
];

// Rough geo-centroid for each state (lat, lon) — used for nearest-state auto-detect.
window.SNAP_STATE_CENTROIDS = {
  AR:[34.9,-92.4], CO:[39.0,-105.5], FL:[27.8,-81.7], HI:[20.8,-156.3], ID:[44.4,-114.6],
  IN:[39.9,-86.3], IA:[42.0,-93.2], KS:[38.5,-98.4], LA:[31.1,-91.8], MO:[38.4,-92.3],
  NE:[41.5,-99.8], NV:[39.3,-116.6], ND:[47.5,-100.5], OH:[40.4,-82.7], OK:[35.5,-97.5],
  SC:[33.9,-80.9], TN:[35.9,-86.7], TX:[31.5,-99.3], UT:[39.3,-111.7], VA:[37.5,-78.9],
  WV:[38.6,-80.6], WY:[43.0,-107.6]
};

// US state abbr -> name (for IP-based detection that returns a state name or code)
window.US_STATE_ABBR = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",
  DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
  KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",
  MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",
  NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",
  OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",
  TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",
  WI:"Wisconsin",WY:"Wyoming",DC:"District of Columbia"
};
