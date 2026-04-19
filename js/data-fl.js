// Florida SNAP restricted items — grouped by the four official categories.
// Source: USDA FNS Florida SNAP Food Restriction Waiver (Jan 2026) + FL DCF Healthy SNAP.
// "examples" are common brand/product names that clearly fit the category definition.
// The waiver is statewide: the same rules apply in every Florida county.

window.SNAP_DATA = [
  // ======== SODA ========
  {
    cat: "soda",
    label: "Soda",
    name: "Regular cola",
    examples: "Coca-Cola, Pepsi, RC Cola, store-brand cola",
    why: "Carbonated + added sugar."
  },
  {
    cat: "soda",
    label: "Soda",
    name: "Diet & zero-sugar cola",
    examples: "Diet Coke, Coke Zero, Diet Pepsi, Pepsi Zero",
    why: "Carbonated + artificial sweetener — still restricted."
  },
  {
    cat: "soda",
    label: "Soda",
    name: "Lemon-lime soda",
    examples: "Sprite, 7UP, Sierra Mist, Starry",
    why: "Carbonated + added sugar or sweetener."
  },
  {
    cat: "soda",
    label: "Soda",
    name: "Orange / fruit-flavored soda",
    examples: "Fanta, Sunkist, Crush, Mountain Dew Baja Blast",
    why: "Carbonated + added sugar; under 50% real juice."
  },
  {
    cat: "soda",
    label: "Soda",
    name: "Root beer & cream soda",
    examples: "A&W, Mug, Barq's, IBC",
    why: "Carbonated + added sugar or sweetener."
  },
  {
    cat: "soda",
    label: "Soda",
    name: "Dr Pepper & pepper-style sodas",
    examples: "Dr Pepper, Mr. Pibb, Cherry Dr Pepper",
    why: "Carbonated + added sugar or sweetener."
  },
  {
    cat: "soda",
    label: "Soda",
    name: "Ginger ale & tonic (sweetened)",
    examples: "Canada Dry Ginger Ale, Schweppes Tonic, Seagram's",
    why: "Carbonated + added sugar; tonic contains added sugar."
  },
  {
    cat: "soda",
    label: "Soda",
    name: "Mountain Dew & citrus sodas",
    examples: "Mountain Dew, Mello Yello, Surge",
    why: "Carbonated + added sugar."
  },
  {
    cat: "soda",
    label: "Soda",
    name: "Flavored sparkling with added sugar",
    examples: "Sweetened Izze, Jarritos, Fanta Zero",
    why: "Over 5g added sugar in a carbonated drink. Plain/naturally flavored sparkling water stays covered."
  },

  // ======== ENERGY DRINKS ========
  {
    cat: "energy",
    label: "Energy Drink",
    name: "Red Bull",
    examples: "Red Bull original, Sugarfree, Total Zero, Editions",
    why: "Over 65 mg caffeine per 8 oz, marketed for energy."
  },
  {
    cat: "energy",
    label: "Energy Drink",
    name: "Monster Energy",
    examples: "Monster Original, Zero Ultra, Java Monster, Juice",
    why: "High-caffeine energy beverage."
  },
  {
    cat: "energy",
    label: "Energy Drink",
    name: "Rockstar",
    examples: "Rockstar Original, Pure Zero, Xdurance",
    why: "High-caffeine energy beverage."
  },
  {
    cat: "energy",
    label: "Energy Drink",
    name: "Bang / Reign / C4",
    examples: "Bang Energy, Reign Total Body Fuel, C4 Energy",
    why: "Performance energy drinks — high caffeine, marketed for stimulation."
  },
  {
    cat: "energy",
    label: "Energy Drink",
    name: "Celsius & fitness energy drinks",
    examples: "Celsius, Alani Nu, Ghost Energy, Ryse",
    why: "Marketed as energy / metabolic stimulation with >65mg caffeine per 8oz."
  },
  {
    cat: "energy",
    label: "Energy Drink",
    name: "5-hour Energy & shots",
    examples: "5-hour Energy, Stacker 2, Vpx Redline",
    why: "Concentrated caffeine energy shots."
  },
  {
    cat: "energy",
    label: "Energy Drink",
    name: "NOS, Full Throttle, Amp",
    examples: "NOS, Full Throttle, Amp Energy",
    why: "Traditional high-caffeine energy drinks."
  },
  {
    cat: "energy",
    label: "Energy Drink",
    name: "Prime Energy (caffeinated)",
    examples: "Prime Energy cans (NOT Prime Hydration sticks)",
    why: "Caffeinated energy version is restricted; non-caffeinated hydration sticks remain eligible."
  },

  // ======== CANDY ========
  {
    cat: "candy",
    label: "Candy",
    name: "Chocolate bars",
    examples: "Hershey's, Snickers, Milky Way, Twix, KitKat, Reese's",
    why: "Sugar + chocolate in bar form."
  },
  {
    cat: "candy",
    label: "Candy",
    name: "Gummy & chewy candy",
    examples: "Haribo, Skittles, Starburst, Sour Patch Kids, Swedish Fish",
    why: "Sugar + flavorings in pieces."
  },
  {
    cat: "candy",
    label: "Candy",
    name: "Hard candy & lollipops",
    examples: "Jolly Rancher, Werther's, Dum-Dums, Blow Pops, Life Savers",
    why: "Sugar-based drops/pieces."
  },
  {
    cat: "candy",
    label: "Candy",
    name: "Caramel & toffee",
    examples: "Milk Duds, Kraft caramels, Werther's Original caramels, Rolo",
    why: "Sugar + caramel in pieces."
  },
  {
    cat: "candy",
    label: "Candy",
    name: "Chocolate-covered nuts & fruit",
    examples: "M&M's, Almond Joy, Raisinets, Peanut M&M's",
    why: "Sugar + chocolate combined with nuts or fruit in pieces."
  },
  {
    cat: "candy",
    label: "Candy",
    name: "Mints & small confections",
    examples: "Altoids (sweetened), Mentos, Tic Tac, Ice Breakers (sugar)",
    why: "Sweetened drops/pieces. Sugar-free breath mints may vary by retailer coding."
  },
  {
    cat: "candy",
    label: "Candy",
    name: "Licorice",
    examples: "Twizzlers, Red Vines, Black Licorice",
    why: "Sugar-based confection in pieces/ropes."
  },
  {
    cat: "candy",
    label: "Candy",
    name: "Seasonal & bagged candy",
    examples: "Halloween variety bags, Easter chocolate, candy corn, Peeps",
    why: "Sugar + flavoring in drops/pieces."
  },
  {
    cat: "candy",
    label: "Candy",
    name: "Marshmallow treats & candy bars (packaged)",
    examples: "Rice Krispies Treats (pre-made), Fluffy Stuff, Kinder Bueno",
    why: "Sugar-based confections. Baking marshmallows and cereal sold separately remain eligible."
  },

  // ======== PREPARED DESSERTS ========
  {
    cat: "dessert",
    label: "Prepared Dessert",
    name: "Snack cakes & packaged sweet cakes",
    examples: "Twinkies, Ho Hos, Ding Dongs, Zebra Cakes, Swiss Rolls",
    why: "Shelf-stable, ready-to-eat, pre-packaged sweet food."
  },
  {
    cat: "dessert",
    label: "Prepared Dessert",
    name: "Packaged cookies",
    examples: "Oreos, Chips Ahoy!, Nutter Butter, Keebler, Famous Amos",
    why: "Processed, shelf-stable, ready-to-eat sweets."
  },
  {
    cat: "dessert",
    label: "Prepared Dessert",
    name: "Packaged donuts",
    examples: "Entenmann's, Hostess Donettes, Little Debbie donuts",
    why: "Pre-packaged sweet food for immediate consumption."
  },
  {
    cat: "dessert",
    label: "Prepared Dessert",
    name: "Toaster pastries",
    examples: "Pop-Tarts, Toaster Strudel, Kellogg's Frosted",
    why: "Ultra-processed sweet pastry, ready-to-eat after minimal heating."
  },
  {
    cat: "dessert",
    label: "Prepared Dessert",
    name: "Honey buns & pastries",
    examples: "Little Debbie Honey Buns, Cloverhill, Tastykake",
    why: "Shelf-stable pre-packaged sweet pastry."
  },
  {
    cat: "dessert",
    label: "Prepared Dessert",
    name: "Rice Krispies Treats & cereal bars (sweet)",
    examples: "Rice Krispies Treats, packaged marshmallow bars",
    why: "Pre-packaged ready-to-eat sweet snack."
  },
  {
    cat: "dessert",
    label: "Prepared Dessert",
    name: "Brownies & pre-packaged cakes",
    examples: "Little Debbie Cosmic Brownies, Hostess CupCakes, snack brownies",
    why: "Processed, shelf-stable, pre-packaged sweet food."
  },
  {
    cat: "dessert",
    label: "Prepared Dessert",
    name: "Marshmallow pies & moon pies",
    examples: "Moon Pies, Scooter Pies",
    why: "Pre-packaged ultra-processed sweet snack."
  }
];
