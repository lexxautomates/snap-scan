(function () {
  const states = window.SNAP_STATES;
  const items = window.SNAP_ITEMS;
  const categories = window.SNAP_CATEGORIES;
  const centroids = window.SNAP_STATE_CENTROIDS;
  const I18n = window.SnapI18n;
  const t = window.t;

  // ---- Storage helpers (localStorage with in-memory fallback) ----
  const LS_KEY = "snapScanState";
  let memState = null;
  function storageGet() {
    try { return localStorage.getItem(LS_KEY); } catch (e) { return memState; }
  }
  function storageSet(v) {
    try { localStorage.setItem(LS_KEY, v); } catch (e) { memState = v; }
  }
  function getActiveState() {
    const code = storageGet();
    return states.find(s => s.code === code) || null;
  }
  function setActiveState(code) {
    storageSet(code);
    render();
  }

  function todayISO() { return new Date().toISOString().slice(0,10); }
  function stateStatus(s) {
    if (!s.effective) return { label: t("state.tbd"), cls: "tbd" };
    if (s.effective <= todayISO()) return { label: t("state.active"), cls: "active" };
    const d = new Date(s.effective + "T00:00:00");
    const locale = I18n.getLang() === "es" ? "es" : (I18n.getLang() === "ht" ? "fr" : "en-US");
    const opts = { month: "short", day: "numeric", year: "numeric" };
    const startsWord = I18n.getLang() === "es" ? "Empieza" : (I18n.getLang() === "ht" ? "Kòmanse" : "Starts");
    return { label: `${startsWord} ${d.toLocaleDateString(locale, opts)}`, cls: "upcoming" };
  }

  // ---- Geo auto-detect ----
  async function detectStateByIP() {
    try {
      const r = await fetch("https://ipapi.co/json/");
      if (!r.ok) throw new Error("ipapi");
      const j = await r.json();
      if (j.region_code && states.find(s => s.code === j.region_code)) return j.region_code;
      return null;
    } catch (e) { return null; }
  }
  async function detectStateByGeolocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          let best = null, bestD = Infinity;
          Object.entries(centroids).forEach(([code, [lat, lon]]) => {
            const d = Math.hypot(lat - latitude, lon - longitude);
            if (d < bestD) { bestD = d; best = code; }
          });
          resolve(best);
        },
        () => resolve(null),
        { timeout: 8000, maximumAge: 3600000 }
      );
    });
  }

  // ---- Rendering ----
  function renderStatePicker() {
    const sel = document.getElementById("stateSelect");
    const active = getActiveState();
    sel.innerHTML =
      `<option value="">${t("state.placeholder")}</option>` +
      states
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(s => {
          const st = stateStatus(s);
          return `<option value="${s.code}" ${active && active.code === s.code ? "selected" : ""}>${s.name} · ${st.label}</option>`;
        })
        .join("");
  }

  function renderBanner() {
    const el = document.getElementById("stateBanner");
    const s = getActiveState();
    if (!s) {
      el.innerHTML = `<div class="banner banner-neutral">
        <strong>${escapeHtml(t("state.pick"))}</strong>
        <span>${escapeHtml(t("state.pickSub"))}</span>
      </div>`;
      return;
    }
    const st = stateStatus(s);
    const cats = s.categories.map(c => categories[c]?.label || c).join(" · ");
    el.innerHTML = `<div class="banner banner-${st.cls}">
      <div class="banner-top">
        <span class="pill pill-${st.cls}">${escapeHtml(st.label)}</span>
        <strong>${escapeHtml(s.name)}</strong>
      </div>
      <p>${escapeHtml(s.note)}</p>
      <p class="banner-cats">${escapeHtml(t("state.restricted"))} <em>${escapeHtml(cats)}</em></p>
    </div>`;
  }

  function renderDirectory() {
    const s = getActiveState();
    const q = document.getElementById("q").value.trim().toLowerCase();
    const activeCat = document.querySelector(".chip.is-active")?.dataset.filter || "all";

    const stateCats = s ? s.categories : Object.keys(categories);

    const chipsEl = document.getElementById("chips");
    const chipCats = ["all", ...stateCats];
    chipsEl.innerHTML = chipCats.map(c => {
      const label = c === "all" ? t("dir.filterAll") : (categories[c]?.label || c);
      const active = c === activeCat ? "is-active" : "";
      return `<button class="chip ${active}" data-filter="${c}">${escapeHtml(label)}</button>`;
    }).join("");
    chipsEl.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => {
      chipsEl.querySelectorAll(".chip").forEach(x => x.classList.remove("is-active"));
      b.classList.add("is-active");
      renderDirectory();
    }));

    const list = items.filter(i => {
      if (!stateCats.includes(i.cat)) return false;
      if (activeCat !== "all" && i.cat !== activeCat) return false;
      if (!q) return true;
      const hay = (i.name + " " + i.examples).toLowerCase();
      return q.split(/\s+/).every(tok => hay.includes(tok));
    });

    const resultsEl = document.getElementById("results");
    const emptyEl = document.getElementById("empty");
    const countEl = document.getElementById("count");

    resultsEl.innerHTML = list.map(i => `
      <li class="card">
        <span class="tag ${i.cat}">${escapeHtml(categories[i.cat]?.label || i.cat)}</span>
        <div class="name">${escapeHtml(i.name)}</div>
        <div class="examples">${escapeHtml(i.examples)}</div>
        <div class="why">${escapeHtml(i.why)}</div>
      </li>
    `).join("");

    if (!s) {
      countEl.textContent = t("dir.countZero");
    } else if (list.length === 1) {
      countEl.textContent = t("dir.countOne", { n: 1, state: s.name });
    } else {
      countEl.textContent = t("dir.countMany", { n: list.length, state: s.name });
    }
    emptyEl.hidden = list.length > 0;
  }

  function render() {
    renderBanner();
    renderStatePicker();
    const s = getActiveState();
    const dirState = document.getElementById("dirState");
    if (dirState) dirState.textContent = s ? s.name : t("dir.intro.placeholder");
    renderDirectory();
  }

  // ---- Brand / product-name search ----
  const brandForm = document.getElementById("brandForm");
  const brandInput = document.getElementById("brandInput");
  const brandResults = document.getElementById("brandResults");

  async function runBrandSearch() {
    const q = brandInput.value.trim();
    if (!q) return;
    const s = getActiveState();
    if (!s) {
      brandResults.innerHTML = `<div class="notice">${escapeHtml(t("search.pickState"))}</div>`;
      document.getElementById("stateSelect").focus();
      return;
    }
    brandResults.innerHTML = `<div class="spinner-row"><div class="spinner-dot"></div> ${escapeHtml(t("search.searching"))}</div>`;
    let products;
    try {
      products = await window.searchOFF(q, 12);
    } catch (e) {
      brandResults.innerHTML = `<div class="notice error">${escapeHtml(t("scan.lookupFail"))}: ${escapeHtml(e.message || "")}</div>`;
      return;
    }
    if (!products || products.length === 0) {
      brandResults.innerHTML = `<div class="notice">${escapeHtml(t("search.noResults"))}</div>`;
      return;
    }

    // Evaluate each product up-front so the eligibility badge renders immediately.
    const cards = products.map((p, idx) => {
      const result = window.evaluateProduct(p, s);
      const img = p.image_front_small_url || p.image_front_url || "";
      const name = p.product_name || (p.brands || "").split(",")[0] || "Product";
      const brand = p.brands || "";
      const badge = result.eligible
        ? `<span class="mini-badge ok">✓</span>`
        : `<span class="mini-badge bad">✗</span>`;
      const verdictLabel = result.eligible
        ? `${t("verdict.ok")} ${s.name}`
        : `${t("verdict.bad")} ${s.name}`;
      return `
        <button type="button" class="product-card" data-idx="${idx}">
          <div class="pc-img">${img ? `<img src="${escapeAttr(img)}" alt="" loading="lazy">` : `<div class="pc-img-ph">—</div>`}</div>
          <div class="pc-body">
            <div class="pc-name">${escapeHtml(name)}</div>
            ${brand ? `<div class="pc-brand">${escapeHtml(brand)}</div>` : ""}
            <div class="pc-verdict ${result.eligible ? 'ok' : 'bad'}">${badge} ${escapeHtml(verdictLabel)}</div>
          </div>
        </button>
      `;
    }).join("");

    brandResults.innerHTML = `
      <p class="results-head">${escapeHtml(t("search.resultsHead"))}</p>
      <div class="product-grid">${cards}</div>
      <p class="microcopy small">${escapeHtml(t("search.poweredBy"))}</p>
    `;

    // Clicking a product card opens the full verdict in the modal.
    brandResults.querySelectorAll(".product-card").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const product = products[idx];
        openVerdictForProduct(product);
      });
    });
  }

  function openVerdictForProduct(product) {
    scanModal.hidden = false;
    scanModal.classList.add("verdict-only");
    verdictEl.hidden = false;
    scanStatus.textContent = "";
    if (scanner) { scanner.stop(); scanner = null; }
    const state = getActiveState();
    const result = window.evaluateProduct(product, state);
    renderVerdict(product, state, result, product.code || "");
    // Update modal title to something more fitting
    const titleEl = document.getElementById("scanTitle");
    if (titleEl) titleEl.textContent = t("search.resultsHead");
  }

  // ---- Scanner flow ----
  const scanBtn = document.getElementById("scanBtn");
  const scanModal = document.getElementById("scanModal");
  const scanClose = document.getElementById("scanClose");
  const video = document.getElementById("video");
  const scanStatus = document.getElementById("scanStatus");
  const verdictEl = document.getElementById("verdict");
  const manualInput = document.getElementById("manualUPC");
  const manualBtn = document.getElementById("manualBtn");
  let scanner = null;

  function openScanModal() {
    const s = getActiveState();
    if (!s) {
      alert(t("search.pickState"));
      document.getElementById("stateSelect").focus();
      return;
    }
    scanModal.hidden = false;
    scanModal.classList.remove("verdict-only");
    verdictEl.hidden = true;
    verdictEl.innerHTML = "";
    scanStatus.textContent = t("scan.point");
    const titleEl = document.getElementById("scanTitle");
    if (titleEl) titleEl.textContent = t("scan.title");
    startCamera();
  }

  function closeScanModal() {
    scanModal.hidden = true;
    if (scanner) { scanner.stop(); scanner = null; }
  }

  async function startCamera() {
    if (!window.ZXing) {
      scanStatus.textContent = t("scan.libFail");
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      scanStatus.textContent = t("scan.noCam");
      return;
    }
    scanner = new window.Scanner(video);
    await scanner.start(
      (upc) => {
        scanStatus.textContent = `${t("scan.scanned")} ${upc}`;
        scanner.stop(); scanner = null;
        handleUPC(upc);
      },
      (err) => {
        scanStatus.textContent = `${t("scan.camErr")} (${err.message || err.name || ""})`;
      }
    );
  }

  async function handleUPC(upc) {
    verdictEl.hidden = false;
    verdictEl.innerHTML = `<div class="spinner">${escapeHtml(t("scan.lookingUp", { upc }))}</div>`;
    let product;
    try {
      product = await window.lookupUPC(upc);
    } catch (e) {
      verdictEl.innerHTML = `<div class="verdict verdict-unknown">
        <h3>${escapeHtml(t("scan.lookupFail"))}</h3>
        <p>${escapeHtml(e.message)}. ${escapeHtml(t("scan.tryAgain"))}</p>
      </div>`;
      return;
    }
    if (!product) {
      verdictEl.innerHTML = `<div class="verdict verdict-unknown">
        <h3>${escapeHtml(t("scan.notFound"))}</h3>
        <p>${escapeHtml(t("scan.notFoundBody", { upc }))}</p>
        <button class="btn btn-primary" id="rescan">${escapeHtml(t("scan.another"))}</button>
      </div>`;
      document.getElementById("rescan").onclick = () => { verdictEl.hidden = true; startCamera(); };
      return;
    }
    const state = getActiveState();
    const result = window.evaluateProduct(product, state);
    renderVerdict(product, state, result, upc);
  }

  function renderVerdict(product, state, result, upc) {
    const img = product.image_front_small_url || product.image_front_url || "";
    const title = product.product_name || "Unnamed product";
    const brand = product.brands || "";
    const head = result.eligible
      ? `<div class="verdict-badge ok">✓ ${escapeHtml(t("verdict.ok"))} ${escapeHtml(state.name)}</div>`
      : `<div class="verdict-badge bad">✗ ${escapeHtml(t("verdict.bad"))} ${escapeHtml(state.name)}</div>`;

    const reasons = result.reasons.map(r => `
      <div class="reason">
        <span class="tag ${r.id}">${escapeHtml(r.label)}</span>
        <p>${escapeHtml(r.blurb)}</p>
      </div>
    `).join("");

    verdictEl.innerHTML = `
      <div class="verdict ${result.eligible ? 'verdict-ok' : 'verdict-bad'}">
        ${head}
        <div class="verdict-body">
          ${img ? `<img src="${escapeAttr(img)}" alt="">` : ""}
          <div>
            <h3>${escapeHtml(title)}</h3>
            ${brand ? `<p class="muted">${escapeHtml(brand)}</p>` : ""}
            ${upc ? `<p class="muted small">UPC ${escapeHtml(upc)}</p>` : ""}
          </div>
        </div>
        ${reasons ? `<div class="reasons"><h4>${escapeHtml(t("verdict.why"))}</h4>${reasons}</div>` : ""}
        ${result.eligible ? `<p class="muted small">${escapeHtml(t("verdict.okFoot"))}</p>` : ""}
        <div class="verdict-actions">
          <button class="btn btn-primary" id="rescan">${escapeHtml(t("scan.another"))}</button>
          ${upc ? `<a class="btn btn-ghost" href="https://world.openfoodfacts.org/product/${encodeURIComponent(upc)}" target="_blank" rel="noopener">${escapeHtml(t("verdict.viewData"))}</a>` : ""}
        </div>
      </div>
    `;
    const rb = document.getElementById("rescan");
    if (rb) rb.onclick = () => { verdictEl.hidden = true; startCamera(); };
  }

  // ---- Utility ----
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // ---- Bootstrapping ----
  document.addEventListener("DOMContentLoaded", async () => {
    // i18n — apply translations and set up the language switcher
    I18n.applyTranslations();
    const langSel = document.getElementById("langSelect");
    langSel.value = I18n.getLang();
    langSel.addEventListener("change", (e) => {
      I18n.setLang(e.target.value);
      render(); // re-render dynamic content in the new language
    });
    document.addEventListener("snapscan:langchange", render);

    document.getElementById("stateSelect").addEventListener("change", (e) => {
      if (e.target.value) setActiveState(e.target.value);
    });
    document.getElementById("q").addEventListener("input", renderDirectory);
    scanBtn.addEventListener("click", openScanModal);
    scanClose.addEventListener("click", closeScanModal);

    // Brand search
    brandForm.addEventListener("submit", (e) => {
      e.preventDefault();
      runBrandSearch();
    });

    manualBtn.addEventListener("click", () => {
      const v = manualInput.value.trim();
      if (!v) return;
      if (scanner) { scanner.stop(); scanner = null; }
      handleUPC(v);
    });
    manualInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); manualBtn.click(); }
    });

    document.getElementById("autoDetect").addEventListener("click", async (e) => {
      e.preventDefault();
      const btn = e.currentTarget;
      const original = btn.textContent;
      btn.textContent = t("state.detecting");
      let code = await detectStateByIP();
      if (!code) code = await detectStateByGeolocation();
      btn.textContent = original;
      if (code && states.find(s => s.code === code)) {
        setActiveState(code);
      } else {
        alert(t("state.detectFail"));
      }
    });

    render();

    // First-run: try auto-detect silently if no state saved yet
    if (!getActiveState()) {
      const code = await detectStateByIP();
      if (code && states.find(s => s.code === code)) {
        setActiveState(code);
      }
    }

    // Service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
  });
})();
