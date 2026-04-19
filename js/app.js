(function () {
  const states = window.SNAP_STATES;
  const items = window.SNAP_ITEMS;
  const categories = window.SNAP_CATEGORIES;
  const centroids = window.SNAP_STATE_CENTROIDS;

  // ---- State management ----
  const LS_KEY = "snapScanState";
  function getActiveState() {
    const code = localStorage.getItem(LS_KEY);
    return states.find(s => s.code === code) || null;
  }
  function setActiveState(code) {
    localStorage.setItem(LS_KEY, code);
    render();
  }

  function todayISO() { return new Date().toISOString().slice(0,10); }
  function stateStatus(s) {
    if (!s.effective) return { label: "Date TBD", cls: "tbd" };
    if (s.effective <= todayISO()) return { label: "Active", cls: "active" };
    const d = new Date(s.effective + "T00:00:00");
    const opts = { month: "short", day: "numeric", year: "numeric" };
    return { label: `Starts ${d.toLocaleDateString(undefined, opts)}`, cls: "upcoming" };
  }

  // ---- Geo auto-detect (IP only — no permission prompt) ----
  async function detectStateByIP() {
    try {
      // ipapi.co returns region_code (e.g. "FL"). Free tier, no key.
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
      `<option value="">Select your state…</option>` +
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
        <strong>Pick a state to begin.</strong>
        <span>Eligibility rules differ by state. We'll tailor the directory and scan results.</span>
      </div>`;
      return;
    }
    const st = stateStatus(s);
    const cats = s.categories.map(c => categories[c]?.label || c).join(" · ");
    el.innerHTML = `<div class="banner banner-${st.cls}">
      <div class="banner-top">
        <span class="pill pill-${st.cls}">${st.label}</span>
        <strong>${s.name}</strong>
      </div>
      <p>${s.note}</p>
      <p class="banner-cats">Restricted: <em>${cats}</em></p>
    </div>`;
  }

  function renderDirectory() {
    const s = getActiveState();
    const q = document.getElementById("q").value.trim().toLowerCase();
    const activeCat = document.querySelector(".chip.is-active")?.dataset.filter || "all";

    // Which categories matter for this state?
    const stateCats = s ? s.categories : Object.keys(categories);

    // Render chips from state categories
    const chipsEl = document.getElementById("chips");
    const chipCats = ["all", ...stateCats];
    chipsEl.innerHTML = chipCats.map(c => {
      const label = c === "all" ? "All" : (categories[c]?.label || c);
      const active = c === activeCat ? "is-active" : "";
      return `<button class="chip ${active}" data-filter="${c}">${label}</button>`;
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
      return q.split(/\s+/).every(t => hay.includes(t));
    });

    const resultsEl = document.getElementById("results");
    const emptyEl = document.getElementById("empty");
    const countEl = document.getElementById("count");

    resultsEl.innerHTML = list.map(i => `
      <li class="card">
        <span class="tag ${i.cat}">${categories[i.cat]?.label || i.cat}</span>
        <div class="name">${i.name}</div>
        <div class="examples">${i.examples}</div>
        <div class="why">${i.why}</div>
      </li>
    `).join("");

    countEl.textContent = s
      ? `${list.length} item group${list.length === 1 ? "" : "s"} restricted in ${s.name}.`
      : "Pick a state to see restricted items.";
    emptyEl.hidden = list.length > 0;
  }

  function render() {
    renderBanner();
    renderStatePicker();
    const s = getActiveState();
    const dirState = document.getElementById("dirState");
    if (dirState) dirState.textContent = s ? s.name : "your state";
    renderDirectory();
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
      alert("Pick a state first so we know which rules to apply.");
      document.getElementById("stateSelect").focus();
      return;
    }
    scanModal.hidden = false;
    verdictEl.hidden = true;
    verdictEl.innerHTML = "";
    scanStatus.textContent = "Point camera at the barcode.";
    startCamera();
  }

  function closeScanModal() {
    scanModal.hidden = true;
    if (scanner) { scanner.stop(); scanner = null; }
  }

  async function startCamera() {
    if (!window.ZXing) {
      scanStatus.textContent = "Camera library failed to load. Use manual entry below.";
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      scanStatus.textContent = "Camera not available on this device. Use manual entry.";
      return;
    }
    scanner = new window.Scanner(video);
    await scanner.start(
      (upc) => {
        scanStatus.textContent = `Scanned: ${upc}`;
        scanner.stop(); scanner = null;
        handleUPC(upc);
      },
      (err) => {
        scanStatus.textContent = `Camera error: ${err.message || err.name}. Try manual entry.`;
      }
    );
  }

  async function handleUPC(upc) {
    verdictEl.hidden = false;
    verdictEl.innerHTML = `<div class="spinner">Looking up ${upc}…</div>`;
    let product;
    try {
      product = await window.lookupUPC(upc);
    } catch (e) {
      verdictEl.innerHTML = `<div class="verdict verdict-unknown">
        <h3>Lookup failed</h3>
        <p>${e.message}. Try again or use the directory above.</p>
      </div>`;
      return;
    }
    if (!product) {
      verdictEl.innerHTML = `<div class="verdict verdict-unknown">
        <h3>Product not found</h3>
        <p>UPC <code>${upc}</code> isn't in the Open Food Facts database. Check the category list manually, or search the directory.</p>
        <button class="btn btn-primary" id="rescan">Scan another</button>
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
      ? `<div class="verdict-badge ok">✓ SNAP-eligible in ${state.name}</div>`
      : `<div class="verdict-badge bad">✗ NOT SNAP-eligible in ${state.name}</div>`;

    const reasons = result.reasons.map(r => `
      <div class="reason">
        <span class="tag ${r.id}">${r.label}</span>
        <p>${r.blurb}</p>
      </div>
    `).join("");

    verdictEl.innerHTML = `
      <div class="verdict ${result.eligible ? 'verdict-ok' : 'verdict-bad'}">
        ${head}
        <div class="verdict-body">
          ${img ? `<img src="${img}" alt="">` : ""}
          <div>
            <h3>${title}</h3>
            ${brand ? `<p class="muted">${brand}</p>` : ""}
            <p class="muted small">UPC ${upc}</p>
          </div>
        </div>
        ${reasons ? `<div class="reasons"><h4>Why</h4>${reasons}</div>` : ""}
        ${result.eligible ? `<p class="muted small">Based on your state's restriction list. Covered by SNAP as normal.</p>` : ""}
        <div class="verdict-actions">
          <button class="btn btn-primary" id="rescan">Scan another</button>
          <a class="btn btn-ghost" href="https://world.openfoodfacts.org/product/${upc}" target="_blank" rel="noopener">View product data</a>
        </div>
      </div>
    `;
    document.getElementById("rescan").onclick = () => { verdictEl.hidden = true; startCamera(); };
  }

  // ---- Bootstrapping ----
  document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("stateSelect").addEventListener("change", (e) => {
      if (e.target.value) setActiveState(e.target.value);
    });
    document.getElementById("q").addEventListener("input", renderDirectory);
    scanBtn.addEventListener("click", openScanModal);
    scanClose.addEventListener("click", closeScanModal);

    manualBtn.addEventListener("click", () => {
      const v = manualInput.value.trim();
      if (!v) return;
      if (scanner) { scanner.stop(); scanner = null; }
      handleUPC(v);
    });
    manualInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") manualBtn.click();
    });

    document.getElementById("autoDetect").addEventListener("click", async (e) => {
      e.preventDefault();
      const btn = e.currentTarget;
      btn.textContent = "Detecting…";
      let code = await detectStateByIP();
      if (!code) code = await detectStateByGeolocation();
      btn.textContent = "Auto-detect my state";
      if (code && states.find(s => s.code === code)) {
        setActiveState(code);
      } else {
        alert("Couldn't detect your state automatically. Please pick it from the list.");
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
