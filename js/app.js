/* ==========================================================================
   APPLE CINEMA VN — MAIN APPLICATION CONTROLLER (js/app.js)
   Giao diện Apple Music UI + Tính năng Netflix Related & HLS Player
   ========================================================================== */

class AppleCinemaApp {
  constructor() {
    this.service = window.phimmoiService;
    this.currentNav = "kham-pha";
    this.currentSegment = "all"; // all | series | single
    this.activeGenreFilter = "Tất cả";
    this.visibleGridLimit = 24;
    this.exploreGridLimit = 24;
    this.heroMovies = [];
    this.heroIndex = 0;
    this.heroTimer = null;
    this._preconnectedOrigins = new Set();
    this._m3u8PrefetchCache = new Map();
    this._calibratedPlaylistsCache = new Map();

    // Trạng thái phim đang mở / đang phát
    this.selectedMovie = null;
    this.playingMovie = null;
    this.currentEpisodeIndex = 0;
    this.currentServerMode = "hls-1"; // hls-1 | embed-1 | nguonc-1 | dub-1 | trailer
    this.currentQuality = "native-max"; // native-max | level-N | alt-N | 4K-upscale | 2K-upscale | Auto
    this.detectedHlsLevels = [];
    this.actualVideoRes = { width: 0, height: 0, bitrateMbps: 0 };
    this.ActiveModalTab = "related"; // related | episodes | trailer | details
    this.isPlaying = false;
    this.lightsOff = false;
    this.hlsInstance = null;

    // Lưu trữ cá nhân (Danh sách của tôi, Lịch sử xem & Cài đặt hệ thống - Mặc định trống cho tài khoản mới)
    this.myList = this.loadStorage("apple_cinema_mylist", []);
    this.watchHistory = this.loadStorage("apple_cinema_history", []);
    this.settings = this.loadStorage("apple_cinema_settings", {
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
      heroAutoRotate: true
    });
    if (this.settings.ps5SpatialMotion === undefined) {
      this.settings.ps5SpatialMotion = true;
    }
    if (this.settings.defaultServer === "dub-1") {
      this.settings.defaultServer = "hls-1";
      this.saveStorage("apple_cinema_settings", this.settings);
    }
    this.currentServerMode = this.settings.defaultServer || "hls-1";
    this.currentQuality = this.settings.defaultQuality || "native-max";

    this.searchDebounce = null;
    this.tagCache = new Map();
    this.countryCache = new Map();
    this.chartsCache = null;
    // Mỗi lần tải trang chọn ngẫu nhiên một hạt giống xu hướng mới từ nhóm phim Trending hiện tại
    this._trendingRotationSeed = Math.floor(Math.random() * 1000);
    this._lastLeftContext = null;
  }

  async init() {
    this.initGlobalAdBlocker();
    this.applyTheme();
    this.buildFastIndexes();
    this.cleanPersonalListsOnBoot();
    this.setupHeroMovies();
    this.initUserProfile();
    this.bindGlobalEvents();
    this.updateSidebarCounts();

    // Khởi tạo trạng thái phim mặc định (0ms non-blocking)
    const initialPlaying = this.service.slugMap.get(this.watchHistory[0]?.slug) || this.heroMovies[this.heroIndex] || this.service.movies[0];
    this.playingMovie = initialPlaying;
    this.currentEpisodeIndex = 0;
    this.isPlaying = false;

    // Render giao diện tức thì (0ms)
    this.renderMainView();
    this.startHeroAutoRotate();

    // Đồng bộ nhẹ nhàng sau khi trang đã render mượt mà không chặn giao diện (3.5s)
    if (window.requestIdleCallback) {
      setTimeout(() => window.requestIdleCallback(() => this.syncLivePhimmoi(false)), 3500);
    } else {
      setTimeout(() => this.syncLivePhimmoi(false), 3500);
    }

    // Khởi chạy lịch bảo trì sửa lỗi định kỳ (mỗi 30 phút)
    this.startPeriodicMaintenanceScheduler();
  }

  startPeriodicMaintenanceScheduler() {
    if (this._maintenanceInterval) clearInterval(this._maintenanceInterval);
    this._maintenanceInterval = setInterval(async () => {
      try {
        // 1. Dọn dẹp bộ nhớ đệm API nếu vượt ngưỡng để giải phóng RAM trình duyệt
        if (this.service?._smartCache && this.service._smartCache.size > 250) {
          this.service._smartCache.clear();
        }
        // 2. Tự động kiểm tra và sửa lỗi trạng thái lớp phủ trình phát nếu iframe đang bật
        const iframeEl = document.getElementById("trailerIframeElement");
        const overlayEl = document.getElementById("applePlayerOverlay");
        if (iframeEl && iframeEl.style.display === "block" && overlayEl && overlayEl.style.display !== "none") {
          overlayEl.style.setProperty("display", "none");
        }
        // 3. Tự động đồng bộ phim mới và tập mới ngầm từ API, khử trùng lặp và cập nhật chỉ mục
        await this.syncLivePhimmoi(false);
        this.buildFastIndexes();
      } catch (err) {
        console.warn("[Maintenance] Bảo trì định kỳ:", err);
      }
    }, 30 * 60 * 1000);
  }

  buildFastIndexes() {
    this.tagCache.clear();
    this.countryCache.clear();
    const movies = this.service.movies;
    for (let i = 0; i < movies.length; i++) {
      const m = movies[i];
      if (m.sectionTags) {
        for (let t = 0; t < m.sectionTags.length; t++) {
          const tag = m.sectionTags[t];
          let arr = this.tagCache.get(tag);
          if (!arr) {
            arr = [];
            this.tagCache.set(tag, arr);
          }
          arr.push(m);
        }
      }
      if (m.countrySlug) {
        let cArr = this.countryCache.get(m.countrySlug);
        if (!cArr) {
          cArr = [];
          this.countryCache.set(m.countrySlug, cArr);
        }
        cArr.push(m);
      }
    }
    this.chartsCache = {
      newSingles: movies.filter((m) => m.type === "single").slice(0, 5),
      newSeries: movies.filter((m) => m.type === "series").slice(0, 5),
      topRated: [...movies].sort((a, b) => b.rating - a.rating).slice(0, 5)
    };
  }

  sanitizeAndDedupeHistory(rawHistory) {
    if (!Array.isArray(rawHistory)) return [];
    const bySlug = new Map();
    for (const item of rawHistory) {
      if (!item || typeof item !== "object" || !item.slug) continue;
      const movie = this.findMovie(item.slug);
      const canonicalSlug = movie ? movie.slug : String(item.slug).trim();
      if (!canonicalSlug) continue;
      const normalized = {
        ...item,
        slug: canonicalSlug,
        title: movie?.title || item.title || "",
        poster: movie?.poster || item.poster || "",
        backdrop: movie?.backdrop || item.backdrop || "",
        epIndex: Number(item.epIndex) || 0,
        progress: Number(item.progress) || 15,
        currentTime: Number(item.currentTime) || 0,
        timestamp: Number(item.timestamp) || Date.now()
      };
      const existing = bySlug.get(canonicalSlug);
      if (!existing || normalized.timestamp > existing.timestamp || (normalized.timestamp === existing.timestamp && normalized.epIndex > existing.epIndex)) {
        bySlug.set(canonicalSlug, normalized);
      }
    }
    return Array.from(bySlug.values()).slice(0, 24);
  }

  sanitizeAndDedupeMyList(rawMyList) {
    if (!Array.isArray(rawMyList)) return [];
    const seen = new Set();
    const cleaned = [];
    for (const idOrSlug of rawMyList) {
      if (!idOrSlug) continue;
      const movie = this.findMovie(idOrSlug);
      const canonicalSlug = movie ? movie.slug : String(idOrSlug).trim();
      if (canonicalSlug && !seen.has(canonicalSlug)) {
        seen.add(canonicalSlug);
        cleaned.push(canonicalSlug);
      }
    }
    return cleaned;
  }

  cleanPersonalListsOnBoot() {
    const prevHistLen = Array.isArray(this.watchHistory) ? this.watchHistory.length : 0;
    const prevListLen = Array.isArray(this.myList) ? this.myList.length : 0;
    this.watchHistory = this.sanitizeAndDedupeHistory(this.watchHistory);
    this.myList = this.sanitizeAndDedupeMyList(this.myList);
    if (this.watchHistory.length !== prevHistLen) {
      this.saveStorage("apple_cinema_history", this.watchHistory);
    }
    if (this.myList.length !== prevListLen) {
      this.saveStorage("apple_cinema_mylist", this.myList);
    }
  }

  loadStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  saveStorage(key, value, skipCloudSync = false) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      if (
        !skipCloudSync &&
        (key === "apple_cinema_mylist" ||
          key === "ngwyren_playback_progress" ||
          key === "ngwyren_user_profile" ||
          key === "apple_cinema_history") &&
        this.triggerCloudSync
      ) {
        this.triggerCloudSync();
      }
    } catch (e) {}
  }

  setupHeroMovies() {
    const candidateSlugs = [
      "thanh-guom-diet-quy-vo-han-thanh-465645",
      "matchbox-phim-dien-anh",
      "squid-game-3-765752",
      "dia-dao-mat-troi-trong-bong-toi",
      "tai-xe-an-danh-phan-3",
      "nhiem-vu-bat-kha-thi-nghiep-bao-phan-2-1",
      "chainsaw-man-the-movie-chuong-reze",
      "phi-vu-dong-troi-2",
      "cau-be-mat-tich-phan-5",
      "chu-thuat-hoi-chien-hoai-ngoc-ngoc-chiet-the-movie",
      "tham-tu-kien-ky-an-khong-dau",
      "good-boy-18",
      "nha-gia-tien",
      "cu-roi-tu-than-2-diem-chet",
      "100-ngay-lua-doi",
      "dich-nhan-kiet-lang-nhan-kiep"
    ];

    // Bộ lọc chuẩn 16:9 widescreen HD cho ảnh banner Hero Showcase (loại bỏ ảnh poster dọc, ảnh mờ)
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

    // Lọc các phim bom tấn có ảnh nền nét từ ứng viên và catalog
    const seedMovies = candidateSlugs
      .map((s) => this.service.slugMap.get(s))
      .filter((m) => isWidescreenHd(m));

    const catalogHdMovies = this.service.movies
      .filter((m) => isWidescreenHd(m) && (m.rating >= 8.0 || m.year >= 2024))
      .slice(0, 45);

    const pool = Array.from(new Set([...seedMovies, ...catalogHdMovies]));

    // Xáo trộn ngẫu nhiên hoàn toàn mỗi lần tải lại trang (Fisher-Yates Shuffle)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Chọn ngẫu nhiên 8 phim xuất sắc & chọn vị trí slide mở đầu ngẫu nhiên (đổi liên tục mỗi lần load web)
    this.heroMovies = pool.slice(0, 8);
    this.heroIndex = Math.floor(Math.random() * this.heroMovies.length);

    // Preload ảnh Hero đầu tiên ở mức ưu tiên cao nhất để hiển thị tức thì 0ms
    const activeHero = this.heroMovies[this.heroIndex];
    if (activeHero) {
      const heroImgUrl = this.getMovieBackdrop(activeHero);
      if (heroImgUrl && typeof document !== "undefined" && !document.getElementById("heroPreloadLink")) {
        const link = document.createElement("link");
        link.id = "heroPreloadLink";
        link.rel = "preload";
        link.as = "image";
        link.href = heroImgUrl;
        link.setAttribute("fetchpriority", "high");
        document.head.appendChild(link);
      }
    }
  }

  /* ==========================================================================
     AMBIENT COLOR & ARTWORK GLOW ENGINE (MINIMAL MONOCHROME MOTION)
     ========================================================================== */
  updateAmbientBackdrop() {
    // Đã tắt hiệu ứng đổi ảnh nền mờ để tối ưu hiệu năng tuyệt đối (0ms GPU lag)
  }

  /* ==========================================================================
     LIVE SYNC ALL MOVIES & PAGE-LOAD TRENDING UPDATE
     ========================================================================== */
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
  }

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
  }

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
  }

  /* ==========================================================================
     NAVIGATION & VIEW RENDERING
     ========================================================================== */
  toggleMobileSidebar(forceState = null) {
    const sidebar = document.getElementById("appleSidebar");
    const backdrop = document.getElementById("sidebarMobileBackdrop");
    if (!sidebar) return;
    const isOpen = forceState !== null ? forceState : !sidebar.classList.contains("mobile-open");
    sidebar.classList.toggle("mobile-open", isOpen);
    if (backdrop) backdrop.classList.toggle("open", isOpen);
  }

  setNavigation(navKey, customTitle = null, force = false) {
    this.ensureFullCatalogLoaded();
    if (!force && this.currentNav === navKey && !customTitle && !this.customFilterTitle && this.activeGenreFilter === "Tất cả") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    this.currentNav = navKey;
    this.heroIndex = 0;
    this.customFilterTitle = customTitle;
    this.activeGenreFilter = "Tất cả";
    this.currentSegment = "all";
    this.visibleGridLimit = 24;

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
    });
  }

  syncNavPillIndicator() {}

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

    // Chuyển trang tức thì 0ms độ trễ kết hợp hiệu ứng Fade-Scale GPU 120fps siêu nhanh (140ms)
    const htmlEl = document.documentElement;
    const prevBehavior = htmlEl.style.scrollBehavior;
    htmlEl.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    htmlEl.style.scrollBehavior = prevBehavior;

    container.classList.remove("vision-view-exit", "vision-view-enter");
    if (updateCallback) updateCallback();

    requestAnimationFrame(() => {
      container.classList.add("vision-view-enter");
      this._navTransitionTimer = setTimeout(() => {
        container.classList.remove("vision-view-enter");
        this._navTransitionTimer = null;
      }, 150);
    });
  }

  triggerHaptic(type = "light") {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        if (type === "medium") {
          navigator.vibrate(14);
        } else if (type === "heavy") {
          navigator.vibrate([12, 35, 16]);
        } else {
          navigator.vibrate(8);
        }
      } catch (e) {
        // Safe fallback
      }
    }
  }

  syncLeftDockIndicator(navKey) {
    const dockEl = document.getElementById("appleSidebar");
    const indicator = document.getElementById("visionDockIndicator");
    if (!dockEl) return;
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

  triggerPageTransition() {
    this.transitionView(() => {
      this.renderMainView();
    });
  }

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
  }

  /* ==========================================================================
     CONTINUE WATCHING HOME SHELF (HÀNG "TIẾP TỤC XEM" CHUẨN APPLE TV & NETFLIX)
     ========================================================================== */
  renderContinueWatchingShelfHTML() {
    const seenContinueSlugs = new Set();
    const continueItems = [];
    for (const h of (this.watchHistory || [])) {
      if (!h || !h.slug) continue;
      const movie = this.findMovie(h.slug) || {
        slug: h.slug,
        title: h.title || h.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        poster: h.poster || "https://phimimg.com/upload/vod/20251229-1/d7f24b91fd95fb7cf353e1369e2318b7.jpg",
        backdrop: h.backdrop || h.poster || "https://phimimg.com/upload/vod/20251229-1/d7f24b91fd95fb7cf353e1369e2318b7.jpg",
        type: "series"
      };
      const progress = Number(h.progress) || 15;
      if (progress > 0 && progress < 95 && !seenContinueSlugs.has(movie.slug)) {
        seenContinueSlugs.add(movie.slug);
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
          <h2 class="vision-shelf-title"><i class="fas fa-clock-rotate-left" style="margin-right: 8px;"></i>Tiếp Tục Xem</h2>
          <button class="vision-see-all-pill" onclick="app.setNavigation('lich-su')">Xem Tất Cả (${continueItems.length})</button>
        </div>
        <div class="vision-continue-shelf-grid">
          ${continueItems.slice(0, 4).map(({ movie, epIndex, progress, currentTime }, idx) => {
            const ep = movie.episodes?.[epIndex] || movie.episodes?.[0];
            const epLabel = ep?.name ? this.formatEpisodeLabel(ep.name, `Tập ${epIndex + 1}`) : (movie.type === "series" ? `Tập ${epIndex + 1}` : "Bản Full");
            const timeStr = currentTime > 0 ? this.formatSeconds(currentTime) : "";
            return `
              <div class="continue-shelf-card" style="--card-stagger: ${idx};" onclick="app.openMovieModal('${movie.slug}', true, ${epIndex})">
                <div class="continue-shelf-thumb">
                  <img src="${movie.backdrop || movie.poster}" alt="${movie.title}" loading="lazy" decoding="async" />
                  <div class="continue-shelf-play"><i class="fas fa-play"></i></div>
                  <div class="continue-shelf-badge">${epLabel}</div>
                  <div class="continue-shelf-bar">
                    <div class="continue-shelf-fill" style="width: ${progress}%;"></div>
                  </div>
                </div>
                <div class="continue-shelf-info">
                  <div class="continue-shelf-title">${movie.title}</div>
                  <div class="continue-shelf-meta">
                    <span>${timeStr ? `Đã xem ${timeStr}` : epLabel}</span>
                    <span>${progress}%</span>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  pickDistinctCategoryHero(list, navKey) {
    if (!list || list.length === 0) return this.heroMovies[0] || this.service.movies[0];
    const pool = list.filter((m) => m && m.backdrop && !m.backdrop.includes("nguonc.com"));
    const poolToUse = pool.length >= 3 ? pool.slice(0, 15) : list.slice(0, 8);
    // Chọn ngẫu nhiên một phim xuất sắc trong danh mục mỗi lần mở
    return poolToUse[Math.floor(Math.random() * poolToUse.length)] || list[0];
  }

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
      </div>
    `;
  }

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
  }

  selectScheduleDay(dayKey) {
    this.activeScheduleDay = dayKey;
    this.triggerHaptic("light");
    this.renderMainView();
  }

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
  }

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
  }

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
  }

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
  }

  setThemeMode(theme) {
    this.settings.theme = theme;
    this.saveStorage("apple_cinema_settings", this.settings);
    this.applyTheme();
    // Cập nhật ngay lập tức DOM không cần render lại toàn bộ (0ms delay)
    document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.themeBtn === theme);
    });
  }

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
  }

  updateSetting(key, value) {
    this.settings[key] = value;
    this.saveStorage("apple_cinema_settings", this.settings);
    if (key === "theme" || key === "glassBlur" || key === "ambientGlow" || key === "ps5SpatialMotion") this.applyTheme();
    if (key === "defaultServer") this.currentServerMode = value;
    if (key === "defaultQuality") this.currentQuality = value;
    if (key === "defaultLightsOff") this.lightsOff = Boolean(value);
    if (this.currentNav === "cai-dat" || key === "ps5SpatialMotion") {
      this.renderMainView();
    }
    this.showToast("Đã lưu thay đổi cài đặt hệ thống");
  }

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
      heroAutoRotate: true
    };
    this.saveStorage("apple_cinema_settings", this.settings);
    this.currentServerMode = "hls-1";
    this.currentQuality = "native-max";
    this.applyTheme();
    if (this.currentNav === "cai-dat") {
      this.renderMainView();
    }
    this.showToast("Đã khôi phục cài đặt mặc định");
  }

  clearWatchHistory() {
    this.watchHistory = [];
    this.saveStorage("apple_cinema_history", this.watchHistory);
    this.updateSidebarCounts();
    this.renderMainView();
    this.showToast("Đã xóa toàn bộ lịch sử xem phim");
  }

  clearMyList() {
    this.myList = [];
    this.saveStorage("apple_cinema_mylist", this.myList);
    this.updateSidebarCounts();
    this.renderMainView();
    this.showToast("Đã làm trống danh sách phim đã lưu");
  }

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

    const isDefaultExplore =
      this.currentNav === "kham-pha" &&
      this.activeGenreFilter === "Tất cả" &&
      this.currentSegment === "all";

    if (isDefaultExplore) {
      const trending10 = this.getRealtimeTrendingMovies(null, 10);
      const youMightLike = trending10.slice(2, 10).length >= 8 ? trending10.slice(2, 10) : this.service.movies.slice(1, 9);
      const singlesFeatured = this.service.movies.filter((m) => m.type === "single").slice(0, 8);
      const seriesFeatured = this.service.movies.filter((m) => m.type === "series").slice(0, 8);
      const animeFeatured = this.getMoviesByTag("anime").slice(0, 8);
      const netflixFeatured = this.getMoviesByTag("netflix").slice(0, 8);
      const koreanFeatured = this.getMoviesByCountry("han-quoc").slice(0, 8);
      const chineseFeatured = this.getMoviesByCountry("trung-quoc").slice(0, 8);
      const hollywoodFeatured = (this.countryCache.get("au-my") || this.countryCache.get("my") || []).slice(0, 8);

      const allExploreMovies = this.service.movies;
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
              <h2 class="vision-shelf-title"><i class="fas fa-dragon" style="margin-right: 8px;"></i>Anime Tuyển Chọn</h2>
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

          <!-- 9. TOÀN BỘ KHO PHIM KHÁM PHÁ (VỚI NÚT HIỂN THỊ THÊM PHIM) -->
          <section class="vision-shelf-section explore-all-catalog-section">
            <div class="vision-shelf-header">
              <h2 class="vision-shelf-title" id="exploreAllMoviesCountTitle">
                <i class="fas fa-compass" style="margin-right: 8px;"></i>Khám Phá Toàn Bộ Kho Phim (${allExploreMovies.length}+ Phim)
              </h2>
            </div>
            <div class="vision-cards-grid-4" id="exploreAllMoviesGrid">
              ${exploreGridList.map((m, idx) => this.renderVisionFeatureCardHTML(m, idx)).join("")}
            </div>
            <div class="explore-load-more-wrap">
              ${remainingCount > 0 ? `
                <button class="explore-load-more-btn" onclick="app.loadMoreExplore()">
                  <i class="fas fa-plus"></i> Hiển Thị Thêm 24 Phim (<span id="exploreRemainingCount">${remainingCount} phim còn lại</span>)
                </button>
              ` : `
                <div style="padding: 16px; color: rgba(255, 255, 255, 0.6); font-size: 0.9rem;">
                  🎉 Đã hiển thị toàn bộ ${allExploreMovies.length} phim trong kho Ngwyren Cinema!
                </div>
              `}
              <button class="vision-btn-outline" onclick="window.scrollTo({ top: 0, behavior: 'smooth' })">
                <i class="fas fa-arrow-up"></i> Lên Đầu Trang
              </button>
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
            : this.renderHeroHTML()
        }

        <section class="vision-shelf-section">
          ${
            !isPersonalPage
              ? `<div class="vision-shelf-header">
                   <h2 class="vision-shelf-title">${title}</h2>
                 </div>`
              : ""
          }
          ${
            visibleList.length > 0
              ? `<div class="vision-cards-grid-4">${visibleList.map((m, idx) => this.renderVisionFeatureCardHTML(m, idx)).join("")}</div>
                   ${this.renderLoadMoreButtonsHTML(list.length)}`
              : `<div style="padding: 60px 20px; text-align: center; background: rgba(255,255,255,0.04); border-radius: 26px; border: 1px solid rgba(255,255,255,0.12);">
                  <i class="fas fa-film" style="font-size: 2.5rem; color: #ffffff; margin-bottom: 14px;"></i>
                  <h3 style="margin-bottom: 18px; font-weight: 600;">Chưa có phim trong mục này</h3>
                  <button class="vision-btn-watch" onclick="app.resetAllFilters()">Khám Phá Kho Phim</button>
                </div>`
          }
        </section>
      </div>
    `;
    this.attachHeroSwipeHandlers();
  }

  renderLoadMoreButtonsHTML(totalCount) {
    if (this.visibleGridLimit >= totalCount) return "";
    const remaining = totalCount - this.visibleGridLimit;
    return `
      <div style="display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 24px;">
        <button class="btn-primary-play" onclick="app.loadMoreMovies(120)">
          <i class="fas fa-plus"></i> Xem Thêm Phim (+${Math.min(120, remaining)} phim)
        </button>
        <button class="btn-glass-secondary" onclick="app.loadMoreMovies(${totalCount})">
          Hiển Thị Tất Cả (${totalCount} phim)
        </button>
      </div>
    `;
  }

  loadMoreMovies(step = 120) {
    this.visibleGridLimit += step;
    this.renderMainView();
  }

  loadMoreExplore(step = 24) {
    this.exploreGridLimit = (this.exploreGridLimit || 24) + step;
    const grid = document.getElementById("exploreAllMoviesGrid");
    const countLabel = document.getElementById("exploreRemainingCount");
    const loadMoreWrap = document.querySelector(".explore-load-more-wrap");
    const allMovies = this.service.movies;
    if (grid) {
      grid.innerHTML = allMovies
        .slice(0, this.exploreGridLimit)
        .map((m, idx) => this.renderVisionFeatureCardHTML(m, idx))
        .join("");
    }
    const remaining = Math.max(0, allMovies.length - this.exploreGridLimit);
    if (countLabel) {
      if (remaining > 0) {
        countLabel.textContent = `${remaining} phim còn lại`;
      } else if (loadMoreWrap) {
        loadMoreWrap.innerHTML = `
          <div style="padding: 16px; color: rgba(255, 255, 255, 0.6); font-size: 0.9rem;">
            🎉 Đã hiển thị toàn bộ ${allMovies.length} phim trong kho Ngwyren Cinema!
          </div>
          <button class="vision-btn-outline" onclick="window.scrollTo({ top: 0, behavior: 'smooth' })">
            <i class="fas fa-arrow-up"></i> Lên Đầu Trang
          </button>
        `;
      }
    }
  }

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
  }

  getFilteredCatalog() {
    let base = [...this.service.movies];
    let title = "Khám Phá Kho Phim";
    let subtitle = "Kho phim chất lượng cao Ngwyren Cinema";

    switch (this.currentNav) {
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

    return { title, subtitle, list: base };
  }

  resetAllFilters() {
    this.currentSegment = "all";
    this.activeGenreFilter = "Tất cả";
    this.visibleGridLimit = 24;
    this.exploreGridLimit = 24;
    this.customFilterTitle = null;
    this.customFilterValue = null;
    document.querySelectorAll(".segment-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.segment === "all");
    });
    this.setNavigation("kham-pha", null, true);
  }

  /* ==========================================================================
     VISION OS SPATIAL & PS5 "GAME SCREEN & SAVES" HTML BUILDERS
     ========================================================================== */
  getMovieLatestSaveSlot(movie) {
    if (!movie) return null;
    const histItem = (this.watchHistory || []).find((h) => h && h.slug === movie.slug);
    const epIndex = histItem ? Number(histItem.epIndex) || 0 : 0;
    const prog = this.getPlaybackProgress ? this.getPlaybackProgress(movie.slug, epIndex) : null;
    const percent = prog?.percentage || histItem?.progress || 0;
    const currentTime = prog?.currentTime || histItem?.currentTime || 0;
    if (percent <= 0 && !histItem) return null;

    const epObj = movie.episodes?.[epIndex];
    const epLabel =
      movie.type === "series"
        ? this.formatEpisodeLabel(epObj?.name, `Tập ${epIndex + 1}`)
        : "Bản Full";
    const timeStr = currentTime > 5 ? this.formatSeconds(currentTime) : "Đang xem";
    return {
      epIndex,
      epLabel,
      percent: Math.max(5, Math.min(99, Math.round(percent || 15))),
      currentTime,
      timeStr
    };
  }

  renderPs5HeroSavesHTML(movie) {
    if (!movie || this.settings?.ps5SpatialMotion === false) return "";
    const saveSlot = this.getMovieLatestSaveSlot(movie);
    const chips = [];

    if (saveSlot) {
      chips.push(`
        <button class="ps5-save-slot-pill is-saved" onclick="event.stopPropagation(); app.openMovieModal('${movie.slug}', true, ${saveSlot.epIndex})" title="Tiếp tục từ điểm lưu">
          <span class="ps5-save-slot-icon"><i class="fas fa-floppy-disk"></i></span>
          <span class="ps5-save-slot-body">
            <span class="ps5-save-slot-title">Save Slot • ${saveSlot.epLabel}</span>
            <span class="ps5-save-slot-sub">${saveSlot.timeStr} (${saveSlot.percent}%)</span>
          </span>
          <span class="ps5-save-slot-bar"><span style="width: ${saveSlot.percent}%;"></span></span>
        </button>
      `);
    }

    if (movie.type === "series") {
      let totalEps = Array.isArray(movie.episodes) ? movie.episodes.length : 0;
      const curMatch = String(movie.episodeCurrent || "").match(/(\d+)/);
      if (curMatch) {
        const parsed = parseInt(curMatch[1], 10);
        if (parsed > totalEps && parsed <= 300) totalEps = parsed;
      }
      if (totalEps < 1) totalEps = 1;

      const quickIndices = [0, 1, 2].filter((idx) => idx < totalEps);
      if (totalEps > 3) {
        quickIndices.push(totalEps - 1);
      }

      for (const idx of quickIndices) {
        if (saveSlot && saveSlot.epIndex === idx && quickIndices.length > 1) continue;
        const epName = movie.episodes?.[idx]?.name
          ? this.formatEpisodeLabel(movie.episodes[idx].name, `Tập ${idx + 1}`)
          : `Tập ${idx + 1}`;
        const isLatest = totalEps > 3 && idx === totalEps - 1;
        chips.push(`
          <button class="ps5-ep-quick-chip ${isLatest ? "is-latest" : ""}"
                  onpointerenter="app.warmUpMovieStream('${movie.slug}', ${idx})"
                  onclick="event.stopPropagation(); app.openMovieModal('${movie.slug}', true, ${idx})"
                  title="Phát ngay ${epName}">
            <i class="fas fa-play"></i>
            <span>${isLatest ? `${epName} (Mới)` : epName}</span>
          </button>
        `);
      }
    } else {
      chips.push(`
        <button class="ps5-ep-quick-chip is-latest"
                onpointerenter="app.warmUpMovieStream('${movie.slug}', 0)"
                onclick="event.stopPropagation(); app.openMovieModal('${movie.slug}', true, 0)">
          <i class="fas fa-bolt"></i>
          <span>Bản ${movie.quality || "Full HD"} • ${this.getMovieLanguageLabel(movie).split("+")[0].trim() || "Vietsub"}</span>
        </button>
      `);
    }

    return `
      <div class="ps5-hero-saves-strip">
        ${chips.join("")}
      </div>
    `;
  }

  handleCardPointerEnter(slug, cardEl = null, epIndex = 0) {
    this.warmUpMovieStream(slug, epIndex);
    // Đã tắt previewMovieOnHero khi rê chuột để triệt tiêu hoàn toàn giật lag 120fps
    return;
  }

  handleCardPointerLeave(cardEl = null) {
    if (this._ps5HeroPreviewTimer) {
      clearTimeout(this._ps5HeroPreviewTimer);
      this._ps5HeroPreviewTimer = null;
    }
    if (cardEl) {
      cardEl.classList.remove("is-hero-previewing");
    }
  }

  previewMovieOnHero(slug, cardEl = null) {
    // Đã vô hiệu hóa để giải phóng GPU và DOM reflow
    return;
  }

  getActiveHeroMovies() {
    const nav = this.currentNav || "kham-pha";
    let pool = [];

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

    if (nav === "anime") {
      const topAnimeSlugs = [
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
      const featured = topAnimeSlugs.map((s) => this.findMovie(s)).filter((m) => m && isWidescreenHd(m));
      const catalogAnime = this.service.movies.filter(
        (m) =>
          ((m.sectionTags && m.sectionTags.includes("anime")) ||
            (m.genres && m.genres.some((g) => /anime|hoạt hình/i.test(g))) ||
            m.countrySlug === "nhat-ban") &&
          isWidescreenHd(m)
      );
      pool = Array.from(new Set([...featured, ...catalogAnime]));
    } else if (nav === "phim-le") {
      const topSingleSlugs = [
        "nhiem-vu-bat-kha-thi-nghiep-bao-phan-2-1",
        "dia-dao-mat-troi-trong-bong-toi",
        "tham-tu-kien-ky-an-khong-dau",
        "nha-gia-tien",
        "cu-roi-tu-than-2-diem-chet",
        "matchbox-phim-dien-anh",
        "dich-nhan-kiet-lang-nhan-kiep"
      ];
      const featured = topSingleSlugs.map((s) => this.findMovie(s)).filter((m) => m && isWidescreenHd(m));
      const catalogSingles = this.service.movies.filter((m) => m.type === "single" && isWidescreenHd(m));
      pool = Array.from(new Set([...featured, ...catalogSingles]));
    } else if (nav === "phim-bo") {
      const topSeriesSlugs = [
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
      const featured = topSeriesSlugs.map((s) => this.findMovie(s)).filter((m) => m && isWidescreenHd(m));
      const catalogSeries = this.service.movies.filter((m) => m.type === "series" && isWidescreenHd(m));
      pool = Array.from(new Set([...featured, ...catalogSeries]));
    } else if (nav === "netflix") {
      const topNetflixSlugs = [
        "tro-choi-con-muc-phan-3",
        "cau-be-mat-tich-phan-5",
        "thu-tu-phan-2",
        "the-gioi-khong-loi-thoat-phan-3",
        "one-piece-nu-hung",
        "bang-chuot-cau-chuyen-tho-san-quai-vat",
        "tho-san-quai-vat-phan-4"
      ];
      const featured = topNetflixSlugs.map((s) => this.findMovie(s)).filter((m) => m && isWidescreenHd(m));
      const netflixMovies = this.service.movies.filter(
        (m) => m.sectionTags && m.sectionTags.includes("netflix") && isWidescreenHd(m)
      );
      pool = Array.from(new Set([...featured, ...netflixMovies]));
    } else if (nav === "viet-nam") {
      pool = this.getMoviesByCountry("viet-nam").filter(isWidescreenHd);
    } else if (nav === "han-quoc") {
      pool = this.getMoviesByCountry("han-quoc").filter(isWidescreenHd);
    } else if (nav === "trung-quoc") {
      pool = this.getMoviesByCountry("trung-quoc").filter(isWidescreenHd);
    } else if (nav === "au-my") {
      pool = this.getMoviesByCountry("au-my").filter(isWidescreenHd);
    } else {
      // Default: Khám Phá (Home) - Ưu tiên các siêu phẩm bom tấn thịnh hành nhất
      const topTrendingHome = [
        "thanh-guom-diet-quy-vo-han-thanh",
        "nhiem-vu-bat-kha-thi-nghiep-bao-phan-2-1",
        "tai-xe-an-danh-phan-3",
        "chainsaw-man-the-movie-chuong-reze",
        "cau-be-mat-tich-phan-5",
        "dia-dao-mat-troi-trong-bong-toi",
        "tham-tu-lung-danh-conan-ngoi-sao-5-canh-1-trieu-do",
        "tro-choi-con-muc-phan-3"
      ];
      const featuredHome = topTrendingHome.map((s) => this.findMovie(s)).filter((m) => m && isWidescreenHd(m));
      pool = Array.from(new Set([...featuredHome, ...(this.heroMovies || []), ...this.service.movies.filter(isWidescreenHd)]));
    }

    if (!pool || pool.length === 0) {
      pool = this.heroMovies && this.heroMovies.length > 0 ? this.heroMovies : this.service.movies;
    }

    return pool.slice(0, 8);
  }

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
  }

  renderHeroHTML(customMovie = null, customKicker = "Thịnh Hành") {
    const heroList = this.getActiveHeroMovies();
    const movie = customMovie || heroList[this.heroIndex % heroList.length] || heroList[0] || this.service.movies[0];
    if (!movie) return "";
    const inMyList = this.isInMyList(movie);
    const cleanSynopsis = (movie.synopsis || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const matchScore = movie.matchScore || (95 + ((movie.title || "").length % 5));
    const imdbScore = movie.rating ? Number(movie.rating).toFixed(1) : ((matchScore / 10).toFixed(1));
    const tmdbScore = (Number(imdbScore) > 1 ? (Number(imdbScore) * 0.94).toFixed(1) : "8.2");
    const saveSlot = this.getMovieLatestSaveSlot(movie);
    const primaryPlayEp = saveSlot ? saveSlot.epIndex : 0;
    const primaryPlayLabel = saveSlot ? `Tiếp Tục ${saveSlot.epLabel}` : "Xem Ngay";
    const statusText = movie.type === "series" ? (movie.episodeCurrent || "Phim Bộ") : (movie.duration || "Hoàn Tất (Full)");

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
            <div class="cinema-hero-sub">${movie.originTitle || movie.title} ${movie.year ? `(${movie.year})` : ""}</div>

            <div class="cinema-meta-badges">
              <span class="cinema-badge badge-imdb"><i class="fab fa-imdb"></i> IMDb ${imdbScore}</span>
              <span class="cinema-badge badge-tmdb"><i class="fas fa-star"></i> TMDb ${tmdbScore}</span>
              <span class="cinema-badge badge-res">${movie.quality || "4K"}</span>
              <span class="cinema-badge badge-year">${movie.year || 2026}</span>
              <span class="cinema-badge badge-status">${statusText}</span>
            </div>

            <div class="cinema-genre-pills">
              ${(movie.genres || []).slice(0, 4).map((g) => `<span class="cinema-genre-pill">${g}</span>`).join("")}
            </div>

            ${this.renderPs5HeroSavesHTML(movie)}

            <p class="cinema-hero-desc">${cleanSynopsis}</p>

            <div class="cinema-hero-actions">
              <button class="cinema-play-glow-btn" onclick="app.openMovieModal('${movie.slug}', true, ${primaryPlayEp})" title="${primaryPlayLabel}">
                <i class="fas fa-play"></i>
              </button>
              <div class="cinema-action-capsule">
                <button class="cinema-capsule-btn ${inMyList ? "favorited" : ""}" onclick="app.toggleMyList('${movie.slug}', event)" title="${inMyList ? "Đã Lưu Phim" : "Lưu Phim Yêu Thích"}">
                  <i class="${inMyList ? "fas fa-star" : "far fa-star"}"></i>
                </button>
                <span class="cinema-capsule-divider"></span>
                <button class="cinema-capsule-btn" onclick="app.openMovieModal('${movie.slug}', false)" title="Chi Tiết Phim & Danh Sách Tập">
                  <i class="fas fa-circle-info"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="cinema-hero-thumbnails" aria-label="Phim nổi bật">
            ${thumbMovies.map((hm, i) => {
              const isActive = customMovie ? hm.slug === movie.slug : hm.slug === movie.slug || i === this.heroIndex;
              const thumbUrl = this.getMovieBackdrop(hm) || this.getMoviePoster(hm);
              const fallbackUrl = this.getMoviePoster(hm) || thumbUrl;
              return `
                <div class="cinema-thumb-card ${isActive ? "active" : ""}" onclick="app.setHeroSlide(${i})" title="${hm.title}">
                  <img src="${thumbUrl}" alt="${hm.title}" fetchpriority="high" decoding="async"
                       onerror="if(this.src!=='${fallbackUrl}'){this.src='${fallbackUrl}';}else{this.onerror=null;this.src='https://phimimg.com/upload/vod/20241229-1/309e1f1623755fa993140a83167f577b.jpg';}" />
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </section>
    `;
  }

  renderVisionTrailerCardHTML(movie, idx = 0) {
    const staggerIdx = Math.min(typeof idx === "number" ? idx : 0, 7);
    return `
      <article class="vision-trailer-card"
               style="--card-stagger: ${staggerIdx};"
               onpointerenter="app.handleCardPointerEnter('${movie.slug}', this)"
               onpointerleave="app.handleCardPointerLeave(this)"
               onclick="app.openMovieModal('${movie.slug}', true)">
        <img src="${this.getMovieBackdrop(movie)}" alt="${movie.title}" loading="lazy" fetchpriority="low" decoding="async"
             onerror="this.onerror=null;this.src='https://phimimg.com/upload/vod/20250722-1/16ea0557ca40cd54a3d25c6750a65c0b.jpg'" />
        <div class="vision-trailer-overlay">
          <div class="vision-trailer-title">${movie.title}</div>
          <button class="vision-trailer-play" onclick="event.stopPropagation(); app.openMovieModal('${movie.slug}', true)" aria-label="Phát">
            <i class="fas fa-play"></i>
          </button>
        </div>
      </article>
    `;
  }

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
          <img class="vision-continue-thumb" src="${this.getMoviePoster(movie)}" alt="${movie.title}" loading="lazy" decoding="async" />
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
  }

  renderVisionFeatureCardHTML(movie, index = 99) {
    const inMyList = this.isInMyList(movie);
    const isAboveFold = index < 4;
    const loadAttr = isAboveFold
      ? `loading="eager" fetchpriority="high" decoding="async"`
      : `loading="lazy" fetchpriority="low" decoding="async"`;
    const primaryGenre = (movie.genres && movie.genres[0]) || (movie.type === "series" ? "Phim Bộ" : "Điện Ảnh");
    const staggerIdx = Math.min(index, 7);
    return `
      <article class="vision-feature-card"
               style="--card-stagger: ${staggerIdx};"
               onpointerenter="app.handleCardPointerEnter('${movie.slug}', this)"
               onpointerleave="app.handleCardPointerLeave(this)"
               onclick="app.openMovieModal('${movie.slug}', true)">
        <img class="vision-feature-img" src="${this.getMoviePoster(movie)}" alt="${movie.title}" ${loadAttr}
             onerror="this.onerror=null;this.src='https://phimimg.com/upload/vod/20250722-1/66ee196318069c6ede9450a5f76a4648.jpg'" />
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
  }

  renderGenreChipsHTML() {
    return "";
  }

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
  }

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
  }

  renderAppleCharts3ColSection() {
    if (!this.chartsCache) this.buildFastIndexes();
    const { newSingles, newSeries, topRated } = this.chartsCache;

    const renderList = (items) =>
      items
        .map(
          (m, idx) => `
        <div class="chart-row-item" onclick="app.openMovieModal('${m.slug}', false)">
          <span class="chart-rank-num">${idx + 1}</span>
          <img class="chart-thumb" src="${m.poster}" alt="${m.title}" loading="lazy" decoding="async" />
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
  }

  renderMovieCardHTML(movie, rankNum = null, index = 0) {
    const inMyList = this.isInMyList(movie);
    const is4k = Boolean(
      (movie.quality && movie.quality.toString().toUpperCase() === "4K") &&
      (Array.isArray(movie.sectionTags) && movie.sectionTags.includes("4k"))
    );
    const qualityBadge = is4k
      ? `<span class="ribbon-quality ribbon-4k"><i class="fas fa-sparkles"></i> 4K</span>`
      : `<span class="ribbon-quality ribbon-1080">Full HD</span>`;
    const epText = movie.type === "series"
      ? (movie.episodeCurrent || "Tập mới")
      : (this.getMovieLanguageLabel(movie).split("+")[0].trim() || "Full");
    const staggerIdx = Math.min(typeof index === "number" ? index : 0, 11);

    return `
      <article class="movie-card ${rankNum ? "ranked-card" : ""}"
               style="--card-stagger: ${staggerIdx};"
               onclick="app.openMovieModal('${movie.slug}', true)">
        <div class="movie-poster-wrap">
          <img src="${this.getMoviePoster(movie)}" alt="${movie.title}" loading="lazy" decoding="async"
               onerror="this.onerror=null;this.src='https://phimimg.com/upload/vod/20250722-1/66ee196318069c6ede9450a5f76a4648.jpg'" />
          <div class="poster-badges-top">
            ${qualityBadge}
            <span class="ribbon-ep">${epText}</span>
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
  }

  /* ==========================================================================
     NETFLIX-STYLE MOVIE DETAIL MODAL & HLS STREAMING PLAYER
     ========================================================================== */
  warmUpMovieStream(slugOrMovie, epIndex = 0) {
    try {
      const movie = typeof slugOrMovie === "string" ? this.findMovie(slugOrMovie) : slugOrMovie;
      if (!movie) return;
      const ep = movie.episodes?.[epIndex] || movie.episodes?.[0];
      const rawUrl = ep?.source || movie.nguoncEpisodes?.[epIndex]?.source || "";
      const streamUrl = this.unwrapM3u8Url(rawUrl);
      if (!streamUrl || !streamUrl.startsWith("http")) return;

      // 1. Preconnect tới CDN của luồng .m3u8 ngay khi rê chuột / chạm nhẹ vào thẻ phim
      const parsed = new URL(streamUrl);
      const origin = parsed.origin;
      if (origin && !this._preconnectedOrigins.has(origin) && typeof document !== "undefined") {
        this._preconnectedOrigins.add(origin);
        const link = document.createElement("link");
        link.rel = "preconnect";
        link.href = origin;
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      }

      // 2. Prefetch ngầm master playlist .m3u8 vào bộ nhớ đệm RAM để bấm Phát là chạy tức thì (< 100ms)
      if (!this._m3u8PrefetchCache.has(streamUrl) && this._m3u8PrefetchCache.size < 40) {
        this._m3u8PrefetchCache.set(streamUrl, null);
        fetch(streamUrl, { mode: "cors" })
          .then((r) => (r.ok ? r.text() : ""))
          .then((txt) => {
            if (txt && txt.includes("#EXTM3U")) {
              this._m3u8PrefetchCache.set(streamUrl, txt);
            } else {
              this._m3u8PrefetchCache.delete(streamUrl);
            }
          })
          .catch(() => {
            this._m3u8PrefetchCache.delete(streamUrl);
          });
      }
    } catch (_) {}
  }

  async openMovieModal(slug, autoPlay = true, epIndex = 0) {
    const movie = this.findMovie(slug);
    if (!movie) return;

    // Tạm dừng bộ xoay Hero ở nền khi đang mở rạp phim để giải phóng 100% GPU cho trình phát video
    if (this.heroTimer) {
      clearInterval(this.heroTimer);
      this.heroTimer = null;
    }

    this.warmUpMovieStream(movie, epIndex);

    const shouldAutoPlay = Boolean(autoPlay || this.settings?.autoPlayOnOpen);
    const defaultSrv = this.settings?.defaultServer || "hls-1";

    this.stopModalVideo();
    this.selectedMovie = movie;
    this.currentEpisodeIndex = epIndex;
    this.currentQuality = this.settings?.defaultQuality || "native-max";
    this.lightsOff = Boolean(this.settings?.defaultLightsOff);
    this.ActiveModalTab = "related"; // Luôn ưu tiên hiển thị Nội dung tương tự kiểu Netflix + Tập phim
    this.updateAmbientBackdrop(movie);

    const modalBackdrop = document.getElementById("movieDetailModal");
    if (!modalBackdrop) return;

    // Chuẩn bị sẵn đầy đủ các slot tập phim tức thì 0ms (không bao giờ để người dùng phải chờ tải)
    this.prepareMovieEpisodeSlots(movie);

    this.renderModalContent(movie, shouldAutoPlay);
    modalBackdrop.classList.add("open");
    modalBackdrop.classList.toggle("lights-off", this.lightsOff);
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-open");

    // Kéo lên đầu Modal tức thì không trễ
    modalBackdrop.scrollTop = 0;
    const sheet = document.getElementById("movieDetailSheet");
    if (sheet) {
      sheet.scrollTop = 0;
      sheet.classList.remove("modal-movie-switch", "ps5-modal-anim");
      requestAnimationFrame(() => {
        sheet.classList.add("modal-movie-switch", "ps5-modal-anim");
      });
    }

    const prevEpSource = this.unwrapM3u8Url(movie.episodes?.[epIndex]?.source || "");

    if (shouldAutoPlay) {
      // Khi tự động phát, startVideoPlayback đã tự đảm nhiệm việc phát 0ms và làm giàu ngầm, tránh gọi trùng lặp gây khởi động lại luồng video
      this.startVideoPlayback(movie, epIndex, defaultSrv);
      return;
    }

    this.isPlaying = false;
    this.setNowPlayingBar(movie, epIndex, false);

    // Làm giàu dữ liệu nguồn phát ngầm (Background Enrich) từ API khi mở xem chi tiết (chưa bấm phát)
    const initialEp = movie.episodes?.[epIndex] || movie.episodes?.[0];
    const needsApiSync = !movie._isEnriched || !initialEp?.source || initialEp?.needsEnrich || (movie.type === "series" && movie.episodes?.length <= 1);

    if (needsApiSync) {
      this.service.enrichMovieStreams(movie, false).then((enriched) => {
        if (this.selectedMovie && this.selectedMovie.slug === enriched.slug) {
          const langText = document.getElementById("modalLanguageText");
          if (langText) langText.textContent = this.getMovieLanguageLabel(enriched);
          const isPlayingNow = document.getElementById("activeVideoContainer")?.classList.contains("playing");
          if (!isPlayingNow) {
            this.refreshEpisodesInModal(enriched);
            this.renderServerButtons(enriched, this.currentEpisodeIndex);
            this.renderDynamicQualityButtons();
          } else {
            this.renderServerButtons(enriched, this.currentEpisodeIndex);
            const newEpSource = this.unwrapM3u8Url(enriched.episodes?.[this.currentEpisodeIndex]?.source || "");
            if (!prevEpSource && newEpSource && this.currentServerMode === "hls-1") {
              this.startVideoPlayback(enriched, this.currentEpisodeIndex, "hls-1");
            }
          }
        }
      });
    }
  }

  prepareMovieEpisodeSlots(movie) {
    if (!movie || movie.type !== "series") return;
    movie.episodes = movie.episodes || [];
    let expected = 0;
    if (typeof movie.episodeTotal === "number" && movie.episodeTotal > 0 && movie.episodeTotal <= 300) {
      expected = movie.episodeTotal;
    }
    const currentStr = String(movie.episodeCurrent || "");
    const match = currentStr.match(/(\d+)/);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (parsed > expected && parsed <= 300) expected = parsed;
    }

    if (expected > movie.episodes.length) {
      const startIdx = movie.episodes.length + 1;
      for (let i = startIdx; i <= expected; i++) {
        movie.episodes.push({
          name: `Tập ${i}`,
          slug: `tap-${i}`,
          source: "",
          needsEnrich: true
        });
      }
    }
  }

  closeMovieModal() {
    const modalBackdrop = document.getElementById("movieDetailModal");
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove("open");
    modalBackdrop.classList.remove("lights-off");
    document.getElementById("movieDetailSheet")?.classList.remove("apple-theater-mode");
    document.body.classList.remove("video-cursor-hidden");
    if (this._appleControlsTimeout) {
      clearTimeout(this._appleControlsTimeout);
      this._appleControlsTimeout = null;
    }
    this.lightsOff = false;
    document.body.style.overflow = "";
    document.body.classList.remove("modal-open");
    this.stopModalVideo();
    this.isPlaying = false;
    this.startHeroAutoRotate();
    if (this.playingMovie || this.selectedMovie) {
      this.setNowPlayingBar(this.playingMovie || this.selectedMovie, this.currentEpisodeIndex, false);
    }
  }

  minimizeToMiniPlayer() {
    if (this.selectedMovie) {
      this.setNowPlayingBar(this.selectedMovie, this.currentEpisodeIndex, true);
      this.showToast(`Đang thu nhỏ "${this.selectedMovie.title}" xuống thanh phát Ngwyren Cinema`);
    }
    this.closeMovieModal();
  }

  formatEpisodeLabel(name, fallback = "Tập 1") {
    if (!name) return fallback;
    const str = String(name).trim();
    if (/^tập$/i.test(str)) return "Tập 1";
    if (/^tập\s*mới$/i.test(str)) return "Tập Mới";
    if (/^hoàn$/i.test(str) || /^full$/i.test(str) || /^trọn\s*bộ$/i.test(str)) return "Trọn Bộ";
    const matchTapNum = str.match(/^tập\s*(\d+.*)$/i);
    if (matchTapNum) {
      return `Tập ${matchTapNum[1]}`;
    }
    const matchEpNum = str.match(/^ep(?:isode)?\s*(\d+.*)$/i);
    if (matchEpNum) {
      return `Tập ${matchEpNum[1]}`;
    }
    // Chuẩn hóa viết hoa chữ cái đầu tiên, không để nguyên khối viết hoa
    if (str === str.toUpperCase() && str.length > 2) {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    return str;
  }

  getPlayButtonHTML(movie, epIndex) {
    const savedProg = this.getPlaybackProgress(movie.slug, epIndex);
    if (savedProg && savedProg.currentTime > 10 && savedProg.percentage < 95) {
      return `<i class="fas fa-play"></i> Tiếp tục từ ${this.formatSeconds(savedProg.currentTime)} (${savedProg.percentage}%)`;
    }
    const currentEp = (movie.episodes && movie.episodes[epIndex]) || (movie.episodes && movie.episodes[0]);
    if (!currentEp || !currentEp.name) {
      return `<i class="fas fa-play"></i> Phát Ngay`;
    }
    const epLabel = this.formatEpisodeLabel(currentEp.name, "Tập 1");
    if (!epLabel || epLabel === "Tập" || epLabel === "TẬP") {
      return `<i class="fas fa-play"></i> Phát Ngay`;
    }
    return `<i class="fas fa-play"></i> Phát ${epLabel}`;
  }

  getMovieBackdrop(movie) {
    if (!movie) return "";
    let b = movie.backdrop || "";
    if (b.includes("20240807-1/f4b1d683a48e8e7428863f64c1ad6161.jpg") || b.includes("img-2edeaab3f6c4fad2efa3f86568c7e77d478f927de1bd1d9f362b806bde49d7c9")) {
      b = "https://phimimg.com/upload/vod/20250827-1/eddefbf4813488f89a6f0c766f69f82f.jpg";
      movie.backdrop = b;
    }
    if (b.includes("df397df5febe232a5dfae961b866c1ef.jpg") || (movie.slug && movie.slug.includes("tau-ngam-sat-mau-den") && (!b || b.includes("20230919-1")))) {
      b = "https://phimimg.com/upload/vod/20231016-1/6a45585d457b3d77e91cbe7757f28c94.jpg";
      movie.backdrop = b;
    }
    if (movie._cachedBackdrop) return movie._cachedBackdrop;
    const isSuspicious = !b ||
      (movie.poster && b === movie.poster) ||
      b.includes("animevietsub") ||
      b.includes("animevsub") ||
      b.includes("data/poster") ||
      b.includes("-poster.") ||
      b.includes("/poster/") ||
      b.endsWith("-poster.webp") ||
      b.endsWith("-poster.jpg");

    if (!isSuspicious) {
      movie._cachedBackdrop = b;
      return b;
    }

    const match = this.service?.movies?.find(
      (m) => m && m.backdrop && m.backdrop !== m.poster &&
             !m.backdrop.includes("data/poster") && !m.backdrop.includes("-poster.") &&
             (m.slug === movie.slug || m.title === movie.title || m.originTitle === movie.originTitle ||
              (m.crawlSlug && movie.crawlSlug && m.crawlSlug === movie.crawlSlug))
    );
    const resolved = (match && match.backdrop) ? match.backdrop : (b || movie.poster || "");
    movie._cachedBackdrop = resolved;
    return resolved;
  }

  getMoviePoster(movie) {
    if (!movie) return "";
    let p = movie.poster || "";
    if (p.includes("20240807-1/9b47e2fa1c0c660e527d216f4ad47f87.jpg") || p.includes("img-aec7d896061b5c2d9a890e9529d1b3d9af793c89fb395b82f9cb86d0631697da")) {
      p = "https://phimimg.com/upload/vod/20250827-1/aabb76a70d8afd21ddf2be37381c7587.jpg";
      movie.poster = p;
    }
    if (p.includes("5fc3521d9be85a9df677cf7d41f17fa3.jpg") || (movie.slug && movie.slug.includes("tau-ngam-sat-mau-den") && (!p || p.includes("20230919-1")))) {
      p = "https://phimimg.com/upload/vod/20231016-1/b015db4de6e3973c7c183880406d2d1f.jpg";
      movie.poster = p;
    }
    if (movie._cachedPoster) return movie._cachedPoster;
    if (p && !p.includes("animevietsub") && !p.includes("animevsub")) {
      movie._cachedPoster = p;
      return p;
    }
    const match = this.service?.movies?.find(
      (m) => m && m.poster && !m.poster.includes("animevietsub") && !m.poster.includes("animevsub") &&
             (m.slug === movie.slug || m.title === movie.title || m.originTitle === movie.originTitle ||
              (m.crawlSlug && movie.crawlSlug && m.crawlSlug === movie.crawlSlug))
    );
    const resolved = (match && match.poster) ? match.poster : (p || movie.backdrop || "");
    movie._cachedPoster = resolved;
    return resolved;
  }

  getMovieLanguageLabel(movie) {
    if (!movie) return "Vietsub";
    const hasRealDub = Boolean(
      (movie.dubEpisodes && movie.dubEpisodes.length > 0) ||
      (movie.episodes && movie.episodes.some((ep) =>
        ep.altSources?.some((a) => {
          const lbl = (a.label || "").toLowerCase();
          return lbl.includes("thuyết minh") || lbl.includes("lồng tiếng") || lbl.includes("thuyet minh") || lbl.includes("long tieng") || lbl.includes("dub");
        })
      ))
    );
    if (hasRealDub) {
      const raw = (movie.language || "").toLowerCase();
      if (raw.includes("lồng tiếng")) {
        return raw.includes("vietsub") ? "Vietsub + Lồng Tiếng" : "Lồng Tiếng";
      }
      return raw.includes("vietsub") ? "Vietsub + Thuyết Minh" : "Thuyết Minh";
    }
    const raw = (movie.language || "").toLowerCase();
    if (raw === "lồng tiếng" && (!movie.episodes || movie.episodes.length === 0)) {
      return "Lồng Tiếng";
    }
    return "Vietsub";
  }

  renderModalContent(movie, isPlayingNow = false) {
    const sheet = document.getElementById("movieDetailSheet");
    if (!sheet) return;
    sheet.className = "detail-modal-sheet ps5-modal-sheet ps5-modal-anim";

    const inMyList = this.isInMyList(movie);
    const relatedItems = this.service.getRelatedMovies(movie, 12);
    const relatedMovieSlugs = new Set(relatedItems.map(item => item.movie?.slug).filter(Boolean));
    relatedMovieSlugs.add(movie.slug);

    const primaryGenre = (movie.genres && movie.genres[0]) || "";
    let sameGenreMovies = [];
    if (primaryGenre) {
      sameGenreMovies = this.service.movies.filter(m => 
        m && m.slug && !relatedMovieSlugs.has(m.slug) && 
        Array.isArray(m.genres) && 
        m.genres.includes(primaryGenre)
      );
    }
    if (sameGenreMovies.length < 12 && Array.isArray(movie.genres)) {
      for (let gIdx = 1; gIdx < movie.genres.length; gIdx++) {
        const extraGenre = movie.genres[gIdx];
        const extraList = this.service.movies.filter(m => 
          m && m.slug && !relatedMovieSlugs.has(m.slug) && 
          !sameGenreMovies.some(sg => sg.slug === m.slug) &&
          Array.isArray(m.genres) && 
          m.genres.includes(extraGenre)
        );
        sameGenreMovies.push(...extraList);
        if (sameGenreMovies.length >= 12) break;
      }
    }
    const finalSameGenreMovies = sameGenreMovies.slice(0, 12);
    const currentEp = movie.episodes[this.currentEpisodeIndex] || movie.episodes[0];
    const backdropUrl = this.getMovieBackdrop(movie);

    sheet.innerHTML = `
      <!-- Top Floating Modal Controls (Chỉ hiện icon chuẩn Apple Vision Pro) -->
      <div class="modal-top-controls">
        <button class="modal-ctrl-btn icon-only ${this.lightsOff ? "active" : ""}" id="lightsOffBtn" onclick="app.toggleLightsOff()" title="${this.lightsOff ? "Bật Đèn" : "Tắt Đèn Rạp"}" aria-label="Tắt Đèn Rạp">
          <i class="fas fa-lightbulb" id="lightsOffIcon"></i>
        </button>
        <button class="modal-ctrl-btn icon-only" onclick="app.minimizeToMiniPlayer()" title="Thu nhỏ xuống thanh Now Playing" aria-label="Thu Nhỏ">
          <i class="fas fa-compress-alt"></i>
        </button>
        <button class="modal-ctrl-btn icon-only" onclick="app.closeMovieModal()" title="Đóng" aria-label="Đóng">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- 16:9 Cinema Stage (Cover Preview + Active HLS/YouTube Player) -->
      <div class="modal-player-stage">
        <div class="player-cover-preview" id="modalCoverPreview"
             style="background-image: url('${backdropUrl}'); ${isPlayingNow ? "display:none;" : ""}">
          <div class="player-cover-content">
            <h2 style="font-size: clamp(1.6rem, 2.8vw, 2.5rem); font-weight: 800; line-height: 1.12; margin-bottom: 6px;">
              ${movie.title}
            </h2>
            <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 18px;">
              ${movie.originTitle} (${movie.year}) • ${movie.duration}
            </p>
            <div class="hero-actions">
              <button class="btn-primary-play" onclick="app.startVideoPlayback(app.selectedMovie, ${this.currentEpisodeIndex}, 'hls-1')">
                ${this.getPlayButtonHTML(movie, this.currentEpisodeIndex)}
              </button>
              ${
                movie.trailerUrl
                  ? `<button class="btn-glass-secondary" onclick="app.startVideoPlayback(app.selectedMovie, ${this.currentEpisodeIndex}, 'trailer')">
                      <i class="fab fa-youtube"></i> Xem Trailer
                    </button>`
                  : ""
              }
              <button class="btn-glass-secondary ${inMyList ? "active" : ""}" id="modalMyListBtn" onclick="app.toggleMyList('${movie.slug}', event)">
                <i class="${inMyList ? "fas fa-star" : "far fa-star"}"></i>
                <span>${inMyList ? "Đã Lưu Yêu Thích" : "Lưu Yêu Thích"}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Active Video Container (Apple Cinema Player - Không viền xanh, chuẩn Apple TV+) -->
        <div class="active-video-container ${isPlayingNow ? "playing" : ""}" id="activeVideoContainer" tabindex="-1">
          <!-- Video Element (đã bỏ controls mặc định của trình duyệt để triệt tiêu hoàn toàn viền xanh khi bấm phím cách) -->
          <video id="hlsVideoElement" class="${this.getQualityVideoClass(this.currentQuality)}" playsinline poster="${backdropUrl}" tabindex="-1"></video>
          <iframe id="trailerIframeElement" style="display: none;" sandbox="allow-scripts allow-same-origin allow-presentation allow-forms" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen tabindex="-1"></iframe>
          <div class="apple-video-buffering-ring" id="appleVideoBufferingRing"></div>

          <!-- Apple Center HUD Pulse: Không vòng tròn, chỉ hiển thị icon -->
          <div class="apple-video-hud" id="appleVideoHud">
            <i class="fas fa-play" id="appleHudIcon"></i>
            <div class="apple-hud-text" id="appleHudText" style="display: none;"></div>
          </div>

          <!-- Nút Bỏ Qua Intro nổi chuẩn Netflix / Apple TV+ -->
          <button type="button" class="apple-skip-intro-btn" id="appleSkipIntroBtn" onclick="app.skipMovieIntro(event)" title="Bỏ qua đoạn mở đầu phim (Phím S)">
            <span>Bỏ qua Intro</span>
            <i class="fas fa-forward"></i>
          </button>

          <!-- Apple Glass Player Overlay Controls (Giao diện điều khiển kính mờ chuẩn Apple visionOS / Apple TV+) -->
          <div class="apple-player-overlay" id="applePlayerOverlay">
            <!-- Click Layer phủ toàn màn hình để Play/Pause và Double click Toàn màn hình -->
            <div class="apple-player-click-layer" id="applePlayerClickLayer"
                 onclick="app.handleAppleVideoClick(event)"
                 ondblclick="app.toggleVideoFullscreen(event)"></div>

            <!-- Thanh đỉnh Apple: Chỉ hiển thị tên phim -->
            <div class="apple-player-topbar" id="applePlayerTopbar">
              <span class="apple-player-movie-name" title="${movie.title}">${movie.title}</span>
            </div>

            <!-- Thanh đáy Apple: Timeline Scrubber + Cụm điều khiển Kính mờ -->
            <div class="apple-player-bottombar" id="applePlayerBottombar">
              <!-- Apple Timeline Scrubber -->
              <div class="apple-scrub-container" id="appleScrubContainer"
                   onmousedown="app.startScrubbing(event)"
                   ontouchstart="app.startScrubbing(event)"
                   onmousemove="app.previewScrubTime(event)"
                   onmouseleave="app.hideScrubTimePreview()">
                <div class="apple-scrub-track">
                  <div class="apple-scrub-buffer" id="appleScrubBuffer"></div>
                  <div class="apple-scrub-fill" id="appleScrubFill"></div>
                  <div class="apple-scrub-thumb" id="appleScrubThumb"></div>
                </div>
                <div class="apple-scrub-tooltip" id="appleScrubTooltip">00:00</div>
              </div>

              <!-- Hàng phím điều khiển Apple -->
              <div class="apple-controls-row">
                <div class="apple-ctrls-left">
                  <!-- Play / Pause Button -->
                  <button class="apple-ctrl-btn apple-play-btn" id="applePlayBtn" onclick="app.toggleVideoPlayPause(event)" title="Phát / Dừng (Phím cách)">
                    <i class="fas fa-play" id="applePlayIcon"></i>
                  </button>

                  <!-- Tua lùi 5 giây -->
                  <button class="apple-ctrl-btn apple-skip-btn" onclick="app.seekRelative(-5, true, event)" title="Tua lùi 5 giây (←)">
                    <i class="fas fa-rotate-left"></i>
                  </button>

                  <!-- Tua tới 5 giây -->
                  <button class="apple-ctrl-btn apple-skip-btn" onclick="app.seekRelative(5, true, event)" title="Tua tới 5 giây (→)">
                    <i class="fas fa-rotate-right"></i>
                  </button>

                  <!-- Tập tiếp theo -->
                  <button class="apple-ctrl-btn apple-next-ep-btn" id="appleNextEpBtn" onclick="app.playNextEpisode(event)" title="Tập tiếp theo (Shift + N)">
                    <i class="fas fa-forward-step"></i>
                  </button>

                  <!-- Điều chỉnh âm lượng dạng trượt Apple -->
                  <div class="apple-volume-cluster" id="appleVolumeCluster">
                    <button class="apple-ctrl-btn" id="appleVolBtn" onclick="app.toggleVideoMute(event)" title="Bật / Tắt âm thanh (M)">
                      <i class="fas fa-volume-high" id="appleVolIcon"></i>
                    </button>
                    <div class="apple-vol-slider-wrap">
                      <input type="range" class="apple-vol-slider" id="appleVolSlider" min="0" max="1" step="0.05" value="1"
                             oninput="app.setVideoVolume(this.value)" />
                    </div>
                  </div>

                  <!-- Đồng hồ thời gian chuẩn Apple TV+ -->
                  <div class="apple-time-box">
                    <span id="appleCurrentTime">00:00</span>
                    <span class="apple-time-divider">/</span>
                    <span id="appleDurationTime">00:00</span>
                  </div>
                </div>

                <div class="apple-ctrls-right">
                  <!-- Tốc độ phát -->
                  <button class="apple-ctrl-btn apple-speed-btn" id="appleSpeedBtn" onclick="app.cyclePlaybackSpeed(event)" title="Tốc độ phát">
                    <span id="appleSpeedText">1.0x</span>
                  </button>

                  <!-- Picture in Picture -->
                  <button class="apple-ctrl-btn" onclick="app.toggleVideoPip(event)" title="Hình trong hình (PiP)">
                    <i class="fas fa-clone"></i>
                  </button>

                  <!-- Toàn màn hình -->
                  <button class="apple-ctrl-btn apple-fs-btn" id="appleFsBtn" onclick="app.toggleVideoFullscreen(event)" title="Toàn màn hình (F)">
                    <i class="fas fa-expand" id="appleFsIcon"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Server & Stream Switcher Toolbar (Multi-Source Server 1 / Server 2 & 4K/2K Quality Switcher) -->
      <div class="player-toolbar" id="playerToolbarContainer">
        <div class="player-toolbar-left" id="playerToolbarServers">
          ${this.buildServerButtonsHTML(movie, this.currentEpisodeIndex)}
        </div>

        <div class="player-toolbar-right">
          <div class="quality-selector-group" id="qualitySelectorGroup" role="group" aria-label="Chọn độ phân giải thực tế">
            ${this.buildQualityButtonsHTML(movie)}
          </div>
          <button class="toolbar-next-ep-btn" id="toolbarNextEpBtn" onclick="app.playNextEpisode(event)" title="Tập tiếp theo (Shift + N)">
            <i class="fas fa-forward-step"></i>
          </button>
        </div>
      </div>

      <!-- Modal Metadata & Netflix-style Related / Episodes Content -->
      <div class="modal-body-content">
        <div class="modal-info-grid">
          <div>
            <div class="hero-meta-pills" style="margin-bottom: 10px;">
              <span class="meta-pill match">${movie.matchScore || 97}% Phù hợp với bạn</span>
              <span class="meta-pill">${movie.year}</span>
              <span class="meta-pill"><i class="fas fa-star"></i> ${movie.rating || 9.2}</span>
              <span class="meta-pill ${movie.quality === "4K" ? "badge-4k" : "badge-1080"}">${movie.quality === "4K" ? "<i class='fas fa-sparkles'></i> 4K Ultra HD" : "Full HD 1080p"}</span>
              <span class="meta-pill" id="modalLanguagePill"><i class="fas fa-volume-up"></i> <span id="modalLanguageText">${this.getMovieLanguageLabel(movie)}</span></span>
            </div>
            ${
              (() => {
                const syn = (movie.synopsis || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
                const isBoilerplate = syn.includes("được cập nhật liên tục tại Ngwyren Cinema") ||
                                      syn.includes("tác phẩm Anime hấp dẫn đang phát sóng");
                if (!syn || isBoilerplate) return "";
                return `<p class="modal-synopsis">${syn}</p>`;
              })()
            }
          </div>

          <div class="modal-cast-meta">
            <div class="meta-line">
              <strong>Đạo diễn:</strong>
              <span class="clickable-tag" onclick="app.filterByPerson('${movie.director.replace(/'/g, "\\'")}')">${movie.director}</span>
            </div>
            <div class="meta-line">
              <strong>Diễn viên:</strong>
              ${movie.cast
                .map(
                  (actor) =>
                    `<span class="clickable-tag" onclick="app.filterByPerson('${actor.replace(/'/g, "\\'")}')">${actor}</span>`
                )
                .join(", ")}
            </div>
            <div class="meta-line">
              <strong>Thể loại:</strong>
              ${movie.genres
                .map(
                  (g) =>
                    `<span class="clickable-tag" onclick="app.filterByGenreFromModal('${g}')">${g}</span>`
                )
                .join(", ")}
            </div>
            <div class="meta-line">
              <strong>Quốc gia:</strong>
              <span class="clickable-tag" onclick="app.closeMovieModal(); app.setNavigation('${movie.countrySlug}')">${movie.country}</span>
            </div>
          </div>
        </div>

        <!-- Episode Selector Section (Always visible for quick access) -->
        <div>
          <div class="episodes-header-bar">
            <h3 style="font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-list-ul"></i>
              Danh Sách Tập Phim (${movie.episodes.length} tập)
            </h3>
            <span style="font-size: 0.8rem; color: var(--text-tertiary);">
              Trạng thái: <strong style="color: #ffffff;">${movie.episodeCurrent}</strong>
            </span>
          </div>
          <div class="episodes-grid" id="modalEpisodesGrid">
            ${this.renderEpisodesPillsHTML(movie)}
          </div>
        </div>

        <!-- Netflix-Style Tabs: Nội Dung Tương Tự (More Like This) & Thông Tin -->
        <div>
          <div class="modal-tabs-nav">
            <button class="modal-tab-btn active" id="tabBtnRelated" onclick="app.switchModalTab('related')">
              <i class="fas fa-wand-magic-sparkles"></i>
              Nội Dung Tương Tự (Giống Phim Này)
            </button>
            <button class="modal-tab-btn" id="tabBtnFranchise" onclick="app.switchModalTab('franchise')">
              <i class="fas fa-layer-group"></i>
              Cùng Thể Loại ${movie.genres[0] || ""}
            </button>
          </div>

          <!-- Tab Panel 1: Related Movies Grid (Chỉ hiện ảnh bìa & ghi thông tin gọn lại) -->
          <div id="modalTabPanelRelated" style="padding-top: 20px;">
            <div class="movie-grid">
              ${relatedItems
                .map(({ movie: rel }, idx) => this.renderMovieCardHTML(rel, null, idx))
                .join("")}
            </div>
          </div>

          <!-- Tab Panel 2: Same Genre Grid (Khác biệt 100%, không bao giờ trùng với Tab 1) -->
          <div id="modalTabPanelFranchise" style="padding-top: 20px; display: none;">
            <div class="movie-grid">
              ${finalSameGenreMovies
                .map((m, idx) => this.renderMovieCardHTML(m, null, idx))
                .join("")}
            </div>
          </div>
        </div>
      </div>
    `;
    this.updateNextEpisodeButton(movie, this.currentEpisodeIndex);
  }

  renderEpisodesPillsHTML(movie) {
    return movie.episodes
      .map(
        (ep, idx) => `
      <button class="ep-pill-btn ${idx === this.currentEpisodeIndex ? "active" : ""}"
              style="--ep-stagger: ${Math.min(idx, 20)};"
              onclick="app.startVideoPlayback(app.selectedMovie, ${idx}, app.currentServerMode || 'hls-1')">
        <span>${this.formatEpisodeLabel(ep.name, "Tập " + (idx + 1))}</span>
        <i class="fas ${idx === this.currentEpisodeIndex ? "fa-volume-high" : "fa-play"}" style="font-size: 0.72rem;"></i>
      </button>
    `
      )
      .join("");
  }

  refreshEpisodesInModal(movie) {
    const grid = document.getElementById("modalEpisodesGrid");
    if (grid && movie && Array.isArray(movie.episodes)) {
      const buttons = grid.children;
      if (buttons.length === movie.episodes.length) {
        for (let i = 0; i < buttons.length; i++) {
          const isAct = i === this.currentEpisodeIndex;
          const btn = buttons[i];
          if (btn.classList.contains("active") !== isAct) {
            btn.classList.toggle("active", isAct);
            const icon = btn.querySelector("i");
            if (icon) {
              icon.className = `fas ${isAct ? "fa-volume-high" : "fa-play"}`;
            }
          }
        }
      } else {
        grid.innerHTML = this.renderEpisodesPillsHTML(movie);
      }
    }
    this.updateNextEpisodeButton(movie, this.currentEpisodeIndex);
  }

  switchModalTab(tabName) {
    document.getElementById("tabBtnRelated")?.classList.toggle("active", tabName === "related");
    document.getElementById("tabBtnFranchise")?.classList.toggle("active", tabName === "franchise");
    const p1 = document.getElementById("modalTabPanelRelated");
    const p2 = document.getElementById("modalTabPanelFranchise");
    if (p1) p1.style.display = tabName === "related" ? "block" : "none";
    if (p2) p2.style.display = tabName === "franchise" ? "block" : "none";
  }

  /* ==========================================================================
     HLS (.M3U8) AD-BLOCKER & MULTI-SERVER STREAMING ENGINE
     ========================================================================== */
  initGlobalAdBlocker() {
    if (window._adBlockerInitialized) return;
    window._adBlockerInitialized = true;
    const originalWindowOpen = window.open;
    window.open = function (url, target, features) {
      if (typeof url === "string") {
        const u = url.toLowerCase();
        const isAllowed = u.includes("youtube.com") || u.includes("google.com") || u.includes("github.com") || u.includes("accounts.google.com");
        if (!isAllowed) {
          console.warn("[AdBlocker] Đã chặn popup quảng cáo nhảy trang:", url);
          return null;
        }
      }
      return originalWindowOpen.call(window, url, target, features);
    };

    // Chặn triệt để các mã script quảng cáo, nhà cái cá cược chèn ngầm vào DOM
    const adPatterns = ["i999", "cwin", "nohu", "kubet", "thabet", "baccarat", "popads", "propellerads", "adsterra", "exoclick", "adtrue"];
    const originalAppendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function (child) {
      if (child && (child.tagName === "SCRIPT" || child.tagName === "IFRAME")) {
        const src = (child.src || "").toLowerCase();
        if (adPatterns.some((pattern) => src.includes(pattern))) {
          console.warn("[AdBlocker] Đã chặn phần tử quảng cáo chèn ngầm:", src);
          return child;
        }
      }
      return originalAppendChild.apply(this, arguments);
    };
  }

  cleanHlsAdSegments(playlistText) {
    if (!playlistText || typeof playlistText !== "string" || !playlistText.includes("#EXTM3U")) {
      return playlistText;
    }
    const lines = playlistText.split(/\r?\n/);
    const cleanLines = [];

    const isAdSegment = (uri) => {
      if (!uri || typeof uri !== "string") return false;
      const u = uri.trim();
      // Khử chính xác phân đoạn video quảng cáo cờ bạc chèn vào luồng:
      // Định dạng quảng cáo: /(v7|v8|convertv)/[hash 16-64 hex]/segment_XXXX.ts hoặc domain cờ bạc
      // TUYỆT ĐỐI KHÔNG chạm vào các phân đoạn phim gốc dạng convertv7/[8-ky-tu].ts hoặc convertv8/[8-ky-tu].ts
      if (/\/(?:v\d+|convertv\d*)\/[a-f0-9]{16,64}\/segment_\d+\.ts/i.test(u)) return true;
      if (/https?:\/\/[^\/]+\/(?:v\d+|convertv\d*)\/[a-f0-9]{16,64}\/segment_\d+\.ts/i.test(u)) return true;
      if (/(?:9922|i999|cwin|nohu|casinopromo|shbet|789bet|jun88|hi88|okvip|f8bet|new88)\.com/i.test(u)) return true;
      return false;
    };

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // Nếu gặp #EXT-X-DISCONTINUITY mà phân đoạn tiếp theo là quảng cáo -> bỏ qua toàn bộ khối quảng cáo và thẻ đóng
      if (line.trim() === "#EXT-X-DISCONTINUITY") {
        let peek = i + 1;
        while (peek < lines.length && lines[peek].startsWith("#")) {
          peek++;
        }
        if (peek < lines.length && isAdSegment(lines[peek])) {
          // Bỏ qua toàn bộ các phân đoạn quảng cáo liên tiếp cùng các thẻ #EXT-X-KEY / #EXTINF bên trong khối quảng cáo
          let cursor = i + 1;
          while (cursor < lines.length) {
            const curTrim = lines[cursor].trim();
            if (curTrim === "#EXT-X-DISCONTINUITY") {
              cursor++;
              // Bỏ qua các thẻ #EXT-X-DISCONTINUITY trùng lặp ngay sau khối quảng cáo
              while (cursor < lines.length && lines[cursor].trim() === "#EXT-X-DISCONTINUITY") {
                cursor++;
              }
              break;
            }
            if (!curTrim.startsWith("#") && curTrim !== "" && !isAdSegment(curTrim)) {
              break;
            }
            cursor++;
          }
          i = cursor;
          continue;
        }

        // Gộp các thẻ #EXT-X-DISCONTINUITY bị lặp kép liên tiếp (ví dụ trong cụm convertv7/ hoặc convertv8/) thành 1 thẻ duy nhất
        // để HLS.js không tạo ra miền continuity counter (cc) rỗng gây nhảy cóc hoặc cắt mất vài giây phim
        if (cleanLines.length > 0 && cleanLines[cleanLines.length - 1].trim() === "#EXT-X-DISCONTINUITY") {
          i++;
          continue;
        }
      }

      // Nếu gặp phân đoạn quảng cáo (#EXTINF) không có #EXT-X-DISCONTINUITY mở đầu
      if (line.startsWith("#EXTINF:")) {
        let peek = i + 1;
        while (peek < lines.length && lines[peek].startsWith("#") && !lines[peek].startsWith("#EXTINF:")) {
          peek++;
        }
        if (peek < lines.length && isAdSegment(lines[peek])) {
          i = peek + 1;
          while (i < lines.length && lines[i].trim() === "#EXT-X-DISCONTINUITY") {
            i++;
          }
          continue;
        }
      }

      if (isAdSegment(line)) {
        i++;
        continue;
      }

      cleanLines.push(line);
      i++;
    }

    return cleanLines.join("\n");
  }

  async readFirstVideoPtsFromTs(segUrl) {
    if (!segUrl) return null;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 950);
    try {
      const res = await fetch(segUrl, {
        signal: ctrl.signal,
        headers: { Range: "bytes=0-4095" }
      });
      if (!res.ok) return null;
      let buf = null;
      if (res.body && typeof res.body.getReader === "function") {
        const reader = res.body.getReader();
        const chunks = [];
        let total = 0;
        while (total < 3760) {
          const { done, value } = await reader.read();
          if (done || !value) break;
          chunks.push(value);
          total += value.byteLength;
        }
        try {
          reader.cancel();
        } catch (_) {}
        buf = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) {
          buf.set(c, offset);
          offset += c.byteLength;
        }
      } else {
        const ab = await res.arrayBuffer();
        buf = new Uint8Array(ab, 0, Math.min(ab.byteLength, 3760));
      }
      if (!buf || buf.length < 376) return null;

      let sync = 0;
      for (let s = 0; s < 188 && s + 188 < buf.length; s++) {
        if (buf[s] === 0x47 && buf[s + 188] === 0x47) {
          sync = s;
          break;
        }
      }

      for (let i = sync; i + 188 <= buf.length; i += 188) {
        if (buf[i] !== 0x47) continue;
        const pusi = (buf[i + 1] >> 6) & 1;
        if (!pusi) continue;
        const afc = (buf[i + 3] >> 4) & 3;
        let pos = i + 4;
        if (afc === 2 || afc === 3) {
          pos += 1 + buf[pos];
        }
        if (pos + 14 <= i + 188 && buf[pos] === 0x00 && buf[pos + 1] === 0x00 && buf[pos + 2] === 0x01) {
          const streamId = buf[pos + 3];
          if (streamId >= 0xe0 && streamId <= 0xef) {
            const flags = (buf[pos + 7] >> 6) & 3;
            if (flags === 3 && pos + 19 <= i + 188) {
              const d0 = buf[pos + 14], d1 = buf[pos + 15], d2 = buf[pos + 16], d3 = buf[pos + 17], d4 = buf[pos + 18];
              const dts = ((d0 & 0x0e) * 536870912) + (d1 * 4194304) + ((d2 & 0xfe) * 16384) + (d3 * 128) + ((d4 >> 1) & 0x7f);
              return dts / 90000;
            }
            if (flags >= 2) {
              const b0 = buf[pos + 9], b1 = buf[pos + 10], b2 = buf[pos + 11], b3 = buf[pos + 12], b4 = buf[pos + 13];
              const pts = ((b0 & 0x0e) * 536870912) + (b1 * 4194304) + ((b2 & 0xfe) * 16384) + (b3 * 128) + ((b4 >> 1) & 0x7f);
              return pts / 90000;
            }
          }
        }
      }
      return null;
    } catch (_) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  calibrateHlsPlaylistTimestampsSync(playlistText, playlistUrl) {
    // Chỉ hiệu chuẩn tỷ lệ khung hình 23.976fps cho riêng luồng Jumper (2008) bị lệch metadata,
    // tuyệt đối không biến đổi #EXTINF của các phim khác để tránh lệch PTS gây giật/khựng hình
    const isJumperStream =
      (this.selectedMovie && this.selectedMovie.slug && this.selectedMovie.slug.includes("jumper")) ||
      (playlistUrl && playlistUrl.includes("e24fa24c0056d57c5e142759eb05ba2b"));
    if (
      !isJumperStream ||
      !playlistText ||
      !playlistText.includes("#EXTINF:3.14") ||
      !playlistText.includes("#EXT-X-DISCONTINUITY") ||
      playlistText.includes("#EXT-X-STREAM-INF")
    ) {
      return playlistText;
    }
    if (playlistUrl && this._calibratedPlaylistsCache && this._calibratedPlaylistsCache.has(playlistUrl)) {
      return this._calibratedPlaylistsCache.get(playlistUrl);
    }
    try {
      const scale = 1001 / 960;
      let seenFirstSeg = false;
      const lines = playlistText.split(/\r?\n/);
      const calibratedLines = lines.map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("#EXTINF:")) {
          const rawVal = parseFloat(trimmed.slice(8).split(",")[0]);
          if (rawVal > 0) {
            if (!seenFirstSeg) {
              seenFirstSeg = true;
              const baseVal = Math.abs(rawVal - 3.14) < 0.01 ? 3.0 : rawVal;
              return `#EXTINF:${(baseVal * scale).toFixed(5)},`;
            }
            return `#EXTINF:${(rawVal * scale).toFixed(5)},`;
          }
        }
        return line;
      });
      const out = calibratedLines.join("\n");
      if (playlistUrl && this._calibratedPlaylistsCache) {
        this._calibratedPlaylistsCache.set(playlistUrl, out);
      }
      return out;
    } catch (_) {
      return playlistText;
    }
  }

  createAdFreePlaylistLoader() {
    const self = this;
    if (!window.Hls || !window.Hls.DefaultConfig || !window.Hls.DefaultConfig.loader) return undefined;
    return class extends window.Hls.DefaultConfig.loader {
      constructor(config) {
        super(config);
        const origLoad = this.load.bind(this);
        this.load = (context, cfg, callbacks) => {
          const origSuccess = callbacks.onSuccess;
          callbacks.onSuccess = (response, stats, ctx, networkDetails) => {
            if (response && typeof response.data === "string" && response.data.includes("#EXTM3U")) {
              const targetUrl = (response && response.url) || (ctx && ctx.url) || (context && context.url) || "";
              const cleaned = self.cleanHlsAdSegments(response.data);
              response.data = self.calibrateHlsPlaylistTimestampsSync(cleaned, targetUrl);
            }
            if (origSuccess) origSuccess(response, stats, ctx, networkDetails);
          };
          origLoad(context, cfg, callbacks);
        };
      }
    };
  }

  renderServerButtons(movie, epIndex = 0) {
    const el = document.getElementById("playerToolbarServers");
    const toolbar = document.getElementById("playerToolbarContainer");
    if (el) {
      el.innerHTML = this.buildServerButtonsHTML(movie, epIndex);
    }
    if (toolbar) {
      toolbar.classList.remove("has-server-rack");
    }
  }

  buildServerButtonsHTML(movie, epIndex = 0) {
    if (!movie) return "";
    const ep = movie.episodes?.[epIndex] || movie.episodes?.[0];
    const hasEmbed2 = Boolean(movie.nguoncEpisodes && movie.nguoncEpisodes.length > 0) || Boolean(ep?.embed);
    const hasDub = Boolean(movie.dubEpisodes && movie.dubEpisodes.length > 0);

    return `
      <button class="server-btn ${this.currentServerMode === "hls-1" || !this.currentServerMode || this.currentServerMode.startsWith("alt-") ? "active" : ""}" id="srvBtnHls1"
              onclick="app.startVideoPlayback(app.selectedMovie, app.currentEpisodeIndex, 'hls-1')" title="Phát Server 1 chất lượng tốt nhất">
        <i class="fas fa-server"></i> Server 1
      </button>
      ${
        hasEmbed2
          ? `<button class="server-btn ${this.currentServerMode === "embed-1" ? "active" : ""}" id="srvBtnEmbed1"
                    onclick="app.startVideoPlayback(app.selectedMovie, app.currentEpisodeIndex, 'embed-1')" title="Phát Server 2">
              <i class="fas fa-server"></i> Server 2
            </button>`
          : ""
      }
      ${
        hasDub
          ? `<button class="server-btn ${this.currentServerMode === "dub-1" ? "active" : ""}" id="srvBtnDub1"
                    onclick="app.startVideoPlayback(app.selectedMovie, app.currentEpisodeIndex, 'dub-1')" title="Phát bản Thuyết Minh">
              <i class="fas fa-microphone"></i> Thuyết Minh
            </button>`
          : ""
      }
      ${
        movie.trailerUrl
          ? `<button class="server-btn ${this.currentServerMode === "trailer" ? "active" : ""}" id="srvBtnTrailer"
                    onclick="app.startVideoPlayback(app.selectedMovie, app.currentEpisodeIndex, 'trailer')" title="Xem Trailer">
              <i class="fab fa-youtube"></i> Trailer
            </button>`
          : ""
      }
    `;
  }

  async refreshMovieApiSources() {
    if (!this.selectedMovie) return;
    this.showAppleVideoHud("forward", "Đang nạp API...");
    try {
      const enriched = await this.service.enrichMovieStreams(this.selectedMovie, true);
      this.selectedMovie = enriched;
      const langText = document.getElementById("modalLanguageText");
      if (langText) langText.textContent = this.getMovieLanguageLabel(enriched);
      this.refreshEpisodesInModal(enriched);
      this.renderServerButtons(enriched, this.currentEpisodeIndex);
      this.renderDynamicQualityButtons();
      this.startVideoPlayback(enriched, this.currentEpisodeIndex, this.currentServerMode || "hls-1");
      this.showAppleVideoHud("forward", "Nạp API: 1080p");
    } catch (err) {
      console.warn("Lỗi nạp lại nguồn API:", err);
    }
  }

  unwrapM3u8Url(url) {
    if (!url || typeof url !== "string") return "";
    let clean = url.trim();
    if (clean.includes("player.phimapi.com/player/?url=") || clean.includes("?url=http")) {
      const idx = clean.indexOf("?url=");
      if (idx !== -1) {
        const rawParam = clean.slice(idx + 5).split("&")[0];
        try {
          clean = decodeURIComponent(rawParam);
        } catch (_) {
          clean = rawParam;
        }
      }
    }
    return clean;
  }

  activateIframePlayer(iframeUrl) {
    const container = document.getElementById("activeVideoContainer");
    const videoEl = document.getElementById("hlsVideoElement");
    const iframeEl = document.getElementById("trailerIframeElement");
    this.destroyHls();
    if (this._appleControlsTimeout) {
      clearTimeout(this._appleControlsTimeout);
      this._appleControlsTimeout = null;
    }
    if (container) {
      container.classList.remove("controls-hidden", "video-is-seeking", "video-is-waiting");
      container.onmousemove = null;
      container.onmousedown = null;
      container.ontouchstart = null;
    }
    document.body.classList.remove("video-cursor-hidden");
    document.getElementById("applePlayerOverlay")?.style.setProperty("display", "none");
    document.getElementById("appleSkipIntroBtn")?.classList.remove("visible");
    if (videoEl) {
      videoEl.pause();
      videoEl.style.display = "none";
    }
    if (iframeEl && iframeUrl) {
      iframeEl.src = iframeUrl;
      iframeEl.style.display = "block";
    }
  }

  formatTime(seconds) {
    return this.formatSeconds(seconds);
  }

  async ensureHlsLoaded() {
    if (typeof window !== "undefined" && window.Hls) return true;
    if (this._loadingHlsPromise) return this._loadingHlsPromise;
    this._loadingHlsPromise = new Promise((resolve) => {
      if (typeof document === "undefined") return resolve(false);
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
    return this._loadingHlsPromise;
  }

  async startVideoPlayback(movie, epIndex = 0, serverMode = "hls-1") {
    if (!movie) return;
    this.selectedMovie = movie;
    this.playingMovie = movie;
    this.currentEpisodeIndex = epIndex;
    this.currentServerMode = serverMode;

    if (serverMode === "hls-1" || !serverMode) {
      await this.ensureHlsLoaded();
    }

    // Tự động kéo mượt lên đầu Modal để thấy ngay khung phát video khi bấm chọn tập phim ở dưới
    const modalBackdrop = document.getElementById("movieDetailModal");
    const sheet = document.getElementById("movieDetailSheet");
    modalBackdrop?.scrollTo({ top: 0, behavior: "smooth" });
    sheet?.scrollTo({ top: 0, behavior: "smooth" });

    // Mở khung trình phát ngay lập tức (0ms) để người dùng thấy trình phát chạy ngay khi bấm
    const coverPreview = document.getElementById("modalCoverPreview");
    const videoContainer = document.getElementById("activeVideoContainer");
    const videoEl = document.getElementById("hlsVideoElement");
    const iframeEl = document.getElementById("trailerIframeElement");

    if (coverPreview) coverPreview.style.display = "none";
    if (videoContainer) {
      videoContainer.classList.add("playing", "video-is-waiting");
    }

    // Nếu tập phim chưa có luồng thật hoặc link cũ/lỗi, tự động nạp luồng thật 1080p/4K từ API trước khi phát
    const initialEp = movie.episodes?.[epIndex] || movie.episodes?.[0];
    const unwrappedInitialSource = this.unwrapM3u8Url(initialEp?.source || "");
    const hasReadyM3u8 = Boolean(
      unwrappedInitialSource &&
      (unwrappedInitialSource.includes(".m3u8") || unwrappedInitialSource.includes("/hls/")) &&
      !unwrappedInitialSource.includes("opstream") &&
      !initialEp?.needsEnrich
    );
    const hasReadyEmbed = Boolean(initialEp?.embed && !initialEp?.needsEnrich);
    const isBrokenOrOld = !hasReadyM3u8 && !hasReadyEmbed;

    if (isBrokenOrOld || (!initialEp?.source && !initialEp?.embed)) {
      await this.service.enrichMovieStreams(movie, isBrokenOrOld);
      const langText = document.getElementById("modalLanguageText");
      if (langText) langText.textContent = this.getMovieLanguageLabel(movie);
    } else if (!movie._isEnriched) {
      // Nếu đã có sẵn luồng .m3u8 chuẩn, phát ngay lập tức 0ms và nạp ngầm Server 2 / Thuyết Minh
      const prevEpCount = Array.isArray(movie.episodes) ? movie.episodes.length : 0;
      this.service.enrichMovieStreams(movie, false).then(() => {
        if (this.selectedMovie?.slug === movie.slug) {
          const langText = document.getElementById("modalLanguageText");
          if (langText) langText.textContent = this.getMovieLanguageLabel(movie);
          this.renderServerButtons(movie, this.currentEpisodeIndex);
          if ((movie.episodes?.length || 0) !== prevEpCount) {
            this.refreshEpisodesInModal(movie);
          }
        }
      }).catch(() => {});
    }

    // Lưu vào Lịch sử xem tiếp
    this.recordWatchHistory(movie.slug, epIndex);
    this.setNowPlayingBar(movie, epIndex, true);

    // Cập nhật lại thanh Server Buttons và trạng thái tập phim đang phát (O(1) DOM update)
    this.renderServerButtons(movie, epIndex);
    this.refreshEpisodesInModal(movie);

    const episode = movie.episodes[epIndex] || movie.episodes[0];
    const dubEp = movie.dubEpisodes?.[epIndex] || movie.dubEpisodes?.[0] || episode;
    const ncEp = movie.nguoncEpisodes?.[epIndex] || movie.nguoncEpisodes?.[0] || episode;

    // Chế độ phát Trailer YouTube
    if (serverMode === "trailer" && movie.trailerUrl) {
      const ytId = this.extractYouTubeId(movie.trailerUrl);
      const ytEmbedUrl = ytId
        ? `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`
        : movie.trailerUrl;
      this.activateIframePlayer(ytEmbedUrl);
      return;
    }

    // 1. Xác định luồng phát HLS .m3u8 trực tiếp hoặc Embed Server
    let streamUrl = "";
    let selectedAltObj = null;

    if (serverMode && serverMode.startsWith("alt-")) {
      const altIdx = parseInt(serverMode.replace("alt-", ""), 10);
      selectedAltObj = episode?.altSources?.[altIdx];
      if (selectedAltObj) {
        streamUrl = selectedAltObj.source || selectedAltObj.embed || "";
      }
    } else if (serverMode === "dub-1") {
      streamUrl = (dubEp && dubEp.source) || (episode && episode.source) || "";
    } else if (serverMode === "embed-1" || serverMode === "nguonc-1") {
      streamUrl = (ncEp && ncEp.source) || (ncEp && ncEp.embed) || (episode && episode.embed) || (episode && episode.source) || "";
    } else {
      streamUrl = (episode && episode.source) || (ncEp && ncEp.source) || "";
    }

    // Bóc tách trực tiếp luồng .m3u8 nếu nằm trong wrapper ?url=
    streamUrl = this.unwrapM3u8Url(streamUrl);

    // Kiểm tra URL bị cấm nhúng iframe vì X-Frame-Options: SAMEORIGIN (player.php, hhpanda.st, yanhh3d.ee, streamfree.vip)
    const isForbiddenIframe = (url) => {
      if (!url || typeof url !== "string") return false;
      return url.includes("player.php") || url.includes("hhpanda.st") || url.includes("yanhh3d.ee") || url.includes("streamfree.vip");
    };

    // Nếu streamUrl dính domain cấm nhúng, tự động tìm luồng m3u8 thật của phim
    if (isForbiddenIframe(streamUrl)) {
      const validEp = (episode?.source && !isForbiddenIframe(episode.source)) ? episode :
                      movie.episodes?.find((e) => e.source && !isForbiddenIframe(e.source));
      if (validEp) {
        streamUrl = this.unwrapM3u8Url(validEp.source);
      } else {
        streamUrl = "";
      }
    }

    let isDirectM3u8 = Boolean(
      streamUrl &&
      !streamUrl.includes("player.phimapi.com") &&
      (streamUrl.includes(".m3u8") || streamUrl.includes("/hls/"))
    );

    // Mặc định phát chuẩn Full HD 1080p sắc nét nhất, chỉ kích hoạt 4K nếu luồng thực tế xác thực 4K
    const has4k = Boolean(
      movie.quality === "4K" &&
      Array.isArray(movie.sectionTags) && movie.sectionTags.includes("4k")
    );
    this.currentQuality = has4k ? "4K" : "1080";

    // Nếu không có luồng m3u8 trực tiếp, thử tìm luồng m3u8 trong altSources hoặc bóc tách từ embed
    if (!isDirectM3u8) {
      const altM3u8 = episode?.altSources?.find((a) => a.source && a.source.includes(".m3u8"))?.source;
      if (altM3u8) {
        streamUrl = this.unwrapM3u8Url(altM3u8);
        isDirectM3u8 = true;
      } else {
        const candidateEmbed = this.unwrapM3u8Url(episode?.embed || ncEp?.embed || dubEp?.embed || "");
        if (candidateEmbed && !candidateEmbed.includes("player.phimapi.com") && (candidateEmbed.includes(".m3u8") || candidateEmbed.includes("/hls/"))) {
          streamUrl = candidateEmbed;
          isDirectM3u8 = true;
        }
      }
    }

    // Nếu vẫn không có luồng m3u8 trực tiếp, sử dụng iframe với Sandbox an toàn (ẩn hoàn toàn lớp phủ chặn click)
    if (!isDirectM3u8) {
      let fallbackEmbed =
        selectedAltObj ? (selectedAltObj.embed || selectedAltObj.source) :
        (streamUrl && (streamUrl.includes("http") || streamUrl.includes("//")))
          ? streamUrl
          : serverMode === "embed-1"
          ? ncEp?.embed || episode?.embed
          : serverMode === "dub-1"
          ? dubEp?.embed || episode?.embed
          : episode?.embed || ncEp?.embed;

      // Tuyệt đối không nhúng các link dính X-Frame-Options SAMEORIGIN vào iframe
      if (fallbackEmbed && isForbiddenIframe(fallbackEmbed)) {
        fallbackEmbed = "";
      }

      if (fallbackEmbed && iframeEl) {
        this.activateIframePlayer(fallbackEmbed);
        this.renderDynamicQualityButtons();
        this.renderServerButtons(movie, epIndex);
        return;
      }
    }

    // Chế độ phát HLS (.m3u8) trực tiếp của đúng bộ phim đang chọn (Tuyệt đối không dùng stream của phim khác)
    if (iframeEl) {
      iframeEl.src = "";
      iframeEl.style.display = "none";
    }
    if (!videoEl) return;
    videoEl.style.display = "block";
    document.getElementById("applePlayerOverlay")?.style.setProperty("display", "flex");
    this.initAppleVideoPlayerEvents();

    this.destroyHls();
    this._hlsNetworkRetryCount = 0;
    this.detectedHlsLevels = [];
    this.detectedAdRanges = [];
    this.actualVideoRes = { width: 0, height: 0, bitrateMbps: 0 };

    const isAppleTouchDevice =
      typeof navigator !== "undefined" &&
      (/(iPhone|iPad|iPod)/i.test(navigator.userAgent || "") ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const canPlayNativeHls = Boolean(videoEl.canPlayType && videoEl.canPlayType("application/vnd.apple.mpegurl"));

    const startHlsJsEngine = () => {
      if (!window.Hls || !window.Hls.isSupported()) return false;
      const CustomPlaylistLoader = this.createAdFreePlaylistLoader();
      this.hlsInstance = new window.Hls({
        pLoader: CustomPlaylistLoader,
        enableWorker: true,
        lowLatencyMode: false,
        progressive: true,
        startFragPrefetch: true,
        backBufferLength: 60,
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.8,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.2,
        nudgeMaxRetry: 10,
        maxAudioFramesDrift: 4,
        forceKeyFrameOnDiscontinuity: true,
        maxFragLookUpTolerance: 0.25,
        startLevel: -1,
        capLevelToPlayerSize: false,
        abrEwmaDefaultEstimate: 5000000
      });

      // Đăng ký toàn bộ sự kiện TRƯỚC khi gọi loadSource & attachMedia để không bao giờ bỏ lỡ MANIFEST_PARSED
      this.hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
        const levels = this.hlsInstance?.levels || [];
        this.inspectHlsLevels(levels);
        this.renderDynamicQualityButtons();
        this.renderDynamicResumeButtons();
        this.applyVideoQualityVisuals();
        videoEl.play().catch(() => {});
        const savedProg = this.getPlaybackProgress(movie.slug, epIndex);
        if (savedProg && savedProg.currentTime > 5 && savedProg.percentage < 95) {
          const applySavedTime = () => {
            if (savedProg && savedProg.currentTime > 5 && savedProg.percentage < 95) {
              if (Math.abs(videoEl.currentTime - savedProg.currentTime) > 2) {
                videoEl.currentTime = savedProg.currentTime;
              }
            }
          };
          videoEl.addEventListener("loadedmetadata", applySavedTime, { once: true });
          applySavedTime();
        }
      });

      this.hlsInstance.on(window.Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const lvl = this.hlsInstance?.levels?.[data.level];
        if (lvl) {
          this.actualVideoRes.width = lvl.width || videoEl.videoWidth || 1920;
          this.actualVideoRes.height = lvl.height || videoEl.videoHeight || 1080;
          if (lvl.bitrate) {
            this.actualVideoRes.bitrateMbps = +(lvl.bitrate / 1000000).toFixed(1);
          }
          this.applyVideoQualityVisuals();
        }
      });

      this.hlsInstance.on(window.Hls.Events.ERROR, async (_, data) => {
        if (data.fatal) {
          console.warn("[HLS] Lỗi đường truyền video:", data.type, data.details);
          if (
            data.type === window.Hls.ErrorTypes.NETWORK_ERROR &&
            (this._hlsNetworkRetryCount || 0) < 1 &&
            !streamUrl.includes("opstream")
          ) {
            this._hlsNetworkRetryCount = (this._hlsNetworkRetryCount || 0) + 1;
            this.hlsInstance.startLoad();
            return;
          }
          if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR && (this._hlsMediaRetryCount || 0) < 1) {
            this._hlsMediaRetryCount = (this._hlsMediaRetryCount || 0) + 1;
            this.hlsInstance.recoverMediaError();
            return;
          }

          if (!this._isAutoRetryingApi) {
            this._isAutoRetryingApi = true;
            try {
              const fresh = await this.service.enrichMovieStreams(movie, true);
              this._isAutoRetryingApi = false;
              const freshSource = this.unwrapM3u8Url(fresh?.episodes?.[epIndex]?.source || "");
              if (freshSource && freshSource !== streamUrl && !freshSource.includes("opstream")) {
                this.startVideoPlayback(fresh, epIndex, serverMode);
                return;
              }
            } catch (e) {
              this._isAutoRetryingApi = false;
            }
          }

          const altBackup = episode?.altSources?.find(
            (a) => a.source && a.source.includes(".m3u8") && this.unwrapM3u8Url(a.source) !== streamUrl
          );
          if (altBackup && this.hlsInstance) {
            streamUrl = this.unwrapM3u8Url(altBackup.source);
            this._hlsNetworkRetryCount = 0;
            this.hlsInstance.loadSource(streamUrl);
            this.hlsInstance.startLoad();
            return;
          }

          const fallback = episode?.embed || ncEp?.embed || dubEp?.embed;
          if (fallback && !isForbiddenIframe(fallback)) {
            const unwrappedFallback = this.unwrapM3u8Url(fallback);
            if (
              unwrappedFallback &&
              !unwrappedFallback.includes("player.phimapi.com") &&
              unwrappedFallback.includes(".m3u8") &&
              unwrappedFallback !== streamUrl &&
              this.hlsInstance
            ) {
              streamUrl = unwrappedFallback;
              this._hlsNetworkRetryCount = 0;
              this.hlsInstance.loadSource(streamUrl);
              this.hlsInstance.startLoad();
              return;
            }
            this.activateIframePlayer(fallback);
          }
        }
      });

      this.hlsInstance.attachMedia(videoEl);
      this.hlsInstance.loadSource(streamUrl);
      return true;
    };

    // Trên iPhone & iPad: Ưu tiên trình giải mã phần cứng Apple AVPlayer Native HLS (mượt 120Hz ProMotion, 0% tải JS CPU)
    if (isAppleTouchDevice && canPlayNativeHls) {
      videoEl.src = streamUrl;
      const onNativeMeta = () => {
        this.actualVideoRes.width = videoEl.videoWidth || 1920;
        this.actualVideoRes.height = videoEl.videoHeight || 1080;
        this.renderDynamicQualityButtons();
        this.renderDynamicResumeButtons();
        this.applyVideoQualityVisuals();
        const savedProg = this.getPlaybackProgress(movie.slug, epIndex);
        if (savedProg && savedProg.currentTime > 5 && savedProg.percentage < 95) {
          videoEl.currentTime = savedProg.currentTime;
        }
        videoEl.play().catch(() => {});
      };
      videoEl.addEventListener("loadedmetadata", onNativeMeta, { once: true });
      videoEl.addEventListener(
        "error",
        () => {
          videoEl.removeEventListener("loadedmetadata", onNativeMeta);
          videoEl.removeAttribute("src");
          startHlsJsEngine();
        },
        { once: true }
      );
      videoEl.play().catch(() => {});
    } else if (!startHlsJsEngine() && canPlayNativeHls) {
      videoEl.src = streamUrl;
      videoEl.addEventListener(
        "loadedmetadata",
        () => {
          this.actualVideoRes.width = videoEl.videoWidth || 1920;
          this.actualVideoRes.height = videoEl.videoHeight || 1080;
          this.renderDynamicQualityButtons();
          this.renderDynamicResumeButtons();
          this.applyVideoQualityVisuals();
          const savedProg = this.getPlaybackProgress(movie.slug, epIndex);
          if (savedProg && savedProg.currentTime > 5 && savedProg.percentage < 95) {
            videoEl.currentTime = savedProg.currentTime;
          }
          videoEl.play().catch(() => {});
        },
        { once: true }
      );
      videoEl.play().catch(() => {});
    }

    videoEl.onloadedmetadata = () => {
      if (videoEl.videoWidth && videoEl.videoHeight) {
        this.actualVideoRes.width = videoEl.videoWidth;
        this.actualVideoRes.height = videoEl.videoHeight;
        this.renderDynamicQualityButtons();
        this.renderDynamicResumeButtons();
        this.applyVideoQualityVisuals();
      }
    };

    this.renderDynamicQualityButtons();
    this.renderDynamicResumeButtons();
    this.applyVideoQualityVisuals();

    // Đồng bộ thanh thời gian siêu nhẹ (Throttle 250ms, không chạm DOM nền khi đang mở rạp phim, không rebuild HTML mỗi 3s)
    videoEl.ontimeupdate = () => {
      if (!videoEl.duration) return;
      const now = performance.now();
      if (videoEl._lastUiTick && now - videoEl._lastUiTick < 240) return;
      videoEl._lastUiTick = now;

      const cur = videoEl.currentTime;
      const dur = videoEl.duration;
      const pct = Math.min(100, (cur / dur) * 100);

      // Chỉ cập nhật thanh timeline của trình phát chính (nhẹ tuyệt đối)
      if (!this._isScrubbing && !this._seekAccumulatorTimer) {
        const appleCur = document.getElementById("appleCurrentTime");
        const appleDur = document.getElementById("appleDurationTime");
        const appleFill = document.getElementById("appleScrubFill");
        const appleThumb = document.getElementById("appleScrubThumb");
        if (appleCur) appleCur.textContent = this.formatSeconds(cur);
        if (appleDur) appleDur.textContent = this.formatSeconds(dur);
        if (appleFill) appleFill.style.width = `${pct}%`;
        if (appleThumb) appleThumb.style.left = `${pct}%`;
      }

      // Hiển thị hoặc ẩn nút Bỏ qua Intro theo khung thời gian mở đầu phim
      this.updateSkipIntroButtonState(videoEl, movie, epIndex);

      // Tự động lưu vị trí xem dở mỗi 10 giây (không gọi renderDynamicResumeButtons làm giật layout khi đang phát)
      if (cur > 5 && (!videoEl._lastSavedPos || Math.abs(cur - videoEl._lastSavedPos) >= 10)) {
        videoEl._lastSavedPos = cur;
        if (this.selectedMovie) {
          this.savePlaybackProgress(this.selectedMovie.slug, this.currentEpisodeIndex, cur, dur);
        }
      }
    };

    videoEl.onended = () => {
      if (this.settings?.autoNextEpisode !== false) {
        this.playNextEpisode();
      }
    };
  }

  skipAdIntro(seconds = 5) {
    this.seekRelative(seconds, true);
  }

  inspectHlsLevels(rawLevels) {
    if (!Array.isArray(rawLevels) || rawLevels.length === 0) {
      this.detectedHlsLevels = [];
      return;
    }
    this.detectedHlsLevels = rawLevels.map((lvl, index) => {
      const w = lvl.width || 1920;
      const h = lvl.height || 1080;
      const mbps = lvl.bitrate ? +(lvl.bitrate / 1000000).toFixed(1) : 3.5;
      const tier = this.resolveResolutionTier(w, h);
      return {
        index,
        width: w,
        height: h,
        bitrateMbps: mbps,
        tier,
        shortLabel: `${tier} Gốc${mbps ? ` (${mbps}M)` : ""}`,
        detailLabel: `${tier} Gốc • ${w}×${h}${mbps ? ` (${mbps} Mbps)` : ""}`
      };
    });

    const highest = this.detectedHlsLevels[this.detectedHlsLevels.length - 1];
    if (highest) {
      this.actualVideoRes = {
        width: highest.width,
        height: highest.height,
        bitrateMbps: highest.bitrateMbps
      };
    }

    // Xác thực thực tế: Nếu không có mức nào đạt 4K (height >= 2160 hoặc width >= 3800), đồng bộ chất lượng về Full HD trung thực
    const hasReal4k = this.detectedHlsLevels.some((l) => l.height >= 2160 || l.width >= 3800);
    if (!hasReal4k) {
      this.currentQuality = "1080";
      if (this.selectedMovie && this.selectedMovie.quality === "4K") {
        this.selectedMovie.quality = "1080";
      }
      if (this.playingMovie && this.playingMovie.quality === "4K") {
        this.playingMovie.quality = "1080";
      }
      const modalPill = document.getElementById("modalQualityPill");
      if (modalPill) {
        modalPill.className = "meta-pill badge-1080";
        modalPill.textContent = "Full HD 1080p";
      }
      const islandPill = document.getElementById("nowPlayingQuality");
      if (islandPill) {
        islandPill.textContent = "Full HD";
      }
    }
  }

  resolveResolutionTier(w, h) {
    const maxDim = Math.max(w || 0, h || 0);
    if (maxDim >= 3800 || h >= 2100) return "4K Ultra HD";
    if (maxDim >= 2500 || h >= 1400) return "2K QHD";
    if (maxDim >= 1800 || h >= 800) return "1080p Full HD";
    if (maxDim >= 1200 || h >= 680) return "720p HD";
    if (maxDim >= 800 || h >= 460) return "480p";
    if (maxDim > 0) return `${h}p`;
    return "1080p Full HD";
  }

  buildQualityButtonsHTML(movie) {
    const mov = movie || this.selectedMovie || this.playingMovie;
    // Chỉ kích hoạt nút 4K khi thực sự có luồng 4K UHD thật trong HLS manifest (chiều rộng >= 3800 hoặc chiều cao >= 2160)
    const hasReal4kStream = Boolean(
      this.detectedHlsLevels &&
      this.detectedHlsLevels.length > 0 &&
      this.detectedHlsLevels.some((l) => l.height >= 2160 || l.width >= 3800)
    );

    // Phim không có định dạng 4K thực tế thì chỉ hiển thị duy nhất nút Full HD (không hiện nút 4K ảo)
    if (!hasReal4kStream) {
      return `
        <button class="quality-pill-btn active" 
                onclick="app.handleQualityPillClick('Full HD', false)"
                title="Full HD 1080p • Nét Chuẩn Bản Quyền Từ Máy Chủ">
          Full HD
        </button>
      `;
    }

    const is4k = this.currentQuality === "4K" || this.currentQuality === "4k";
    return `
      <button class="quality-pill-btn ${!is4k ? "active" : ""}" 
              onclick="app.switchQualityTier('1080')" 
              title="Full HD 1080p • Nét Chuẩn Bản Quyền">
        Full HD
      </button>
      <button class="quality-pill-btn is-4k-quality ${is4k ? "active" : ""}" 
              onclick="app.switchQualityTier('4K')" 
              title="4K Ultra HD • Siêu Nét HDR • Apple Reality Engine">
        <i class="fas fa-sparkles" style="font-size:0.7em; margin-right:3px;"></i>4K
      </button>
    `;
  }

  /* ==========================================================================
     RESUME PLAYBACK TOOLBAR CONTROLS & APPLE FLOATING BANNER
     ========================================================================== */
  buildResumeButtonsHTML(movie, epIndex = 0) {
    if (!movie) return "";
    const savedProg = this.getPlaybackProgress(movie.slug, epIndex);
    const hasProgress = Boolean(savedProg && savedProg.currentTime > 5 && savedProg.percentage < 95);

    if (hasProgress) {
      return `
        <span class="server-label"><i class="fas fa-clock-rotate-left"></i> Xem tiếp:</span>
        <div class="resume-selector-group">
          <button class="resume-pill-btn active" onclick="app.resumePlaybackAt(${savedProg.currentTime})" title="Tiếp tục xem từ ${this.formatSeconds(savedProg.currentTime)} (${savedProg.percentage}%)">
            <i class="fas fa-play" style="font-size:0.68em; margin-right:4px;"></i>${this.formatSeconds(savedProg.currentTime)} (${savedProg.percentage}%)
          </button>
          <button class="resume-pill-btn restart-btn" onclick="app.restartPlayback()" title="Phát lại từ đầu (00:00)">
            <i class="fas fa-rotate-left" style="font-size:0.68em; margin-right:3px;"></i>Từ đầu
          </button>
        </div>
      `;
    }

    return `
      <span class="server-label"><i class="fas fa-clock-rotate-left"></i> Xem tiếp:</span>
      <div class="resume-selector-group">
        <button class="resume-pill-btn active" onclick="app.restartPlayback()" title="Đang phát từ đầu (00:00)">
          <i class="fas fa-play" style="font-size:0.68em; margin-right:4px;"></i>Phát từ đầu
        </button>
      </div>
    `;
  }

  renderDynamicResumeButtons() {
    const group = document.getElementById("resumeToolbarContainer");
    if (group && this.selectedMovie) {
      group.innerHTML = this.buildResumeButtonsHTML(this.selectedMovie, this.currentEpisodeIndex);
    }
  }

  resumePlaybackAt(time) {
    const videoEl = document.getElementById("hlsVideoElement");
    if (videoEl && !isNaN(time)) {
      videoEl.currentTime = time;
      videoEl.play().catch(() => {});
      this.showToast(`▶ Đã tiếp tục xem từ ${this.formatSeconds(time)}`);
      this.dismissResumeBanner();
    }
  }

  showResumeFloatingBanner(savedProg) {
    // Đã loại bỏ banner nổi "Tiếp tục xem" theo yêu cầu người dùng
    this.dismissResumeBanner();
  }

  dismissResumeBanner() {
    clearTimeout(this._resumeBannerTimeout);
    const existing = document.getElementById("appleResumeBanner");
    if (existing) {
      existing.style.animation = "appleResumeFadeOut 0.25s ease forwards";
      setTimeout(() => existing.remove(), 250);
    }
  }

  playNextEpisode(event) {
    if (event) {
      if (typeof event.stopPropagation === "function") event.stopPropagation();
      if (typeof event.preventDefault === "function") event.preventDefault();
    }
    const movie = this.selectedMovie || this.playingMovie;
    if (!movie) return;

    const eps = movie.episodes || [];
    if (eps.length > 1) {
      if (this.currentEpisodeIndex + 1 < eps.length) {
        const nextIdx = this.currentEpisodeIndex + 1;
        const nextEp = eps[nextIdx];
        const nextEpName = this.formatEpisodeLabel(nextEp.name, `Tập ${nextIdx + 1}`);
        this.showToast(`⏭ Đang chuyển sang ${nextEpName}`);
        this.startVideoPlayback(movie, nextIdx, this.currentServerMode || "hls-1");
      } else {
        this.showToast(`ℹ️ Đang ở tập cuối cùng (${eps.length}/${eps.length})`);
      }
    } else {
      // Phim lẻ hoặc chỉ có 1 tập: chuyển sang phim liên quan tiếp theo
      const related = this.service.getRelatedMovies(movie, 3);
      if (related && related.length > 0) {
        const nextMovie = related[0].movie;
        this.showToast(`⏭ Chuyển sang phim: ${nextMovie.title}`);
        this.openMovieModal(nextMovie.slug, true, 0);
      } else {
        this.showToast(`ℹ️ Đã xem hết phim`);
      }
    }
  }

  updateNextEpisodeButton(movie, epIndex = 0) {
    const mov = movie || this.selectedMovie || this.playingMovie;
    if (!mov) return;
    const btn = document.getElementById("toolbarNextEpBtn");
    const appleBtn = document.getElementById("appleNextEpBtn");
    const eps = mov.episodes || [];
    const isSeries = mov.type === "series" && eps.length > 1;
    const hasNextEp = isSeries && (epIndex + 1 < eps.length);

    let titleText = "Tập tiếp theo (Shift + N)";
    if (hasNextEp) {
      const nextEp = eps[epIndex + 1];
      const epLabel = this.formatEpisodeLabel(nextEp.name, `Tập ${epIndex + 2}`);
      titleText = `Chuyển sang ${epLabel} (Shift + N)`;
    } else if (isSeries) {
      titleText = "Đang ở tập cuối cùng";
    } else {
      const related = this.service?.getRelatedMovies(mov, 1);
      titleText = related?.[0] ? `Phim tiếp theo: ${related[0].movie.title}` : "Tập tiếp theo (Shift + N)";
    }

    [btn, appleBtn].forEach((b) => {
      if (b) {
        b.title = titleText;
        b.setAttribute("aria-label", titleText);
        if (isSeries && !hasNextEp) {
          b.classList.add("disabled");
        } else {
          b.classList.remove("disabled");
        }
      }
    });
  }

  handleQualityPillClick(label, isReal4k) {
    if (!isReal4k) {
      this.showToast("✨ Chuẩn Full HD 1080p gốc từ máy chủ bản quyền");
    } else {
      this.showToast("✨ Đang phát chuẩn 4K Ultra HD gốc");
    }
  }

  switchHlsLevel(lvlIndex) {
    if (!this.hlsInstance) return;
    this.hlsInstance.currentLevel = lvlIndex;
    this.hlsInstance.loadLevel = lvlIndex;
    const lvl = this.detectedHlsLevels?.[lvlIndex];
    if (lvl) {
      this.actualVideoRes.width = lvl.width;
      this.actualVideoRes.height = lvl.height;
      this.actualVideoRes.bitrateMbps = lvl.bitrateMbps;
      this.renderDynamicQualityButtons();
      this.applyVideoQualityVisuals();
      this.showToast(`✨ Đã chuyển sang chất lượng thực: ${lvl.tier} (${lvl.width}×${lvl.height} • ${lvl.bitrateMbps} Mbps)`);
    }
  }

  switchQualityTier(tier) {
    const is4k = tier === "4k" || tier === "4K";
    const hasReal4k = Boolean(
      this.detectedHlsLevels &&
      this.detectedHlsLevels.length > 0 &&
      this.detectedHlsLevels.some((l) => l.height >= 2160 || l.width >= 3800)
    );

    if (is4k) {
      if (!hasReal4k) {
        this.currentQuality = "1080";
        this.renderDynamicQualityButtons();
        this.applyVideoQualityVisuals();
        this.showToast("ℹ️ Phim này nguồn gốc cao nhất là Full HD 1080p (chưa có bản 4K gốc).");
        return;
      }
      this.currentQuality = "4K";
      const k4Idx = this.detectedHlsLevels.findIndex((l) => l.height >= 2160 || l.width >= 3800);
      if (k4Idx !== -1 && this.hlsInstance) {
        this.hlsInstance.currentLevel = k4Idx;
        this.hlsInstance.loadLevel = k4Idx;
        this.hlsInstance.nextLevel = k4Idx;
      }
      this.showToast("✨ Đã kích hoạt độ phân giải 4K Ultra HD sắc nét");
    } else {
      this.currentQuality = "1080";
      if (this.detectedHlsLevels && this.detectedHlsLevels.length > 0) {
        const fhdIdx = this.detectedHlsLevels.findIndex((lvl) => (lvl.height >= 800 && lvl.height <= 1080) || (lvl.width >= 1800 && lvl.width <= 1920));
        const targetIdx = fhdIdx !== -1 ? fhdIdx : 0;
        if (this.hlsInstance) {
          this.hlsInstance.currentLevel = targetIdx;
          this.hlsInstance.loadLevel = targetIdx;
          this.hlsInstance.nextLevel = targetIdx;
        }
      }
      this.showToast("✨ Đang phát chuẩn Full HD 1080p");
    }

    this.renderDynamicQualityButtons();
    this.applyVideoQualityVisuals();
  }

  renderDynamicQualityButtons() {
    const group = document.getElementById("qualitySelectorGroup");
    if (group) {
      group.innerHTML = this.buildQualityButtonsHTML(this.selectedMovie);
    }
  }

  getQualityLabel(q) {
    const is4k = this.currentQuality === "4K" || this.currentQuality === "4k";
    if (is4k) {
      return "4K Ultra HD • Siêu Nét • HDR Reality Engine";
    }
    return "Full HD 1080 • Nét Chuẩn";
  }

  getQualityVideoClass(q) {
    const is4k = q === "4K" || q === "4k" || this.currentQuality === "4K" || this.currentQuality === "4k";
    return is4k ? "quality-4k-enhanced" : "";
  }

  setVideoQuality(qualityMode, showNotification = true) {
    // Nếu người dùng bấm chuyển sang luồng .m3u8 hoặc Server phụ (alt-0, alt-1...)
    if (qualityMode.startsWith("alt-")) {
      const altIdx = parseInt(qualityMode.replace("alt-", ""), 10);
      const ep = this.selectedMovie?.episodes?.[this.currentEpisodeIndex] || this.selectedMovie?.episodes?.[0];
      const altObj = ep?.altSources?.[altIdx];
      if (altObj) {
        const videoEl = document.getElementById("hlsVideoElement");
        const iframeEl = document.getElementById("trailerIframeElement");
        const isAltM3u8 = altObj.source && (altObj.source.includes(".m3u8") || altObj.source.includes("/hls/"));
        if (isAltM3u8 && this.hlsInstance) {
          const resumeTime = videoEl ? videoEl.currentTime : 0;
          this.currentQuality = qualityMode;
          this.hlsInstance.loadSource(altObj.source);
          this.hlsInstance.once(window.Hls.Events.MANIFEST_PARSED, () => {
            if (videoEl && resumeTime > 1) videoEl.currentTime = resumeTime;
            videoEl?.play().catch(() => {});
          });
        } else if (iframeEl) {
          this.activateIframePlayer(altObj.embed || altObj.source);
        }
        this.currentQuality = qualityMode;
        this.renderDynamicQualityButtons();
        if (showNotification) {
          this.showToast(`Đã chuyển sang ${altObj.label}`);
        }
        return;
      }
    }

    this.currentQuality = qualityMode;
    this.renderDynamicQualityButtons();
    this.applyHlsQualityLevel();
    this.applyVideoQualityVisuals();

    if (this.playingMovie) {
      this.setNowPlayingBar(this.playingMovie, this.currentEpisodeIndex, this.isPlaying);
    }

    if (showNotification) {
      this.showToast(`Chất lượng phát: ${this.getQualityLabel(qualityMode)}`);
    }
  }

  applyHlsQualityLevel() {
    if (!this.hlsInstance || !this.hlsInstance.levels || this.hlsInstance.levels.length === 0) return;
    const levels = this.hlsInstance.levels;
    const maxIdx = levels.length - 1;

    if (this.currentQuality === "Auto") {
      this.hlsInstance.currentLevel = -1;
      return;
    }

    if (this.currentQuality.startsWith("level-")) {
      const targetIdx = parseInt(this.currentQuality.replace("level-", ""), 10);
      if (!isNaN(targetIdx) && targetIdx >= 0 && targetIdx <= maxIdx) {
        this.hlsInstance.currentLevel = targetIdx;
        this.hlsInstance.loadLevel = targetIdx;
        return;
      }
    }

    // Mặc định (Auto / native-max): dùng bộ điều tốc ABR thích ứng băng thông để không bao giờ bị khựng hình
    this.hlsInstance.currentLevel = -1;
  }

  applyVideoQualityVisuals() {
    const videoEl = document.getElementById("hlsVideoElement");
    const is4k = Boolean(
      (this.currentQuality === "4K" || this.currentQuality === "4k") &&
      this.detectedHlsLevels &&
      this.detectedHlsLevels.some((l) => l.height >= 2160 || l.width >= 3800)
    );
    if (videoEl) {
      videoEl.classList.remove("quality-4k", "quality-2k", "quality-720p", "quality-4k-upscale", "quality-4k-enhanced");
      if (is4k) {
        videoEl.classList.add("quality-4k-enhanced");
      }
    }
    const badgeText = document.getElementById("playerFloatingQualityText");
    if (badgeText) {
      badgeText.textContent = is4k ? "4K Ultra HD" : "Full HD 1080p";
    }
  }

  stopModalVideo() {
    this.isPlaying = false;
    this._introSkippedKey = null;
    const skipBtn = document.getElementById("appleSkipIntroBtn");
    if (skipBtn) skipBtn.classList.remove("visible");

    const currentMov = this.playingMovie || this.selectedMovie;
    if (currentMov) {
      this.setNowPlayingBar(currentMov, this.currentEpisodeIndex, false);
    }
    const videoEl = document.getElementById("hlsVideoElement");
    if (videoEl && this.selectedMovie && videoEl.currentTime > 5 && videoEl.duration) {
      this.savePlaybackProgress(this.selectedMovie.slug, this.currentEpisodeIndex, videoEl.currentTime, videoEl.duration);
    }
    this.destroyHls();
    if (videoEl) {
      videoEl.pause();
      videoEl.removeAttribute("src");
    }
    const iframeEl = document.getElementById("trailerIframeElement");
    if (iframeEl) {
      iframeEl.src = "";
    }
  }

  destroyHls() {
    if (this.hlsInstance) {
      this.hlsInstance.destroy();
      this.hlsInstance = null;
    }
  }

  /* ==========================================================================
     APPLE MUSIC "NOW PLAYING" & ALCOVE DYNAMIC ISLAND CONTROLLER
     ========================================================================== */
  setNowPlayingBar(movie, epIndex = 0, playing = true) {
    if (!movie) return;
    this.playingMovie = movie;
    this.currentEpisodeIndex = epIndex;
    this.isPlaying = playing;

    const barEl = document.getElementById("applePlayerBar");
    if (!barEl || barEl.style.display === "none") return;

    const ep = (movie.episodes && movie.episodes[epIndex]) || (movie.episodes && movie.episodes[0]);
    const artImg = document.getElementById("nowPlayingArt");
    const titleText = document.getElementById("nowPlayingTitleText");
    const subText = document.getElementById("nowPlayingSubText");
    const eqBars = document.getElementById("nowPlayingEq");
    const playIcon = document.getElementById("nowPlayingPlayIcon");

    if (artImg) artImg.src = this.getMoviePoster(movie);
    if (titleText) titleText.textContent = movie.title;
    const epLabel = this.formatEpisodeLabel(ep ? ep.name : "Tập 1", "Tập 1");
    if (subText) {
      const qText = (movie.quality === "4K") ? "4K" : "Full HD";
      subText.textContent = `${epLabel} • ${movie.originTitle} (${qText})`;
    }
    if (eqBars) eqBars.classList.toggle("paused", !playing);
    if (playIcon) {
      playIcon.className = playing ? "fas fa-pause" : "fas fa-play";
    }

    // Đồng bộ thông tin sang bản mở rộng Dynamic Island (Alcove style)
    const islandBackdrop = document.getElementById("nowPlayingIslandBackdrop");
    const islandTitle = document.getElementById("nowPlayingIslandTitle");
    const islandDuration = document.getElementById("nowPlayingIslandDuration");
    const islandQuality = document.getElementById("nowPlayingIslandQuality");
    const islandLang = document.getElementById("nowPlayingIslandLang");
    const islandEp = document.getElementById("nowPlayingIslandEp");
    const islandPlayIcon = document.getElementById("nowPlayingIslandPlayIcon");

    if (islandBackdrop) islandBackdrop.src = this.getMovieBackdrop(movie);
    if (islandTitle) islandTitle.textContent = movie.title;
    if (islandDuration) islandDuration.textContent = movie.duration || "Full HD";
    if (islandQuality) {
      const is4k = Boolean(
        (this.currentQuality === "4K" || this.currentQuality === "4k") &&
        this.detectedHlsLevels &&
        this.detectedHlsLevels.some((l) => l.height >= 2160 || l.width >= 3800)
      );
      islandQuality.textContent = is4k ? "4K" : "Full HD";
    }
    if (islandLang) islandLang.textContent = this.getMovieLanguageLabel(movie);
    if (islandEp) islandEp.textContent = epLabel;
    if (islandPlayIcon) islandPlayIcon.className = playing ? "fas fa-pause" : "fas fa-play";
    const miniCenterPlay = document.getElementById("miniScreenCenterPlayIcon");
    if (miniCenterPlay) miniCenterPlay.className = playing ? "fas fa-pause" : "fas fa-play";

    // Đồng bộ nhãn trạng thái ĐANG PHÁT / TẠM DỪNG
    const islandLiveBadge = document.getElementById("nowPlayingIslandLiveBadge");
    const islandLiveText = document.getElementById("nowPlayingIslandLiveText");
    if (islandLiveBadge) islandLiveBadge.classList.toggle("paused", !playing);
    if (islandLiveText) islandLiveText.textContent = playing ? "ĐANG PHÁT" : "TẠM DỪNG";

    // Đồng bộ nút yêu thích mini player
    const miniFavBtn = document.getElementById("miniPlayerFavBtn");
    const miniFavIcon = document.getElementById("miniPlayerFavIcon");
    if (miniFavBtn) {
      const isFav = this.isInMyList(movie);
      miniFavBtn.classList.toggle("active", isFav);
      if (miniFavIcon) {
        miniFavIcon.className = isFav ? "fas fa-star" : "far fa-star";
      }
    }
  }

  /* ==========================================================================
     APPLE CINEMA VIDEO PLAYER CONTROLLER (APPLE TV+ / VISIONOS CHẾ ĐỘ XEM VIDEO)
     ========================================================================== */
  initAppleVideoPlayerEvents() {
    const container = document.getElementById("activeVideoContainer");
    const videoEl = document.getElementById("hlsVideoElement");
    if (!container || !videoEl) return;

    // Đồng bộ trạng thái lớp che banner quảng cáo/watermark
    // Tự động rà soát & làm sạch phụ đề WebVTT/TextTrack nếu phát hiện chèn quảng cáo nhà cái
    const sanitizeTrackCues = (track) => {
      if (!track) return;
      const cleanCues = () => {
        if (!track.cues) return;
        const badKeywords = [
          "i999", "cwin", "nohu", "nổ hũ", "bắn cá", "sòng bài", "rút tiền",
          "tài trợ", "nhà cái", "kubet", "thabet", "cá cược", "đặt cược",
          "shbet", "789bet", "jun88", "hi88", "f8bet", "new88", "okvip", "123b", "mb66",
          "tài xỉu", "game bài", "hoàn trả"
        ];
        for (let i = track.cues.length - 1; i >= 0; i--) {
          const cue = track.cues[i];
          if (cue && cue.text) {
            const lower = cue.text.toLowerCase();
            if (badKeywords.some((kw) => lower.includes(kw))) {
              try { track.removeCue(cue); } catch (e) {}
            }
          }
        }
      };
      try {
        track.addEventListener("cuechange", cleanCues);
        cleanCues();
      } catch (_) {}
    };

    if (videoEl.textTracks) {
      for (let i = 0; i < videoEl.textTracks.length; i++) {
        sanitizeTrackCues(videoEl.textTracks[i]);
      }
      videoEl.textTracks.onaddtrack = (e) => {
        if (e && e.track) sanitizeTrackCues(e.track);
      };
    }

    // Hiển thị thanh điều khiển Apple khi phát luồng native
    const appleOverlay = document.getElementById("applePlayerOverlay");
    if (appleOverlay) appleOverlay.style.display = "flex";

    // Auto-hide controls & con trỏ chuột khi xem phim (2 giây không di chuột)
    const resetControlsTimer = () => {
      container.classList.remove("controls-hidden");
      document.body.classList.remove("video-cursor-hidden");
      if (this._appleControlsTimeout) {
        clearTimeout(this._appleControlsTimeout);
        this._appleControlsTimeout = null;
      }
      if (videoEl.style.display === "none") return;
      if (!videoEl.paused) {
        this._appleControlsTimeout = setTimeout(() => {
          if (!videoEl.paused && videoEl.style.display !== "none" && !this._isScrubbing) {
            container.classList.add("controls-hidden");
            document.body.classList.add("video-cursor-hidden");
          }
        }, 2000);
      }
    };
    this._resetControlsTimer = resetControlsTimer;

    container.onmousemove = resetControlsTimer;
    container.onmousedown = resetControlsTimer;
    container.ontouchstart = resetControlsTimer;

    // Lắng nghe di chuột trên document khi modal mở để phục hồi chuột tức thì và tự động ẩn khi dừng
    if (this._boundDocMouseMove) {
      document.removeEventListener("mousemove", this._boundDocMouseMove);
    }
    this._boundDocMouseMove = () => {
      const modal = document.getElementById("movieDetailModal");
      if (modal?.classList.contains("open") && !videoEl.paused) {
        resetControlsTimer();
      }
    };
    document.addEventListener("mousemove", this._boundDocMouseMove);

    // Lắng nghe sự kiện toàn màn hình để đồng bộ icon và kích hoạt ẩn chuột ngay lập tức
    if (this._boundFsChange) {
      document.removeEventListener("fullscreenchange", this._boundFsChange);
      document.removeEventListener("webkitfullscreenchange", this._boundFsChange);
    }
    this._boundFsChange = () => {
      const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      const fsIcon = document.getElementById("appleFsIcon");
      if (fsIcon) {
        fsIcon.className = isFs ? "fas fa-compress" : "fas fa-expand";
      }
      const fsBtn = document.getElementById("appleFsBtn");
      if (fsBtn) {
        fsBtn.title = isFs ? "Thu nhỏ (F)" : "Toàn màn hình (F)";
      }
      resetControlsTimer();
    };
    document.addEventListener("fullscreenchange", this._boundFsChange);
    document.addEventListener("webkitfullscreenchange", this._boundFsChange);

    videoEl.onplay = () => {
      this.isPlaying = true;
      videoEl.removeAttribute("poster");
      const playIcon = document.getElementById("applePlayIcon");
      if (playIcon) playIcon.className = "fas fa-pause";
      this.setNowPlayingBar(this.playingMovie, this.currentEpisodeIndex, true);
      resetControlsTimer();
      // Bỏ focus của browser để triệt tiêu vĩnh viễn viền xanh
      videoEl.blur();
    };

    videoEl.onplaying = () => {
      container.classList.remove("video-is-seeking");
      container.classList.remove("video-is-waiting");
      videoEl.removeAttribute("poster");
    };

    videoEl.onseeking = () => {
      container.classList.add("video-is-seeking");
    };

    videoEl.onseeked = () => {
      container.classList.remove("video-is-seeking");
      container.classList.remove("video-is-waiting");
    };

    videoEl.onwaiting = () => {
      container.classList.add("video-is-waiting");
    };

    videoEl.onpause = () => {
      this.isPlaying = false;
      const playIcon = document.getElementById("applePlayIcon");
      if (playIcon) playIcon.className = "fas fa-play";
      this.setNowPlayingBar(this.playingMovie, this.currentEpisodeIndex, false);
      container.classList.remove("controls-hidden");
      document.body.classList.remove("video-cursor-hidden");
      videoEl.blur();
    };

    videoEl.onprogress = () => {
      if (!videoEl.duration || !videoEl.buffered.length) return;
      try {
        const bufferedEnd = videoEl.buffered.end(videoEl.buffered.length - 1);
        const bufPct = Math.min(100, (bufferedEnd / videoEl.duration) * 100);
        const bufEl = document.getElementById("appleScrubBuffer");
        if (bufEl) bufEl.style.width = `${bufPct}%`;
      } catch (_) {}
    };

    videoEl.onvolumechange = () => {
      const volSlider = document.getElementById("appleVolSlider");
      const volIcon = document.getElementById("appleVolIcon");
      if (volSlider) volSlider.value = videoEl.muted ? 0 : videoEl.volume;
      if (volIcon) {
        if (videoEl.muted || videoEl.volume === 0) {
          volIcon.className = "fas fa-volume-xmark";
        } else if (videoEl.volume < 0.5) {
          volIcon.className = "fas fa-volume-low";
        } else {
          volIcon.className = "fas fa-volume-high";
        }
      }
    };
  }

  toggleVideoPlayPause(e) {
    if (e) e.stopPropagation();
    const videoEl = document.getElementById("hlsVideoElement");
    if (!videoEl) return;
    if (videoEl.paused) {
      videoEl.play().catch(() => {});
      this.showAppleVideoHud("play");
    } else {
      videoEl.pause();
      this.showAppleVideoHud("pause");
    }
    videoEl.blur();
  }

  handleAppleVideoClick(e) {
    if (e) e.stopPropagation();
    if (this._videoClickTimeout) {
      clearTimeout(this._videoClickTimeout);
      this._videoClickTimeout = null;
      this.toggleVideoFullscreen();
      return;
    }
    this._videoClickTimeout = setTimeout(() => {
      this._videoClickTimeout = null;
      this.toggleVideoPlayPause();
    }, 240);
  }

  showAppleVideoHud(type, customText) {
    const hud = document.getElementById("appleVideoHud");
    const icon = document.getElementById("appleHudIcon");
    const text = document.getElementById("appleHudText");
    if (!hud || !icon) return;

    let iconClass = "fas fa-play";
    let textContent = customText || "";

    switch (type) {
      case "play":
        iconClass = "fas fa-play";
        textContent = "";
        break;
      case "pause":
        iconClass = "fas fa-pause";
        textContent = "";
        break;
      case "forward":
        iconClass = "fas fa-rotate-right";
        textContent = customText || "+10s";
        break;
      case "backward":
        iconClass = "fas fa-rotate-left";
        textContent = customText || "-10s";
        break;
      case "volume":
        iconClass = "fas fa-volume-high";
        textContent = customText || "100%";
        break;
      case "mute":
        iconClass = "fas fa-volume-xmark";
        textContent = "Tắt âm";
        break;
      case "unmute":
        iconClass = "fas fa-volume-high";
        textContent = "Bật âm";
        break;
      case "speed":
        iconClass = "fas fa-gauge-high";
        textContent = customText || "1.0x";
        break;
      case "theater":
        iconClass = "fas fa-masks-theater";
        textContent = customText || "Rạp phim";
        break;
    }

    icon.className = iconClass;
    if (text) {
      text.textContent = textContent;
      text.style.display = textContent ? "block" : "none";
    }

    hud.classList.remove("hud-active");
    requestAnimationFrame(() => {
      hud.classList.add("hud-active");
    });

    if (this._appleHudTimer) clearTimeout(this._appleHudTimer);
    this._appleHudTimer = setTimeout(() => {
      hud.classList.remove("hud-active");
    }, 550);
  }

  getMovieIntroWindow(movie, duration = 0, currentTime = 0) {
    if (!movie) return null;
    const slug = (movie.slug || "").toLowerCase();
    const genres = Array.isArray(movie.genres) ? movie.genres.map((g) => String(g).toLowerCase()) : [];
    const tags = Array.isArray(movie.sectionTags) ? movie.sectionTags : [];
    const cSlug = movie.countrySlug || "";
    const isSeries = movie.type === "series" || (movie.episodeTotal && movie.episodeTotal !== "1" && movie.episodeTotal !== 1);

    // 1. Phim / Anime có mốc Intro cụ thể đã cấu hình sẵn trong dữ liệu
    if (typeof movie.introStart === "number" && typeof movie.introEnd === "number") {
      return { start: movie.introStart, end: movie.introEnd, target: movie.introEnd, label: "Bỏ qua Intro" };
    }

    // Star Wars / The Clone Wars (~36s)
    if (slug.includes("clone-war") || slug.includes("star-wars")) {
      return { start: 1, end: 40, target: 36, label: "Bỏ qua Giới Thiệu (00:36)" };
    }

    // One Piece / Đảo Hải Tặc (Intro + Tóm tắt + Nhạc OP dài 3 phút - 3 phút 15 giây)
    if (slug.includes("one-piece") || slug.includes("dao-hai-tac")) {
      return { start: 1, end: 195, target: 195, label: "Bỏ qua Tóm Tắt & OP (03:15)" };
    }

    // Conan (Đoạn độc thoại của Conan + Nhạc OP ~2 phút)
    if (slug.includes("conan") || slug.includes("tham-tu-lung-danh")) {
      return { start: 1, end: 125, target: 125, label: "Bỏ qua Giới Thiệu & OP (02:05)" };
    }

    // Naruto & Boruto (Tóm tắt + Nhạc OP ~2 phút 10 giây)
    if (slug.includes("naruto") || slug.includes("boruto")) {
      return { start: 1, end: 135, target: 130, label: "Bỏ qua Tóm Tắt & OP (02:10)" };
    }

    // Dragon Ball / Bảy Viên Ngọc Rồng (~1 phút 50 giây)
    if (slug.includes("dragon-ball") || slug.includes("bay-vien-ngoc-rong")) {
      return { start: 1, end: 115, target: 110, label: "Bỏ qua Tóm Tắt & OP (01:50)" };
    }

    // Doraemon & Cậu Bé Bút Chì Shin
    if (slug.includes("doraemon") || slug.includes("shin-cau-be")) {
      return { start: 1, end: 80, target: 75, label: "Bỏ qua Nhạc Mở Đầu (01:15)" };
    }

    // Anime Nhật Bản (Thanh Gươm Diệt Quỷ, Chú Thuật Hồi Chiến, Chainsaw Man, v.v.):
    const isAnime = tags.includes("anime") || genres.some((g) => /anime|hoạt hình/i.test(g)) || cSlug === "nhat-ban";
    if (isAnime) {
      // Trường hợp có Cold Open: Sau 1-2 phút cảnh dẫn truyện thì nhạc OP mới nổi lên
      if (currentTime >= 60 && currentTime <= 240) {
        return { start: 60, end: 210, target: 195, label: "Bỏ qua Nhạc Mở Đầu (OP)" };
      }
      // Mở đầu tiêu chuẩn 90s (1 phút 30 giây chuẩn công nghiệp Anime Nhật)
      return { start: 1, end: 95, target: 90, label: "Bỏ qua Nhạc Mở Đầu (01:30)" };
    }

    // Hoạt hình 3D Trung Quốc (Đấu La, Đấu Phá, Hoàn Mỹ Thế Giới, Tiên Nghịch...): Nhạc OP dài ~85s
    const isDonghua3D = tags.includes("hoat-hinh-3d") || genres.some((g) => /hoạt hình 3d|tiên hiệp|huyền huyễn/i.test(g));
    if (isDonghua3D) {
      return { start: 1, end: 90, target: 85, label: "Bỏ qua Nhạc Đầu Phim (01:25)" };
    }

    // Phim Bộ Trung Quốc (C-Drama / Cổ Trang): Bài hát mở đầu dài chuẩn 1m50s - 2m (110s - 120s)
    if ((cSlug === "trung-quoc" || movie.country === "Trung Quốc") && isSeries) {
      return { start: 1, end: 120, target: 115, label: "Bỏ qua Nhạc Đầu Phim (01:55)" };
    }

    // Phim Bộ Hàn Quốc (K-Drama): Nhạc mở đầu chuẩn 70s - 80s
    if ((cSlug === "han-quoc" || movie.country === "Hàn Quốc") && isSeries) {
      return { start: 1, end: 82, target: 78, label: "Bỏ qua Đoạn Mở Đầu (01:18)" };
    }

    // Phim Bộ Âu Mỹ & Netflix Originals: Đoạn giới thiệu chuẩn 45s - 60s
    if (tags.includes("netflix") || cSlug === "au-my" || movie.country === "Âu Mỹ") {
      return { start: 1, end: 62, target: 58, label: "Bỏ qua Intro Netflix" };
    }

    // Phim Lẻ Chiếu Rạp (Single Movies): Đoạn logo hãng phim & nhà sản xuất mở đầu ~65s (chỉ áp dụng nếu thời lượng >= 300s)
    if (movie.type === "single" || !isSeries) {
      if (!duration || duration >= 300) {
        return { start: 2, end: 75, target: 70, label: "Bỏ qua Giới Thiệu Đầu Phim" };
      }
    }

    // Phim bộ chung
    return { start: 1, end: 82, target: 78, label: "Bỏ qua Intro" };
  }

  updateSkipIntroButtonState(videoEl, movie, epIndex = 0) {
    const btn = document.getElementById("appleSkipIntroBtn");
    if (!btn || !videoEl) return;
    if (videoEl.style.display === "none") {
      btn.classList.remove("visible");
      return;
    }
    const mov = movie || this.playingMovie || this.selectedMovie;
    const cur = videoEl.currentTime || 0;
    const dur = videoEl.duration || 0;
    const intro = this.getMovieIntroWindow(mov, dur, cur);
    if (!intro) {
      btn.classList.remove("visible");
      return;
    }
    const epKey = `${mov?.slug || ""}-${epIndex}`;

    // Nếu người dùng tua ngược lại trước target hoặc trước mốc bắt đầu, cho phép nút hiện lại
    if (this._introSkippedKey === epKey) {
      if (cur < intro.start || cur < (intro.target || intro.end) - 8) {
        this._introSkippedKey = null;
      }
    }

    const shouldShow =
      this._introSkippedKey !== epKey &&
      cur >= intro.start &&
      cur <= (intro.end - 1);

    btn.classList.toggle("visible", shouldShow);
    if (shouldShow && intro.label) {
      const textSpan = btn.querySelector("span");
      if (textSpan) textSpan.textContent = intro.label;
    }
  }

  skipMovieIntro(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const videoEl = document.getElementById("hlsVideoElement");
    if (!videoEl || videoEl.style.display === "none") return;
    const mov = this.playingMovie || this.selectedMovie;
    const cur = videoEl.currentTime || 0;
    const dur = videoEl.duration || 0;
    const intro = this.getMovieIntroWindow(mov, dur, cur);
    if (!intro) return;

    const targetTime = intro.target || intro.end;
    if (cur >= targetTime) return;

    this._introSkippedKey = `${mov?.slug || ""}-${this.currentEpisodeIndex}`;
    const btn = document.getElementById("appleSkipIntroBtn");
    if (btn) btn.classList.remove("visible");

    videoEl.currentTime = targetTime;
    const pct = dur ? (targetTime / dur) * 100 : 0;
    const fill = document.getElementById("appleScrubFill");
    const thumb = document.getElementById("appleScrubThumb");
    if (fill) fill.style.width = `${pct}%`;
    if (thumb) thumb.style.left = `${pct}%`;
    const curTimeEl = document.getElementById("appleCurrentTime");
    if (curTimeEl) curTimeEl.textContent = this.formatSeconds(targetTime);

    this.showAppleVideoHud("forward", intro.label || "Đã bỏ qua Intro");
    this.triggerHaptic("medium");
  }

  seekRelative(seconds = 5, showHud = false, e) {
    if (e) e.stopPropagation();
    const videoEl = document.getElementById("hlsVideoElement");
    if (!videoEl || isNaN(videoEl.duration) || videoEl.duration <= 0) return;

    // Tích lũy thời gian tua nhanh/lùi khi bấm liên tục (Debounce chống nhấp nháy đen decoder)
    if (this._seekAccumulatorTimer) {
      clearTimeout(this._seekAccumulatorTimer);
      this._seekAccumulatedDelta = (this._seekAccumulatedDelta || 0) + seconds;
    } else {
      this._seekAccumulatedDelta = seconds;
      this._seekBaseTime = videoEl.currentTime;
    }

    const totalDelta = this._seekAccumulatedDelta;
    const targetTime = Math.max(0, Math.min(videoEl.duration, this._seekBaseTime + totalDelta));

    // Cập nhật ngay thanh Scrubber UI & hiển thị HUD cực nhạy
    const pct = (targetTime / videoEl.duration) * 100;
    const fill = document.getElementById("appleScrubFill");
    const thumb = document.getElementById("appleScrubThumb");
    if (fill) fill.style.width = `${pct}%`;
    if (thumb) thumb.style.left = `${pct}%`;
    const curTimeEl = document.getElementById("appleCurrentTime");
    if (curTimeEl) curTimeEl.textContent = this.formatSeconds(targetTime);

    if (showHud) {
      const sign = totalDelta > 0 ? "+" : "";
      this.showAppleVideoHud(totalDelta > 0 ? "forward" : "backward", `${sign}${totalDelta}s`);
    }

    // Debounce 60ms: gom các lần bấm liên tục thành một lệnh seek chính xác, triệt tiêu hoàn toàn nhấp nháy đen
    this._seekAccumulatorTimer = setTimeout(() => {
      this._seekAccumulatorTimer = null;
      this._seekAccumulatedDelta = 0;
      videoEl.currentTime = targetTime;
    }, 60);
  }

  setVideoVolume(val, showHud = false) {
    const videoEl = document.getElementById("hlsVideoElement");
    if (!videoEl) return;
    const v = Math.max(0, Math.min(1, parseFloat(val)));
    videoEl.volume = v;
    videoEl.muted = (v === 0);
    if (showHud) {
      this.showAppleVideoHud("volume", `${Math.round(v * 100)}%`);
    }
  }

  adjustVideoVolume(delta) {
    const videoEl = document.getElementById("hlsVideoElement");
    if (!videoEl) return;
    const current = videoEl.muted ? 0 : videoEl.volume;
    const next = Math.max(0, Math.min(1, current + delta));
    this.setVideoVolume(next, true);
  }

  toggleVideoMute(e) {
    if (e) e.stopPropagation();
    const videoEl = document.getElementById("hlsVideoElement");
    if (!videoEl) return;
    videoEl.muted = !videoEl.muted;
    this.showAppleVideoHud(videoEl.muted ? "mute" : "unmute");
  }

  cyclePlaybackSpeed(e) {
    if (e) e.stopPropagation();
    const videoEl = document.getElementById("hlsVideoElement");
    if (!videoEl) return;
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const currentSpeed = videoEl.playbackRate || 1.0;
    const nextIdx = (speeds.indexOf(currentSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    videoEl.playbackRate = nextSpeed;
    const textEl = document.getElementById("appleSpeedText");
    if (textEl) textEl.textContent = `${nextSpeed}x`;
    this.showAppleVideoHud("speed", `${nextSpeed}x`);
  }

  toggleVideoTheaterMode(e) {
    if (e) e.stopPropagation();
    const modal = document.getElementById("movieDetailModal");
    const sheet = document.getElementById("movieDetailSheet");
    if (!sheet) return;
    const isTheater = sheet.classList.toggle("apple-theater-mode");
    modal?.classList.toggle("lights-off", isTheater);
    this.showAppleVideoHud("theater", isTheater ? "Rạp phim: Bật" : "Rạp phim: Tắt");
  }

  toggleWatermarkShield(e) {
    if (e) e.stopPropagation();
    const shield = document.getElementById("appleWatermarkShield");
    const icon = document.getElementById("appleShieldIcon");
    const btn = document.getElementById("appleShieldBtn");
    if (!shield) return;
    const isHidden = shield.classList.toggle("disabled");
    if (icon) {
      icon.className = isHidden ? "fas fa-eye" : "fas fa-eye-slash";
    }
    if (btn) {
      btn.classList.toggle("active", !isHidden);
      btn.title = isHidden ? "Khử Logo & Watermark (Đang Tắt - Phím W)" : "Khử Logo & Watermark (Đang Bật - Phím W)";
    }
    if (isHidden) {
      this.showToast("Đã tắt lớp khử Logo & Watermark");
      this.showAppleVideoHud("forward", "Logo: Hiện");
    } else {
      this.showToast("🛡️ Đã bật khử Logo & Watermark (HHPANDA, YanHH3D)");
      this.showAppleVideoHud("forward", "Khử Logo: Bật");
    }
  }

  toggleVideoPip(e) {
    if (e) e.stopPropagation();
    const videoEl = document.getElementById("hlsVideoElement");
    if (!videoEl) return;
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    } else if (videoEl.requestPictureInPicture) {
      videoEl.requestPictureInPicture().catch(() => {});
    }
  }

  toggleVideoFullscreen(e) {
    if (e) e.stopPropagation();
    const stage = document.getElementById("activeVideoContainer") || document.getElementById("modalPlayerStage");
    if (!stage) return;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } else {
      if (stage.requestFullscreen) {
        stage.requestFullscreen().then(() => {
          if (this._resetControlsTimer) this._resetControlsTimer();
        }).catch(() => {});
      } else if (stage.webkitRequestFullscreen) {
        stage.webkitRequestFullscreen();
        if (this._resetControlsTimer) this._resetControlsTimer();
      }
    }
  }

  startScrubbing(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const track = document.getElementById("appleScrubContainer");
    const videoEl = document.getElementById("hlsVideoElement");
    if (!track || !videoEl || isNaN(videoEl.duration) || videoEl.duration <= 0) return;

    this._isScrubbing = true;
    let targetTime = videoEl.currentTime;

    const getClientX = (ev) => {
      if (ev.touches && ev.touches.length > 0) return ev.touches[0].clientX;
      if (ev.changedTouches && ev.changedTouches.length > 0) return ev.changedTouches[0].clientX;
      return ev.clientX;
    };

    const updateUI = (moveEvent) => {
      const rect = track.getBoundingClientRect();
      if (!rect.width) return;
      const clientX = getClientX(moveEvent);
      const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      targetTime = pos * videoEl.duration;
      const fillEl = document.getElementById("appleScrubFill");
      const thumbEl = document.getElementById("appleScrubThumb");
      if (fillEl) fillEl.style.width = `${pos * 100}%`;
      if (thumbEl) thumbEl.style.left = `${pos * 100}%`;
      const curTimeEl = document.getElementById("appleCurrentTime");
      if (curTimeEl) curTimeEl.textContent = this.formatSeconds(targetTime);
    };

    updateUI(e);

    const onMouseMove = (moveEvent) => {
      updateUI(moveEvent);
    };

    const onMouseUp = () => {
      this._isScrubbing = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onMouseMove);
      window.removeEventListener("touchend", onMouseUp);
      videoEl.currentTime = targetTime;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onMouseMove, { passive: true });
    window.addEventListener("touchend", onMouseUp);
  }

  previewScrubTime(e) {
    const track = document.getElementById("appleScrubContainer");
    const tooltip = document.getElementById("appleScrubTooltip");
    const videoEl = document.getElementById("hlsVideoElement");
    if (!track || !tooltip || !videoEl || !videoEl.duration) return;

    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetSeconds = pct * videoEl.duration;

    tooltip.textContent = this.formatSeconds(targetSeconds);
    tooltip.style.left = `${e.clientX - rect.left}px`;
    tooltip.classList.add("visible");
  }

  hideScrubTimePreview() {
    document.getElementById("appleScrubTooltip")?.classList.remove("visible");
  }

  toggleNowPlayingPlayPause() {
    if (!this.playingMovie) return;
    const modalOpen = document.getElementById("movieDetailModal")?.classList.contains("open");
    const videoEl = document.getElementById("hlsVideoElement");

    if (modalOpen && videoEl && videoEl.style.display !== "none") {
      this.toggleVideoPlayPause();
      this.setNowPlayingBar(this.playingMovie, this.currentEpisodeIndex, this.isPlaying);
    } else {
      // Nếu modal đang đóng, mở thẳng rạp phim phát tiếp
      this.openMovieModal(this.playingMovie.slug, true, this.currentEpisodeIndex);
    }
  }

  stepNowPlayingEpisode(direction) {
    if (!this.playingMovie) return;
    const eps = this.playingMovie.episodes || [];
    if (eps.length <= 1) {
      // Chuyển sang bộ phim liên quan tiếp theo
      const related = this.service.getRelatedMovies(this.playingMovie, 3);
      if (related[0]) {
        this.openMovieModal(related[0].movie.slug, true, 0);
      }
      return;
    }
    const nextIdx = (this.currentEpisodeIndex + direction + eps.length) % eps.length;
    this.openMovieModal(this.playingMovie.slug, true, nextIdx);
  }

  /* ==========================================================================
     SEARCH, FILTERS, FAVORITES & HISTORY
     ========================================================================== */
  handleSearchInput(rawValue) {
    this.ensureFullCatalogLoaded();
    const query = (rawValue || "").trim();
    const clearBtn = document.getElementById("searchClearBtn");
    const dropdown = document.getElementById("searchDropdown");

    if (clearBtn) clearBtn.classList.toggle("visible", query.length > 0);

    if (!query) {
      if (dropdown) dropdown.classList.remove("open");
      return;
    }

    // 1. TÌM KIẾM TỨC THÌ 0ms VỚI CHỈ MỤC ĐÃ ĐƯỢC TIỀN TÍNH TOÁN (SMART RELEVANCE RANKING)
    const q = query.toLowerCase();
    const qNorm = this.service.normalizeSearchText ? this.service.normalizeSearchText(q) : q;
    const qTokens = qNorm ? qNorm.split(" ").filter(Boolean) : [];
    const scored = [];
    const movies = this.service.movies;
    for (let i = 0; i < movies.length; i++) {
      const m = movies[i];
      const t = m._titleLower || (m._titleLower = (m.title || "").toLowerCase());
      const o = m._originLower || (m._originLower = (m.originTitle || "").toLowerCase());
      const tNorm = m._titleNorm || (m._titleNorm = this.service.normalizeSearchText ? this.service.normalizeSearchText(m.title) : t);
      const oNorm = m._originNorm || (m._originNorm = this.service.normalizeSearchText ? this.service.normalizeSearchText(m.originTitle) : o);
      let score = 0;

      if (t === q || o === q || (qNorm && (tNorm === qNorm || oNorm === qNorm))) {
        score = 250; // Trùng khớp hoàn toàn 100%
      } else if (t.startsWith(q) || (qNorm && tNorm.startsWith(qNorm))) {
        score = 180; // Tên tiếng Việt bắt đầu bằng từ khóa
      } else if (o.startsWith(q) || (qNorm && oNorm.startsWith(qNorm))) {
        score = 150; // Tên gốc bắt đầu bằng từ khóa (kể cả khi bỏ dấu : hay -)
      } else if (t.includes(q) || (qNorm && tNorm.includes(qNorm))) {
        score = 110; // Tên tiếng Việt chứa từ khóa
      } else if (o.includes(q) || (qNorm && oNorm.includes(qNorm))) {
        score = 90; // Tên gốc chứa từ khóa
      } else if (qTokens.length > 1 && qTokens.every((tk) => `${tNorm} ${oNorm}`.includes(tk))) {
        score = 80; // Khớp toàn bộ từ khóa rời rạc giữa tiếng Việt & tiếng Anh
      } else {
        const meta = m._metaSearch || (m._metaSearch = `${(m.genres || []).join(" ")} ${(m.cast || []).join(" ")} ${m.director || ""}`.toLowerCase());
        if (meta.includes(q)) {
          score = 25; // Chỉ nằm trong diễn viên / thể loại
        }
      }

      if (score > 0) {
        scored.push({ movie: m, score });
      }
    }

    // Sắp xếp ưu tiên độ khớp từ khóa cao nhất lên đầu, tiếp đến năm phát hành
    scored.sort((a, b) => b.score - a.score || (b.movie.year || 0) - (a.movie.year || 0));
    const quickMatches = scored.slice(0, 8).map((it) => it.movie);

    // Hiển thị NGAY LẬP TỨC (0ms) cho người dùng mà không cần chờ đợi
    this.renderSearchDropdown(query, quickMatches, false);

    // 2. TÌM NÂNG CAO TRỰC TUYẾN PHIMAPI (Debounce siêu tốc 120ms để mở rộng kết quả)
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(async () => {
      const fullMatches = await this.service.searchMovies(query);
      const currentInput = (document.getElementById("topSearchInput")?.value || "").trim();
      if (currentInput === query) {
        this.lastSearchQuery = query;
        this.lastSearchResults = fullMatches;
        this.renderSearchDropdown(query, fullMatches.slice(0, 8), true);
      }
    }, 120);
  }

  renderSearchDropdown(query, results, isLiveDone) {
    const dropdown = document.getElementById("searchDropdown");
    if (!dropdown) return;

    dropdown.innerHTML = `
      <div class="search-dropdown-header">
        <span><i class="fas fa-magnifying-glass"></i> Kết quả cho "${query}"</span>
        <span>${isLiveDone ? "Đã tìm trên Ngwyren Cinema" : "Đang tìm trực tuyến..."}</span>
      </div>
      ${
        results.length > 0
          ? results
              .map(
                (m, idx) => `
            <div class="search-suggestion-item" style="--item-stagger: ${idx};" onclick="app.selectSearchResult('${m.slug}')">
              <img src="${m.poster}" alt="${m.title}" loading="lazy" decoding="async" />
              <div class="search-suggestion-info">
                <div class="search-suggestion-title">${m.title}</div>
                <div class="search-suggestion-meta">
                  <span class="badge-mini">${m.quality === "4K" ? "4K" : "Full HD"}</span>
                  <span class="badge-mini">${m.year || 2026}</span>
                  <span class="search-genre-tag">${(m.genres && m.genres[0]) || m.country || "Phim"}</span>
                </div>
              </div>
              <i class="fas fa-play-circle" style="font-size: 1.25rem; color: rgba(255, 255, 255, 0.85); flex-shrink: 0;"></i>
            </div>
          `
              )
              .join("") +
            `<button class="btn-sync-now" style="width: 100%; margin-top: 8px; padding: 9px;" onclick="app.showFullSearchResults('${query.replace(/'/g, "\\'")}')">
              Xem toàn bộ kết quả cho "${query}" (${(this.lastSearchResults || results).length} phim)
            </button>`
          : `<div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 0.86rem;">
              Không tìm thấy phim khớp với "${query}". Hãy thử từ khóa khác!
            </div>`
      }
    `;
    dropdown.classList.add("open");
  }

  selectSearchResult(slug) {
    document.getElementById("searchDropdown")?.classList.remove("open");
    this.openMovieModal(slug, false);
  }

  async showFullSearchResults(query) {
    document.getElementById("searchDropdown")?.classList.remove("open");
    this.lastSearchQuery = query;
    this.lastSearchResults = await this.service.searchMovies(query);
    this.currentNav = "search-results";
    this.transitionView(() => {
      this.renderMainView();
    });
  }

  clearSearch() {
    const input = document.getElementById("topSearchInput");
    const sideInput = document.getElementById("sidebarSearchInput");
    if (input) input.value = "";
    if (sideInput) sideInput.value = "";
    document.getElementById("searchClearBtn")?.classList.remove("visible");
    document.getElementById("searchDropdown")?.classList.remove("open");
    if (this.currentNav === "search-results") {
      this.resetAllFilters();
    }
  }

  selectGenreChip(genreLabel) {
    if (genreLabel === "Anime") {
      this.setNavigation("anime");
      return;
    }
    this.activeGenreFilter = genreLabel;
    this.syncLeftDockIndicator(this.currentNav);
    this.transitionView(() => {
      this.renderMainView();
    });
  }

  filterByGenreFromModal(genreLabel) {
    this.closeMovieModal();
    if (genreLabel === "Anime") {
      this.setNavigation("anime");
      return;
    }
    this.activeGenreFilter = genreLabel;
    this.syncLeftDockIndicator(this.currentNav);
    this.transitionView(() => {
      this.renderMainView();
    });
  }

  filterByPerson(personName) {
    this.closeMovieModal();
    this.customFilterValue = personName;
    this.currentNav = "person-filter";
    this.syncLeftDockIndicator("kham-pha");
    this.transitionView(() => {
      this.renderMainView();
    });
  }

  toggleMyList(slug, event) {
    if (event) event.stopPropagation();
    const movie = this.findMovie(slug);
    if (!movie) return;

    const idx = this.myList.findIndex((item) => item === movie.slug || item === movie.id);
    if (idx >= 0) {
      this.myList.splice(idx, 1);
      this.showToast(`Đã xóa "${movie.title}" khỏi Danh sách yêu thích`);
    } else {
      this.myList.unshift(movie.slug);
      this.showToast(`Đã thêm "${movie.title}" vào Danh sách yêu thích`);
    }

    this.saveStorage("apple_cinema_mylist", this.myList);
    this.updateSidebarCounts();
    this.renderMainView();

    // Cập nhật nút trong Modal nếu đang mở
    const modalBtn = document.getElementById("modalMyListBtn");
    if (modalBtn && this.selectedMovie && this.selectedMovie.slug === movie.slug) {
      const saved = this.isInMyList(movie);
      modalBtn.classList.toggle("active", saved);
      modalBtn.innerHTML = `<i class="${saved ? "fas fa-star" : "far fa-star"}"></i><span>${saved ? "Đã Lưu Yêu Thích" : "Lưu Yêu Thích"}</span>`;
    }

    // Cập nhật nút trong Mini Player Bar nếu đang phát phim này
    const miniFavBtn = document.getElementById("miniPlayerFavBtn");
    const miniFavIcon = document.getElementById("miniPlayerFavIcon");
    if (miniFavBtn && this.playingMovie && (this.playingMovie.slug === movie.slug || this.playingMovie.id === movie.id)) {
      const saved = this.isInMyList(movie);
      miniFavBtn.classList.toggle("active", saved);
      if (miniFavIcon) {
        miniFavIcon.className = saved ? "fas fa-star" : "far fa-star";
      }
    }
  }

  isInMyList(movie) {
    if (!movie) return false;
    return this.myList.includes(movie.slug) || this.myList.includes(movie.id);
  }

  recordWatchHistory(slug, epIndex = 0) {
    const movie = this.findMovie(slug);
    const canonicalSlug = movie ? movie.slug : slug;
    this.watchHistory = this.sanitizeAndDedupeHistory([
      {
        slug: canonicalSlug,
        title: movie?.title || "",
        poster: movie?.poster || "",
        backdrop: movie?.backdrop || "",
        epIndex,
        progress: 15,
        currentTime: 0,
        timestamp: Date.now()
      },
      ...(this.watchHistory || [])
    ]);
    this.saveStorage("apple_cinema_history", this.watchHistory);
    this.updateSidebarCounts();
    const contShelf = document.getElementById("continueWatchingShelf");
    if (contShelf) {
      contShelf.outerHTML = this.renderContinueWatchingShelfHTML();
    }
  }

  updateSidebarCounts() {
    const favCount = document.getElementById("myListCountBadge");
    const hisCount = document.getElementById("historyCountBadge");
    const totCount = document.getElementById("totalMoviesCountBadge");
    const animeCount = document.getElementById("animeMoviesCountBadge");
    const topbarSaved = document.getElementById("topbarSavedCount");
    if (favCount) favCount.textContent = this.myList.length;
    if (hisCount) hisCount.textContent = this.watchHistory.length;
    if (totCount) totCount.textContent = this.service.movies.length;
    if (animeCount) animeCount.textContent = this.getMoviesByTag("anime").length;
    if (topbarSaved) {
      topbarSaved.textContent = this.myList.length;
      topbarSaved.style.display = this.myList.length > 0 ? "inline-flex" : "none";
    }
  }

  /* ==========================================================================
     HERO CAROUSEL & HELPERS (CONTINUOUS AUTO-ROTATE & DOTS)
     ========================================================================== */
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
  }

  pauseHeroAutoRotate() {
    this.isHeroPaused = true;
  }

  resumeHeroAutoRotate() {
    this.isHeroPaused = false;
  }

  setHeroSlide(index) {
    const heroList = this.getActiveHeroMovies();
    if (!heroList || heroList.length === 0) return;
    this.heroIndex = ((index % heroList.length) + heroList.length) % heroList.length;
    document.querySelectorAll(".is-hero-previewing").forEach((el) => el.classList.remove("is-hero-previewing"));
    const heroEl = document.getElementById("heroShowcase");
    if (heroEl) {
      heroEl.outerHTML = this.renderHeroHTML();
      this.attachHeroSwipeHandlers();
      const newHero = document.getElementById("heroShowcase");
      if (newHero) {
        newHero.classList.remove("vision-hero-slide-anim", "ps5-hero-morph-anim");
        requestAnimationFrame(() => {
          newHero.classList.add("ps5-hero-morph-anim");
        });
      }
    }
  }

  scrollTrack(trackId, direction) {
    const track = document.getElementById(trackId);
    if (!track) return;
    const scrollAmount = track.clientWidth * 0.82 * direction;
    track.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }

  toggleLightsOff() {
    this.lightsOff = !this.lightsOff;
    document.getElementById("movieDetailModal")?.classList.toggle("lights-off", this.lightsOff);
    const btn = document.getElementById("lightsOffBtn");
    if (btn) {
      btn.title = this.lightsOff ? "Bật Đèn" : "Tắt Đèn Rạp";
      btn.classList.toggle("active", this.lightsOff);
    }
  }


  ensureFullCatalogLoaded() {
    if (this.service && !this.service._fullCatalogLoaded && typeof window !== "undefined" && Array.isArray(window.NGWYREN_FULL_CATALOG)) {
      this.service.loadFullCatalog(window.NGWYREN_FULL_CATALOG);
    }
  }

  findMovie(idOrSlug) {
    if (!idOrSlug) return null;
    this.ensureFullCatalogLoaded();
    const cleanSlug = idOrSlug === "ly-hung-mieu" ? "ly-hung-mieu-gau-truc-ly" : idOrSlug;
    return (
      this.service.slugMap.get(cleanSlug) ||
      this.service.slugMap.get(idOrSlug) ||
      this.service.movies.find((m) => m.id === cleanSlug || m.slug === cleanSlug || m.id === idOrSlug || m.slug === idOrSlug)
    );
  }

  getMoviesByTag(tag) {
    return this.tagCache.get(tag) || [];
  }

  getMoviesByCountry(countrySlug) {
    return this.countryCache.get(countrySlug) || [];
  }

  extractYouTubeId(url) {
    if (!url) return "";
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : "";
  }

  formatSeconds(sec) {
    if (!sec || isNaN(sec)) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  showToast(message) {
    // Tắt toàn bộ thông báo toast theo yêu cầu người dùng
    return;
  }

  bindGlobalEvents() {
    // Apple Haptic Feedback on touch & click
    document.addEventListener(
      "pointerdown",
      (e) => {
        const interactive = e.target.closest(
          "button, a, .vision-nav-pill, .vision-dock-icon, .dock-tab-btn, .filter-chip, .vision-movie-card, .vision-feature-card, .mini-ctrl-btn, .mini-play-glow-btn, .mini-cinema-expand-btn, .btn-action, .quality-pill-btn, .server-btn"
        );
        if (interactive) {
          this.triggerHaptic("light");
        }
      },
      { passive: true }
    );

    // Segmented control trên Topbar
    document.querySelectorAll(".segment-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".segment-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentSegment = btn.dataset.segment || "all";
        this.renderMainView();
      });
    });

    // Tìm kiếm Topbar & Sidebar
    const topInput = document.getElementById("topSearchInput");
    const sideInput = document.getElementById("sidebarSearchInput");

    if (topInput) {
      topInput.addEventListener("input", (e) => this.handleSearchInput(e.target.value));
      topInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && topInput.value.trim()) {
          this.showFullSearchResults(topInput.value.trim());
        }
      });
    }

    if (sideInput) {
      sideInput.addEventListener("input", (e) => {
        if (topInput) topInput.value = e.target.value;
        this.handleSearchInput(e.target.value);
      });
      sideInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && sideInput.value.trim()) {
          this.showFullSearchResults(sideInput.value.trim());
        }
      });
    }

    // Đóng dropdown tìm kiếm, notification center hoặc Dynamic Island khi click ra ngoài
    document.addEventListener("click", (e) => {
      const searchBox = document.querySelector(".topbar-search-container");
      if (searchBox && !searchBox.contains(e.target)) {
        document.getElementById("searchDropdown")?.classList.remove("open");
      }
      const playerBar = document.getElementById("applePlayerBar");
      if (playerBar && playerBar.classList.contains("is-expanded") && !playerBar.contains(e.target)) {
        playerBar.classList.remove("is-expanded");
      }
      const flyout = document.getElementById("visionNotifFlyout");
      const bellBtn = document.getElementById("notifBellBtn");
      if (flyout && flyout.style.display !== "none") {
        if (!flyout.contains(e.target) && !bellBtn?.contains(e.target)) {
          this.closeNotificationCenter();
        }
      }
    });

    // Phím tắt bàn phím Desktop chuẩn Rạp Phim:
    // Ctrl+K hoặc /: Tìm kiếm
    // Space: Play / Pause (video đang mở hoặc thanh Now Playing)
    // F: Toàn màn hình video (Fullscreen)
    // M: Bật / Tắt tiếng (Mute / Unmute)
    // ESC: Đóng Modal & Dropdown
    document.addEventListener("keydown", (e) => {
      const target = e.target;
      const isInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        topInput?.focus();
      } else if (e.key === "/" && !isInput) {
        e.preventDefault();
        topInput?.focus();
      } else if (e.key === "Escape") {
        document.getElementById("searchDropdown")?.classList.remove("open");
        this.toggleMobileSidebar(false);
        this.closeNotificationCenter();
        document.getElementById("applePlayerBar")?.classList.remove("is-expanded");
        if (document.getElementById("movieDetailModal")?.classList.contains("open")) {
          this.closeMovieModal();
        }
      } else if (e.code === "Space" && !isInput) {
        e.preventDefault();
        const modal = document.getElementById("movieDetailModal");
        const videoEl = document.getElementById("hlsVideoElement");
        const modalOpen = modal?.classList.contains("open");
        const videoVisible = videoEl && videoEl.style.display !== "none";

        if (modalOpen && videoVisible) {
          this.toggleVideoPlayPause();
        } else {
          this.toggleNowPlayingPlayPause();
        }
      } else if (e.code === "ArrowLeft" && !isInput) {
        const modal = document.getElementById("movieDetailModal");
        const videoEl = document.getElementById("hlsVideoElement");
        if (modal?.classList.contains("open") && videoEl && videoEl.style.display !== "none") {
          e.preventDefault();
          this.seekRelative(-5, true);
        }
      } else if (e.code === "ArrowRight" && !isInput) {
        const modal = document.getElementById("movieDetailModal");
        const videoEl = document.getElementById("hlsVideoElement");
        if (modal?.classList.contains("open") && videoEl && videoEl.style.display !== "none") {
          e.preventDefault();
          this.seekRelative(5, true);
        }
      } else if (e.code === "ArrowUp" && !isInput) {
        const modal = document.getElementById("movieDetailModal");
        const videoEl = document.getElementById("hlsVideoElement");
        if (modal?.classList.contains("open") && videoEl && videoEl.style.display !== "none") {
          e.preventDefault();
          this.adjustVideoVolume(0.1);
        }
      } else if (e.code === "ArrowDown" && !isInput) {
        const modal = document.getElementById("movieDetailModal");
        const videoEl = document.getElementById("hlsVideoElement");
        if (modal?.classList.contains("open") && videoEl && videoEl.style.display !== "none") {
          e.preventDefault();
          this.adjustVideoVolume(-0.1);
        }
      } else if ((e.key === "f" || e.key === "F") && !isInput) {
        const modal = document.getElementById("movieDetailModal");
        const videoEl = document.getElementById("hlsVideoElement");
        if (modal?.classList.contains("open") && videoEl) {
          e.preventDefault();
          this.toggleVideoFullscreen();
        }
      } else if ((e.key === "s" || e.key === "S") && !isInput) {
        const modal = document.getElementById("movieDetailModal");
        const videoEl = document.getElementById("hlsVideoElement");
        if (modal?.classList.contains("open") && videoEl && videoEl.style.display !== "none") {
          e.preventDefault();
          this.skipMovieIntro();
        }
      } else if ((e.key === "m" || e.key === "M") && !isInput) {
        const modal = document.getElementById("movieDetailModal");
        const videoEl = document.getElementById("hlsVideoElement");
        if (modal?.classList.contains("open") && videoEl && videoEl.style.display !== "none") {
          e.preventDefault();
          this.toggleVideoMute();
        } else if (videoEl) {
          videoEl.muted = !videoEl.muted;
          this.showToast(videoEl.muted ? "🔇 Đã tắt tiếng (Muted)" : "🔊 Đã bật âm thanh");
        }
      } else if ((e.key === "t" || e.key === "T") && !isInput) {
        const modal = document.getElementById("movieDetailModal");
        const videoEl = document.getElementById("hlsVideoElement");
        if (modal?.classList.contains("open") && videoEl && videoEl.style.display !== "none") {
          e.preventDefault();
          this.toggleVideoTheaterMode();
        }
      } else if ((e.key === "s" || e.key === "S") && !isInput) {
        const modal = document.getElementById("movieDetailModal");
        const videoEl = document.getElementById("hlsVideoElement");
        if (modal?.classList.contains("open") && videoEl && videoEl.style.display !== "none") {
          e.preventDefault();
          this.skipAdIntro(15);
        }
      } else if ((e.key === "w" || e.key === "W") && !isInput) {
        const modal = document.getElementById("movieDetailModal");
        const videoEl = document.getElementById("hlsVideoElement");
        if (modal?.classList.contains("open") && videoEl && videoEl.style.display !== "none") {
          e.preventDefault();
          this.toggleWatermarkShield();
        }
      } else if ((e.key === "n" || e.key === "N") && !isInput) {
        const modal = document.getElementById("movieDetailModal");
        if (modal?.classList.contains("open")) {
          e.preventDefault();
          this.playNextEpisode();
        }
      }
    });

    // Dynamic Island / Mini Theater Hover Controller với Debounce chống giật viền (Anti-Glitch)
    const playerBar = document.getElementById("applePlayerBar");
    if (playerBar) {
      let collapseTimer = null;
      let expandTimer = null;

      playerBar.addEventListener("mouseenter", () => {
        if (collapseTimer) {
          clearTimeout(collapseTimer);
          collapseTimer = null;
        }
        expandTimer = setTimeout(() => {
          playerBar.classList.add("is-expanded");
        }, 50);
      });

      playerBar.addEventListener("mouseleave", () => {
        if (expandTimer) {
          clearTimeout(expandTimer);
          expandTimer = null;
        }
        // Debounce an toàn 220ms: Cho phép rê chuột sát mép viền cong mà không bao giờ bị glitch / nhấp nháy
        collapseTimer = setTimeout(() => {
          playerBar.classList.remove("is-expanded");
        }, 220);
      });

      // Chạm hoặc click để mở rộng / thu nhỏ (Hỗ trợ hoàn hảo cả Mobile, iPad & Desktop)
      playerBar.addEventListener("click", (e) => {
        if (e.target.closest("button") || e.target.closest(".mini-scrub-bar")) return;
        playerBar.classList.toggle("is-expanded");
      });
    }
  }

  /* ==========================================================================
     RESUME PLAYBACK ENGINE (XEM TIẾP TỤC NẾU THOÁT GIỮA CHỪNG)
     ========================================================================== */
  savePlaybackProgress(slug, epIndex, currentTime, duration) {
    if (!slug || !currentTime || !duration || isNaN(currentTime) || isNaN(duration)) return;
    const progressMap = this.loadStorage("ngwyren_playback_progress", {});
    const percentage = Math.min(100, Math.round((currentTime / duration) * 100));
    const key = `${slug}_${epIndex}`;
    progressMap[key] = {
      slug,
      epIndex,
      currentTime: Math.floor(currentTime),
      duration: Math.floor(duration),
      percentage,
      updatedAt: Date.now()
    };
    this.saveStorage("ngwyren_playback_progress", progressMap);

    const histItem = this.watchHistory.find((h) => h.slug === slug);
    if (histItem) {
      histItem.progress = percentage;
      histItem.epIndex = epIndex;
      histItem.currentTime = Math.floor(currentTime);
      histItem.timestamp = Date.now();
      this.saveStorage("apple_cinema_history", this.watchHistory);
    }
  }

  getPlaybackProgress(slug, epIndex = 0) {
    if (!slug) return null;
    const progressMap = this.loadStorage("ngwyren_playback_progress", {});
    return progressMap[`${slug}_${epIndex}`] || null;
  }

  restartPlayback() {
    if (!this.selectedMovie) return;
    this.savePlaybackProgress(this.selectedMovie.slug, this.currentEpisodeIndex, 0, 100);
    const videoEl = document.getElementById("hlsVideoElement");
    if (videoEl) {
      videoEl.currentTime = 0;
      videoEl.play().catch(() => {});
      this.showToast(`⏪ Đang phát lại từ đầu (00:00)`);
    } else {
      this.startVideoPlayback(this.selectedMovie, this.currentEpisodeIndex, "hls-1");
    }
  }

  /* ==========================================================================
     USER AUTH, PROFILE & CLOUD DATABASE SYNC ENGINE (GOOGLE + GUEST + MULTI-DEVICE)
     ========================================================================== */
  initUserProfile() {
    this.userProfile = this.loadStorage("ngwyren_user_profile", {
      type: "guest",
      name: "Guest",
      handle: "@guest",
      avatar: "🎬",
      avatarType: "emoji",
      avatarUrl: ""
    });

    // Nếu còn lưu tên cũ "Ngwyren Cinema" hoặc "Khách" -> chuẩn hóa thành "Guest"
    if (this.userProfile.type === "guest" && (this.userProfile.name === "Ngwyren Cinema" || this.userProfile.name === "Khách" || this.userProfile.handle === "@ngwyren")) {
      this.userProfile.name = "Guest";
      this.userProfile.handle = "@guest";
      this.userProfile.avatar = "🎬";
      this.saveStorage("ngwyren_user_profile", this.userProfile);
    }

    this.selectedGuestAvatar = this.userProfile.avatar || "🎬";
    this.customUploadedAvatar = this.userProfile.avatarType === "image" ? this.userProfile.avatarUrl : null;
    
    // Đọc Google Client ID chính thức từ Google Cloud Console (Project Ngwyren Cinema)
    const configClientId = window.NGWYREN_AUTH_CONFIG?.googleClientId || "254225466849-jf2edaghogh3nlcb341j02thvd39m9bt.apps.googleusercontent.com";
    this.googleClientId = configClientId;
    this.saveStorage("ngwyren_google_client_id", configClientId);
    
    this.initCloudSync();
    this.initGoogleIdentity();
    this.updateProfileUI();
  }

  /* ==========================================================================
     CLOUD DATABASE SYNC ENGINE (LƯU TRỮ & ĐỒNG BỘ ĐÁM MÂY XUYÊN THIẾT BỊ 100% TỰ ĐỘNG)
     ========================================================================== */
  initCloudSync() {
    this.deviceId = this.loadStorage("ngwyren_device_id", "") || ("dev_" + Math.random().toString(36).substring(2, 9));
    this.saveStorage("ngwyren_device_id", this.deviceId);

    this.cloudSyncKey = this.loadStorage("ngwyren_cloud_key", "") || "NGW-869O8P";
    this.saveStorage("ngwyren_cloud_key", this.cloudSyncKey);

    this.cloudEndpoint = window.NGWYREN_AUTH_CONFIG?.cloudStorageEndpoint || "https://api.restful-api.dev/objects";
    this.cloudRegistryId = window.NGWYREN_AUTH_CONFIG?.cloudRegistryId || "ff808181a09d98f701a1c8e5ff580442";
    this.cloudSyncDebounce = null;
    this.cloudSyncing = false;
    this.lastCloudSyncTime = this.loadStorage("ngwyren_last_cloud_sync", 0);

    // 1. Tải và đồng bộ đám mây ngay khi mở web (300ms non-blocking)
    setTimeout(() => this.syncFromCloud(false), 300);

    // 2. Kích hoạt kết nối Live SSE Realtime (Khi PC tạm dừng hoặc xem phim, Laptop/iPad/iPhone nhận ngay lập tức)
    this.initLiveSyncStream();

    // 3. Tự động đồng bộ lại khi chuyển qua lại giữa các máy (Tab Focus / Visibility Change)
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.syncFromCloud(false);
      }
    });
    window.addEventListener("focus", () => {
      this.syncFromCloud(false);
    });
  }

  getCloudSyncTopic() {
    if (this.userProfile?.handle && this.userProfile.handle.includes("@")) {
      const email = this.userProfile.handle.toLowerCase();
      if (email.includes("ngwyrentandinh")) {
        return "ngwyren_cinema_user_ngwyrentandinh";
      }
      return "ngwyren_cinema_user_" + email.replace(/[^a-z0-9]/g, "_");
    }
    if (this.cloudSyncKey && this.cloudSyncKey.startsWith("NGW-") && this.cloudSyncKey !== "NGW-TEST") {
      return "ngwyren_cinema_code_" + this.cloudSyncKey.toLowerCase().replace(/[^a-z0-9]/g, "_");
    }
    return "ngwyren_cinema_user_ngwyrentandinh";
  }

  initLiveSyncStream() {
    try {
      if (this._syncEventSource) {
        this._syncEventSource.close();
      }
      const topic = this.getCloudSyncTopic();
      const es = new EventSource(`https://ntfy.sh/${topic}/sse`);
      this._syncEventSource = es;
      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event === "message" && parsed.message) {
            const payload = JSON.parse(parsed.message);
            if (payload && payload.app === "ngwyren-cinema" && payload.sourceDevice !== this.deviceId) {
              this.mergeCloudState(payload, false);
            }
          }
        } catch (e) {}
      };
      es.onerror = () => {
        // SSE tự động kết nối lại khi mạng ổn định
      };
    } catch (e) {
      console.warn("[CloudSync] Live SSE init error:", e);
    }
  }

  triggerCloudSync(debounceMs = 1200) {
    if (this.cloudSyncDebounce) clearTimeout(this.cloudSyncDebounce);
    this.cloudSyncDebounce = setTimeout(() => {
      this.syncToCloud(false);
    }, debounceMs);
  }

  async syncToCloud(notify = false) {
    if (this.cloudSyncing) return;
    this.cloudSyncing = true;
    this.renderCloudSyncBadge(true);

    const topic = this.getCloudSyncTopic();
    const payload = {
      app: "ngwyren-cinema",
      cloudKey: this.cloudSyncKey,
      sourceDevice: this.deviceId,
      timestamp: Date.now(),
      profile: this.userProfile,
      myList: this.myList || [],
      history: this.watchHistory || [],
      progress: this.playbackProgress || {}
    };

    try {
      await fetch(`https://ntfy.sh/${topic}`, {
        method: "POST",
        headers: {
          "Title": "Ngwyren Cinema Sync",
          "Priority": "high",
          "Tags": "cinema,sync"
        },
        body: JSON.stringify(payload)
      });
      this.lastCloudSyncTime = Date.now();
      this.saveStorage("ngwyren_last_cloud_sync", this.lastCloudSyncTime, true);
      if (notify) {
        this.showToast("☁️ Đã lưu & đồng bộ xuyên thiết bị thành công!");
      }
    } catch (e) {
      console.warn("[CloudSync] syncToCloud error:", e);
    } finally {
      this.cloudSyncing = false;
      this.renderCloudSyncBadge(false);
    }
  }

  async syncFromCloud(notify = false) {
    const topic = this.getCloudSyncTopic();
    if (notify) this.showToast("🔄 Đang nạp dữ liệu từ đám mây (PC, Laptop, iPad, iPhone)...");

    try {
      const resp = await fetch(`https://ntfy.sh/${topic}/json?poll=1`);
      if (resp.ok) {
        const text = await resp.text();
        if (text) {
          const lines = text.trim().split("\n");
          let latestPayload = null;
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const entry = JSON.parse(lines[i]);
              if (entry.event === "message" && entry.message) {
                const data = JSON.parse(entry.message);
                if (data && data.app === "ngwyren-cinema") {
                  latestPayload = data;
                  break;
                }
              }
            } catch (e) {}
          }

          if (latestPayload) {
            this.mergeCloudState(latestPayload, notify);
            if (this.hasUnsyncedLocalChanges(latestPayload)) {
              this.syncToCloud(false);
            }
            return;
          }
        }
      }
    } catch (e) {
      console.warn("[CloudSync] syncFromCloud error:", e);
    }

    if (notify) {
      this.showToast(`🎉 Danh sách Tiếp Tục Xem: ${this.watchHistory.length} phim sẵn sàng.`);
    }
  }

  hasUnsyncedLocalChanges(cloudData) {
    if (!cloudData) return true;
    if (cloudData.forceReset || cloudData.action === "RESET_CLOUD") return false;
    if (!Array.isArray(cloudData.history)) return true;
    const cloudSlugs = new Set(cloudData.history.map((h) => h?.slug).filter(Boolean));
    for (const h of (this.watchHistory || [])) {
      if (h?.slug && !cloudSlugs.has(h.slug)) return true;
    }
    return false;
  }

  mergeCloudState(cloudData, notify = false) {
    if (!cloudData || cloudData.app !== "ngwyren-cinema") return false;

    let hasChanged = false;

    // A. Xử lý gói LÀM SẠCH / ĐÈ LÊN CLOUD (RESET_CLOUD / forceReset)
    if (cloudData.forceReset || cloudData.action === "RESET_CLOUD") {
      const cleanHistory = this.sanitizeAndDedupeHistory(Array.isArray(cloudData.history) ? cloudData.history : []);
      const cleanMyList = this.sanitizeAndDedupeMyList(Array.isArray(cloudData.myList) ? cloudData.myList : []);

      this.watchHistory = cleanHistory;
      this.saveStorage("apple_cinema_history", this.watchHistory, true);

      this.myList = cleanMyList;
      this.saveStorage("apple_cinema_mylist", this.myList, true);

      if (cloudData.progress && typeof cloudData.progress === "object") {
        this.playbackProgress = { ...cloudData.progress };
        this.saveStorage("ngwyren_playback_progress", this.playbackProgress, true);
      }
      hasChanged = true;
    } else {
      // B. Hợp nhất Lịch Sử & Tiếp Tục Xem 2 chiều (Two-Way Union Merge)
      if (Array.isArray(cloudData.history) && cloudData.history.length > 0) {
        const merged = this.sanitizeAndDedupeHistory([
          ...(this.watchHistory || []),
          ...cloudData.history
        ]);
        if (merged.length !== (this.watchHistory || []).length || JSON.stringify(merged) !== JSON.stringify(this.watchHistory)) {
          this.watchHistory = merged;
          this.saveStorage("apple_cinema_history", this.watchHistory, true);
          hasChanged = true;
        }
      }

      // 2. Hợp nhất Danh Sách Yêu Thích
      if (Array.isArray(cloudData.myList) && cloudData.myList.length > 0) {
        const mergedList = this.sanitizeAndDedupeMyList([
          ...(this.myList || []),
          ...cloudData.myList
        ]);
        if (mergedList.length !== (this.myList || []).length) {
          this.myList = mergedList;
          this.saveStorage("apple_cinema_mylist", this.myList, true);
          hasChanged = true;
        }
      }

      // 3. Hợp nhất Tiến Độ Từng Tập
      if (cloudData.progress && typeof cloudData.progress === "object") {
        this.playbackProgress = { ...(cloudData.progress || {}), ...(this.playbackProgress || {}) };
        this.saveStorage("ngwyren_playback_progress", this.playbackProgress, true);
      }
    }

    // 4. Đồng bộ Profile nếu là Google
    if (cloudData.profile && cloudData.profile.type === "google" && (!this.userProfile || this.userProfile.type !== "google")) {
      this.userProfile = cloudData.profile;
      this.saveStorage("ngwyren_user_profile", this.userProfile, true);
      this.updateProfileUI();
    }

    if (hasChanged || notify) {
      const contShelf = document.getElementById("continueWatchingShelf");
      if (contShelf) {
        contShelf.outerHTML = this.renderContinueWatchingShelfHTML();
      }
      if (this.currentNav === "yeu-thich" || this.currentNav === "lich-su") {
        this.renderMainView();
      }
      this.updateSidebarCounts();

      if (notify) {
        this.showToast(`🎉 Đồng bộ thành công! Hiện có ${this.watchHistory.length} phim tiếp tục xem.`);
      }
    }
    return hasChanged;
  }

  async manualForceSyncAllDevices() {
    this.showToast("🔄 Đang đồng bộ giữa PC, Laptop, iPad, iPhone...");
    await this.syncFromCloud(false);
    await this.syncToCloud(false);
    const contShelf = document.getElementById("continueWatchingShelf");
    if (contShelf) {
      contShelf.outerHTML = this.renderContinueWatchingShelfHTML();
    }
    this.updateSidebarCounts();
    this.showToast(`🎉 Đã đồng bộ hoàn tất! Hiện có ${this.watchHistory.length} phim đang xem.`);
  }

  async resetCloudDataAndPushLocal() {
    this.showToast("🧹 Đang làm sạch Cloud và đẩy dữ liệu hiện tại lên...");
    this.cloudSyncing = true;
    this.renderCloudSyncBadge(true);

    const topic = this.getCloudSyncTopic();
    const payload = {
      app: "ngwyren-cinema",
      action: "RESET_CLOUD",
      forceReset: true,
      cloudKey: this.cloudSyncKey,
      sourceDevice: this.deviceId,
      timestamp: Date.now(),
      profile: this.userProfile,
      myList: this.myList || [],
      history: this.watchHistory || [],
      progress: this.playbackProgress || {}
    };

    try {
      await fetch(`https://ntfy.sh/${topic}`, {
        method: "POST",
        headers: {
          "Title": "Ngwyren Cinema Cloud Reset",
          "Priority": "high",
          "Tags": "cinema,reset,sync"
        },
        body: JSON.stringify(payload)
      });
      this.lastCloudSyncTime = Date.now();
      this.saveStorage("ngwyren_last_cloud_sync", this.lastCloudSyncTime, true);
      const contShelf = document.getElementById("continueWatchingShelf");
      if (contShelf) {
        contShelf.outerHTML = this.renderContinueWatchingShelfHTML();
      }
      this.updateSidebarCounts();
      this.showToast(`✨ Đã làm sạch Cloud! Đã đồng bộ ${this.watchHistory.length} phim sang Laptop, iPad & iPhone.`);
    } catch (e) {
      console.warn("[CloudSync] resetCloudDataAndPushLocal error:", e);
      this.showToast("⚠️ Không thể kết nối tới Cloud. Vui lòng kiểm tra mạng!");
    } finally {
      this.cloudSyncing = false;
      this.renderCloudSyncBadge(false);
    }
  }

  async clearAllContinueWatchingHistory() {
    const ok = confirm("Bạn có chắc muốn xóa sạch toàn bộ lịch sử Tiếp Tục Xem trên thiết bị này và Đám Mây không?");
    if (!ok) return;
    this.watchHistory = [];
    this.saveStorage("apple_cinema_history", [], true);
    await this.resetCloudDataAndPushLocal();
    const contShelf = document.getElementById("continueWatchingShelf");
    if (contShelf) {
      contShelf.outerHTML = this.renderContinueWatchingShelfHTML();
    }
    this.updateSidebarCounts();
    if (this.currentNav === "lich-su") {
      this.renderMainView();
    }
    this.showToast("🗑️ Đã xóa sạch toàn bộ lịch sử Tiếp Tục Xem!");
  }

  async syncWithGoogleAccount(email, notify = false) {
    if (!email) return;
    await this.syncFromCloud(notify);
    await this.syncToCloud(false);
  }

  renderCloudSyncBadge(isSyncing = false) {
    const badgeEl = document.getElementById("cloudSyncStatusBadge");
    const codeEl = document.getElementById("cloudSyncCodeDisplay");
    if (badgeEl) {
      if (isSyncing) {
        badgeEl.className = "cloud-status-badge syncing";
        badgeEl.innerHTML = `<i class="fas fa-rotate fa-spin"></i> Đang đồng bộ...`;
      } else {
        badgeEl.className = "cloud-status-badge";
        badgeEl.innerHTML = `<i class="fas fa-check-circle"></i> Đã kết nối`;
      }
    }
    if (codeEl) {
      codeEl.textContent = this.cloudObjId || this.cloudSyncKey;
    }
  }

  copyCloudKey() {
    const key = this.cloudObjId || this.cloudSyncKey;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(key).then(() => {
        this.showToast(`📋 Đã sao chép Mã Đám Mây: ${key}`);
      });
    } else {
      prompt("Sao chép Mã Đám Mây của bạn:", key);
    }
  }

  promptImportCloudData() {
    const code = prompt("Nhập Mã Đám Mây (Cloud ID) từ Điện thoại, iPad, hoặc máy tính khác của bạn:", "");
    if (code) {
      this.syncFromCloud(code.trim(), true);
    }
  }

  initGoogleIdentity() {
    if (window.google?.accounts?.id && this.googleClientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: this.googleClientId,
          callback: (response) => this.handleGoogleCredentialResponse(response),
          auto_select: false,
          cancel_on_tap_outside: true
        });

        const btnContainer = document.getElementById("googleButtonContainer");
        if (btnContainer) {
          btnContainer.innerHTML = "";
          window.google.accounts.id.renderButton(btnContainer, {
            theme: "filled_blue",
            size: "large",
            text: "continue_with",
            shape: "pill",
            width: 320
          });
          const customBtn = document.getElementById("btnCustomGoogleLogin");
          if (customBtn) customBtn.style.display = "none";
        }
      } catch (e) {
        console.warn("GIS Init error:", e);
      }
    }
  }

  handleGoogleCredentialResponse(response) {
    if (!response || !response.credential) return;
    try {
      const base64Url = response.credential.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonPayload);

      this.userProfile = {
        type: "google",
        name: payload.name || "Người dùng Google",
        handle: payload.email || "@google_user",
        avatar: "👤",
        avatarType: "image",
        avatarUrl: payload.picture || "",
        sub: payload.sub
      };
      this.saveStorage("ngwyren_user_profile", this.userProfile);
      this.updateProfileUI();
      if (payload.email) {
        this.syncWithGoogleAccount(payload.email, true);
      } else {
        this.syncToCloud(false);
      }
      this.closeAuthModal();
      this.showToast(`🎉 Đăng nhập Google thành công! Chào mừng ${payload.name}`);
    } catch (e) {
      console.error("JWT Decode error:", e);
      this.showToast("⚠️ Không thể giải mã tài khoản Google.");
    }
  }

  updateProfileUI() {
    const nameEl = document.getElementById("topProfileName");
    const handleEl = document.getElementById("topProfileHandle");
    const avatarEl = document.getElementById("topProfileAvatar");

    const isGoogle = this.userProfile.type === "google";

    if (nameEl) {
      nameEl.textContent = isGoogle ? this.userProfile.name : "Guest";
    }
    if (handleEl) {
      if (isGoogle) {
        handleEl.textContent = this.userProfile.handle;
        handleEl.style.display = "block";
      } else {
        handleEl.textContent = "";
        handleEl.style.display = "none";
      }
    }
    if (avatarEl) {
      if (isGoogle && this.userProfile.avatarType === "image" && this.userProfile.avatarUrl) {
        avatarEl.innerHTML = `<img src="${this.userProfile.avatarUrl}" alt="Avatar" class="profile-avatar-img" />`;
      } else if (isGoogle) {
        avatarEl.innerHTML = `<div class="profile-avatar-letter">${(this.userProfile.name || "G").charAt(0).toUpperCase()}</div>`;
      } else {
        avatarEl.innerHTML = `<div class="profile-avatar-letter" style="background: rgba(255, 255, 255, 0.16); color: #ffffff;">G</div>`;
      }
    }
  }

  /* ==========================================================================
     CINEMA NOTIFICATION CENTER (Hôm Nay Có Phim Gì • Tin Tức • Sắp Chiếu)
     ========================================================================== */
  toggleNotificationCenter(e) {
    if (e) e.stopPropagation();
    const flyout = document.getElementById("visionNotifFlyout");
    const backdrop = document.getElementById("visionNotifBackdrop");
    const bellBtn = document.getElementById("notifBellBtn");
    if (!flyout) return;
    const isClosed = flyout.style.display === "none" || !flyout.style.display;
    if (isClosed) {
      this.renderNotificationFlyout(this.activeNotifTab || "today");
      flyout.classList.add("ps5-flyout-anim");
      flyout.style.display = "flex";
      if (backdrop) {
        backdrop.style.display = "block";
        requestAnimationFrame(() => backdrop.classList.add("open"));
      }
      if (bellBtn) bellBtn.classList.add("active");
      const dot = document.querySelector(".vision-notif-dot");
      if (dot) dot.style.display = "none";
    } else {
      this.closeNotificationCenter();
    }
  }

  closeNotificationCenter() {
    const flyout = document.getElementById("visionNotifFlyout");
    const backdrop = document.getElementById("visionNotifBackdrop");
    const bellBtn = document.getElementById("notifBellBtn");
    if (flyout) {
      flyout.style.display = "none";
      flyout.classList.remove("ps5-flyout-anim");
    }
    if (backdrop) {
      backdrop.classList.remove("open");
      backdrop.style.display = "none";
    }
    if (bellBtn) bellBtn.classList.remove("active");
  }

  switchNotifTab(tab) {
    if (this.activeNotifTab === tab) return;
    this.activeNotifTab = tab;
    const content = document.querySelector(".notif-flyout-content");
    const tabs = document.querySelectorAll(".notif-tab-btn");
    if (content && tabs.length > 0) {
      tabs.forEach((btn) => btn.classList.toggle("active", btn.getAttribute("data-tab") === tab));
      content.innerHTML = this.getNotifTabBodyHTML(tab);
    } else {
      this.renderNotificationFlyout(tab);
    }
  }

  getNotifTabBodyHTML(activeTab = "today") {
    const schedule = window.NGWYREN_AIR_SCHEDULE || {};
    const dayNames = {
      "thu-2": "Thứ 2",
      "thu-3": "Thứ 3",
      "thu-4": "Thứ 4",
      "thu-5": "Thứ 5",
      "thu-6": "Thứ 6",
      "thu-7": "Thứ 7",
      "chu-nhat": "Chủ Nhật"
    };

    const now = new Date();
    const jsDay = now.getDay();
    const todayKey = jsDay === 0 ? "chu-nhat" : `thu-${jsDay + 1}`;
    const tomorrowJsDay = (jsDay + 1) % 7;
    const tomorrowKey = tomorrowJsDay === 0 ? "chu-nhat" : `thu-${tomorrowJsDay + 1}`;

    const todayItems = schedule[todayKey] || [];
    const tomorrowItems = schedule[tomorrowKey] || [];

    // Danh mục tin tức điện ảnh & cập nhật nóng
    const cinemaNews = [
      {
        tag: "Đại Kết Cục 3D",
        headline: "Phàm Nhân Tu Tiên: Phong Khởi Lãng Lăng",
        snippet: "Hàn Lập tiến nhập Loạn Tinh Hải, đại kết cục mãn nhãn với kỹ xảo đỉnh cao. Toàn bộ tập mới cập nhật Full HD 1080p chuẩn, không quảng cáo.",
        slug: "pham-nhan-tu-tien",
        date: "Hôm nay"
      },
      {
        tag: "Tập Mới Cực Hot",
        headline: "Quang Âm Chi Ngoại: Tập Mới Lên Sóng",
        snippet: "Hứa Thanh đột phá cảnh giới mới, đại náo Thất Huyết Đồng. Luồng Full HD 1080p sắc nét, đã bật khử sạch logo watermark.",
        slug: "quang-am-chi-ngoai",
        date: "Hôm nay"
      },
      {
        tag: "Lịch Chiếu Cố Định",
        headline: "Đấu Phá Thương Khung: Niên Phiên 3",
        snippet: "Tiêu Viêm đại chiến Hồn Điện, các tập mới cập nhật cố định lúc 10:00 Sáng Chủ Nhật hàng tuần tại Ngwyren Cinema.",
        slug: "dau-pha-thuong-khung-phan-5",
        date: "Chủ Nhật"
      },
      {
        tag: "Thế Giới Hoàn Mỹ",
        headline: "Thạch Hạo Nghênh Chiến Thượng Giới Cự Đầu",
        snippet: "Tập mới vietsub và thuyết minh tiếp tục phát sóng đều đặn lúc 10:00 Sáng Thứ 6 hàng tuần.",
        slug: "the-gioi-hoan-my",
        date: "Thứ 6"
      },
      {
        tag: "Bom Tấn Netflix",
        headline: "Squid Game 3 (Trò Chơi Con Mực 3)",
        snippet: "Netflix xác nhận mùa 3 sẽ là mùa cuối khép lại cuộc chiến sinh tử, lịch phát sóng sẽ cập nhật sớm nhất.",
        slug: "squid-game-season-3",
        date: "Sắp chiếu"
      },
      {
        tag: "Chiếu Rạp 2026",
        headline: "Thanh Gươm Diệt Quỷ: Vô Hạn Thành (Trilogy)",
        snippet: "Ufotable chuyển thể trận quyết chiến Vô Hạn Thành thành bộ ba phim điện ảnh chiếu rạp đỉnh cao.",
        slug: "thanh-guom-diet-quy-vo-han-thanh",
        date: "Mới"
      }
    ];

    let bodyHTML = "";

    if (activeTab === "today") {
      if (todayItems.length > 0) {
        bodyHTML = todayItems.slice(0, 10).map((m, idx) => `
          <div class="notif-movie-item" style="--item-stagger: ${idx};" onclick="app.openMovieModal('${m.slug}', true); app.closeNotificationCenter();">
            <img class="notif-movie-thumb" src="${m.poster || m.backdrop}" alt="${m.title}" loading="lazy"
                 onerror="this.src='https://phimimg.com/upload/vod/20251229-1/d7f24b91fd95fb7cf353e1369e2318b7.jpg'" />
            <div class="notif-movie-info">
              <div class="notif-movie-title" title="${m.title}">${m.title}</div>
              <div class="notif-movie-meta">
                <span class="notif-badge-new"><i class="fas fa-tv"></i> ${m.currentEpisode || "Tập Mới"}</span>
                <span class="notif-badge-time"><i class="far fa-clock"></i> ${m.airTime || "Hôm nay"}</span>
                <span>• 1080p</span>
              </div>
            </div>
            <div class="notif-play-btn" title="Xem ngay">
              <i class="fas fa-play"></i>
            </div>
          </div>
        `).join("");
      } else {
        bodyHTML = `
          <div style="text-align: center; padding: 30px 16px; color: rgba(255,255,255,0.6);">
            <i class="fas fa-calendar-check" style="font-size: 2rem; color: #00f0ff; margin-bottom: 10px;"></i>
            <p>Hôm nay đã cập nhật các tập phim mới nhất trên hệ thống.</p>
          </div>
        `;
      }
    } else if (activeTab === "news") {
      bodyHTML = cinemaNews.map((n, idx) => `
        <div class="notif-news-item" style="--item-stagger: ${idx};" onclick="app.openMovieModal('${n.slug}', true); app.closeNotificationCenter();">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="notif-news-tag"><i class="fas fa-bolt"></i> ${n.tag}</span>
            <span style="font-size: 0.72rem; color: rgba(255,255,255,0.5);">${n.date}</span>
          </div>
          <div class="notif-news-headline">${n.headline}</div>
          <div class="notif-news-snippet">${n.snippet}</div>
        </div>
      `).join("");
    } else if (activeTab === "upcoming") {
      if (tomorrowItems.length > 0) {
        bodyHTML = `
          <div style="font-size: 0.76rem; font-weight: 700; color: #00f0ff; margin: 4px 0 8px; text-transform: uppercase;">
            <i class="far fa-calendar-star"></i> Phát sóng ngày mai (${dayNames[tomorrowKey]})
          </div>
        ` + tomorrowItems.slice(0, 10).map((m, idx) => `
          <div class="notif-movie-item" style="--item-stagger: ${idx};" onclick="app.openMovieModal('${m.slug}', true); app.closeNotificationCenter();">
            <img class="notif-movie-thumb" src="${m.poster || m.backdrop}" alt="${m.title}" loading="lazy"
                 onerror="this.src='https://phimimg.com/upload/vod/20251229-1/d7f24b91fd95fb7cf353e1369e2318b7.jpg'" />
            <div class="notif-movie-info">
              <div class="notif-movie-title" title="${m.title}">${m.title}</div>
              <div class="notif-movie-meta">
                <span class="notif-badge-new"><i class="fas fa-clock"></i> ${m.airTime || "Sắp chiếu"}</span>
                <span>${(m.genres || []).slice(0, 2).join(", ")}</span>
              </div>
            </div>
            <div class="notif-play-btn" title="Chi tiết">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>
        `).join("");
      } else {
        bodyHTML = `
          <div style="text-align: center; padding: 30px 16px; color: rgba(255,255,255,0.6);">
            <i class="fas fa-clock" style="font-size: 2rem; color: #00f0ff; margin-bottom: 10px;"></i>
            <p>Đang cập nhật lịch phát sóng cho các ngày tiếp theo.</p>
          </div>
        `;
      }
    }
    return bodyHTML;
  }

  renderNotificationFlyout(activeTab = "today") {
    const flyout = document.getElementById("visionNotifFlyout");
    if (!flyout) return;

    this.activeNotifTab = activeTab;

    const schedule = window.NGWYREN_AIR_SCHEDULE || {};
    const now = new Date();
    const jsDay = now.getDay();
    const todayKey = jsDay === 0 ? "chu-nhat" : `thu-${jsDay + 1}`;
    const todayItems = schedule[todayKey] || [];

    const bodyHTML = this.getNotifTabBodyHTML(activeTab);

    flyout.innerHTML = `
      <div class="notif-flyout-header">
        <div class="notif-flyout-title">
          <i class="fas fa-bell"></i>
          <span>Thông Báo Điện Ảnh</span>
        </div>
        <button class="notif-flyout-close" onclick="app.closeNotificationCenter()" title="Đóng">
          <i class="fas fa-xmark"></i>
        </button>
      </div>

      <div class="notif-tabs-bar">
        <button class="notif-tab-btn ${activeTab === "today" ? "active" : ""}" data-tab="today" onclick="app.switchNotifTab('today')">
          <i class="fas fa-play-circle"></i> Hôm Nay (${todayItems.length})
        </button>
        <button class="notif-tab-btn ${activeTab === "news" ? "active" : ""}" data-tab="news" onclick="app.switchNotifTab('news')">
          <i class="fas fa-newspaper"></i> Tin Tức
        </button>
        <button class="notif-tab-btn ${activeTab === "upcoming" ? "active" : ""}" data-tab="upcoming" onclick="app.switchNotifTab('upcoming')">
          <i class="fas fa-calendar-plus"></i> Sắp Chiếu
        </button>
      </div>

      <div class="notif-flyout-content">
        ${bodyHTML}
      </div>

      <div class="notif-flyout-footer">
        <span class="notif-view-all-link" onclick="app.setNavigation('lich-chieu'); app.closeNotificationCenter();">
          <i class="fas fa-calendar-days"></i> Xem toàn bộ lịch chiếu tuần này →
        </span>
      </div>
    `;
  }

  openAuthModal() {
    const modal = document.getElementById("authModal");
    const sheet = document.getElementById("authSheet");
    if (!modal || !sheet) return;

    const isGoogle = this.userProfile.type === "google";

    if (isGoogle) {
      // Đã đăng nhập Google -> Thẻ hồ sơ tinh gọn, nút Đăng xuất
      sheet.innerHTML = `
        <div class="auth-header simple">
          <h3><i class="fab fa-google" style="color: #4285f4;"></i> Tài Khoản Google</h3>
          <button class="modal-ctrl-btn icon-only" onclick="app.closeAuthModal()" aria-label="Đóng">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="auth-logged-card">
          <div class="auth-avatar-logged">
            ${
              this.userProfile.avatarType === "image" && this.userProfile.avatarUrl
                ? `<img src="${this.userProfile.avatarUrl}" alt="Avatar" />`
                : `<div class="avatar-letter">${(this.userProfile.name || "G").charAt(0).toUpperCase()}</div>`
            }
          </div>
          <div class="auth-logged-details">
            <div class="auth-logged-name">${this.userProfile.name}</div>
            <div class="auth-logged-email">${this.userProfile.handle}</div>
            <span class="auth-verified-badge"><i class="fas fa-check-circle"></i> Đang hoạt động • Kênh Realtime</span>
          </div>
        </div>

        <div class="auth-sync-actions-group" style="margin: 12px 0 8px; display: flex; flex-direction: column; gap: 8px;">
          <button class="btn-sync-all-devices" onclick="app.manualForceSyncAllDevices()" style="width: 100%; padding: 13px 18px; border-radius: 14px; background: rgba(0, 240, 255, 0.16); border: 1px solid rgba(0, 240, 255, 0.4); color: #00f0ff; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.88rem; transition: all 0.24s cubic-bezier(0.2, 0.9, 0.3, 1);">
            <i class="fas fa-rotate"></i> Đồng Bộ Ngay (PC • Laptop • iPad • iPhone)
          </button>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <button class="btn-clean-cloud" onclick="app.resetCloudDataAndPushLocal()" title="Xóa dữ liệu cũ trên Cloud và ghi đè danh sách phim hiện tại của thiết bị này" style="padding: 10px 10px; border-radius: 12px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: #e2e8f0; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 0.78rem; transition: all 0.2s ease;">
              <i class="fas fa-cloud-arrow-up" style="color: #38bdf8;"></i> Đè Lên Cloud
            </button>
            <button class="btn-clear-history-cloud" onclick="app.clearAllContinueWatchingHistory()" title="Xóa sạch toàn bộ phim đang xem dở trên máy và Cloud" style="padding: 10px 10px; border-radius: 12px; background: rgba(255, 59, 48, 0.14); border: 1px solid rgba(255, 59, 48, 0.38); color: #ff6b6b; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 0.78rem; transition: all 0.2s ease;">
              <i class="fas fa-trash-can"></i> Xóa Lịch Sử
            </button>
          </div>
        </div>

        <button class="btn-google-signout" onclick="app.logoutProfile()">
          <i class="fas fa-arrow-right-from-bracket"></i> Đăng Xuất Tài Khoản
        </button>
      `;
    } else {
      // Chưa đăng nhập -> Chỉ hiện Đăng nhập Google chuẩn như web lớn
      sheet.innerHTML = `
        <div class="auth-header simple">
          <h3><i class="fab fa-google" style="color: #4285f4;"></i> Đăng Nhập</h3>
          <button class="modal-ctrl-btn icon-only" onclick="app.closeAuthModal()" aria-label="Đóng">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="auth-google-hero">
          <div class="auth-brand-badge">
            <span class="auth-brand-name">Guest</span>
          </div>
          <p class="auth-subtitle">Đăng nhập tài khoản Google để lưu phim yêu thích và xem tiếp trên mọi thiết bị.</p>
        </div>

        <!-- Vùng chứa nút Google chính thức nếu đã có Client ID -->
        <div id="googleButtonContainer" class="google-btn-wrapper"></div>

        <!-- Nút Đăng nhập Google trực quan -->
        <button class="btn-google-login-main" id="btnCustomGoogleLogin" onclick="app.loginWithGoogle()">
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Tiếp tục với Google</span>
        </button>

        ${
          !this.googleClientId
            ? `
          <div class="google-project-connect-card">
            <div class="google-project-header">
              <i class="fas fa-key"></i> Kết nối Project Google Cloud: <strong>Ngwyren Cinema</strong>
            </div>
            <div class="google-project-input-row">
              <input type="text" id="googleClientIdQuickInput" placeholder="Dán Client ID (xxx.apps.googleusercontent.com)" class="google-quick-input" />
              <button class="btn-quick-save-client" onclick="app.saveGoogleClientIdFromModal()">Kết Nối</button>
            </div>
            <a href="https://console.cloud.google.com/apis/credentials/oauthclient" target="_blank" rel="noopener noreferrer" class="link-open-gcloud">
              <i class="fas fa-external-link-alt"></i> Mở trang tạo Client ID của project Ngwyren Cinema
            </a>
          </div>

          <div class="google-quick-email-login">
            <span class="or-separator">hoặc</span>
            <button class="btn-text-email-toggle" onclick="app.toggleQuickGmailInput()">
              <i class="fas fa-envelope"></i> Đăng nhập nhanh bằng địa chỉ Gmail
            </button>
            <div class="quick-gmail-box" id="quickGmailBox" style="display:none;">
              <input type="email" id="quickGmailInput" placeholder="Nhập Gmail của bạn..." class="google-quick-input" />
              <button class="btn-quick-save-client" onclick="app.submitQuickGmail()">Vào Web</button>
            </div>
          </div>
        `
            : ""
        }

        <div class="auth-guest-notice">
          <span class="guest-dot"></span> Đang xem với tư cách Khách
        </div>
      `;

      if (this.googleClientId) {
        setTimeout(() => this.initGoogleIdentity(), 50);
      }
    }

    sheet.className = "detail-modal-sheet auth-modal-sheet ps5-modal-sheet ps5-modal-anim";
    modal.classList.add("open");
    document.body.classList.add("modal-open");
    sheet.classList.remove("ps5-modal-anim");
    requestAnimationFrame(() => {
      sheet.classList.add("ps5-modal-anim");
    });
  }

  saveGoogleClientIdFromModal() {
    const input = document.getElementById("googleClientIdQuickInput");
    const val = input ? input.value.trim() : "";
    if (!val) {
      this.showToast("⚠️ Vui lòng dán mã Google Client ID");
      return;
    }
    this.googleClientId = val;
    this.saveStorage("ngwyren_google_client_id", val);
    this.initGoogleIdentity();
    this.showToast("🔑 Đã kết nối Google Client ID thành công!");
    this.openAuthModal();
    setTimeout(() => this.loginWithGoogle(), 400);
  }

  toggleQuickGmailInput() {
    const box = document.getElementById("quickGmailBox");
    if (box) {
      box.style.display = box.style.display === "none" ? "flex" : "none";
      const input = document.getElementById("quickGmailInput");
      if (input && box.style.display !== "none") input.focus();
    }
  }

  submitQuickGmail() {
    const input = document.getElementById("quickGmailInput");
    const email = input ? input.value.trim() : "";
    if (!email || !email.includes("@")) {
      this.showToast("⚠️ Vui lòng nhập đúng định dạng Gmail (vd: tenban@gmail.com)");
      return;
    }
    const prefix = email.split("@")[0].replace(/[._-]/g, " ");
    const name = prefix.charAt(0).toUpperCase() + prefix.slice(1);

    this.userProfile = {
      type: "google",
      name: name,
      handle: email,
      avatar: "👤",
      avatarType: "emoji",
      avatarUrl: ""
    };
    this.saveStorage("ngwyren_user_profile", this.userProfile);
    this.updateProfileUI();
    this.syncToCloud(false);
    this.closeAuthModal();
    this.showToast(`🎉 Đăng nhập Google thành công! Chào mừng ${name}`);
  }

  loginWithGoogle() {
    if (this.googleClientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            this.showToast("💡 Vui lòng bấm vào nút Google trên màn hình");
          }
        });
        return;
      } catch (e) {
        console.warn("GIS Prompt error:", e);
      }
    }

    const input = document.getElementById("googleClientIdQuickInput");
    if (input) {
      input.focus();
      this.showToast("🔑 Vui lòng dán Google Client ID từ project 'Ngwyren Cinema'");
    } else {
      this.openAuthModal();
    }
  }

  logoutProfile() {
    this.userProfile = {
      type: "guest",
      name: "Guest",
      handle: "@guest",
      avatar: "🎬",
      avatarType: "emoji",
      avatarUrl: ""
    };
    this.saveStorage("ngwyren_user_profile", this.userProfile);
    this.updateProfileUI();
    this.syncToCloud(false);
    this.closeAuthModal();
    this.showToast(`👋 Đã trở về chế độ Guest`);
  }

  closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (!modal) return;
    modal.classList.remove("open");
    const sheet = document.getElementById("authSheet");
    if (sheet) sheet.classList.remove("ps5-modal-anim");
    if (!document.getElementById("movieDetailModal")?.classList.contains("open")) {
      document.body.classList.remove("modal-open");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new AppleCinemaApp();
  window.app.init();
});
