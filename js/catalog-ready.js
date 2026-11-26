/**
 * @fileoverview Catalog Ready Hook (v2.9.1)
 * bootstrap.js khởi động app TRƯỚC khi movies-catalog.js được nạp (cùng hàng đợi defer),
 * nên lần vẽ đầu chỉ có ~70 phim mẫu → số đếm "Xem Tất Cả (…)" và các hàng phim bị sai.
 * File này chạy ngay sau movies-catalog.js: nạp kho phim đầy đủ rồi vẽ lại trang hiện tại.
 */
(() => {
  "use strict";

  function applyFullCatalog() {
    const app = window.app;
    if (!app || !app.service || !Array.isArray(window.NGWYREN_FULL_CATALOG)) return;
    if (app.service._fullCatalogLoaded) return;

    const scrollTopBefore = window.scrollY;
    app.ensureFullCatalogLoaded();

    // Chỉ vẽ lại khi người dùng chưa cuộn/mở phim, tránh giật trang
    const modalOpen = document.getElementById("movieDetailModal")?.classList.contains("open");
    if (!modalOpen && scrollTopBefore < 200 && typeof app.setNavigation === "function") {
      if (app._heroTracks) app._heroTracks = {};
      app.setNavigation(app.currentNav || "kham-pha", app.customFilterTitle || null, true);
    }
  }

  if (window.app) {
    applyFullCatalog();
  } else {
    document.addEventListener("DOMContentLoaded", applyFullCatalog, { once: true });
  }
})();
