// SnapScan i18n — EN / ES / HT (Haitian Creole).
// Usage:
//   <element data-i18n="hero.title">fallback text</element>
//   <input data-i18n-attr="placeholder" data-i18n="search.placeholder">
//   window.t("hero.title")
// Language is auto-detected from navigator.language, overridden by localStorage("snapScanLang").
(function () {
  const DICT = {
    en: {
      "nav.directory": "Directory",
      "nav.how": "How it works",
      "nav.sources": "Sources",
      "nav.language": "Language",

      "lang.en": "English",
      "lang.es": "Español",
      "lang.ht": "Kreyòl Ayisyen",

      "hero.eyebrow": "SNAP/EBT · 22 States Covered",
      "hero.title.a": "Check any product —",
      "hero.title.em": "know instantly",
      "hero.title.b": "if SNAP will cover it.",
      "hero.lede": "2026 SNAP restrictions vary by state — Florida bans soda, energy drinks, candy, and prepared desserts; Iowa bans all taxable food; others ban soft drinks only. Search by brand name or scan the barcode — SnapScan tells you before you reach the register.",

      "state.srLabel": "Your state",
      "state.placeholder": "Select your state…",
      "state.autodetect": "Auto-detect my state",
      "state.pick": "Pick a state to begin.",
      "state.pickSub": "Eligibility rules differ by state. We'll tailor the directory and verdicts.",
      "state.restricted": "Restricted:",
      "state.active": "Active",
      "state.tbd": "Date TBD",
      "state.detecting": "Detecting…",
      "state.detectFail": "Couldn't detect your state. Please pick it from the list.",

      "search.title": "Search by brand or product",
      "search.help": "Type a product name — Coca-Cola, Snickers, Red Bull, Pop-Tarts — and we'll check it against your state's SNAP rules. No UPC needed.",
      "search.placeholder": "e.g. Coca-Cola, Red Bull, Snickers…",
      "search.button": "Check product",
      "search.orScan": "or",
      "search.scan": "Scan a barcode instead",
      "search.searching": "Searching…",
      "search.noResults": "No products found. Try a different spelling or brand.",
      "search.pickState": "Pick a state first so we know which rules to apply.",
      "search.resultsHead": "Tap a product to see the verdict",
      "search.poweredBy": "Data from Open Food Facts",
      "search.moreResults": "Showing top {n} of many. Refine your search for better results.",

      "browse.cta": "Browse restricted list",

      "micro.offline": "Works offline after first load · No account, no tracking · Data from",
      "micro.and": "and",

      "why.title": "Why this exists",
      "why.l1": "22 states have USDA-approved SNAP food restrictions rolling out 2026–2028.",
      "why.l2": "Rules vary wildly — Iowa's ban is huge, West Virginia's is narrow.",
      "why.l3": "Retailer POS flags are inconsistent. Shoppers get surprised at checkout.",
      "why.l4": "SnapScan checks before the register — no awkward moments, no go-backs.",

      "dir.title": "Restricted Items — Directory",
      "dir.intro.a": "Showing the items that",
      "dir.intro.placeholder": "your state",
      "dir.intro.b": "restricts. Search by brand or food name, or filter by category.",
      "dir.placeholder": "Search: Coke, Snickers, Red Bull, Pop-Tarts…",
      "dir.filterAll": "All",
      "dir.empty": "No matches. Try a broader term.",
      "dir.countZero": "Pick a state to see restricted items.",
      "dir.countOne": "{n} item group restricted in {state}.",
      "dir.countMany": "{n} item groups restricted in {state}.",

      "how.title": "How SnapScan works",
      "how.s1.title": "Pick your state",
      "how.s1.body": "Or let SnapScan auto-detect it. Each state's SNAP rules load instantly.",
      "how.s2.title": "Search or scan",
      "how.s2.body": "Type a brand name or scan the barcode — we handle both. No app install needed.",
      "how.s3.title": "Get an instant verdict",
      "how.s3.body": "We match the product against your state's restricted categories and tell you plainly: covered or not.",
      "how.install.title": "Install as an app",
      "how.install.body": "On iPhone: tap Share → \"Add to Home Screen\". On Android: tap the menu → \"Install app\". Works offline after first load.",

      "sources.title": "Sources",

      "scan.title": "Scan a barcode",
      "scan.close": "Close",
      "scan.point": "Point camera at the barcode.",
      "scan.manual": "Or enter UPC manually",
      "scan.upcPlaceholder": "e.g. 049000028911",
      "scan.check": "Check",
      "scan.libFail": "Camera library failed to load. Use manual entry below.",
      "scan.noCam": "Camera not available on this device. Use manual entry.",
      "scan.camErr": "Camera error. Try manual entry.",
      "scan.scanned": "Scanned:",
      "scan.lookingUp": "Looking up {upc}…",
      "scan.lookupFail": "Lookup failed",
      "scan.tryAgain": "Try again or use the directory above.",
      "scan.notFound": "Product not found",
      "scan.notFoundBody": "UPC {upc} isn't in the Open Food Facts database. Search by brand name instead, or check the directory.",
      "scan.another": "Scan another",

      "verdict.ok": "SNAP-eligible in",
      "verdict.bad": "NOT SNAP-eligible in",
      "verdict.why": "Why",
      "verdict.okFoot": "Based on your state's restriction list. Covered by SNAP as normal.",
      "verdict.viewData": "View product data",

      "foot.disclaimer": "Community-built. Not affiliated with USDA or any state agency. Verdicts are informational — your retailer's POS system is the authoritative source at checkout.",
      "foot.github": "Open source on GitHub",
      "foot.privacy": "Privacy",

      "privacy.back": "Back to SnapScan",

      "consent.body": "SnapScan uses cookies and similar technologies from Google AdSense to show ads that keep the app free. We don't track your searches or sell your data.",
      "consent.learnMore": "Privacy policy",
      "consent.accept": "Accept ads",
      "consent.reject": "Only non-personalized"
    },

    es: {
      "nav.directory": "Directorio",
      "nav.how": "Cómo funciona",
      "nav.sources": "Fuentes",
      "nav.language": "Idioma",

      "lang.en": "English",
      "lang.es": "Español",
      "lang.ht": "Kreyòl Ayisyen",

      "hero.eyebrow": "SNAP/EBT · 22 Estados Cubiertos",
      "hero.title.a": "Revisa cualquier producto —",
      "hero.title.em": "entérate al instante",
      "hero.title.b": "si SNAP lo cubre.",
      "hero.lede": "Las restricciones de SNAP en 2026 varían según el estado — Florida prohíbe refrescos, bebidas energéticas, dulces y postres preparados; Iowa prohíbe toda comida con impuesto; otros solo prohíben refrescos. Busca por marca o escanea el código de barras — SnapScan te avisa antes de llegar a la caja.",

      "state.srLabel": "Tu estado",
      "state.placeholder": "Selecciona tu estado…",
      "state.autodetect": "Detectar mi estado",
      "state.pick": "Elige un estado para empezar.",
      "state.pickSub": "Las reglas de elegibilidad varían según el estado. Personalizaremos el directorio y los veredictos.",
      "state.restricted": "Restringido:",
      "state.active": "Activo",
      "state.tbd": "Fecha por confirmar",
      "state.detecting": "Detectando…",
      "state.detectFail": "No pudimos detectar tu estado. Selecciónalo de la lista.",

      "search.title": "Busca por marca o producto",
      "search.help": "Escribe el nombre de un producto — Coca-Cola, Snickers, Red Bull, Pop-Tarts — y lo revisaremos según las reglas SNAP de tu estado. No necesitas el código de barras.",
      "search.placeholder": "ej. Coca-Cola, Red Bull, Snickers…",
      "search.button": "Revisar producto",
      "search.orScan": "o",
      "search.scan": "Escanear código de barras",
      "search.searching": "Buscando…",
      "search.noResults": "No se encontraron productos. Prueba otra escritura o marca.",
      "search.pickState": "Primero elige un estado para saber qué reglas aplicar.",
      "search.resultsHead": "Toca un producto para ver el veredicto",
      "search.poweredBy": "Datos de Open Food Facts",
      "search.moreResults": "Mostrando los {n} mejores. Refina tu búsqueda para más precisión.",

      "browse.cta": "Ver lista restringida",

      "micro.offline": "Funciona sin conexión tras la primera carga · Sin cuenta, sin rastreo · Datos de",
      "micro.and": "y",

      "why.title": "Por qué existe",
      "why.l1": "22 estados tienen restricciones de alimentos SNAP aprobadas por USDA, con vigencia 2026–2028.",
      "why.l2": "Las reglas varían mucho — la de Iowa es amplia, la de West Virginia es limitada.",
      "why.l3": "Las cajas de las tiendas no marcan todo bien. Los compradores se sorprenden al pagar.",
      "why.l4": "SnapScan revisa antes de la caja — sin momentos incómodos, sin devoluciones.",

      "dir.title": "Artículos restringidos — Directorio",
      "dir.intro.a": "Mostrando los artículos que",
      "dir.intro.placeholder": "tu estado",
      "dir.intro.b": "restringe. Busca por marca o alimento, o filtra por categoría.",
      "dir.placeholder": "Buscar: Coca, Snickers, Red Bull, Pop-Tarts…",
      "dir.filterAll": "Todos",
      "dir.empty": "Sin resultados. Prueba un término más general.",
      "dir.countZero": "Elige un estado para ver los artículos restringidos.",
      "dir.countOne": "{n} grupo de artículos restringido en {state}.",
      "dir.countMany": "{n} grupos de artículos restringidos en {state}.",

      "how.title": "Cómo funciona SnapScan",
      "how.s1.title": "Elige tu estado",
      "how.s1.body": "O deja que SnapScan lo detecte. Las reglas SNAP de cada estado cargan al instante.",
      "how.s2.title": "Busca o escanea",
      "how.s2.body": "Escribe el nombre de una marca o escanea el código — ambos funcionan. Sin instalar apps.",
      "how.s3.title": "Veredicto instantáneo",
      "how.s3.body": "Cotejamos el producto con las categorías restringidas de tu estado y te decimos claro: cubierto o no.",
      "how.install.title": "Instalar como app",
      "how.install.body": "En iPhone: toca Compartir → \"Añadir a pantalla de inicio\". En Android: menú → \"Instalar app\". Funciona sin conexión tras la primera carga.",

      "sources.title": "Fuentes",

      "scan.title": "Escanear código de barras",
      "scan.close": "Cerrar",
      "scan.point": "Apunta la cámara al código de barras.",
      "scan.manual": "O ingresa el UPC manualmente",
      "scan.upcPlaceholder": "ej. 049000028911",
      "scan.check": "Revisar",
      "scan.libFail": "La librería de cámara falló. Usa la entrada manual abajo.",
      "scan.noCam": "Cámara no disponible. Usa entrada manual.",
      "scan.camErr": "Error de cámara. Usa entrada manual.",
      "scan.scanned": "Escaneado:",
      "scan.lookingUp": "Buscando {upc}…",
      "scan.lookupFail": "Falló la búsqueda",
      "scan.tryAgain": "Intenta de nuevo o usa el directorio.",
      "scan.notFound": "Producto no encontrado",
      "scan.notFoundBody": "El UPC {upc} no está en Open Food Facts. Busca por marca o revisa el directorio.",
      "scan.another": "Escanear otro",

      "verdict.ok": "Cubierto por SNAP en",
      "verdict.bad": "NO cubierto por SNAP en",
      "verdict.why": "Por qué",
      "verdict.okFoot": "Según la lista de restricciones de tu estado. Cubierto por SNAP con normalidad.",
      "verdict.viewData": "Ver datos del producto",

      "foot.disclaimer": "Proyecto comunitario. No afiliado a USDA ni a ninguna agencia estatal. Los veredictos son informativos — el sistema POS del comercio es la fuente oficial al pagar.",
      "foot.github": "Código abierto en GitHub",
      "foot.privacy": "Privacidad",

      "privacy.back": "Volver a SnapScan",

      "consent.body": "SnapScan usa cookies y tecnologías similares de Google AdSense para mostrar anuncios que mantienen la app gratis. No rastreamos tus búsquedas ni vendemos tus datos.",
      "consent.learnMore": "Política de privacidad",
      "consent.accept": "Aceptar anuncios",
      "consent.reject": "Solo no personalizados"
    },

    ht: {
      "nav.directory": "Anyè",
      "nav.how": "Kijan li mache",
      "nav.sources": "Sous",
      "nav.language": "Lang",

      "lang.en": "English",
      "lang.es": "Español",
      "lang.ht": "Kreyòl Ayisyen",

      "hero.eyebrow": "SNAP/EBT · 22 Eta Kouvri",
      "hero.title.a": "Tcheke nenpòt pwodwi —",
      "hero.title.em": "konnen lamenm",
      "hero.title.b": "si SNAP ap kouvri li.",
      "hero.lede": "Règleman SNAP 2026 chanje selon eta w — Florid entèdi soda, bwason enèji, bonbon, ak desè pre-fè; Iowa entèdi tout manje ki gen taks; lòt yo entèdi bwason dous sèlman. Chèche pa mak oswa eskane kòd ba a — SnapScan ba w repons la anvan ou rive nan kès la.",

      "state.srLabel": "Eta w",
      "state.placeholder": "Chwazi eta w…",
      "state.autodetect": "Detekte eta m",
      "state.pick": "Chwazi yon eta pou kòmanse.",
      "state.pickSub": "Règleman yo pa menm nan chak eta. N ap ajiste anyè a ak repons yo.",
      "state.restricted": "Entèdi:",
      "state.active": "Aktif",
      "state.tbd": "Dat ap vini",
      "state.detecting": "N ap detekte…",
      "state.detectFail": "Nou pa ka detekte eta w. Chwazi li nan lis la.",

      "search.title": "Chèche pa mak oswa pwodwi",
      "search.help": "Tape non yon pwodwi — Coca-Cola, Snickers, Red Bull, Pop-Tarts — n ap tcheke li kont règleman SNAP nan eta w. Pa bezwen kòd ba.",
      "search.placeholder": "pa egzanp Coca-Cola, Red Bull, Snickers…",
      "search.button": "Tcheke pwodwi a",
      "search.orScan": "oswa",
      "search.scan": "Eskane kòd ba a",
      "search.searching": "N ap chèche…",
      "search.noResults": "Pa jwenn pwodwi. Eseye yon lòt ekriti oswa mak.",
      "search.pickState": "Chwazi yon eta anvan pou nou konnen ki règ pou aplike.",
      "search.resultsHead": "Tape sou yon pwodwi pou wè repons la",
      "search.poweredBy": "Done ki soti nan Open Food Facts",
      "search.moreResults": "Ap montre {n} pi bon yo. Presize rechèch ou pou pi bon rezilta.",

      "browse.cta": "Gade lis entèdi a",

      "micro.offline": "Fonksyone san entènèt apre premye chajman · Pa gen kont, pa gen swivi · Done soti nan",
      "micro.and": "ak",

      "why.title": "Poukisa sa egziste",
      "why.l1": "22 eta gen restriksyon manje SNAP ki apwouve pa USDA, 2026–2028.",
      "why.l2": "Règleman yo chanje anpil — Iowa gen yon gwo entèdiksyon, West Virginia gen yon ti kras.",
      "why.l3": "Sistèm POS magazen yo pa konsistan. Kliyan yo sezi nan kès la.",
      "why.l4": "SnapScan tcheke anvan kès la — san malèz, san retounen atik.",

      "dir.title": "Atik Entèdi — Anyè",
      "dir.intro.a": "Ap montre atik ki",
      "dir.intro.placeholder": "eta w",
      "dir.intro.b": "entèdi yo. Chèche pa mak oswa non manje, oswa filtre pa kategori.",
      "dir.placeholder": "Chèche: Coke, Snickers, Red Bull, Pop-Tarts…",
      "dir.filterAll": "Tout",
      "dir.empty": "Pa gen rezilta. Eseye yon tèm pi jeneral.",
      "dir.countZero": "Chwazi yon eta pou wè atik entèdi yo.",
      "dir.countOne": "{n} gwoup atik entèdi nan {state}.",
      "dir.countMany": "{n} gwoup atik entèdi nan {state}.",

      "how.title": "Kijan SnapScan mache",
      "how.s1.title": "Chwazi eta w",
      "how.s1.body": "Oswa kite SnapScan detekte li. Règleman SNAP chak eta chaje lamenm.",
      "how.s2.title": "Chèche oswa eskane",
      "how.s2.body": "Tape yon non mak oswa eskane kòd ba a — tou de mache. Pa bezwen enstale anyen.",
      "how.s3.title": "Repons lamenm",
      "how.s3.body": "Nou konpare pwodwi a ak kategori entèdi eta w yo epi nou di w klè: kouvri oswa pa kouvri.",
      "how.install.title": "Enstale kòm app",
      "how.install.body": "Sou iPhone: tape Share → \"Add to Home Screen\". Sou Android: meni → \"Install app\". Fonksyone san entènèt apre premye chajman.",

      "sources.title": "Sous",

      "scan.title": "Eskane kòd ba a",
      "scan.close": "Fèmen",
      "scan.point": "Lonje kamera a sou kòd ba a.",
      "scan.manual": "Oswa antre UPC a alamen",
      "scan.upcPlaceholder": "pa egzanp 049000028911",
      "scan.check": "Tcheke",
      "scan.libFail": "Bibliyotèk kamera a pa chaje. Antre alamen anba a.",
      "scan.noCam": "Kamera pa disponib. Antre alamen.",
      "scan.camErr": "Erè kamera. Antre alamen.",
      "scan.scanned": "Eskane:",
      "scan.lookingUp": "N ap chèche {upc}…",
      "scan.lookupFail": "Chèche a echwe",
      "scan.tryAgain": "Eseye ankò oswa itilize anyè a.",
      "scan.notFound": "Pwodwi pa jwenn",
      "scan.notFoundBody": "UPC {upc} pa nan baz done Open Food Facts. Chèche pa non mak la oswa gade nan anyè a.",
      "scan.another": "Eskane yon lòt",

      "verdict.ok": "SNAP kouvri nan",
      "verdict.bad": "SNAP PA kouvri nan",
      "verdict.why": "Poukisa",
      "verdict.okFoot": "Dapre lis restriksyon eta w la. SNAP kouvri li nòmalman.",
      "verdict.viewData": "Gade done pwodwi a",

      "foot.disclaimer": "Pwojè kominotè. Pa afilye ak USDA oswa okenn ajans eta. Repons yo se pou enfòmasyon — sistèm POS machann lan se sous ofisyèl la nan kès.",
      "foot.github": "Kòd louvri sou GitHub",
      "foot.privacy": "Konfidansyalite",

      "privacy.back": "Retounen nan SnapScan",

      "consent.body": "SnapScan itilize kouki ak teknoloji menm jan an de Google AdSense pou montre reklam ki kenbe app la gratis. Nou pa swiv rechèch ou yo ni vann done w.",
      "consent.learnMore": "Règleman konfidansyalite",
      "consent.accept": "Aksepte reklam",
      "consent.reject": "Sèlman san pèsonalizasyon"
    }
  };

  const SUPPORTED = ["en", "es", "ht"];
  const LS_KEY = "snapScanLang";
  let memLang = null;

  function storageGet() {
    try { return localStorage.getItem(LS_KEY); } catch (e) { return memLang; }
  }
  function storageSet(v) {
    try { localStorage.setItem(LS_KEY, v); } catch (e) { memLang = v; }
  }

  function detectLang() {
    const saved = storageGet();
    if (saved && SUPPORTED.includes(saved)) return saved;
    const navs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"]);
    for (const raw of navs) {
      const l = String(raw).toLowerCase();
      if (l.startsWith("ht")) return "ht";
      if (l.startsWith("es")) return "es";
      if (l.startsWith("en")) return "en";
    }
    return "en";
  }

  let current = detectLang();

  function t(key, vars) {
    const d = DICT[current] || DICT.en;
    let s = d[key];
    if (s == null) s = (DICT.en[key] != null ? DICT.en[key] : key);
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ""));
    }
    return s;
  }

  function applyTranslations(root) {
    root = root || document;
    root.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const attr = el.getAttribute("data-i18n-attr");
      const val = t(key);
      if (attr) {
        el.setAttribute(attr, val);
      } else {
        el.textContent = val;
      }
    });
    // Update <html lang>
    document.documentElement.lang = current;
  }

  function setLang(lang) {
    if (!SUPPORTED.includes(lang)) return;
    current = lang;
    storageSet(lang);
    applyTranslations();
    document.dispatchEvent(new CustomEvent("snapscan:langchange", { detail: { lang } }));
  }

  function getLang() { return current; }

  window.SnapI18n = { t, setLang, getLang, applyTranslations, SUPPORTED };
  window.t = t;
})();
