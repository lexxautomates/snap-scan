// Canonical item groups with category tags. Each state shows the subset that matches its restricted categories.
window.SNAP_ITEMS = [
  // SODA
  { cat: "soda", name: "Regular cola", examples: "Coca-Cola, Pepsi, RC Cola", why: "Carbonated + added sugar." },
  { cat: "soda", name: "Diet & zero-sugar cola", examples: "Diet Coke, Coke Zero, Diet Pepsi", why: "Carbonated + artificial sweetener (restricted in most states that ban soda)." },
  { cat: "soda", name: "Lemon-lime soda", examples: "Sprite, 7UP, Starry", why: "Carbonated + added sugar or sweetener." },
  { cat: "soda", name: "Orange / fruit soda", examples: "Fanta, Sunkist, Crush", why: "Carbonated + added sugar; <50% real juice." },
  { cat: "soda", name: "Root beer & cream soda", examples: "A&W, Mug, Barq's, IBC", why: "Carbonated + added sugar." },
  { cat: "soda", name: "Dr Pepper & pepper sodas", examples: "Dr Pepper, Mr. Pibb", why: "Carbonated + added sugar." },
  { cat: "soda", name: "Ginger ale & tonic", examples: "Canada Dry, Schweppes Tonic", why: "Carbonated + added sugar." },
  { cat: "soda", name: "Mountain Dew & citrus", examples: "Mountain Dew, Mello Yello, Surge", why: "Carbonated + added sugar." },

  // ENERGY
  { cat: "energy", name: "Red Bull", examples: "Red Bull original, Sugarfree, Editions", why: "≥65mg caffeine per 8oz, marketed for energy." },
  { cat: "energy", name: "Monster Energy", examples: "Monster Original, Zero Ultra, Java Monster", why: "High-caffeine energy beverage." },
  { cat: "energy", name: "Rockstar", examples: "Rockstar Original, Pure Zero, Xdurance", why: "High-caffeine energy beverage." },
  { cat: "energy", name: "Bang / Reign / C4", examples: "Bang Energy, Reign, C4 Energy", why: "Performance energy drinks." },
  { cat: "energy", name: "Celsius & fitness energy", examples: "Celsius, Alani Nu, Ghost, Ryse", why: "Marketed for energy / metabolic stimulation." },
  { cat: "energy", name: "5-hour Energy & shots", examples: "5-hour Energy, Stacker 2", why: "Concentrated caffeine energy shots." },
  { cat: "energy", name: "NOS, Full Throttle, Amp", examples: "NOS, Full Throttle, Amp", why: "Traditional high-caffeine energy drinks." },
  { cat: "energy", name: "Prime Energy (caffeinated)", examples: "Prime Energy cans", why: "Caffeinated version restricted; non-caffeinated Prime Hydration is fine." },

  // CANDY
  { cat: "candy", name: "Chocolate bars", examples: "Hershey's, Snickers, KitKat, Reese's", why: "Sugar + chocolate in bar form." },
  { cat: "candy", name: "Gummy & chewy", examples: "Haribo, Skittles, Starburst, Sour Patch", why: "Sugar + flavorings in pieces." },
  { cat: "candy", name: "Hard candy & lollipops", examples: "Jolly Rancher, Werther's, Dum-Dums", why: "Sugar-based drops/pieces." },
  { cat: "candy", name: "Caramel & toffee", examples: "Milk Duds, Kraft caramels, Rolo", why: "Sugar + caramel." },
  { cat: "candy", name: "Chocolate-covered nuts/fruit", examples: "M&M's, Almond Joy, Raisinets", why: "Sugar + chocolate + nuts/fruit in pieces." },
  { cat: "candy", name: "Mints & small confections", examples: "Altoids, Mentos, Tic Tac, Ice Breakers", why: "Sweetened drops/pieces." },
  { cat: "candy", name: "Licorice", examples: "Twizzlers, Red Vines, Black Licorice", why: "Sugar-based confection." },
  { cat: "candy", name: "Seasonal candy", examples: "Halloween bags, candy corn, Peeps", why: "Sugar + flavoring." },

  // PREPARED DESSERTS
  { cat: "dessert", name: "Snack cakes", examples: "Twinkies, Ho Hos, Ding Dongs, Zebra Cakes", why: "Shelf-stable ready-to-eat sweets." },
  { cat: "dessert", name: "Packaged cookies", examples: "Oreos, Chips Ahoy!, Nutter Butter", why: "Pre-packaged sweet food." },
  { cat: "dessert", name: "Packaged donuts", examples: "Entenmann's, Hostess Donettes", why: "Pre-packaged sweet food." },
  { cat: "dessert", name: "Toaster pastries", examples: "Pop-Tarts, Toaster Strudel", why: "Ultra-processed sweet pastry." },
  { cat: "dessert", name: "Honey buns & pastries", examples: "Little Debbie Honey Buns, Tastykake", why: "Shelf-stable sweet pastry." },
  { cat: "dessert", name: "Brownies & cupcakes (packaged)", examples: "Cosmic Brownies, Hostess CupCakes", why: "Pre-packaged sweet food." },
  { cat: "dessert", name: "Moon pies & marshmallow pies", examples: "Moon Pies, Scooter Pies", why: "Pre-packaged ultra-processed." },

  // SWEET BEVERAGES (non-soda)
  { cat: "sweet_bev", name: "Sports drinks", examples: "Gatorade, Powerade, BodyArmor", why: "≥5g added sugar per serving." },
  { cat: "sweet_bev", name: "Sweetened iced tea", examples: "Gold Peak, Snapple, Arizona", why: "Sweetened beverage." },
  { cat: "sweet_bev", name: "Lemonade & fruit punch", examples: "Minute Maid, Country Time, Hawaiian Punch", why: "Sweetened beverage." },
  { cat: "sweet_bev", name: "Kids' pouches & juice cocktails", examples: "Capri Sun, Hi-C, Kool-Aid Jammers", why: "Sweetened beverage with added sugar." },
  { cat: "sweet_bev", name: "Sweetened coffee drinks", examples: "Starbucks Frappuccino bottles, Java Monster", why: "Sweetened beverage — non-energy versions may still qualify." },

  // JUICE DRINKS <50%
  { cat: "juice_drink", name: "Fruit juice cocktails", examples: "Ocean Spray Cran-Apple, SunnyD", why: "Less than 50% real juice; added sugar." },
  { cat: "juice_drink", name: "Fruit 'ade' drinks", examples: "Hi-C, Tampico, fruit punch", why: "<50% juice, high added sugar." },

  // PROCESSED / TAXABLE
  { cat: "processed_food", name: "Ultra-processed snack foods", examples: "Flavored chips, cheese puffs, processed meat snacks", why: "NOVA group 4 — extensive processing, additives, low whole-food content (Tennessee)." },
  { cat: "taxable", name: "Prepared/taxable items (Iowa)", examples: "Most processed foods, hot foods, ready-to-eat meals", why: "Iowa restricts ALL taxable food items; only basic staples remain eligible." }
];
