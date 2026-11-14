/**
 * @fileoverview Safe Bootstrapper for Ngwyren Cinema (v2.4.0)
 * Instantiates AppleCinemaApp once DOM and all feature modules have loaded.
 */
(() => {
  "use strict";

  function bootCinemaApp() {
    if (window.app) return;
    if (!window.AppleCinemaApp) {
      console.error("[NgwyrenSystem] AppleCinemaApp class missing during bootstrap.");
      return;
    }
    try {
      window.app = new window.AppleCinemaApp();
      window.app.init();
    } catch (err) {
      console.error("[NgwyrenSystem] Bootstrap failure:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootCinemaApp);
  } else {
    bootCinemaApp();
  }
})();
