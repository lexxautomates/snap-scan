// SnapScan consent banner — Google AdSense-compatible GDPR/CCPA notice.
//
// Strategy:
//   1. If the user has Global Privacy Control enabled, auto-apply non-personalized ads
//      and don't show the banner (we're respecting their signal).
//   2. Otherwise show the banner once. Store choice in localStorage.
//   3. We use Google AdSense's native "Non-personalized ads" via the
//      adsbygoogle.requestNonPersonalizedAds signal. The adsbygoogle array
//      is processed when the ad script loads.
(function () {
  const LS_KEY = "snapScanAdsConsent"; // values: "personalized" | "non_personalized"
  const t = window.t || function (k) { return k; };

  function storageGet() {
    try { return localStorage.getItem(LS_KEY); } catch (e) { return null; }
  }
  function storageSet(v) {
    try { localStorage.setItem(LS_KEY, v); } catch (e) {}
  }

  function applyChoice(choice) {
    window.adsbygoogle = window.adsbygoogle || [];
    if (choice === "non_personalized") {
      // Tell AdSense to serve non-personalized ads only
      window.adsbygoogle.requestNonPersonalizedAds = 1;
      window.adsbygoogle.pauseAdRequests = 0;
    }
    // "personalized" is the AdSense default — nothing to do.
  }

  function buildBanner() {
    const banner = document.createElement("div");
    banner.className = "consent-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie and advertising consent");
    banner.innerHTML = `
      <p>${escapeHtml(t("consent.body"))}
        <a href="./privacy.html">${escapeHtml(t("consent.learnMore"))}</a>.</p>
      <div class="consent-actions">
        <button type="button" class="btn-reject" data-choice="non_personalized">${escapeHtml(t("consent.reject"))}</button>
        <button type="button" class="btn-accept" data-choice="personalized">${escapeHtml(t("consent.accept"))}</button>
      </div>
    `;
    banner.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", () => {
        const choice = b.dataset.choice;
        storageSet(choice);
        applyChoice(choice);
        banner.remove();
      });
    });
    return banner;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function init() {
    // Respect Global Privacy Control — auto-opt-out for cross-context advertising
    if (navigator.globalPrivacyControl === true) {
      storageSet("non_personalized");
      applyChoice("non_personalized");
      return;
    }
    const existing = storageGet();
    if (existing === "personalized" || existing === "non_personalized") {
      applyChoice(existing);
      return;
    }
    // No decision yet — show banner after a short delay so it doesn't jump in
    setTimeout(() => {
      document.body.appendChild(buildBanner());
    }, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose for a possible "reset consent" UI later
  window.SnapConsent = {
    reset() { try { localStorage.removeItem(LS_KEY); } catch (e) {} location.reload(); },
    current() { return storageGet(); }
  };
})();
