/**
 * @fileoverview NavigationUI Domain Module for Ngwyren Cinema
 * Isolated feature module registered safely onto AppleCinemaApp via NgwyrenSystem.
 */
(() => {
  "use strict";
  if (!window.AppleCinemaApp || !window.NgwyrenSystem) {
    console.error("[NgwyrenSystem] Missing core dependency while loading NavigationUI");
    return;
  }

  const NavigationUIMethods = {
  pickNonRepeatingHeroMovie(candidateMovies, storageKey = "ngwyren_recent_hero_slugs") {
    if (!candidateMovies || candidateMovies.length === 0) return null;
    const storage = typeof window !== "undefined" && window.localStorage ? window.localStorage : (typeof localStorage !== "undefined" ? localStorage : null);
    let history = [];
    try {
      const raw = storage ? storage.getItem(storageKey) : null;
      if (raw) history = JSON.parse(raw);
      if (!Array.isArray(history)) history = [];
    } catch (_) {
      history = [];
    }

    // Cửa sổ chống trùng: lưu vết 18 lần load gần nhất (hoặc N-2 nếu danh sách nhỏ)
    const recentWindow = Math.min(18, Math.max(1, candidateMovies.length - 2));
    const recentSlugs = history.slice(-recentWindow);

    let available = candidateMovies.filter((m) => m && m.slug && !recentSlugs.includes(m.slug));

    // Nếu đã duyệt hết kho ứng viên, loại trừ ít nhất bộ phim của lần load ngay trước đó
    if (available.length === 0) {
      const lastSlug = history[history.length - 1];
      available = candidateMovies.filter((m) => m && m.slug && m.slug !== lastSlug);
    }
    if (available.length === 0) {
      available = candidateMovies;
    }

    // Chọn ngẫu nhiên 1 phim từ tập hợp chưa trùng lặp
    const chosen = available[Math.floor(Math.random() * available.length)];
    if (chosen && chosen.slug) {
      history.push(chosen.slug);
      try {
        if (storage) {
          storage.setItem(storageKey, JSON.stringify(history.slice(-30)));
        }
      } catch (_) {}
    }
    return chosen;
  },

  setupHeroMovies() {
    this.ensureFullCatalogLoaded();
    this._heroTracks = {};
    this.heroIndex = 0;
    this.heroMovies = this.getActiveHeroMovies();
  },

  updateAmbientBackdrop() {
    // Đã tắt hiệu ứng đổi ảnh nền mờ để tối ưu hiệu năng tuyệt đối (0ms GPU lag)
  },

  async syncLivePhimmoi(showToast = true) {
    if (this._isSyncingLive) return;
    this._isSyncingLive = true;
    const statusText = document.getElementById("liveStatusText");
    const syncBtn = document.getElementById("btnSyncPhimmoi");
    if (statusText) statusText.textContent = "Đang cập nhật...";
    if (syncBtn) syncBtn.disabled = true;

    try {
      const result = await this.service.syncLatestFromPhimmoi(24);
      this.buildFastIndexes();
      this.setupHeroMovies();
      this.updateSidebarCounts();
      this.refreshRealtimeTrendingDOM();

      if (statusText) {
        statusText.textContent = `Trực tuyến (${result.total} phim)`;
      }
      if (syncBtn) syncBtn.disabled = false;

      if (showToast) {
        this.renderMainView();
        if (result.added > 0) {
          this.showToast(`Đã cập nhật thêm ${result.added} phim mới (Tổng ${result.total} phim)`);
        } else {
          this.showToast(`Đã đồng bộ toàn bộ kho phim (${result.total} phim)`);
        }
      }
    } finally {
      this._isSyncingLive = false;
    }
  },

  getRealtimeTrendingMovies(contextMovies = null, limit = 6) {
    if (this.service && typeof this.service.getRealtimeTrendingList === "function") {
      return this.service.getRealtimeTrendingList(
        contextMovies,
        limit,
        this._trendingRotationSeed || 0,
        this.watchHistory || []
      );
    }
    const pool = Array.isArray(contextMovies) && contextMovies.length > 0 ? contextMovies : this.service.movies;
    return pool.slice(0, limit);
  },

  refreshRealtimeTrendingDOM() {
    const stackEl = document.getElementById("visionLiveTrendingStack");
    const contextToUse =
      this.currentNav === "kham-pha" || this.currentNav === "cai-dat" || this.currentNav === "lich-chieu"
        ? null
        : this._lastLeftContext;
    const trending10 = this.getRealtimeTrendingMovies(contextToUse, 10);
    if (stackEl) {
      const trending6 = trending10.slice(0, 6);
      stackEl.innerHTML = trending6.map((m, idx) => this.renderVisionTrailerCardHTML(m, idx)).join("");
    }
    const youMightLikeEl = document.getElementById("visionYouMightLikeGrid");
    if (youMightLikeEl && !contextToUse) {
      const next4 = trending10.slice(6, 10);
      if (next4.length === 4) {
        youMightLikeEl.innerHTML = next4.map((m, idx) => this.renderVisionFeatureCardHTML(m, idx)).join("");
      }
    }
  },

  toggleMobileSidebar(forceState = null) {
    const sidebar = document.getElementById("appleSidebar");
    const backdrop = document.getElementById("sidebarMobileBackdrop");
    if (!sidebar) return;
    const isOpen = forceState !== null ? forceState : !sidebar.classList.contains("mobile-open");
    sidebar.classList.toggle("mobile-open", isOpen);
    if (backdrop) backdrop.classList.toggle("open", isOpen);
  },

  setNavigation(navKey, customTitle = null, force = false) {
    if (navKey === "search") {
      navKey = "tim-kiem";
    }
    this.ensureFullCatalogLoaded();
    if (!force && this.currentNav === navKey && !customTitle && !this.customFilterTitle && this.activeGenreFilter === "Tất cả") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (navKey === "tim-kiem") {
        document.getElementById("dedicatedSearchInput")?.focus();
      }
      return;
    }

    this.currentNav = navKey;
    if (this._heroTracks) delete this._heroTracks[navKey];
    this.heroIndex = 0;
    this.customFilterTitle = customTitle;
    this.activeGenreFilter = "Tất cả";
    this.currentSegment = "all";
    this.visibleGridLimit = 24;

    const dropdown = document.getElementById("searchDropdown");
    if (dropdown) {
      dropdown.classList.remove("open");
      dropdown.innerHTML = "";
    }

    // 1. Phản hồi nhấp nháy: Cập nhật active pill & nút topbar
    document.querySelectorAll("[data-nav]").forEach((el) => {
      el.classList.toggle("active", el.dataset.nav === navKey);
    });

    this.syncLeftDockIndicator(navKey);
    this.toggleMobileSidebar(false);

    // 2. Chuyển cảnh giao diện mượt mà bằng Scale In - Out (Không trượt slide, không blur, 120fps)
    this.transitionView(() => {
      this.renderMainView();
      this.attachHeroSwipeHandlers();
      if (navKey === "tim-kiem") {
        setTimeout(() => {
          document.getElementById("dedicatedSearchInput")?.focus();
        }, 40);
      }
    });
  },

  syncNavPillIndicator() {},

  transitionView(updateCallback) {
    const container = document.getElementById("mainContentWrapper");
    if (!container) {
      if (updateCallback) updateCallback();
      return;
    }

    if (this._navTransitionTimer) {
      clearTimeout(this._navTransitionTimer);
      this._navTransitionTimer = null;
    }

    // Chuyển trang tức thì, không chớp khung hình (zero 1-frame flash) và không cắt ngang animation
    const htmlEl = document.documentElement;
    const prevBehavior = htmlEl.style.scrollBehavior;
    htmlEl.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    htmlEl.style.scrollBehavior = prevBehavior;

    container.classList.remove("vision-view-exit", "vision-view-enter");
    if (updateCallback) updateCallback();

    // Kích hoạt animation ngay trước frame vẽ đầu tiên để không bị nháy opacity 1 -> 0 -> 1
    void container.offsetWidth;
    container.classList.add("vision-view-enter");

    const cleanupEnter = () => {
      container.classList.remove("vision-view-enter");
      container.removeEventListener("animationend", onAnimEnd);
      if (this._navTransitionTimer) {
        clearTimeout(this._navTransitionTimer);
        this._navTransitionTimer = null;
      }
    };
    const onAnimEnd = (e) => {
      if (e.target === container) cleanupEnter();
    };
    container.addEventListener("animationend", onAnimEnd);
    this._navTransitionTimer = setTimeout(cleanupEnter, 420);
  },

  syncLeftDockIndicator(navKey) {
    const dockEl = document.getElementById("appleSidebar");
    if (dockEl) {
      const dockMap = {
        "kham-pha": 0,
        "phim-le": 0,
        "phim-bo": 0,
        "netflix": 0,
        "vietsub": 0,
        "moi-cap-nhat": 0,
        "yeu-thich": 1,
        "lich-su": 1,
        "anime": 2,
        "lich-chieu": 3,
        "cai-dat": 4
      };
      const targetIdx = dockMap[navKey] !== undefined ? dockMap[navKey] : 0;

      dockEl.style.setProperty("--dock-idx", String(targetIdx));
      document.querySelectorAll(".vision-dock-icon").forEach((btn) => {
        btn.classList.toggle("active", Number(btn.dataset.dockIdx) === targetIdx);
      });
    }

    // Đồng bộ hiệu ứng thanh điều hướng dưới điện thoại kiểu iPhone (Liquid Glider + Bottom Indicator + Spring Bounce)
    const mobileDock = document.getElementById("liquidMobileDock");
    if (mobileDock) {
      const mobileMap = {
        "kham-pha": 0,
        "phim-le": 0,
        "phim-bo": 0,
        "moi-cap-nhat": 0,
        "vietsub": 0,
        "tim-kiem": 1,
        "search-results": 1,
        "filter-results": 1,
        "anime": 2,
        "netflix": 3,
        "yeu-thich": 4,
        "lich-su": 4
      };
      const mIdx = mobileMap[navKey] !== undefined ? mobileMap[navKey] : 0;
      const prevIdx = mobileDock._activeIdx;
      mobileDock._activeIdx = mIdx;
      mobileDock.style.setProperty("--mobile-dock-idx", String(mIdx));
      mobileDock.querySelectorAll(".dock-tab-btn").forEach((btn, i) => {
        const btnIdx = btn.dataset.mobileIdx !== undefined ? Number(btn.dataset.mobileIdx) : i;
        const isAct = btnIdx === mIdx;
        btn.classList.toggle("active", isAct);
        if (isAct && prevIdx !== mIdx) {
          btn.classList.remove("ios-tab-bounce");
          void btn.offsetWidth;
          btn.classList.add("ios-tab-bounce");
        } else if (!isAct) {
          btn.classList.remove("ios-tab-bounce");
        }
      });
    }
  },

  triggerPageTransition() {
    this.transitionView(() => {
      this.renderMainView();
    });
  },

  renderLeftSideColumnHTML(contextMovies = null, panelTitle = "Đề Xuất") {
    // Lưu ngữ cảnh hiện tại và tính toán 6 phim xu hướng thời gian thực (Real-time Trending)
    this._lastLeftContext = contextMovies && contextMovies !== this.service.movies ? contextMovies : null;
    const sourceTrailers = this.getRealtimeTrendingMovies(this._lastLeftContext, 6);
    const seenContinueSlugs = new Set();
    const continueItems = [];
    for (const h of this.watchHistory) {
      const movie = this.findMovie(h?.slug);
      if (movie && !seenContinueSlugs.has(movie.slug)) {
        seenContinueSlugs.add(movie.slug);
        continueItems.push({ movie, epIndex: h.epIndex || 0 });
      }
    }

    // Chỉ hiển thị khung Xem Tiếp khi người dùng đã thực sự xem phim (tài khoản mới không hiện rác)
    const continuePanelHTML = continueItems.length > 0 ? `
        <div class="vision-glass-panel">
          <div class="vision-panel-header">
            <span class="vision-panel-title">Xem Tiếp</span>
            <button class="vision-see-all-pill" onclick="app.setNavigation('lich-su')">Lịch sử</button>
          </div>
          <div class="vision-continue-list">
            ${continueItems.slice(0, 5).map((item) => this.renderVisionContinueItemHTML(item.movie, item.epIndex)).join("")}
          </div>
        </div>
    ` : "";

    return `
      <aside class="vision-side-col">
        <div class="vision-glass-panel">
          <div class="vision-panel-header">
            <span class="vision-panel-title">${panelTitle}</span>
            <span class="vision-panel-sort">Hôm nay</span>
          </div>
          <div class="vision-trailer-stack" id="visionLiveTrendingStack">
            ${sourceTrailers.map((m, idx) => this.renderVisionTrailerCardHTML(m, idx)).join("")}
          </div>
        </div>

        ${continuePanelHTML}
      </aside>
    `;
  },

  getCanonicalMovieKey(movie) {
    if (!movie) return "";
    if (this.service?.getCanonicalMovieKey) return this.service.getCanonicalMovieKey(movie);
    let t = (movie.title || movie.originTitle || movie.slug || "")
      .toLowerCase()
      .replace(/đ/g, "d")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    if (t.includes("godzilla tru mot") || t.includes("godzilla tru khong") || t.includes("godzilla minus one")) {
      return "godzilla minus one";
    }
    if (t.includes("ramayana")) {
      return "ramayana rise of a legend";
    }
    return t;
  },

  dedupeMovieList(list) {
    if (!Array.isArray(list) || list.length <= 1) return list || [];
    // Fast-path 0ms: this.service.movies đã được deduplicateCatalog() làm sạch hoàn toàn
    if (this.service && list === this.service.movies) return list;
    const seenSlugs = new Set();
    const seenKeys = new Set();
    const keyToMovieMap = new Map();
    const result = [];
    const canMerge = this.service && typeof this.service.canMergeMovies === "function"
      ? (a, b) => this.service.canMergeMovies(a, b)
      : () => true;
    const getKeys = this.service && typeof this.service.getCanonicalMovieKeys === "function"
      ? (m) => m._canonKeys || (m._canonKeys = this.service.getCanonicalMovieKeys(m))
      : (m) => m._canonKeys || (m._canonKeys = [this.getCanonicalMovieKey(m)]);
    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      if (!m || !m.slug) continue;
      const keys = getKeys(m);
      const isSlugSeen = seenSlugs.has(m.slug) || (m.crawlSlug && seenSlugs.has(m.crawlSlug));
      let matchedKey = null;
      for (let ki = 0; ki < keys.length; ki++) {
        const k = keys[ki];
        if (k && seenKeys.has(k) && canMerge(keyToMovieMap.get(k), m)) {
          matchedKey = k;
          break;
        }
      }
      if (isSlugSeen || matchedKey) {
        if (this.service && typeof this.service.mergeBestQualityMovie === "function") {
          const existing = (matchedKey && keyToMovieMap.get(matchedKey)) || (this.service.slugMap && this.service.slugMap.get(m.slug));
          if (existing && existing !== m && canMerge(existing, m)) {
            this.service.mergeBestQualityMovie(existing, m);
          }
        }
        continue;
      }
      seenSlugs.add(m.slug);
      if (m.crawlSlug) seenSlugs.add(m.crawlSlug);
      if (Array.isArray(m.aliasSlugs)) {
        for (let ai = 0; ai < m.aliasSlugs.length; ai++) seenSlugs.add(m.aliasSlugs[ai]);
      }
      for (let ki = 0; ki < keys.length; ki++) {
        const k = keys[ki];
        if (k) {
          seenKeys.add(k);
          keyToMovieMap.set(k, m);
        }
      }
      result.push(m);
    }
    return result;
  },

  renderContinueWatchingShelfHTML() {
    const seenCanonicalKeys = new Set();
    const continueItems = [];
    for (const h of (this.watchHistory || [])) {
      if (!h || !h.slug) continue;
      const foundMovie = this.findMovie(h.slug);
      const fallbackImg = "https://phimimg.com/upload/vod/20251229-1/d7f24b91fd95fb7cf353e1369e2318b7.jpg";
      const movie = foundMovie ? {
        ...foundMovie,
        poster: foundMovie.poster || foundMovie.backdrop || h.poster || fallbackImg,
        backdrop: foundMovie.backdrop || foundMovie.poster || h.backdrop || fallbackImg
      } : {
        slug: h.slug,
        title: h.title || h.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        poster: h.poster || fallbackImg,
        backdrop: h.backdrop || h.poster || fallbackImg,
        type: "single"
      };

      const cKey = this.getCanonicalMovieKey(movie);
      if (seenCanonicalKeys.has(cKey)) continue;

      const progress = Number(h.progress) || 15;
      if (progress > 0 && progress < 95) {
        seenCanonicalKeys.add(cKey);
        continueItems.push({
          movie,
          epIndex: Number(h.epIndex) || 0,
          progress,
          currentTime: Number(h.currentTime) || 0
        });
      }
    }

    if (continueItems.length === 0) {
      return `<div id="continueWatchingShelf" style="display: none;"></div>`;
    }

    return `
      <section id="continueWatchingShelf" class="vision-shelf-section vision-continue-watching-shelf">
        <div class="vision-shelf-header">
          <h2 class="vision-shelf-title"><i class="fas fa-circle-play" style="margin-right: 8px;"></i>Tiếp Tục Xem</h2>
          <button class="vision-see-all-pill" onclick="app.setNavigation('lich-su')">Xem Tất Cả (${continueItems.length})</button>
        </div>
        <div class="vision-continue-shelf-grid">
          ${continueItems.slice(0, 4).map(({ movie, epIndex, progress, currentTime }, idx) => {
            const isGenuineSeries = Boolean(Array.isArray(movie.episodes) && movie.episodes.length > 1);
            const ep = movie.episodes?.[epIndex] || movie.episodes?.[0];
            const epLabel = isGenuineSeries ? (ep?.name ? this.formatEpisodeLabel(ep.name, `Tập ${epIndex + 1}`) : `Tập ${epIndex + 1}`) : "";
            const timeStr = currentTime > 0 ? this.formatSeconds(currentTime) : "";
            const thumbImg = movie.backdrop || movie.poster || "https://phimimg.com/upload/vod/20251229-1/d7f24b91fd95fb7cf353e1369e2318b7.jpg";
            return `
              <div class="continue-shelf-card" style="--card-stagger: ${idx};" onclick="app.openMovieModal('${movie.slug}', true, ${epIndex})">
                <div class="continue-shelf-thumb">
                  <img src="${thumbImg}" alt="${movie.title}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://phimimg.com/upload/vod/20251229-1/d7f24b91fd95fb7cf353e1369e2318b7.jpg';" />
                  <div class="continue-shelf-play"><i class="fas fa-play"></i></div>
                  ${isGenuineSeries && epLabel ? `<div class="continue-shelf-badge">${epLabel}</div>` : ""}
                  <div class="continue-shelf-bar">
                    <div class="continue-shelf-fill" style="width: ${progress}%;"></div>
                  </div>
                </div>
                <div class="continue-shelf-info">
                  <div class="continue-shelf-title">${movie.title}</div>
                  <div class="continue-shelf-meta">
                    <span>${timeStr ? `Đã xem ${timeStr}` : (isGenuineSeries && epLabel ? epLabel : "Đang xem")}</span>
                    <span>${progress}%</span>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </section>
    `;
  },

  pickDistinctCategoryHero(list, navKey) {
    if (!list || list.length === 0) return this.heroMovies[0] || this.service.movies[0];
    const pool = list.filter((m) => m && m.backdrop && !m.backdrop.includes("nguonc.com"));
    const poolToUse = pool.length >= 3 ? pool.slice(0, 15) : list.slice(0, 8);
    // Chọn ngẫu nhiên một phim xuất sắc trong danh mục mỗi lần mở
    return poolToUse[Math.floor(Math.random() * poolToUse.length)] || list[0];
  },

  renderSettingsViewHTML() {
    const s = this.settings || {};
    let glassPercent = 50;
    if (s.glassPercent !== undefined) glassPercent = Number(s.glassPercent);
    else if (s.glassBlur === "clear") glassPercent = 0;
    else if (s.glassBlur === "frost") glassPercent = 100;
    const glassLabel = glassPercent === 0 ? "Trong Suốt" : (glassPercent === 100 ? "Kính Mờ" : "Tiêu Chuẩn");

    return `
      <div class="cinema-settings-layout">
        <!-- Spatial Settings Hero Header -->
        <section class="vision-settings-banner">
          <div class="vision-settings-banner-left">
            <h1 class="vision-hero-title">Cài Đặt Hệ Thống</h1>
          </div>
          <div class="vision-settings-banner-actions">
            <button class="vision-btn-outline" onclick="app.resetDefaultSettings()">
              Mặc Định
            </button>
          </div>
        </section>

        <!-- Settings Grid (2-Column Glass Cards) -->
        <div class="vision-settings-grid">
            <!-- Card Theme: Giao Diện & Không Gian Thị Giác -->
            <div class="vision-settings-card" style="grid-column: 1 / -1; --card-stagger: 0;">
              <div class="vision-settings-card-header">
                <div>
                  <h3>Chủ Đề & Không Gian</h3>
                </div>
              </div>

              <!-- Row 1: Tông Màu -->
              <div class="vision-setting-row">
                <div class="vision-setting-info">
                  <strong>Tông màu</strong>
                </div>
                <div class="vision-setting-pills">
                  <button class="filter-chip ${(s.theme || 'default') === 'default' ? 'active' : ''}" data-theme-btn="default" onclick="app.setThemeMode('default')">
                    Mặc Định
                  </button>
                  <button class="filter-chip ${s.theme === 'midnight' ? 'active' : ''}" data-theme-btn="midnight" onclick="app.setThemeMode('midnight')">
                    Nửa Đêm
                  </button>
                  <button class="filter-chip ${s.theme === 'aurora' ? 'active' : ''}" data-theme-btn="aurora" onclick="app.setThemeMode('aurora')">
                    Cực Quang
                  </button>
                  <button class="filter-chip ${s.theme === 'amber' ? 'active' : ''}" data-theme-btn="amber" onclick="app.setThemeMode('amber')">
                    Hoàng Hôn
                  </button>
                  <button class="filter-chip ${s.theme === 'emerald' ? 'active' : ''}" data-theme-btn="emerald" onclick="app.setThemeMode('emerald')">
                    Lục Bảo
                  </button>
                </div>
              </div>

              <!-- Row 2: Độ mờ kính (Native visionOS Range Slider) -->
              <div class="vision-setting-row" style="flex-direction: column; align-items: stretch; gap: 10px;">
                <div style="width: 100%;">
                  <strong style="font-size: 0.88rem; color: #ffffff;">Độ mờ kính</strong>
                </div>
                <div class="ios-slider-wrapper">
                  <div class="ios-slider-control">
                    <span class="ios-slider-icon" title="Trong suốt (0%)" onclick="app.setGlassStep(0)" style="cursor: pointer;">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="5" stroke-dasharray="3 3"/>
                      </svg>
                    </span>
                    <input type="range" min="0" max="100" value="${glassPercent}" id="glassNativeRange" class="ios-native-range" style="--range-fill: ${glassPercent}%;" aria-label="Độ mờ kính" />
                    <span class="ios-slider-icon" title="Kính mờ (100%)" onclick="app.setGlassStep(100)" style="cursor: pointer;">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" fill-opacity="0.45"/>
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Row 3: Ánh sáng môi trường -->
              <div class="vision-setting-row">
                <div class="vision-setting-info">
                  <strong>Ánh sáng môi trường</strong>
                </div>
                <button class="vision-toggle-btn ${s.ambientGlow !== false ? 'on' : ''}" id="ambientGlowToggleBtn" onclick="app.toggleAmbientGlow()">
                  <span>${s.ambientGlow !== false ? 'Bật' : 'Tắt'}</span>
                </button>
              </div>
            </div>

            <!-- Card 2: Trải Nghiệm Rạp Chiếu -->
            <div class="vision-settings-card" style="--card-stagger: 1;">
              <div class="vision-settings-card-header">
                <div>
                  <h3>Trải Nghiệm Rạp Chiếu</h3>
                </div>
              </div>

              <div class="vision-setting-row">
                <div class="vision-setting-info">
                  <strong>Tự động phát</strong>
                </div>
                <button class="vision-toggle-btn ${s.autoPlayOnOpen ? 'on' : ''}" onclick="app.updateSetting('autoPlayOnOpen', ${!s.autoPlayOnOpen})">
                  <span>${s.autoPlayOnOpen ? 'Bật' : 'Tắt'}</span>
                </button>
              </div>

              <div class="vision-setting-row">
                <div class="vision-setting-info">
                  <strong>Tắt đèn rạp</strong>
                </div>
                <button class="vision-toggle-btn ${s.defaultLightsOff ? 'on' : ''}" onclick="app.updateSetting('defaultLightsOff', ${!s.defaultLightsOff})">
                  <span>${s.defaultLightsOff ? 'Bật' : 'Tắt'}</span>
                </button>
              </div>

              <div class="vision-setting-row">
                <div class="vision-setting-info">
                  <strong>Tự xoay Banner</strong>
                </div>
                <button class="vision-toggle-btn ${s.heroAutoRotate !== false ? 'on' : ''}" onclick="app.updateSetting('heroAutoRotate', ${s.heroAutoRotate === false})">
                  <span>${s.heroAutoRotate !== false ? 'Bật' : 'Tắt'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
    `;
  },

  renderScheduleViewHTML() {
    const schedule = window.NGWYREN_AIR_SCHEDULE || {};
    const dayKeys = ["thu-2", "thu-3", "thu-4", "thu-5", "thu-6", "thu-7", "chu-nhat"];
    const dayNames = {
      "thu-2": "Thứ 2",
      "thu-3": "Thứ 3",
      "thu-4": "Thứ 4",
      "thu-5": "Thứ 5",
      "thu-6": "Thứ 6",
      "thu-7": "Thứ 7",
      "chu-nhat": "Chủ Nhật"
    };

    // Xác định ngày hiện tại trong tuần (Hôm nay) và tính ngày/tháng thực tế cho 7 ngày trong tuần
    const now = new Date();
    const jsDay = now.getDay(); // 0: Chủ Nhật, 1: Thứ 2, 2: Thứ 3...
    const todayKey = jsDay === 0 ? "chu-nhat" : `thu-${jsDay + 1}`;

    const dayIndexInWeek = (jsDay + 6) % 7; // Thứ 2 = 0, ..., Chủ Nhật = 6
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayIndexInWeek);

    const dayDates = {};
    dayKeys.forEach((k, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dayNum = String(d.getDate()).padStart(2, "0");
      const monthNum = String(d.getMonth() + 1).padStart(2, "0");
      dayDates[k] = `${dayNum}/${monthNum}`;
    });

    if (!this.activeScheduleDay) {
      this.activeScheduleDay = todayKey;
    }

    const currentDayKey = this.activeScheduleDay;
    const dayItems = schedule[currentDayKey] || [];

    const tabsHTML = dayKeys
      .map((k, idx) => {
        const isToday = k === todayKey;
        const isActive = k === currentDayKey;
        const count = (schedule[k] || []).length;
        return `
          <button class="schedule-tab-btn ${isActive ? "active" : ""} ${isToday ? "is-today" : ""}"
                  style="--tab-stagger: ${idx};"
                  onclick="app.selectScheduleDay('${k}')"
                  data-day="${k}">
            ${isToday ? '<span class="tab-today-badge-outer"><i class="fas fa-circle-dot"></i> Hôm nay</span>' : ""}
            <span class="tab-day-label">${dayNames[k]}</span>
            <span class="tab-date-label">${dayDates[k]}</span>
            <span class="tab-count-tag">${count} phim</span>
          </button>
        `;
      })
      .join("");

    const cardsHTML = dayItems.length > 0
      ? dayItems
          .map((m, idx) => {
            const genresHTML = (m.genres || []).slice(0, 2).map((g) => `<span class="sch-genre-tag">${g}</span>`).join("");
            return `
              <article class="schedule-card-glass" style="--card-stagger: ${idx};" onclick="app.openMovieModal('${m.slug}', true)">
                <div class="schedule-card-media">
                  <img src="${m.poster || m.backdrop}" alt="${m.title}" loading="lazy" decoding="async"
                       onerror="this.src='https://phimimg.com/upload/vod/20251229-1/d7f24b91fd95fb7cf353e1369e2318b7.jpg'" />
                  <div class="schedule-card-top-badges">
                    <span class="sch-time-pill"><i class="far fa-clock"></i> ${m.airTime || "10:00 Sáng"}</span>
                    <span class="sch-quality-pill"><i class="fas fa-sparkles"></i> ${m.quality === "4K" ? "4K" : "Full HD"}</span>
                  </div>
                  <div class="schedule-hover-play">
                    <div class="sch-play-icon"><i class="fas fa-play"></i></div>
                  </div>
                </div>
                <div class="schedule-card-info">
                  <h3 class="schedule-movie-title" title="${m.title}">${m.title}</h3>
                  <div class="schedule-movie-sub">${m.originTitle || m.country}</div>
                  <div class="schedule-movie-chips">
                    <span class="sch-ep-pill"><i class="fas fa-tv"></i> ${this.formatEpisodeLabel(m.currentEpisode || "Tập Mới", "Tập Mới")}</span>
                  </div>
                  <div class="schedule-movie-genres">${genresHTML}</div>
                </div>
              </article>
            `;
          })
          .join("")
      : `
        <div class="schedule-empty-state">
          <i class="fas fa-calendar-xmark"></i>
          <h3>Chưa có lịch phát sóng cho ${dayNames[currentDayKey]}</h3>
          <p>Các tập phim hoạt hình 3D và Anime mới đang được tự động đồng bộ hàng ngày.</p>
        </div>
      `;

    return `
      <div class="cinema-schedule-layout">
        <!-- Spatial Schedule Hero Header -->
        <section class="schedule-hero-panel">
          <h1 class="schedule-hero-title">Lịch Chiếu Phim</h1>
        </section>

        <!-- Day of Week Capsule Scroller Bar -->
        <div class="schedule-tabs-bar">
          <div class="schedule-tabs-scroll-wrap">
            ${tabsHTML}
          </div>
        </div>

        <!-- Schedule Cards 4-Column Grid -->
        <div class="schedule-cards-grid">
          ${cardsHTML}
        </div>
      </div>
    `;
  },

  selectScheduleDay(dayKey) {
    this.activeScheduleDay = dayKey;
    this.triggerHaptic("light");
    this.renderMainView();
  },

  renderDedicatedSearchViewHTML() {
    this.ensureFullCatalogLoaded();
    const query = (this.dedicatedSearchQuery || "").trim();
    const activeChip = this.dedicatedSearchChip || "trending";
    const chips = [
      { key: "trending", label: "Xu Hướng Hot", icon: "fa-fire" },
      { key: "chieu-rap", label: "Chiếu Rạp", icon: "fa-ticket" },
      { key: "viet-nam", label: "Việt Nam", icon: "fa-star" },
      { key: "han-quoc", label: "Hàn Quốc", icon: "fa-heart" },
      { key: "trung-quoc", label: "Trung Quốc", icon: "fa-dragon" },
      { key: "anime", label: "Anime", icon: "fa-wand-magic-sparkles" },
      { key: "hanh-dong", label: "Hành Động", icon: "fa-bolt" },
      { key: "kinh-di", label: "Kinh Dị", icon: "fa-ghost" },
      { key: "tinh-cam", label: "Tình Cảm", icon: "fa-champagne-glasses" }
    ];

    const chipsHTML = chips
      .map(
        (c) => `
          <button type="button" class="dedicated-search-chip ${!query && activeChip === c.key ? "active" : ""}" onclick="app.selectDedicatedSearchChip('${c.key}')">
            <i class="fas ${c.icon}"></i>
            <span>${c.label}</span>
          </button>
        `
      )
      .join("");

    const initialList = query
      ? (this.dedicatedSearchResults || this.searchCatalogLocal(query))
      : this.getDedicatedSearchChipMovies(activeChip);

    return `
      <div class="cinema-dedicated-search-layout">
        <section class="dedicated-search-hero">
          <div class="dedicated-search-header">
            <h1 class="dedicated-search-title">Tìm Kiếm Phim</h1>
            <p class="dedicated-search-subtitle">Khám phá nhanh hơn ${this.service.movies.length}+ bộ phim điện ảnh, phim bộ & Anime 4K/Full HD</p>
          </div>

          <form class="dedicated-search-bar-wrap" onsubmit="event.preventDefault(); app.handleDedicatedSearchInput(document.getElementById('dedicatedSearchInput')?.value || '', true);">
            <div class="dedicated-search-capsule">
              <i class="fas fa-magnifying-glass dedicated-search-icon"></i>
              <input
                type="text"
                id="dedicatedSearchInput"
                class="dedicated-search-input"
                value="${query.replace(/"/g, "&quot;")}"
                placeholder="Nhập tên phim, tên tiếng Anh, diễn viên, đạo diễn..."
                autocomplete="off"
                oninput="app.handleDedicatedSearchInput(this.value)"
              />
              <button
                type="button"
                id="dedicatedSearchClearBtn"
                class="dedicated-search-clear ${query ? "visible" : ""}"
                onclick="app.clearDedicatedSearch()"
                title="Xóa từ khóa"
                aria-label="Xóa từ khóa"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </form>

          <div class="dedicated-search-chips" id="dedicatedSearchChips">
            ${chipsHTML}
          </div>
        </section>

        <section class="vision-shelf-section" id="dedicatedSearchResultsContainer">
          ${this.renderDedicatedSearchResultsInnerHTML(query, initialList, true, activeChip)}
        </section>
      </div>
    `;
  },

  searchCatalogLocal(query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return [];
    const qNorm = this.service.normalizeSearchText ? this.service.normalizeSearchText(q) : q;
    const qTokens = qNorm ? qNorm.split(" ").filter(Boolean) : [];
    const scored = [];
    const movies = this.service.movies;
    for (let i = 0; i < movies.length; i++) {
      const m = movies[i];
      if (!m) continue;
      const t = m._titleLower || (m._titleLower = (m.title || "").toLowerCase());
      const o = m._originLower || (m._originLower = (m.originTitle || "").toLowerCase());
      const tNorm = m._titleNorm || (m._titleNorm = this.service.normalizeSearchText ? this.service.normalizeSearchText(m.title) : t);
      const oNorm = m._originNorm || (m._originNorm = this.service.normalizeSearchText ? this.service.normalizeSearchText(m.originTitle) : o);
      let score = 0;
      if (t === q || o === q || (qNorm && (tNorm === qNorm || oNorm === qNorm))) score = 250;
      else if (t.startsWith(q) || (qNorm && tNorm.startsWith(qNorm))) score = 180;
      else if (o.startsWith(q) || (qNorm && oNorm.startsWith(qNorm))) score = 150;
      else if (t.includes(q) || (qNorm && tNorm.includes(qNorm))) score = 110;
      else if (o.includes(q) || (qNorm && oNorm.includes(qNorm))) score = 90;
      else if (qTokens.length > 1 && qTokens.every((tk) => `${tNorm} ${oNorm}`.includes(tk))) score = 80;
      else {
        const meta = m._metaSearch || (m._metaSearch = `${(m.genres || []).join(" ")} ${(m.cast || []).join(" ")} ${m.director || ""}`.toLowerCase());
        if (meta.includes(q)) score = 25;
      }
      if (score > 0) scored.push({ movie: m, score });
    }
    scored.sort((a, b) => b.score - a.score || (b.movie.year || 0) - (a.movie.year || 0));
    return this.dedupeMovieList(scored.map((it) => it.movie));
  },

  getDedicatedSearchChipMovies(chipKey = "trending") {
    this.ensureFullCatalogLoaded();
    let list = [];
    switch (chipKey) {
      case "chieu-rap":
        list = this.service.movies.filter((m) => (m.sectionTags && m.sectionTags.includes("chieu-rap")) || m.type === "single");
        break;
      case "viet-nam":
        list = this.getMoviesByCountry("viet-nam");
        break;
      case "han-quoc":
        list = this.getMoviesByCountry("han-quoc");
        break;
      case "trung-quoc":
        list = this.getMoviesByCountry("trung-quoc");
        break;
      case "anime":
        list = this.getMoviesByTag("anime");
        break;
      case "hanh-dong":
        list = this.service.movies.filter((m) => (m.genres || []).some((g) => /hành động/i.test(g)));
        break;
      case "kinh-di":
        list = this.service.movies.filter((m) => (m.genres || []).some((g) => /kinh dị|bí ẩn/i.test(g)));
        break;
      case "tinh-cam":
        list = this.service.movies.filter((m) => (m.genres || []).some((g) => /tình cảm|lãng mạn|chính kịch/i.test(g)));
        break;
      default:
        list = [...this.getRealtimeTrendingMovies(null, 12), ...this.service.movies.slice(0, 24)];
        break;
    }
    return this.dedupeMovieList(list).slice(0, 24);
  },

  renderDedicatedSearchResultsInnerHTML(query, results, isOnlineDone = true, activeChip = "trending") {
    const q = (query || "").trim();
    const list = Array.isArray(results) ? results : [];
    const chipTitles = {
      "trending": "Xu Hướng Tìm Kiếm & Đề Xuất Hôm Nay",
      "chieu-rap": "Phim Chiếu Rạp & Điện Ảnh Nổi Bật",
      "viet-nam": "Điện Ảnh Việt Nam Đặc Sắc",
      "han-quoc": "Phim Hàn Quốc Thịnh Hành",
      "trung-quoc": "Phim Trung Quốc Tuyển Chọn",
      "anime": "Anime & Hoạt Hình Đỉnh Cao",
      "hanh-dong": "Bom Tấn Hành Động Kịch Tính",
      "kinh-di": "Phim Kinh Dị & Bí Ẩn Hấp Dẫn",
      "tinh-cam": "Phim Tình Cảm & Tâm Lý Đặc Sắc"
    };

    if (!q) {
      const heading = chipTitles[activeChip] || chipTitles.trending;
      return `
        <div class="vision-shelf-header">
          <h2 class="vision-shelf-title"><i class="fas fa-sparkles" style="margin-right: 8px;"></i>${heading}</h2>
        </div>
        <div class="vision-cards-grid-4">
          ${list.slice(0, 24).map((m, idx) => this.renderVisionFeatureCardHTML(m, idx)).join("")}
        </div>
      `;
    }

    return `
      <div class="vision-shelf-header">
        <h2 class="vision-shelf-title">
          Kết quả cho "${q.replace(/"/g, "&quot;")}" (${list.length} phim)
        </h2>
        <span style="font-size: 0.82rem; color: rgba(255,255,255,0.6);">
          ${isOnlineDone ? '<i class="fas fa-check-circle" style="color:#34c759;margin-right:4px;"></i>Đã đồng bộ toàn kho' : '<i class="fas fa-circle-notch fa-spin" style="margin-right:4px;"></i>Đang mở rộng tìm kiếm...'}
        </span>
      </div>
      ${
        list.length > 0
          ? `<div class="vision-cards-grid-4">${list.slice(0, 36).map((m, idx) => this.renderVisionFeatureCardHTML(m, idx)).join("")}</div>`
          : ""
      }
      ${this.renderMovieRequestCardHTML(q, list.length > 0)}
    `;
  },

  handleDedicatedSearchInput(rawValue, immediate = false) {
    this.ensureFullCatalogLoaded();
    const query = (rawValue || "").trim();
    this.dedicatedSearchQuery = query;
    this.lastSearchQuery = query;

    const clearBtn = document.getElementById("dedicatedSearchClearBtn");
    if (clearBtn) clearBtn.classList.toggle("visible", query.length > 0);

    const chipsWrap = document.getElementById("dedicatedSearchChips");
    if (chipsWrap) {
      chipsWrap.querySelectorAll(".dedicated-search-chip").forEach((btn) => {
        if (query) btn.classList.remove("active");
      });
    }

    if (this._dedicatedSearchTimer) {
      clearTimeout(this._dedicatedSearchTimer);
      this._dedicatedSearchTimer = null;
    }

    const container = document.getElementById("dedicatedSearchResultsContainer");
    if (!container) return;

    if (!query) {
      const chipKey = this.dedicatedSearchChip || "trending";
      const defaultMovies = this.getDedicatedSearchChipMovies(chipKey);
      container.innerHTML = this.renderDedicatedSearchResultsInnerHTML("", defaultMovies, true, chipKey);
      return;
    }

    const localMatches = this.searchCatalogLocal(query);
    this.dedicatedSearchResults = localMatches;
    this.lastSearchResults = localMatches;
    container.innerHTML = this.renderDedicatedSearchResultsInnerHTML(query, localMatches, false);

    const delay = immediate ? 0 : 140;
    this._dedicatedSearchTimer = setTimeout(async () => {
      try {
        const fullMatches = await this.service.searchMovies(query);
        if (this.currentNav === "tim-kiem" && (this.dedicatedSearchQuery || "").trim() === query) {
          const deduped = this.dedupeMovieList(fullMatches);
          this.dedicatedSearchResults = deduped;
          this.lastSearchResults = deduped;
          const liveContainer = document.getElementById("dedicatedSearchResultsContainer");
          if (liveContainer) {
            liveContainer.innerHTML = this.renderDedicatedSearchResultsInnerHTML(query, deduped, true);
          }
        }
      } catch (e) {
        console.warn("[DedicatedSearch] online search error:", e);
      }
    }, delay);
  },

  clearDedicatedSearch() {
    this.dedicatedSearchQuery = "";
    this.dedicatedSearchResults = null;
    const input = document.getElementById("dedicatedSearchInput");
    if (input) {
      input.value = "";
      input.focus();
    }
    const clearBtn = document.getElementById("dedicatedSearchClearBtn");
    if (clearBtn) clearBtn.classList.remove("visible");
    this.selectDedicatedSearchChip(this.dedicatedSearchChip || "trending");
  },

  selectDedicatedSearchChip(chipKey) {
    this.dedicatedSearchChip = chipKey || "trending";
    this.dedicatedSearchQuery = "";
    const input = document.getElementById("dedicatedSearchInput");
    if (input) input.value = "";
    const clearBtn = document.getElementById("dedicatedSearchClearBtn");
    if (clearBtn) clearBtn.classList.remove("visible");

    const chips = ["trending", "chieu-rap", "viet-nam", "han-quoc", "trung-quoc", "anime", "hanh-dong", "kinh-di", "tinh-cam"];
    document.querySelectorAll("#dedicatedSearchChips .dedicated-search-chip").forEach((btn, idx) => {
      btn.classList.toggle("active", chips[idx] === this.dedicatedSearchChip);
    });

    const container = document.getElementById("dedicatedSearchResultsContainer");
    if (container) {
      const list = this.getDedicatedSearchChipMovies(this.dedicatedSearchChip);
      container.innerHTML = this.renderDedicatedSearchResultsInnerHTML("", list, true, this.dedicatedSearchChip);
    }
  },

  applyGlassDynamics(percent) {
    const p = Math.max(0, Math.min(100, Number(percent)));
    const t = p / 100;

    // 100% continuous linear interpolation (LERP) - no steps, no thresholds, zero glitch!
    const blurPx = Math.round(4 + t * 50); // 4px -> 54px
    const alpha = (0.15 + t * 0.77).toFixed(3); // 0.15 -> 0.92
    const panelAlpha = (0.025 + t * 0.11).toFixed(3); // 0.025 -> 0.135
    const dockAlpha = (0.22 + t * 0.72).toFixed(3); // 0.22 -> 0.94
    const borderAlpha = (0.42 - t * 0.26).toFixed(3); // 0.42 -> 0.16
    const rimAlpha = (0.65 - t * 0.45).toFixed(3); // 0.65 -> 0.20
    const shadowAlpha = (0.25 + t * 0.55).toFixed(3); // 0.25 -> 0.80
    const shadowBlur = Math.round(20 + t * 50); // 20px -> 70px

    const root = document.documentElement;
    root.style.setProperty("--glass-dyn-blur", `${blurPx}px`);
    root.style.setProperty("--glass-dyn-alpha", `${alpha}`);
    root.style.setProperty("--glass-panel-alpha", `${panelAlpha}`);
    root.style.setProperty("--glass-dock-alpha", `${dockAlpha}`);
    root.style.setProperty("--glass-border-alpha", `${borderAlpha}`);
    root.style.setProperty("--glass-rim-alpha", `${rimAlpha}`);
    root.style.setProperty("--glass-shadow-alpha", `${shadowAlpha}`);
    root.style.setProperty("--glass-shadow-blur", `${shadowBlur}px`);
    root.style.setProperty("--range-fill", `${p}%`);
  },

  initGlassSlider() {
    const range = document.getElementById("glassNativeRange");
    const label = document.getElementById("glassSliderValueLabel");
    if (!range) return;

    const applyPercent = (val, save = false) => {
      const percent = Math.max(0, Math.min(100, Number(val)));
      range.style.setProperty("--range-fill", `${percent}%`);

      // Cập nhật động học mượt mà liên tục từng 1% không hề có nấc gián đoạn
      this.applyGlassDynamics(percent);

      if (label) {
        const text = percent < 30 ? "Trong Suốt" : (percent > 70 ? "Kính Mờ" : "Tiêu Chuẩn");
        label.textContent = `${text} (${percent}%)`;
      }

      if (save) {
        this.settings.glassPercent = percent;
        this.settings.glassBlur = percent < 30 ? "clear" : (percent > 70 ? "frost" : "standard");
        this.saveStorage("apple_cinema_settings", this.settings);
      }
    };

    range.oninput = (e) => {
      applyPercent(e.target.value, false);
    };

    range.onchange = (e) => {
      applyPercent(e.target.value, true);
    };
  },

  setGlassStep(percent) {
    this.settings.glassPercent = percent;
    this.settings.glassBlur = percent === 0 ? "clear" : (percent === 100 ? "frost" : "standard");
    this.saveStorage("apple_cinema_settings", this.settings);
    this.applyTheme();
    const range = document.getElementById("glassNativeRange");
    const label = document.getElementById("glassSliderValueLabel");
    if (range) {
      range.value = percent;
      range.style.setProperty("--range-fill", `${percent}%`);
    }
    if (label) {
      const text = percent === 0 ? "Trong Suốt" : (percent === 100 ? "Kính Mờ" : "Tiêu Chuẩn");
      label.textContent = `${text} (${percent}%)`;
    }
  },

  applyTheme() {
    const s = this.settings || {};
    const root = document.documentElement;
    root.setAttribute("data-theme", s.theme || "default");
    root.setAttribute("data-ambient", s.ambientGlow !== false ? "true" : "false");
    root.setAttribute("data-ps5-motion", s.ps5SpatialMotion !== false ? "true" : "false");
    if (document.body) {
      document.body.classList.toggle("ps5-spatial-ui", s.ps5SpatialMotion !== false);
    }

    let percent = 50;
    if (s.glassPercent !== undefined) percent = Number(s.glassPercent);
    else if (s.glassBlur === "clear") percent = 0;
    else if (s.glassBlur === "frost") percent = 100;

    this.applyGlassDynamics(percent);
  },

  setThemeMode(theme) {
    this.settings.theme = theme;
    this.saveStorage("apple_cinema_settings", this.settings);
    this.applyTheme();
    // Cập nhật ngay lập tức DOM không cần render lại toàn bộ (0ms delay)
    document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.themeBtn === theme);
    });
  },

  toggleAmbientGlow() {
    const current = this.settings.ambientGlow !== false;
    this.settings.ambientGlow = !current;
    this.saveStorage("apple_cinema_settings", this.settings);
    this.applyTheme();
    const btn = document.getElementById("ambientGlowToggleBtn");
    if (btn) {
      btn.classList.toggle("on", this.settings.ambientGlow);
      const span = btn.querySelector("span");
      if (span) span.textContent = this.settings.ambientGlow ? "Bật" : "Tắt";
    }
  },

  updateSetting(key, value) {
    this.settings[key] = value;
    this.saveStorage("apple_cinema_settings", this.settings);
    if (key === "theme" || key === "glassBlur" || key === "ambientGlow" || key === "ps5SpatialMotion") this.applyTheme();
    if (key === "defaultServer") this.currentServerMode = value;
    if (key === "defaultQuality") this.currentQuality = value;
    if (key === "defaultLightsOff") this.lightsOff = Boolean(value);
    if (key === "bilingualSubMode") {
      this.bilingualSubMode = value || "off";
      this.setBilingualSubtitleMode?.(this.bilingualSubMode, false);
    }
    if (this.currentNav === "cai-dat" || key === "ps5SpatialMotion") {
      this.renderMainView();
    }
    this.showToast("Đã lưu thay đổi cài đặt hệ thống");
  },

  resetDefaultSettings() {
    this.settings = {
      theme: "default",
      glassPercent: 50,
      glassBlur: "standard",
      ambientGlow: true,
      ps5SpatialMotion: true,
      defaultServer: "hls-1",
      defaultQuality: "native-max",
      autoPlayOnOpen: false,
      autoNextEpisode: true,
      defaultLightsOff: false,
      heroAutoRotate: true,
      bilingualSubMode: "off"
    };
    this.saveStorage("apple_cinema_settings", this.settings);
    this.currentServerMode = "hls-1";
    this.currentQuality = "native-max";
    this.bilingualSubMode = "off";
    this.setBilingualSubtitleMode?.("off", false);
    this.applyTheme();
    if (this.currentNav === "cai-dat") {
      this.renderMainView();
    }
    this.showToast("Đã khôi phục cài đặt mặc định");
  },

  clearWatchHistory() {
    this.watchHistory = [];
    this.saveStorage("apple_cinema_history", this.watchHistory);
    if (this.userProfile?.email) {
      this.syncToCloud(false);
    }
    this.updateSidebarCounts();
    this.renderMainView();
    this.showToast("Đã xóa toàn bộ lịch sử xem phim");
  },

  clearMyList() {
    this.myList = [];
    this.saveStorage("apple_cinema_mylist", this.myList);
    if (this.userProfile?.email) {
      this.syncToCloud(false);
    }
    this.updateSidebarCounts();
    this.renderMainView();
    this.showToast("Đã làm trống danh sách phim đã lưu");
  },

  renderMainView() {
    const container = document.getElementById("mainContentWrapper");
    if (!container) return;

    // Trang Cài Đặt Hệ Thống (Khi bấm icon bánh răng ở thanh bên trái)
    if (this.currentNav === "cai-dat") {
      container.innerHTML = this.renderSettingsViewHTML();
      this.initGlassSlider();
      return;
    }

    // Trang Lịch Chiếu Phim (Hoạt Hình 3D & Anime Showtimes)
    if (this.currentNav === "lich-chieu") {
      container.innerHTML = this.renderScheduleViewHTML();
      return;
    }

    // Trang Tìm Kiếm Riêng Biệt (Dedicated Search Page)
    if (this.currentNav === "tim-kiem") {
      container.innerHTML = this.renderDedicatedSearchViewHTML();
      return;
    }

    const isDefaultExplore =
      this.currentNav === "kham-pha" &&
      this.activeGenreFilter === "Tất cả" &&
      this.currentSegment === "all";

    if (isDefaultExplore) {
      const trending10 = this.dedupeMovieList(this.getRealtimeTrendingMovies(null, 10));
      const youMightLike = this.dedupeMovieList(trending10.slice(2, 10).length >= 8 ? trending10.slice(2, 10) : this.service.movies.slice(1, 12)).slice(0, 8);
      const singlesFeatured = this.dedupeMovieList(this.service.movies.filter((m) => m.type === "single")).slice(0, 8);
      const seriesFeatured = this.dedupeMovieList(this.service.movies.filter((m) => m.type === "series")).slice(0, 8);
      const animeFeatured = this.dedupeMovieList(this.getMoviesByTag("anime")).slice(0, 8);
      const netflixFeatured = this.dedupeMovieList(this.getMoviesByTag("netflix")).slice(0, 8);
      const koreanFeatured = this.dedupeMovieList(this.getMoviesByCountry("han-quoc")).slice(0, 8);
      const chineseFeatured = this.dedupeMovieList(this.getMoviesByCountry("trung-quoc")).slice(0, 8);
      const hollywoodFeatured = this.dedupeMovieList(this.countryCache.get("au-my") || this.countryCache.get("my") || []).slice(0, 8);

      const allExploreMovies = this.dedupeMovieList(this.service.movies);
      const currentExploreLimit = this.exploreGridLimit || 24;
      const exploreGridList = allExploreMovies.slice(0, currentExploreLimit);
      const remainingCount = Math.max(0, allExploreMovies.length - currentExploreLimit);

      container.innerHTML = `
        <div class="cinema-home-layout">
          <!-- FULL-WIDTH CINEMATIC HERO SHOWCASE -->
          ${this.renderHeroHTML()}

          ${this.renderContinueWatchingShelfHTML()}

          <!-- 1. BẠN ĐANG QUAN TÂM GÌ? (8 Phim Đề Xuất Hot) -->
          <section class="vision-shelf-section">
            <div class="vision-shelf-header">
              <h2 class="vision-shelf-title">Bạn đang quan tâm gì?</h2>
              <button class="vision-see-all-pill" onclick="app.setNavigation('moi-cap-nhat')">Xem Tất Cả</button>
            </div>
            <div class="vision-cards-grid-4" id="visionYouMightLikeGrid">
              ${youMightLike.map((m, idx) => this.renderVisionFeatureCardHTML(m, idx)).join("")}
            </div>
          </section>

          <!-- 2. PHIM CHIẾU RẠP & BOM TẤN MỚI NHẤT -->
          <section class="vision-shelf-section">
            <div class="vision-shelf-header">
              <h2 class="vision-shelf-title"><i class="fas fa-film" style="margin-right: 8px;"></i>Phim Chiếu Rạp & Bom Tấn Mới Nhất</h2>
              <button class="vision-see-all-pill" onclick="app.setNavigation('phim-le')">
                Xem Tất Cả (${this.service.movies.filter((m) => m.type === "single").length})
              </button>
            </div>
            <div class="vision-cards-grid-4">
              ${singlesFeatured.map((m, idx) => this.renderVisionFeatureCardHTML(m, idx)).join("")}
            </div>
          </section>

          <!-- 3. PHIM BỘ ĐANG HOT & CẬP NHẬT MỚI -->
          <section class="vision-shelf-section">
            <div class="vision-shelf-header">
              <h2 class="vision-shelf-title"><i class="fas fa-tv" style="margin-right: 8px;"></i>Phim Bộ Đang Hot & Cập Nhật Mới</h2>
              <button class="vision-see-all-pill" onclick="app.setNavigation('phim-bo')">
                Xem Tất Cả (${this.service.movies.filter((m) => m.type === "series").length})
              </button>
            </div>
            <div class="vision-cards-grid-4">
              ${seriesFeatured.map((m, idx) => this.renderVisionFeatureCardHTML(m, idx)).join("")}
            </div>
          </section>

          <!-- 4. ANIME TUYỂN CHỌN -->
          <section class="vision-shelf-section">
            <div class="vision-shelf-header">
              <h2 class="vision-shelf-title"><i class="anime-konoha-icon"></i>Anime Tuyển Chọn</h2>
              <button class="vision-see-all-pill" onclick="app.setNavigation('anime')">
                Xem Tất Cả (${this.getMoviesByTag("anime").length})
              </button>
            </div>
            <div class="vision-cards-grid-4">
              ${animeFeatured.map((m, idx) => this.renderVisionFeatureCardHTML(m, idx)).join("")}
            </div>
          </section>

          <!-- 5. PHIM ĐỘC QUYỀN NETFLIX -->
          <section class="vision-shelf-section">
            <div class="vision-shelf-header">
              <h2 class="vision-shelf-title"><i class="fas fa-play" style="margin-right: 8px;"></i>Phim Độc Quyền Netflix</h2>
              <button class="vision-see-all-pill" onclick="app.setNavigation('netflix')">
                Xem Tất Cả (${this.getMoviesByTag("netflix").length})
              </button>
            </div>
            <div class="vision-cards-grid-4">
              ${netflixFeatured.map((m, idx) => this.renderVisionFeatureCardHTML(m, idx)).join("")}
            </div>
          </section>

          <!-- 6. PHIM HÀN QUỐC THỊNH HÀNH -->
          <section class="vision-shelf-section">
            <div class="vision-shelf-header">
              <h2 class="vision-shelf-title">Phim Hàn Quốc Thịnh Hành</h2>
              <button class="vision-see-all-pill" onclick="app.setNavigation('han-quoc')">
                Xem Tất Cả (${this.getMoviesByCountry("han-quoc").length})
              </button>
            </div>
            <div class="vision-cards-grid-4">
              ${koreanFeatured.map((m, idx) => this.renderVisionFeatureCardHTML(m, idx)).join("")}
            </div>
          </section>

          <!-- 7. PHIM TRUNG QUỐC ĐẶC SẮC -->
          ${chineseFeatured.length > 0 ? `
            <section class="vision-shelf-section">
              <div class="vision-shelf-header">
                <h2 class="vision-shelf-title">Phim Trung Quốc Đặc Sắc</h2>
                <button class="vision-see-all-pill" onclick="app.setNavigation('trung-quoc')">
                  Xem Tất Cả (${this.getMoviesByCountry("trung-quoc").length})
                </button>
              </div>
              <div class="vision-cards-grid-4">
                ${chineseFeatured.map((m, idx) => this.renderVisionFeatureCardHTML(m, idx)).join("")}
              </div>
            </section>
          ` : ""}

          <!-- 8. PHIM ÂU MỸ / HOLLYWOOD -->
          ${hollywoodFeatured.length > 0 ? `
            <section class="vision-shelf-section">
              <div class="vision-shelf-header">
                <h2 class="vision-shelf-title">Phim Âu Mỹ & Bom Tấn Hollywood</h2>
                <button class="vision-see-all-pill" onclick="app.setNavigation('au-my')">
                  Xem Tất Cả (${(this.countryCache.get("au-my") || []).length})
                </button>
              </div>
              <div class="vision-cards-grid-4">
                ${hollywoodFeatured.map((m, idx) => this.renderVisionFeatureCardHTML(m, idx)).join("")}
              </div>
            </section>
          ` : ""}

          <!-- 9. TOÀN BỘ KHO PHIM KHÁM PHÁ (VỚI NÚT XEM THÊM PHIM) -->
          <section class="vision-shelf-section explore-all-catalog-section">
            <div class="vision-shelf-header">
              <h2 class="vision-shelf-title" id="exploreAllMoviesCountTitle">
                <i class="fas fa-compass" style="margin-right: 8px;"></i>Khám Phá Toàn Bộ Kho Phim (${allExploreMovies.length}+ Phim)
              </h2>
            </div>
            ${this.getActiveFiltersCount() > 0 ? this.renderActiveFilterChipsHTML() : ""}
            <div class="vision-cards-grid-4" id="exploreAllMoviesGrid">
              ${exploreGridList.map((m, idx) => this.renderVisionFeatureCardHTML(m, idx)).join("")}
            </div>
            <div class="explore-load-more-wrap">
              ${remainingCount > 0 ? `
                <button class="explore-load-more-btn" onclick="app.loadMoreExplore(24)">
                  Xem Thêm Phim
                </button>
              ` : `
                <div class="explore-all-loaded-text">Đã hiển thị tất cả phim</div>
              `}
            </div>
          </section>
        </div>
      `;
      this.attachHeroSwipeHandlers();
      return;
    }

    // Chế độ danh mục (Đã Lưu, Lịch Sử, Anime, Movies, TV Series, Netflix, Vietsub...)
    // GIỮ NGUYÊN 100% SHAPE 2 CỘT VISION OS NHƯNG THAY ĐỔI RÕ RÀNG NỘI DUNG TỪNG TRANG
    const { title, subtitle, list } = this.getFilteredCatalog();
    const visibleList = list.slice(0, this.visibleGridLimit);
    const isPersonalPage = this.currentNav === "yeu-thich" || this.currentNav === "lich-su";

    container.innerHTML = `
      <div class="cinema-category-layout">
        <!-- Category Header Banner / Hero -->
        ${
          isPersonalPage
            ? `<section class="vision-settings-banner">
                 <div class="vision-settings-banner-left">
                   <h1 class="vision-hero-title">${title} (${list.length} phim)</h1>
                 </div>
                 <div class="vision-settings-banner-actions">
                   ${
                     this.currentNav === "yeu-thich" && list.length > 0
                       ? `<button class="vision-btn-outline" onclick="app.clearMyList()"><i class="fas fa-trash-can"></i> Xóa Danh Sách</button>`
                       : this.currentNav === "lich-su" && list.length > 0
                       ? `<button class="vision-btn-outline" onclick="app.clearWatchHistory()"><i class="fas fa-trash-can"></i> Xóa Lịch Sử</button>`
                       : ""
                   }
                   <button class="vision-btn-watch" onclick="app.resetAllFilters()">
                     <i class="fas fa-house"></i> Về Khám Phá
                   </button>
                 </div>
               </section>`
            : this.currentNav === "search-results"
            ? `<section class="vision-settings-banner">
                 <div class="vision-settings-banner-left">
                   <h1 class="vision-hero-title">Kết quả tìm kiếm: "${(this.lastSearchQuery || "").replace(/"/g, '&quot;')}"</h1>
                   <p style="color: rgba(255,255,255,0.65); font-size: 0.88rem; margin-top: 4px;">Tìm thấy ${list.length} tác phẩm trong kho phim</p>
                 </div>
                 <div class="vision-settings-banner-actions">
                   <button class="vision-btn-watch" onclick="app.clearSearch(); app.resetAllFilters();">
                     <i class="fas fa-house"></i> Về Khám Phá
                   </button>
                 </div>
               </section>`
            : this.renderHeroHTML()
        }

        <section class="vision-shelf-section">
          ${
            !isPersonalPage && this.currentNav !== "search-results"
              ? `<div class="vision-shelf-header">
                   <h2 class="vision-shelf-title">${title}</h2>
                 </div>`
              : ""
          }
          ${this.getActiveFiltersCount() > 0 ? this.renderActiveFilterChipsHTML() : ""}
          ${
            visibleList.length > 0
              ? `<div class="vision-cards-grid-4">${visibleList.map((m, idx) => this.renderVisionFeatureCardHTML(m, idx)).join("")}</div>
                   ${this.renderLoadMoreButtonsHTML(list.length)}`
              : this.currentNav === "search-results"
              ? this.renderMovieRequestCardHTML(this.lastSearchQuery || "", false)
              : `<div style="padding: 60px 20px; text-align: center; background: rgba(255,255,255,0.04); border-radius: 26px; border: 1px solid rgba(255,255,255,0.12);">
                  <i class="fas fa-film" style="font-size: 2.5rem; color: #ffffff; margin-bottom: 14px;"></i>
                  <h3 style="margin-bottom: 18px; font-weight: 600;">Chưa có phim trong mục này</h3>
                  <button class="vision-btn-watch" onclick="app.resetAllFilters()">Khám Phá Kho Phim</button>
                </div>`
          }
          ${
            this.currentNav === "search-results" && visibleList.length > 0
              ? this.renderMovieRequestCardHTML(this.lastSearchQuery || "", true)
              : ""
          }
        </section>
      </div>
    `;
    this.attachHeroSwipeHandlers();
  },

  renderMovieRequestCardHTML(query = "", hasResults = false) {
    const qStr = (query || "").trim();
    const titleHTML = hasResults
      ? `Chưa có phần phim <span>"${qStr.replace(/"/g, "&quot;")}"</span> bạn tìm?`
      : `Không tìm thấy <span>"${qStr.replace(/"/g, "&quot;")}"</span>?`;
    const subText = hasResults
      ? `Nhập tên phần phim hoặc bản phim cụ thể. Hệ thống sẽ tự động quét đa nguồn, nạp phim và gửi email/thông báo cho bạn ngay.`
      : `Hệ thống AI sẽ tự động dò tìm nguồn phát chất lượng cao, nạp phim vào rạp và gửi email/thông báo cho bạn ngay.`;

    const savedEmail =
      this.userProfile?.email ||
      (this.userProfile?.handle && this.userProfile.handle.includes("@") && !this.userProfile.handle.includes("guest") ? this.userProfile.handle : "") ||
      (() => {
        try {
          return localStorage.getItem("ngwyren_user_email") || "";
        } catch (_) {
          return "";
        }
      })();

    return `
      <div class="movie-request-box vision-request-panel">
        <h3 class="req-panel-title">
          ${titleHTML}
        </h3>
        <p class="req-panel-subtitle">
          ${subText}
        </p>

        <form id="movieRequestForm" class="req-panel-form" onsubmit="event.preventDefault(); app.submitMovieRequest();">
          <!-- Main Action Bar (Unified Capsule) -->
          <div class="req-main-input-bar">
            <i class="fas fa-film req-main-input-icon"></i>
            <input type="text" id="reqMovieTitleInput" class="req-main-input" value="${qStr.replace(/"/g, '&quot;')}" placeholder="Tên phim hoặc phần cụ thể cần nạp..." required autocomplete="off" />
            <input type="file" id="reqMovieImageFileInput" accept="image/*" style="display: none;" onchange="app.handleMovieRequestImageSelect(this)" />
            <button type="button" id="reqMovieImageBtn" class="req-action-icon-btn" onclick="document.getElementById('reqMovieImageFileInput').click()" title="Đính kèm ảnh poster hoặc screenshot">
              <i class="fas fa-camera"></i>
            </button>
            <button type="submit" id="reqMovieSubmitBtn" class="req-submit-btn">
              <i class="fas fa-bolt"></i> Nạp Phim
            </button>
          </div>

          <!-- Secondary Grid: Email & Ghi Chú -->
          <div class="req-secondary-grid">
            <div class="req-input-pill">
              <i class="far fa-envelope"></i>
              <input type="email" id="reqMovieEmailInput" value="${(savedEmail || "").replace(/"/g, '&quot;')}" placeholder="Email nhận thông báo..." />
            </div>
            <div class="req-input-pill">
              <i class="far fa-note-sticky"></i>
              <input type="text" id="reqMovieNoteInput" placeholder="Ghi chú thêm (bản đẹp, tập...)" />
            </div>
          </div>

          <!-- Quick Suggestion Chips -->
          <div class="req-quick-chips">
            <span class="req-chips-label"><i class="fas fa-tags" style="font-size: 0.68rem;"></i> Gợi ý:</span>
            <button type="button" class="req-chip-btn" onclick="app.appendReqNote('Thuyết Minh')">+ Thuyết Minh</button>
            <button type="button" class="req-chip-btn" onclick="app.appendReqNote('Vietsub Full HD')">+ Vietsub Full HD</button>
            <button type="button" class="req-chip-btn" onclick="app.appendReqNote('Phần tiếp theo')">+ Phần tiếp theo</button>
            <button type="button" class="req-chip-btn" onclick="app.appendReqNote('Trọn bộ')">+ Trọn bộ</button>
          </div>

          <!-- Image Preview Pill -->
          <div id="reqMovieImagePreviewWrap" class="req-image-preview-wrap">
            <div class="req-image-attached-pill">
              <img id="reqMovieImagePreview" src="" alt="Thumbnail" />
              <span id="reqMovieImageFileName" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;"></span>
              <button type="button" class="req-image-remove-btn" onclick="app.removeReqImage()" title="Gỡ ảnh">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <!-- Status Message Banner -->
          <div id="reqMovieStatus" class="req-status-banner"></div>
        </form>
      </div>
    `;
  },

  appendReqNote(tag) {
    const input = document.getElementById("reqMovieNoteInput");
    if (!input) return;
    const current = (input.value || "").trim();
    if (!current) {
      input.value = tag;
    } else if (!current.includes(tag)) {
      input.value = `${current}, ${tag}`;
    }
    input.focus();
  },

  removeReqImage() {
    this._tempReqImageBase64 = null;
    const fileInput = document.getElementById("reqMovieImageFileInput");
    if (fileInput) fileInput.value = "";
    const previewWrap = document.getElementById("reqMovieImagePreviewWrap");
    if (previewWrap) previewWrap.style.display = "none";
    const imageBtn = document.getElementById("reqMovieImageBtn");
    if (imageBtn) imageBtn.classList.remove("has-image");
  },

  renderLoadMoreButtonsHTML(totalCount) {
    if (this.visibleGridLimit >= totalCount) return "";
    return `
      <div class="explore-load-more-wrap">
        <button class="explore-load-more-btn" onclick="app.loadMoreMovies(24)">
          Xem Thêm Phim
        </button>
      </div>
    `;
  },

  loadMoreMovies(step = 24) {
    const prevLimit = this.visibleGridLimit || 24;
    this.visibleGridLimit = prevLimit + step;
    const { list } = this.getFilteredCatalog();
    const grid = document.querySelector(".cinema-category-layout .vision-cards-grid-4, .cinema-category-layout .vision-catalog-grid");
    const loadMoreWrap = document.querySelector(".explore-load-more-wrap");
    if (grid) {
      const nextBatch = list.slice(prevLimit, this.visibleGridLimit);
      if (nextBatch.length > 0) {
        const frag = document.createRange().createContextualFragment(
          nextBatch.map((m, idx) => this.renderVisionFeatureCardHTML(m, prevLimit + idx)).join("")
        );
        grid.appendChild(frag);
      }
      if (this.visibleGridLimit >= list.length && loadMoreWrap) {
        loadMoreWrap.innerHTML = `<div class="explore-all-loaded-text">Đã hiển thị tất cả phim</div>`;
      }
      return;
    }
    this.renderMainView();
  },

  loadAllCategoryMovies(totalCount) {
    this.visibleGridLimit = totalCount || 99999;
    this.renderMainView();
    this.showToast(`Đã tải và hiển thị toàn bộ ${totalCount || ""} phim!`, "success");
  },

  loadMoreExplore(step = 24) {
    const prevLimit = this.exploreGridLimit || 24;
    this.exploreGridLimit = prevLimit + step;
    const grid = document.getElementById("exploreAllMoviesGrid");
    const loadMoreWrap = document.querySelector(".explore-load-more-wrap");
    const allMovies = this.service.movies;
    if (grid) {
      const nextBatch = allMovies.slice(prevLimit, this.exploreGridLimit);
      if (nextBatch.length > 0) {
        const frag = document.createRange().createContextualFragment(
          nextBatch.map((m, idx) => this.renderVisionFeatureCardHTML(m, prevLimit + idx)).join("")
        );
        grid.appendChild(frag);
      }
    }
    const remaining = Math.max(0, allMovies.length - this.exploreGridLimit);
    if (remaining <= 0) {
      if (loadMoreWrap) {
        loadMoreWrap.innerHTML = `
          <div class="explore-all-loaded-text">Đã hiển thị tất cả phim</div>
        `;
      }
    }
  },

  loadAllExplore() {
    const allMovies = this.service.movies;
    this.exploreGridLimit = allMovies.length;
    const grid = document.getElementById("exploreAllMoviesGrid");
    const loadMoreWrap = document.querySelector(".explore-load-more-wrap");
    if (grid) {
      grid.innerHTML = allMovies
        .map((m, idx) => this.renderVisionFeatureCardHTML(m, idx))
        .join("");
    }
    if (loadMoreWrap) {
      loadMoreWrap.innerHTML = `
        <div style="padding: 16px; color: rgba(255, 255, 255, 0.85); font-size: 0.95rem; font-weight: 600; text-align: center; width: 100%;">
          🎉 Đã hiển thị toàn bộ ${allMovies.length} phim trong kho Ngwyren Cinema!
        </div>
        <button class="vision-btn-outline" onclick="window.scrollTo({ top: 0, behavior: 'smooth' })">
          <i class="fas fa-arrow-up"></i> Lên Đầu Trang
        </button>
      `;
    }
    this.showToast(`Đã tải và hiển thị toàn bộ ${allMovies.length} phim trong kho!`, "success");
  },

  updateExploreCountsAndGrid() {
    if (this.currentNav !== "kham-pha") return;
    const titleEl = document.getElementById("exploreAllMoviesCountTitle");
    const allMovies = this.service.movies;
    if (titleEl) {
      titleEl.innerHTML = `<i class="fas fa-compass" style="margin-right: 8px;"></i>Khám Phá Toàn Bộ Kho Phim (${allMovies.length}+ Phim)`;
    }
    const grid = document.getElementById("exploreAllMoviesGrid");
    if (grid) {
      grid.innerHTML = allMovies
        .slice(0, this.exploreGridLimit || 24)
        .map((m, idx) => this.renderVisionFeatureCardHTML(m, idx))
        .join("");
    }
    const countLabel = document.getElementById("exploreRemainingCount");
    if (countLabel) {
      const remaining = Math.max(0, allMovies.length - (this.exploreGridLimit || 24));
      countLabel.textContent = `${remaining} phim còn lại`;
    }
    const contShelf = document.getElementById("continueWatchingShelf");
    if (contShelf) {
      contShelf.outerHTML = this.renderContinueWatchingShelfHTML();
    }
  },

  getFilteredCatalog() {
    let base = [...this.service.movies];
    let title = "Khám Phá Kho Phim";
    let subtitle = "Kho phim chất lượng cao Ngwyren Cinema";

    switch (this.currentNav) {
      case "ai":
        base = base.filter((m) =>
          (m.sectionTags && m.sectionTags.includes("ai")) ||
          ((m.genres && m.genres.some(g => (g || "").toLowerCase().includes("viễn tưởng") || (g || "").toLowerCase().includes("khoa học"))) &&
          (
            (m.title && /ai|robot|người máy|cyborg|trí tuệ nhân tạo|ma trận|creator/i.test(m.title)) ||
            (m.originTitle && /ai|robot|cyborg|terminator|matrix|creator|artificial|blade runner|m3gan|upgrade/i.test(m.originTitle)) ||
            (m.synopsis && /trí tuệ nhân tạo|trí thông minh nhân tạo|robot|người máy|cyborg|hệ thống ai/i.test(m.synopsis))
          ))
        );
        title = "Vũ Trụ Phim Trí Tuệ Nhân Tạo & Robot (AI)";
        subtitle = "Những kiệt tác điện ảnh đỉnh cao về AI, người máy và tương lai công nghệ loài người";
        break;
      case "netflix":
        base = this.getMoviesByTag("netflix");
        title = "Phim Độc Quyền Netflix";
        subtitle = "Kho phim Netflix Originals bản FHD Vietsub & Lồng Tiếng";
        break;
      case "vietsub":
        base = base.filter((m) => (m.language || "").toLowerCase().includes("vietsub") || (m.sectionTags && m.sectionTags.includes("vietsub")));
        title = "Kho Phim Vietsub Chất Lượng Cao";
        subtitle = "Tổng hợp đa nguồn phát Vietsub FHD mượt mà";
        break;
      case "moi-cap-nhat":
        title = "Tất Cả Phim Mới Cập Nhật";
        subtitle = "Toàn bộ danh sách phim mới nhất trên hệ thống";
        break;
      case "phim-bo":
        base = base.filter((m) => m.type === "series");
        title = "Phim Bộ Dài Tập";
        subtitle = "Trọn bộ Vietsub & Thuyết minh chất lượng cao";
        break;
      case "phim-le":
        base = base.filter((m) => m.type === "single");
        title = "Phim Lẻ Chiếu Rạp";
        subtitle = "Bom tấn điện ảnh Full HD";
        break;
      case "chieu-rap":
        base = base.filter((m) => (m.sectionTags && m.sectionTags.includes("chieu-rap")) || (m.genres && m.genres.some(g => (g || "").toLowerCase().includes("chiếu rạp"))));
        title = "Phim Chiếu Rạp Bom Tấn";
        subtitle = "Các siêu phẩm điện ảnh Việt Nam & quốc tế từng gây sốt phòng vé";
        break;
      case "filter-results":
        base = this.applyMovieFilters(this.service.movies);
        title = `Kết Quả Lọc Phim (${base.length} Phim)`;
        subtitle = "Danh sách phim được tinh lọc theo các tiêu chí chuyên sâu của bạn";
        break;
      case "anime":
        base = this.getMoviesByTag("anime");
        title = "Anime";
        subtitle = "Tuyển tập Anime Nhật Bản & Hoạt hình đặc sắc";
        break;
      case "viet-nam":
        base = this.getMoviesByCountry("viet-nam");
        title = "Điện Ảnh Việt Nam";
        subtitle = "Phim chiếu rạp & truyền hình Việt Nam";
        break;
      case "han-quoc":
        base = this.getMoviesByCountry("han-quoc");
        title = "Phim Hàn Quốc Tuyển Chọn";
        subtitle = "K-Drama ăn khách nhất hiện nay";
        break;
      case "trung-quoc":
        base = this.getMoviesByCountry("trung-quoc");
        title = "Phim Trung Quốc Đặc Sắc";
        subtitle = "Cổ trang, kiếm hiệp, trinh thám & ngôn tình";
        break;
      case "au-my":
        base = this.getMoviesByCountry("au-my");
        title = "Phim Âu Mỹ & Hollywood";
        subtitle = "Hành động, viễn tưởng & giật gân";
        break;
      case "yeu-thich": {
        const seenFav = new Set();
        base = [];
        for (const idOrSlug of this.myList) {
          const m = this.findMovie(idOrSlug);
          if (m && !seenFav.has(m.slug)) {
            seenFav.add(m.slug);
            base.push(m);
          }
        }
        title = "Danh Sách Đã Lưu";
        subtitle = "Những bộ phim bạn đã lưu để thưởng thức";
        break;
      }
      case "lich-su": {
        const seenHist = new Set();
        base = [];
        for (const h of this.watchHistory) {
          const m = this.findMovie(h?.slug);
          if (m && !seenHist.has(m.slug)) {
            seenHist.add(m.slug);
            base.push(m);
          }
        }
        title = "Lịch Sử Xem Tiếp";
        subtitle = "Tiếp tục thưởng thức từ tập phim đang xem dở";
        break;
      }
      case "person-filter":
        base = base.filter(
          (m) =>
            m.cast.includes(this.customFilterValue) ||
            m.director === this.customFilterValue
        );
        title = `Phim của ${this.customFilterValue}`;
        subtitle = "Tác phẩm liên quan đến diễn viên / đạo diễn này";
        break;
      case "search-results":
        base = this.lastSearchResults || [];
        title = `Kết quả tìm kiếm: "${this.lastSearchQuery || ""}"`;
        subtitle = "Tìm kiếm trên toàn bộ kho phim Ngwyren Cinema";
        break;
    }

    // Lọc theo Segmented Control (Tất cả / Phim Bộ / Phim Lẻ)
    if (this.currentSegment === "series") {
      base = base.filter((m) => m.type === "series");
    } else if (this.currentSegment === "single") {
      base = base.filter((m) => m.type === "single");
    }

    // Lọc theo thể loại (Genre chip)
    if (this.activeGenreFilter && this.activeGenreFilter !== "Tất cả") {
      base = base.filter((m) =>
        m.genres.some((g) => g.toLowerCase() === this.activeGenreFilter.toLowerCase())
      );
      title = `Thể loại: ${this.activeGenreFilter}`;
    }

    // Tinh lọc chuyên sâu nếu có bộ lọc bổ sung
    if (this.currentNav !== "filter-results" && this.getActiveFiltersCount() > 0) {
      base = this.applyMovieFilters(base);
      title = `${title} (Đã Lọc: ${base.length} Phim)`;
    }

    return { title, subtitle, list: this.dedupeMovieList(base) };
  },

  resetAllFilters() {
    this.currentSegment = "all";
    this.activeGenreFilter = "Tất cả";
    this.filters = { type: "all", genre: "all", country: "all", year: "all", sort: "latest" };
    this.visibleGridLimit = 24;
    this.exploreGridLimit = 24;
    this.customFilterTitle = null;
    this.customFilterValue = null;
    this.closeFilterPanel();
    this.updateFilterButtonBadge();
    document.querySelectorAll(".segment-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.segment === "all");
    });
    this.setNavigation("kham-pha", null, true);
  },

  getMovieLatestSaveSlot(movie) {
    if (!movie) return null;
    const histItem = (this.watchHistory || []).find((h) => h && h.slug === movie.slug);
    const epIndex = histItem ? Number(histItem.epIndex) || 0 : 0;
    const prog = this.getPlaybackProgress ? this.getPlaybackProgress(movie.slug, epIndex) : null;
    const percent = prog?.percentage || histItem?.progress || 0;
    const currentTime = prog?.currentTime || histItem?.currentTime || 0;
    if (percent <= 0 && !histItem) return null;

    const isGenuineSeries = Boolean(Array.isArray(movie.episodes) && movie.episodes.length > 1);
    const epObj = movie.episodes?.[epIndex];
    const epLabel = isGenuineSeries ? this.formatEpisodeLabel(epObj?.name, `Tập ${epIndex + 1}`) : "";
    const timeStr = currentTime > 5 ? this.formatSeconds(currentTime) : "Đang xem";
    return {
      epIndex,
      epLabel,
      percent: Math.max(5, Math.min(99, Math.round(percent || 15))),
      currentTime,
      timeStr
    };
  },

  renderPs5HeroSavesHTML(movie) {
    if (!movie || this.settings?.ps5SpatialMotion === false) return "";
    const saveSlot = this.getMovieLatestSaveSlot(movie);
    if (!saveSlot) return "";

    return `
      <div class="ps5-hero-saves-strip">
        <button class="ps5-save-slot-pill is-saved" onclick="event.stopPropagation(); app.openMovieModal('${movie.slug}', true, ${saveSlot.epIndex})" title="Tiếp tục xem phim">
          <span class="ps5-save-slot-icon"><i class="fas fa-play" style="font-size: 0.72rem; margin-left: 2px;"></i></span>
          <span class="ps5-save-slot-body">
            <span class="ps5-save-slot-title">Tiếp tục${saveSlot.epLabel ? ` • ${saveSlot.epLabel}` : ""}</span>
            <span class="ps5-save-slot-sub">${saveSlot.timeStr} (${saveSlot.percent}%)</span>
          </span>
          <span class="ps5-save-slot-bar"><span style="width: ${saveSlot.percent}%;"></span></span>
        </button>
      </div>
    `;
  },

  handleCardPointerEnter(slug, cardEl = null, epIndex = 0) {
    this.warmUpMovieStream(slug, epIndex);
    // Đã tắt previewMovieOnHero khi rê chuột để triệt tiêu hoàn toàn giật lag 120fps
    return;
  },

  handleCardPointerLeave(cardEl = null) {
    if (this._ps5HeroPreviewTimer) {
      clearTimeout(this._ps5HeroPreviewTimer);
      this._ps5HeroPreviewTimer = null;
    }
    if (cardEl) {
      cardEl.classList.remove("is-hero-previewing");
    }
  },

  previewMovieOnHero(slug, cardEl = null) {
    // Đã vô hiệu hóa để giải phóng GPU và DOM reflow
    return;
  },

  getActiveHeroMovies() {
    this.ensureFullCatalogLoaded();
    const nav = this.currentNav || "kham-pha";

    // Sử dụng lại track trong phiên hiển thị hiện tại để trượt slide & auto-rotate mượt mà
    if (this._heroTracks && this._heroTracks[nav] && this._heroTracks[nav].length > 0) {
      return this._heroTracks[nav];
    }

    const isWidescreenHd = (m) => {
      if (!m || !m.backdrop || !m.poster) return false;
      const b = m.backdrop;
      if (b === m.poster) return false;
      if (b.includes("animevsub") || b.includes("animevietsub")) return false;
      if (b.includes("data/poster") || b.includes("-poster.") || b.includes("/poster/")) return false;
      if (b.endsWith("-poster.webp") || b.endsWith("-poster.jpg")) return false;
      if (b.includes("nguonc.com")) return false;
      return true;
    };

    let candidateSlugs = [];
    let fallbackCategoryMovies = [];

    if (nav === "anime") {
      candidateSlugs = [
        "thanh-guom-diet-quy-vo-han-thanh",
        "chainsaw-man-the-movie-chuong-reze",
        "chu-thuat-hoi-chien-hoai-ngoc-ngoc-chiet-the-movie",
        "tham-tu-lung-danh-conan-ngoi-sao-5-canh-1-trieu-do",
        "naruto-shippuden",
        "one-piece-film-red",
        "chu-thuat-hoi-chien-phan-2",
        "doraemon-nobita-va-cuoc-phieu-luu-vao-the-gioi-trong-tranh",
        "thanh-guom-diet-quy-phan-4-lang-tho-ren"
      ];
      fallbackCategoryMovies = this.service.movies.filter(
        (m) =>
          ((m.sectionTags && m.sectionTags.includes("anime")) ||
            (m.genres && m.genres.some((g) => /anime|hoạt hình/i.test(g))) ||
            m.countrySlug === "nhat-ban") &&
          isWidescreenHd(m)
      );
    } else if (nav === "phim-le") {
      candidateSlugs = [
        "nhiem-vu-bat-kha-thi-nghiep-bao-phan-2-1",
        "dia-dao-mat-troi-trong-bong-toi",
        "mai",
        "tham-tu-kien-ky-an-khong-dau",
        "nha-gia-tien",
        "cu-roi-tu-than-2-diem-chet",
        "matchbox-phim-dien-anh",
        "dich-nhan-kiet-lang-nhan-kiep",
        "ke-kien-tao",
        "oppenheimer"
      ];
      fallbackCategoryMovies = this.service.movies.filter((m) => m.type === "single" && isWidescreenHd(m));
    } else if (nav === "phim-bo") {
      candidateSlugs = [
        "tai-xe-an-danh-phan-3",
        "cau-be-mat-tich-phan-5",
        "tro-choi-con-muc-phan-3",
        "thu-tu-phan-2",
        "good-boy-18",
        "the-gioi-khong-loi-thoat-phan-3",
        "kho-do-danh",
        "khom-lung",
        "100-ngay-lua-doi"
      ];
      fallbackCategoryMovies = this.service.movies.filter((m) => m.type === "series" && isWidescreenHd(m));
    } else if (nav === "netflix") {
      candidateSlugs = [
        "tro-choi-con-muc-phan-3",
        "cau-be-mat-tich-phan-5",
        "thu-tu-phan-2",
        "the-gioi-khong-loi-thoat-phan-3",
        "one-piece-nu-hung",
        "bang-chuot-cau-chuyen-tho-san-quai-vat",
        "tho-san-quai-vat-phan-4"
      ];
      fallbackCategoryMovies = this.service.movies.filter(
        (m) => m.sectionTags && m.sectionTags.includes("netflix") && isWidescreenHd(m)
      );
    } else if (nav === "viet-nam") {
      fallbackCategoryMovies = this.getMoviesByCountry("viet-nam").filter(isWidescreenHd);
    } else if (nav === "han-quoc") {
      fallbackCategoryMovies = this.getMoviesByCountry("han-quoc").filter(isWidescreenHd);
    } else if (nav === "trung-quoc") {
      fallbackCategoryMovies = this.getMoviesByCountry("trung-quoc").filter(isWidescreenHd);
    } else if (nav === "au-my") {
      fallbackCategoryMovies = this.getMoviesByCountry("au-my").filter(isWidescreenHd);
    } else {
      // Default: Khám Phá (Home) - Tập hợp 24 bom tấn đỉnh cao đa thể loại
      candidateSlugs = [
        "thanh-guom-diet-quy-vo-han-thanh",
        "nhiem-vu-bat-kha-thi-nghiep-bao-phan-2-1",
        "mai",
        "dia-dao-mat-troi-trong-bong-toi",
        "tai-xe-an-danh-phan-3",
        "chainsaw-man-the-movie-chuong-reze",
        "cau-be-mat-tich-phan-5",
        "tham-tu-lung-danh-conan-ngoi-sao-5-canh-1-trieu-do",
        "tro-choi-con-muc-phan-3",
        "chu-thuat-hoi-chien-hoai-ngoc-ngoc-chiet-the-movie",
        "one-piece-film-red",
        "tham-tu-kien-ky-an-khong-dau",
        "nha-gia-tien",
        "cu-roi-tu-than-2-diem-chet",
        "matchbox-phim-dien-anh",
        "thu-tu-phan-2",
        "good-boy-18",
        "the-gioi-khong-loi-thoat-phan-3",
        "kho-do-danh",
        "khom-lung",
        "doraemon-nobita-va-cuoc-phieu-luu-vao-the-gioi-trong-tranh",
        "100-ngay-lua-doi",
        "dich-nhan-kiet-lang-nhan-kiep",
        "ke-kien-tao"
      ];
      fallbackCategoryMovies = this.service.movies.filter((m) => isWidescreenHd(m) && (m.rating >= 8.5 || m.year >= 2024));
    }

    const curated = candidateSlugs.map((s) => this.findMovie(s)).filter((m) => m && isWidescreenHd(m));
    const allCandidates = curated.length >= 8 ? curated : Array.from(new Set([...curated, ...fallbackCategoryMovies]));

    if (!allCandidates || allCandidates.length === 0) {
      return (this.heroMovies && this.heroMovies.length > 0 ? this.heroMovies : this.service.movies).slice(0, 8);
    }

    // CHỌN 1 PHIM KHÁC BIỆT HOÀN TOÀN KHÔNG TRÙNG LẶP VỚI CÁC LẦN LOAD TRƯỚC
    const storageKey = `ngwyren_hero_history_${nav}`;
    const chosenHero = this.pickNonRepeatingHeroMovie(allCandidates, storageKey) || allCandidates[0];

    // Xây dựng dải 8 phim cho Hero: Đặt phim được chọn lên đầu (Index 0)
    const otherCandidates = allCandidates.filter((m) => m && m.slug !== chosenHero.slug);
    for (let i = otherCandidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [otherCandidates[i], otherCandidates[j]] = [otherCandidates[j], otherCandidates[i]];
    }

    const heroTrack = [chosenHero, ...otherCandidates.slice(0, 7)];
    if (!this._heroTracks) this._heroTracks = {};
    this._heroTracks[nav] = heroTrack;
    this.heroIndex = 0;

    // Preload ngay ảnh nền của phim Hero được chọn ở độ ưu tiên cao nhất
    const heroBackdrop = this.getMovieBackdrop(chosenHero);
    if (heroBackdrop && typeof document !== "undefined") {
      let link = document.getElementById("heroPreloadLink");
      if (!link) {
        link = document.createElement("link");
        link.id = "heroPreloadLink";
        link.rel = "preload";
        link.as = "image";
        document.head.appendChild(link);
      }
      link.href = heroBackdrop;
      link.setAttribute("fetchpriority", "high");
    }

    return heroTrack;
  },

  attachHeroSwipeHandlers() {
    const heroEl = document.getElementById("heroShowcase");
    if (!heroEl || heroEl._hasSwipeListener) return;
    heroEl._hasSwipeListener = true;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    heroEl.addEventListener(
      "touchstart",
      (e) => {
        if (!e.touches || e.touches.length === 0) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        this.pauseHeroAutoRotate();
      },
      { passive: true }
    );

    heroEl.addEventListener(
      "touchend",
      (e) => {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        const elapsed = Date.now() - touchStartTime;

        // Chỉ phản hồi cử chỉ vuốt ngang rõ rệt trên iPhone / iPad
        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && elapsed < 800) {
          const heroList = this.getActiveHeroMovies();
          if (heroList.length <= 1) return;
          if (deltaX < 0) {
            this.setHeroSlide((this.heroIndex + 1) % heroList.length);
          } else {
            this.setHeroSlide((this.heroIndex - 1 + heroList.length) % heroList.length);
          }
        } else {
          this.resumeHeroAutoRotate();
        }
      },
      { passive: true }
    );
  },

  renderHeroHTML(customMovie = null, customKicker = "Thịnh Hành") {
    const heroList = this.getActiveHeroMovies();
    const movie = customMovie || heroList[this.heroIndex % heroList.length] || heroList[0] || this.service.movies[0];
    if (!movie) return "";
    const inMyList = this.isInMyList(movie);
    const cleanSynopsis = (movie.synopsis || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const matchScore = movie.matchScore || (95 + ((movie.title || "").length % 5));
    const imdbScore = movie.rating ? Number(movie.rating).toFixed(1) : ((matchScore / 10).toFixed(1));
    const saveSlot = this.getMovieLatestSaveSlot(movie);
    const primaryPlayEp = saveSlot ? saveSlot.epIndex : 0;
    const primaryPlayLabel = saveSlot ? `Tiếp Tục ${saveSlot.epLabel}` : "Xem Ngay";
    const statusText = movie.type === "series" ? (movie.episodeCurrent || "Phim Bộ") : (movie.duration || "Full");

    // Danh sách thumbnail phim cho dải trượt góc dưới bên phải - LẤY 100% TỪ DANH MỤC HIỆN TẠI (ĐÚNG PHIM - ĐÚNG CHỖ)
    const thumbMovies = heroList.slice(0, 8);
    const mainBackdrop = this.getMovieBackdrop(movie) || this.getMoviePoster(movie);
    const mainPosterFallback = this.getMoviePoster(movie) || mainBackdrop;

    return `
      <section class="vision-hero-banner cinema-showcase-hero ps5-hero-morph-anim" id="heroShowcase" data-hero-slug="${movie.slug}" onmouseenter="app.pauseHeroAutoRotate()" onmouseleave="app.resumeHeroAutoRotate()">
        <img class="vision-hero-bg" src="${mainBackdrop}" alt="${movie.title}" fetchpriority="high" decoding="async"
             onerror="this.onerror=null;this.src='${mainPosterFallback}';" />
        <div class="vision-hero-overlay"></div>

        <div class="cinema-hero-content">
          <div class="cinema-hero-info">
            <h1 class="cinema-hero-title">${movie.title}</h1>
            ${movie.originTitle && movie.originTitle.toLowerCase() !== (movie.title || "").toLowerCase() ? `<div class="cinema-hero-sub">${movie.originTitle}</div>` : ""}

            <div class="cinema-meta-badges">
              <span class="cinema-badge badge-imdb"><i class="fab fa-imdb"></i> ${imdbScore}</span>
              ${(movie.quality === "4K" || movie.has4k) ? `<span class="cinema-badge badge-res badge-4k">4K</span>` : ""}
              <span class="cinema-badge badge-year">${movie.year || 2026}</span>
              <span class="cinema-badge badge-status">${statusText}</span>
            </div>

            ${Array.isArray(movie.genres) && movie.genres.length > 0 ? `<div class="cinema-genre-pills">${movie.genres.slice(0, 2).map((g) => `<span class="cinema-genre-pill">${g}</span>`).join("")}</div>` : ""}

            ${this.renderPs5HeroSavesHTML(movie)}

            <p class="cinema-hero-desc">${cleanSynopsis}</p>

            <div class="cinema-hero-actions">
              <button class="cinema-play-glow-btn" onclick="app.openMovieModal('${movie.slug}', true, ${primaryPlayEp})" title="${primaryPlayLabel}">
                <i class="fas fa-play"></i>
              </button>
              <button class="cinema-fav-circle-btn ${inMyList ? "favorited" : ""}" onclick="app.toggleMyList('${movie.slug}', event)" title="${inMyList ? "Đã Lưu Phim" : "Lưu Phim Yêu Thích"}">
                <i class="${inMyList ? "fas fa-star" : "far fa-star"}"></i>
              </button>
            </div>
          </div>

          <div class="cinema-hero-thumbnails cinema-hero-pager" aria-label="Điều hướng slide phim nổi bật">
            <button type="button" class="hero-pager-arrow" onclick="event.stopPropagation(); app.stepHeroSlide(-1)" title="Phim trước" aria-label="Phim trước">
              <i class="fas fa-chevron-left"></i>
            </button>
            <div class="hero-pager-dots">
              ${thumbMovies.map((hm, i) => {
                const isActive = customMovie ? hm.slug === movie.slug : hm.slug === movie.slug || i === this.heroIndex;
                const safeTitle = (hm.title || "").replace(/"/g, "&quot;");
                return `<button type="button" class="hero-pager-dot ${isActive ? "active" : ""}" onclick="event.stopPropagation(); app.setHeroSlide(${i})" title="${safeTitle}" aria-label="Slide ${i + 1}: ${safeTitle}"></button>`;
              }).join("")}
            </div>
            <button type="button" class="hero-pager-arrow" onclick="event.stopPropagation(); app.stepHeroSlide(1)" title="Phim tiếp" aria-label="Phim tiếp">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </section>
    `;
  },

  renderVisionTrailerCardHTML(movie, idx = 0) {
    const staggerIdx = Math.min(typeof idx === "number" ? idx : 0, 7);
    const trailerImg = this.getMovieBackdrop(movie) || this.getMoviePoster(movie);
    const trailerFallback = this.getMoviePoster(movie) || trailerImg;
    return `
      <article class="vision-trailer-card"
               style="--card-stagger: ${staggerIdx};"
               onpointerenter="app.handleCardPointerEnter('${movie.slug}', this)"
               onpointerleave="app.handleCardPointerLeave(this)"
               onclick="app.openMovieModal('${movie.slug}', true)">
        <img src="${trailerImg}" alt="${movie.title}" loading="lazy" fetchpriority="low" decoding="async"
             onerror="if(this.src!=='${trailerFallback}'){this.src='${trailerFallback}';}else{this.onerror=null;app.handleImageFallback(this,'${movie.slug}');}" />
        <div class="vision-trailer-overlay">
          <div class="vision-trailer-title">${movie.title}</div>
          <button class="vision-trailer-play" onclick="event.stopPropagation(); app.openMovieModal('${movie.slug}', true)" aria-label="Phát">
            <i class="fas fa-play"></i>
          </button>
        </div>
      </article>
    `;
  },

  renderVisionContinueItemHTML(movie, epIndex = 0) {
    const epName = movie.episodes?.[epIndex]?.name || movie.episodeCurrent || "Tập 1";
    const prog = this.getPlaybackProgress(movie.slug, epIndex);
    const pct = prog ? prog.percentage : 35;
    const timeText = prog ? `Đã xem ${this.formatSeconds(prog.currentTime)} (${pct}%)` : `${epName} • ${movie.quality}`;

    return `
      <div class="vision-continue-item"
           onpointerenter="app.handleCardPointerEnter('${movie.slug}', this, ${epIndex})"
           onpointerleave="app.handleCardPointerLeave(this)"
           onclick="app.openMovieModal('${movie.slug}', true, ${epIndex})"
           title="Tiếp tục xem ${movie.title}">
        <div class="vision-continue-thumb-box">
          <img class="vision-continue-thumb" src="${this.getMoviePoster(movie)}" alt="${movie.title}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://phimimg.com/upload/vod/20251229-1/d7f24b91fd95fb7cf353e1369e2318b7.jpg';" />
          <div class="vision-continue-progress-bg">
            <div class="vision-continue-progress-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
        <div class="vision-continue-text">
          <div class="vision-continue-title">${movie.title}</div>
          <div class="vision-continue-sub">${timeText}</div>
        </div>
        <button class="vision-continue-play" aria-label="Phát tiếp">
          <i class="fas fa-play"></i>
        </button>
      </div>
    `;
  },

  renderVisionFeatureCardHTML(movie, index = 99) {
    const inMyList = this.isInMyList(movie);
    const isAboveFold = index < 4;
    const loadAttr = isAboveFold
      ? `loading="eager" fetchpriority="high" decoding="async"`
      : `loading="lazy" fetchpriority="low" decoding="async"`;
    const primaryGenre = (movie.genres && movie.genres[0]) || (movie.type === "series" ? "Phim Bộ" : "Điện Ảnh");
    const isWaveCard = index < 8;
    const staggerIdx = Math.min(index, 7);
    const cardImg = this.getMovieBackdrop(movie) || this.getMoviePoster(movie);
    const cardFallback = this.getMoviePoster(movie) || cardImg;
    return `
      <article class="vision-feature-card${isWaveCard ? " ps5-wave-card" : ""}"
               style="--card-stagger: ${staggerIdx};"
               onpointerenter="app.handleCardPointerEnter('${movie.slug}', this)"
               onpointerleave="app.handleCardPointerLeave(this)"
               onclick="app.openMovieModal('${movie.slug}', true)">
        <img class="vision-feature-img" src="${cardImg}" alt="${movie.title}" ${loadAttr}
             onerror="if(this.src!=='${cardFallback}'){this.src='${cardFallback}';}else{this.onerror=null;app.handleImageFallback(this,'${movie.slug}');}" />
        <div class="vision-feature-shade"></div>

        <div class="vision-feature-bottom">
          <div class="vision-feature-meta">
            <span class="vision-card-genre">${primaryGenre}</span>
            <h3 class="vision-card-title" title="${movie.title}">${movie.title}</h3>
            <p class="vision-card-desc">${movie.originTitle} (${movie.year}) • ${movie.episodeCurrent || movie.quality}</p>
          </div>
          <button class="vision-card-play-white" onclick="event.stopPropagation(); app.openMovieModal('${movie.slug}', true)" title="Xem ngay">
            <i class="fas fa-play"></i>
          </button>
        </div>
      </article>
    `;
  },

  renderGenreChipsHTML() {
    return "";
  },

  renderCarouselSection(title, subtitle, movies, navTarget, maxItems = 12) {
    const trackId = `track-${Math.random().toString(36).slice(2, 8)}`;
    const displayMovies = (movies || []).slice(0, maxItems);
    return `
      <section class="movie-section">
        <div class="section-header">
          <div class="section-title-wrap">
            <h2 class="section-title">${title}</h2>
            <p class="section-subtitle">${subtitle}</p>
          </div>
          <div class="section-controls">
            ${
              navTarget
                ? `<button class="btn-see-all" onclick="app.setNavigation('${navTarget}')">
                    Xem tất cả (${(movies || []).length}) <i class="fas fa-chevron-right" style="font-size: 0.72rem;"></i>
                  </button>`
                : ""
            }
            <button class="carousel-nav-btn" onclick="app.scrollTrack('${trackId}', -1)" aria-label="Trước">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button class="carousel-nav-btn" onclick="app.scrollTrack('${trackId}', 1)" aria-label="Tiếp">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="movie-track" id="${trackId}">
          ${displayMovies.map((m, idx) => this.renderMovieCardHTML(m, null, idx)).join("")}
        </div>
      </section>
    `;
  },

  renderTop10RankedSection() {
    const topMovies = this.service.movies.slice(0, 10);
    const trackId = "track-top10";
    return `
      <section class="movie-section">
        <div class="section-header">
          <div class="section-title-wrap">
            <h2 class="section-title">Top 10 Phim Xu Hướng</h2>
          </div>
          <div class="section-controls">
            <button class="carousel-nav-btn" onclick="app.scrollTrack('${trackId}', -1)">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button class="carousel-nav-btn" onclick="app.scrollTrack('${trackId}', 1)">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="movie-track" id="${trackId}">
          ${topMovies.map((m, idx) => this.renderMovieCardHTML(m, idx + 1, idx)).join("")}
        </div>
      </section>
    `;
  },

  renderAppleCharts3ColSection() {
    if (!this.chartsCache) this.buildFastIndexes();
    const { newSingles, newSeries, topRated } = this.chartsCache;

    const renderList = (items) =>
      items
        .map(
          (m, idx) => `
        <div class="chart-row-item" onclick="app.openMovieModal('${m.slug}', false)">
          <span class="chart-rank-num">${idx + 1}</span>
          <img class="chart-thumb" src="${m.poster}" alt="${m.title}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://phimimg.com/upload/vod/20251229-1/d7f24b91fd95fb7cf353e1369e2318b7.jpg';" />
          <div class="chart-info">
            <div class="chart-title">${m.title}</div>
            <div class="chart-sub">${m.originTitle} • ${m.country}</div>
          </div>
          <span class="chart-ep-tag">${m.type === "series" ? m.episodeCurrent : m.duration}</span>
        </div>
      `
        )
        .join("");

    return `
      <section class="movie-section">
        <div class="section-header">
          <div class="section-title-wrap">
            <h2 class="section-title">Bảng Xếp Hạng Ngwyren Cinema</h2>
          </div>
        </div>
        <div class="charts-grid-3">
          <div class="chart-column-card">
            <div class="chart-column-header">
              <div class="chart-column-title"><i class="fas fa-film"></i> Phim Lẻ Mới Nhất</div>
              <button class="btn-see-all" onclick="app.setNavigation('phim-le')">Tất cả</button>
            </div>
            <div class="chart-list">${renderList(newSingles)}</div>
          </div>

          <div class="chart-column-card">
            <div class="chart-column-header">
              <div class="chart-column-title"><i class="fas fa-tv"></i> Phim Bộ Mới Cập Nhật</div>
              <button class="btn-see-all" onclick="app.setNavigation('phim-bo')">Tất cả</button>
            </div>
            <div class="chart-list">${renderList(newSeries)}</div>
          </div>

          <div class="chart-column-card">
            <div class="chart-column-header">
              <div class="chart-column-title"><i class="fas fa-star"></i> Điểm Đánh Giá Cao Nhất</div>
              <button class="btn-see-all" onclick="app.setNavigation('moi-cap-nhat')">Tất cả</button>
            </div>
            <div class="chart-list">${renderList(topRated)}</div>
          </div>
        </div>
      </section>
    `;
  },

  renderMovieCardHTML(movie, rankNum = null, index = 0) {
    const inMyList = this.isInMyList(movie);
    const is4k = Boolean(
      (movie.quality && movie.quality.toString().toUpperCase().includes("4K")) ||
      movie.has4k === true ||
      (Array.isArray(movie.sectionTags) && movie.sectionTags.includes("4k"))
    );
    const qualityBadge = is4k
      ? `<span class="ribbon-quality ribbon-4k"><i class="fas fa-sparkles"></i> 4K</span>`
      : `<span class="ribbon-quality ribbon-1080">Full HD</span>`;
    const isSeries = Boolean(
      movie.type === "series" ||
      (Array.isArray(movie.episodes) && movie.episodes.length > 1) ||
      (Array.isArray(movie.sectionTags) && movie.sectionTags.includes("phim-bo")) ||
      (movie.episodeTotal && parseInt(movie.episodeTotal, 10) > 1)
    );
    const epText = isSeries ? (movie.episodeCurrent || "Tập mới") : "";
    const staggerIdx = Math.min(typeof index === "number" ? index : 0, 11);
    const posterImg = this.getMoviePoster(movie) || this.getMovieBackdrop(movie);
    const posterFallback = this.getMovieBackdrop(movie) || posterImg;

    return `
      <article class="movie-card ${rankNum ? "ranked-card" : ""}"
               style="--card-stagger: ${staggerIdx};"
               onclick="app.openMovieModal('${movie.slug}', true)">
        <div class="movie-poster-wrap">
          <img src="${posterImg}" alt="${movie.title}" loading="lazy" decoding="async"
               onerror="if(this.src!=='${posterFallback}'){this.src='${posterFallback}';}else{this.onerror=null;app.handleImageFallback(this,'${movie.slug}');}" />
          <div class="poster-badges-top">
            ${qualityBadge}
            ${isSeries && epText ? `<span class="ribbon-ep">${epText}</span>` : ""}
          </div>
          ${rankNum ? `<span class="rank-number-badge">${rankNum}</span>` : ""}

          <div class="poster-hover-overlay">
            <div class="hover-play-center" onclick="event.stopPropagation(); app.openMovieModal('${movie.slug}', true)" title="Phát ngay">
              <i class="fas fa-play" style="margin-left: 2px;"></i>
            </div>
            <div class="hover-bottom-row">
              <span class="hover-match-score">${movie.matchScore || 96}% Phù hợp</span>
              <div class="hover-action-btns">
                <button class="mini-circle-btn ${inMyList ? "active" : ""}"
                        onclick="app.toggleMyList('${movie.slug}', event)"
                        title="${inMyList ? "Xóa khỏi Yêu thích" : "Lưu vào Yêu thích"}">
                  <i class="${inMyList ? "fas fa-star" : "far fa-star"}"></i>
                </button>
                <button class="mini-circle-btn"
                        onclick="event.stopPropagation(); app.openMovieModal('${movie.slug}', false)"
                        title="Nội dung tương tự & Chi tiết">
                  <i class="fas fa-chevron-down"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="movie-card-info">
          <h3 class="movie-card-title" title="${movie.title}">${movie.title}</h3>
          <div class="movie-card-sub">${movie.originTitle} • ${movie.year}</div>
        </div>
      </article>
    `;
  },

  startHeroAutoRotate() {
    clearInterval(this.heroTimer);
    this.heroTimer = setInterval(() => {
      const heroList = this.getActiveHeroMovies();
      if (
        this.settings?.heroAutoRotate !== false &&
        heroList.length > 1 &&
        !this.isHeroPaused &&
        !document.hidden &&
        window.scrollY < 700 &&
        !document.getElementById("movieDetailModal")?.classList.contains("open") &&
        !document.getElementById("authModal")?.classList.contains("open")
      ) {
        this.setHeroSlide((this.heroIndex + 1) % heroList.length);
      }
    }, 5000);
  },

  pauseHeroAutoRotate() {
    this.isHeroPaused = true;
  },

  resumeHeroAutoRotate() {
    this.isHeroPaused = false;
  },

  stepHeroSlide(delta = 1) {
    const heroList = this.getActiveHeroMovies();
    if (!heroList || heroList.length === 0) return;
    const nextIdx = ((this.heroIndex + delta) % heroList.length + heroList.length) % heroList.length;
    this.setHeroSlide(nextIdx);
  },

  setHeroSlide(index) {
    const heroList = this.getActiveHeroMovies();
    if (!heroList || heroList.length === 0) return;
    this.heroIndex = ((index % heroList.length) + heroList.length) % heroList.length;
    document.querySelectorAll(".is-hero-previewing").forEach((el) => el.classList.remove("is-hero-previewing"));
    const heroEl = document.getElementById("heroShowcase");
    if (heroEl) {
      // renderHeroHTML đã gắn sẵn class ps5-hero-morph-anim trên phần tử mới -> không xóa/gắn lại sau 1 frame để tránh chớp màn hình
      heroEl.outerHTML = this.renderHeroHTML();
      this.attachHeroSwipeHandlers();
    }
  },

  scrollTrack(trackId, direction) {
    const track = document.getElementById(trackId);
    if (!track) return;
    const scrollAmount = track.clientWidth * 0.82 * direction;
    track.scrollBy({ left: scrollAmount, behavior: "smooth" });
  },

  toggleLightsOff() {
    this.lightsOff = !this.lightsOff;
    document.getElementById("movieDetailModal")?.classList.toggle("lights-off", this.lightsOff);
    const btn = document.getElementById("lightsOffBtn");
    if (btn) {
      btn.title = this.lightsOff ? "Bật Đèn" : "Tắt Đèn Rạp";
      btn.classList.toggle("active", this.lightsOff);
    }
  },

  navigateTo(navKey, customTitle = null, force = false) {
    return this.setNavigation(navKey, customTitle, force);
  }
  };

  window.NgwyrenSystem.attachModule(window.AppleCinemaApp, "NavigationUI", NavigationUIMethods, {
    isolateErrors: false
  });
})();
