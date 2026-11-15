/**
 * Ngwyren Cinema - Core Application Shell & State Coordinator (v2.4.0)
 * Domain features live cleanly in js/modules/*.js via NgwyrenSystem.attachModule.
 */
class AppleCinemaApp {
  constructor() {
    this.service = window.phimmoiService;
    this.currentNav = "kham-pha";
    this.currentSegment = "all"; // all | series | single
    this.activeGenreFilter = "Tất cả";
    this.visibleGridLimit = 24;
    this.exploreGridLimit = 24;
    this.filters = {
      type: "all",
      genre: "all",
      country: "all",
      year: "all",
      sort: "latest"
    };
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
      heroAutoRotate: true,
      bilingualSubMode: "off"
    });
    if (this.settings.ps5SpatialMotion === undefined) {
      this.settings.ps5SpatialMotion = true;
    }
    if (!this.settings.bilingualSubMode) {
      this.settings.bilingualSubMode = "off";
    }
    if (this.settings.defaultServer === "dub-1") {
      this.settings.defaultServer = "hls-1";
      this.saveStorage("apple_cinema_settings", this.settings);
    }
    this.currentServerMode = this.settings.defaultServer || "hls-1";
    this.currentQuality = this.settings.defaultQuality || "native-max";
    this.bilingualSubMode = this.settings.bilingualSubMode || "off";

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
    this.ensureFullCatalogLoaded();
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
    // Background-lane non-blocking maintenance scheduler
    if (window.NgwyrenSystem?.dispatcher) {
      window.NgwyrenSystem.dispatcher.scheduleIdle("periodicMaintenance", () => {
        this.startPeriodicMaintenanceScheduler();
      }, 600);
      window.NgwyrenSystem.bus?.emit("app:ready", { version: this.APP_VERSION || "2.5.2" });
    } else {
      this.startPeriodicMaintenanceScheduler();
    }

    // Khởi chạy bộ quét nền tự động nạp phim theo yêu cầu người dùng
    this.initAutoIngestWatcher();

    // Hiển thị chấm đỏ thông báo nếu có phim đã nạp sẵn sàng
    try {
      const requests = JSON.parse(localStorage.getItem("ngwyren_movie_requests") || "[]");
      const hasRecentReady = requests.some((r) => (r.status === "ready" || r.status === "auto_ingested") && !r.viewed);
      if (hasRecentReady) {
        const dot = document.querySelector(".vision-notif-dot");
        if (dot) dot.style.display = "block";
      }
    } catch (_) {}

    // Hỗ trợ mở phim trực tiếp từ liên kết Email / thông báo chia sẻ (?movie=slug)
    const urlParams = new URLSearchParams(window.location.search);
    const targetMovieSlug = urlParams.get("movie");
    if (targetMovieSlug) {
      setTimeout(async () => {
        let target = this.service.slugMap.get(targetMovieSlug);
        if (!target) {
          target = await this.service.searchAndIngestMovie(targetMovieSlug);
        }
        if (target) {
          this.openMovieModal(target.slug, true);
        }
      }, 600);
    }
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
  }

  sanitizeAndDedupeHistory(rawHistory) {
    if (!Array.isArray(rawHistory)) return [];
    const byKey = new Map();
    for (const item of rawHistory) {
      if (!item || typeof item !== "object" || !item.slug) continue;
      const movie = this.findMovie(item.slug);
      const canonicalSlug = movie ? movie.slug : String(item.slug).trim();
      if (!canonicalSlug) continue;
      const cKey = this.getCanonicalMovieKey(movie || { slug: canonicalSlug, title: item.title }) || canonicalSlug;
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
      const existing = byKey.get(cKey);
      if (!existing || normalized.timestamp > existing.timestamp || (normalized.timestamp === existing.timestamp && normalized.epIndex > existing.epIndex)) {
        byKey.set(cKey, normalized);
      }
    }
    return Array.from(byKey.values()).slice(0, 24);
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
    if (window.NgwyrenSystem?.storage) {
      return window.NgwyrenSystem.storage.get(key, fallback);
    }
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  saveStorage(key, data) {
    if (window.NgwyrenSystem?.storage) {
      return window.NgwyrenSystem.storage.set(key, data);
    }
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      if (key === "ngwyren_cinema_history_v1" && Array.isArray(data) && data.length > 20) {
        try {
          localStorage.setItem(key, JSON.stringify(data.slice(0, 20)));
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
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

  formatTime(seconds) {
    return this.formatSeconds(seconds);
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
    let found = (
      this.service.slugMap.get(cleanSlug) ||
      this.service.slugMap.get(idOrSlug) ||
      this.service.movies.find((m) => m.id === cleanSlug || m.slug === cleanSlug || m.id === idOrSlug || m.slug === idOrSlug)
    );
    if (!found) {
      const ALIASES = {
        "godzilla-minus-one": "godzilla-tru-mot",
        "godzilla-minus-zero": "godzilla-tru-mot",
        "ramayana": "ramayana-rise-of-a-legend",
        "ramayana-khoi-nguon-mot-huyen-thoai": "ramayana-rise-of-a-legend"
      };
      const aliased = ALIASES[cleanSlug] || ALIASES[idOrSlug];
      if (aliased) {
        found = this.service.slugMap.get(aliased) || this.service.movies.find((m) => m.slug === aliased || m.id === aliased);
      }
    }
    return found;
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

  showNotification(message) {
    this.showToast(message);
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
      const biMenu = document.getElementById("appleBilingualMenu");
      const biWrap = document.getElementById("appleBilingualCluster");
      if (biMenu && biMenu.classList.contains("open") && biWrap && !biWrap.contains(e.target)) {
        biMenu.classList.remove("open");
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
        this.closeFilterPanel?.();
        this.closeAuthModal?.();
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
      } else if ((e.key === "c" || e.key === "C") && !isInput) {
        const modal = document.getElementById("movieDetailModal");
        if (modal?.classList.contains("open")) {
          e.preventDefault();
          this.cycleBilingualSubtitleMode?.();
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
    // Đồng bộ lại Flyout vị trí khi xoay iPad / resize cửa sổ
    window.addEventListener("resize", () => {
      window.NgwyrenSystem?.dispatcher?.scheduleFrame("viewportReposition", () => {
        const notif = document.getElementById("visionNotifFlyout");
        if (notif && notif.style.display === "flex") this.positionNotificationFlyout?.();
        const filter = document.getElementById("visionFilterFlyout");
        if (filter && filter.style.display === "flex") this.positionFilterFlyout?.();
      });
    }, { passive: true });
  }

  // =========================================================================
  // TỰ ĐỘNG QUÉT NỀN & THÔNG BÁO / EMAIL KHI NẠP PHIM YÊU CẦU
  // =========================================================================

  initAutoIngestWatcher() {
    if (this._autoIngestTimer) clearInterval(this._autoIngestTimer);

    // Chạy lượt đầu sau 8 giây khi trang đã ổn định
    setTimeout(() => {
      this.checkPendingMovieRequests();
    }, 8000);

    // Chạy định kỳ mỗi 60 giây trong nền
    this._autoIngestTimer = setInterval(() => {
      this.checkPendingMovieRequests();
    }, 60000);
  }

  async checkPendingMovieRequests(forceId = null) {
    let pending = [];
    try {
      pending = JSON.parse(localStorage.getItem("ngwyren_pending_movie_requests") || "[]");
    } catch (_) {
      pending = [];
    }

    if (!Array.isArray(pending) || pending.length === 0) return;

    let hasChanges = false;
    const remaining = [];

    for (const req of pending) {
      if (forceId && String(req.id) !== String(forceId)) {
        remaining.push(req);
        continue;
      }
      if (req.status === "ready" || req.status === "auto_ingested") {
        continue;
      }

      try {
        const found = await this.service.searchAndIngestMovie(req.title);
        if (found && found.slug) {
          hasChanges = true;
          req.status = "ready";
          req.foundSlug = found.slug;
          req.resolvedAt = new Date().toISOString();

          // Cập nhật trạng thái trong ngwyren_movie_requests
          this.updateMovieRequestStatus(req.id, "ready", found.slug);

          // Phát cảnh báo & gửi email & bắn web push notification
          this.dispatchMovieIngestedAlert({
            movie: found,
            targetEmail: req.email,
            note: req.note,
            isImmediate: false
          });
        } else {
          remaining.push(req);
        }
      } catch (err) {
        console.warn("[AutoIngestWatcher] Kiểm tra thất bại:", req.title, err);
        remaining.push(req);
      }
    }

    if (hasChanges) {
      try {
        localStorage.setItem("ngwyren_pending_movie_requests", JSON.stringify(remaining));
      } catch (_) {}
      // Nếu tab requests trong notification flyout đang mở, cập nhật giao diện ngay
      if (this.activeNotifTab === "requests") {
        this.renderNotificationFlyout("requests");
      }
    }
  }

  updateMovieRequestStatus(id, newStatus, foundSlug = "") {
    try {
      const list = JSON.parse(localStorage.getItem("ngwyren_movie_requests") || "[]");
      const item = list.find((r) => String(r.id) === String(id));
      if (item) {
        item.status = newStatus;
        if (foundSlug) item.foundSlug = foundSlug;
        item.resolvedAt = new Date().toISOString();
        localStorage.setItem("ngwyren_movie_requests", JSON.stringify(list));
      }
    } catch (_) {}
  }

  async sendMovieReadyEmail({ toEmail, movie, note }) {
    if (!toEmail || typeof toEmail !== "string" || !toEmail.includes("@")) return false;
    try {
      const siteOrigin = window.location.origin || "https://ngwyren.github.io";
      const sitePath = window.location.pathname || "/";
      const directUrl = `${siteOrigin}${sitePath}?movie=${encodeURIComponent(movie.slug)}`;

      const payload = {
        _subject: `[Ngwyren Cinema] Phim "${movie.title}" bạn yêu cầu đã được nạp thành công!`,
        "Tên Phim": `${movie.title} (${movie.originTitle || ""})`,
        "Trạng Thái": "Đã nạp thành công vào hệ thống Ngwyren Cinema",
        "Chất Lượng": `${movie.quality || "Full HD 1080p"} • ${movie.lang || "Vietsub/Thuyết Minh"}`,
        "Đường Dẫn Xem Trực Tiếp": directUrl,
        "Ghi Chú Yêu Cầu": note || "Yêu cầu từ khán giả",
        "Thời Gian Nạp": new Date().toLocaleString("vi-VN"),
        "Thông Điệp": "Hệ thống tự động nạp phim Ngwyren Cinema đã tìm thấy và xử lý nguồn phim theo yêu cầu của bạn. Chúc bạn có những phút giây xem phim tuyệt vời!"
      };

      const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(toEmail.trim())}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch (err) {
      console.warn("[EmailDispatch] Không thể gửi email:", err);
      return false;
    }
  }

  dispatchMovieIngestedAlert({ movie, targetEmail, note, isImmediate = false }) {
    // 1. Lưu thông báo vào localStorage
    try {
      const notifs = JSON.parse(localStorage.getItem("ngwyren_user_notifications") || "[]");
      notifs.unshift({
        id: `notif-${Date.now()}`,
        type: "movie_ready",
        title: `Phim "${movie.title}" đã nạp thành công!`,
        message: `Phim bạn yêu cầu hiện đã sẵn sàng với chất lượng Full HD. Bấm để thưởng thức ngay.`,
        slug: movie.slug,
        poster: movie.poster || movie.backdrop,
        time: new Date().toISOString(),
        read: false
      });
      localStorage.setItem("ngwyren_user_notifications", JSON.stringify(notifs.slice(0, 30)));
    } catch (_) {}

    // 2. Kích hoạt chấm đỏ trên chuông thông báo Topbar
    const dot = document.querySelector(".vision-notif-dot");
    if (dot) dot.style.display = "block";

    // 3. Web Notification trình duyệt
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Ngwyren Cinema: Đã Nạp Phim!", {
          body: `Phim "${movie.title}" bạn yêu cầu đã được nạp thành công. Xem ngay!`,
          icon: movie.poster || movie.backdrop || "favicon.ico"
        });
      } catch (_) {}
    }

    // 4. Gửi email thông báo nếu có email
    if (targetEmail && targetEmail.includes("@")) {
      this.sendMovieReadyEmail({ toEmail: targetEmail, movie, note });
    }

    // 5. Hiển thị Toast nổi thông báo trên màn hình
    this.showMovieIngestedToast(movie);
  }

  showMovieIngestedToast(movie) {
    let toast = document.getElementById("visionMovieIngestedToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "visionMovieIngestedToast";
      toast.className = "vision-movie-ingested-toast";
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; max-width: 440px; padding: 12px 16px; background: rgba(22, 24, 32, 0.94); backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px); border: 1px solid rgba(52, 199, 89, 0.4); border-radius: 16px; box-shadow: 0 16px 40px rgba(0,0,0,0.6); color: #fff; pointer-events: auto;">
        <img src="${movie.poster || movie.backdrop || ''}" alt="${movie.title}" style="width: 44px; height: 60px; object-fit: cover; border-radius: 8px; flex-shrink: 0;" onerror="this.style.display='none'" />
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 0.72rem; font-weight: 700; color: #34c759; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">
            <i class="fas fa-circle-check"></i> Đã Nạp Phim Thành Công
          </div>
          <div style="font-size: 0.88rem; font-weight: 700; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${movie.title}
          </div>
          <div style="font-size: 0.76rem; color: rgba(255,255,255,0.7);">
            Phim đã có sẵn luồng phát HD Vietsub
          </div>
        </div>
        <button onclick="app.openMovieModal('${movie.slug}', true); document.getElementById('visionMovieIngestedToast').style.display='none';"
                style="padding: 7px 14px; background: linear-gradient(135deg, #34c759, #248a3d); color: #fff; border: none; border-radius: 8px; font-size: 0.78rem; font-weight: 600; cursor: pointer; flex-shrink: 0; box-shadow: 0 4px 12px rgba(52,199,89,0.35);">
          Xem Ngay
        </button>
        <button onclick="document.getElementById('visionMovieIngestedToast').style.display='none';"
                style="background: transparent; border: none; color: rgba(255,255,255,0.5); font-size: 0.9rem; cursor: pointer; padding: 4px; line-height: 1;" title="Đóng">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    toast.style.position = "fixed";
    toast.style.top = "20px";
    toast.style.right = "20px";
    toast.style.zIndex = "100000";
    toast.style.display = "block";
    toast.style.animation = "toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)";

    if (this._movieToastTimer) clearTimeout(this._movieToastTimer);
    this._movieToastTimer = setTimeout(() => {
      if (toast) toast.style.display = "none";
    }, 9000);
  }

  async retryMovieRequest(id) {
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem("ngwyren_movie_requests") || "[]");
    } catch (_) {
      list = [];
    }
    const item = list.find((r) => String(r.id) === String(id));
    if (!item) return;

    const btn = document.getElementById(`retryBtn-${id}`);
    if (btn) {
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Đang quét...';
      btn.disabled = true;
    }

    try {
      const found = await this.service.searchAndIngestMovie(item.title);
      if (found && found.slug) {
        this.updateMovieRequestStatus(id, "ready", found.slug);
        this.dispatchMovieIngestedAlert({
          movie: found,
          targetEmail: item.email,
          note: item.note,
          isImmediate: false
        });
        this.renderNotificationFlyout("requests");
      } else {
        if (btn) {
          btn.innerHTML = '<i class="fas fa-hourglass-half"></i> Chưa có link';
          setTimeout(() => {
            if (btn) {
              btn.innerHTML = '<i class="fas fa-bolt"></i> Quét Lại';
              btn.disabled = false;
            }
          }, 2000);
        }
      }
    } catch (_) {
      if (btn) {
        btn.innerHTML = '<i class="fas fa-bolt"></i> Quét Lại';
        btn.disabled = false;
      }
    }
  }

}

window.AppleCinemaApp = AppleCinemaApp;
