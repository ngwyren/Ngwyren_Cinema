/**
 * @fileoverview UserCloudSync Domain Module for Ngwyren Cinema
 * Isolated feature module registered safely onto AppleCinemaApp via NgwyrenSystem.
 */
(() => {
  "use strict";
  if (!window.AppleCinemaApp || !window.NgwyrenSystem) {
    console.error("[NgwyrenSystem] Missing core dependency while loading UserCloudSync");
    return;
  }

  const UserCloudSyncMethods = {
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
  },

  isInMyList(movie) {
    if (!movie) return false;
    return this.myList.includes(movie.slug) || this.myList.includes(movie.id);
  },

  recordWatchHistory(slug, epIndex = 0) {
    const movie = this.findMovie(slug);
    const canonicalSlug = movie ? movie.slug : slug;
    const existing = (this.watchHistory || []).find((h) => h && h.slug === canonicalSlug);
    const savedProg = this.getPlaybackProgress(canonicalSlug, epIndex);

    // BẢO LƯU TIẾN TRÌNH: Giữ nguyên currentTime và progress nếu phim đã được xem dở
    const preservedProgress = (savedProg && savedProg.percentage > 0)
      ? savedProg.percentage
      : (existing && existing.epIndex === epIndex && existing.progress > 0)
      ? existing.progress
      : 15;

    const preservedCurrentTime = (savedProg && savedProg.currentTime > 0)
      ? savedProg.currentTime
      : (existing && existing.epIndex === epIndex && existing.currentTime > 0)
      ? existing.currentTime
      : 0;

    this.watchHistory = this.sanitizeAndDedupeHistory([
      {
        slug: canonicalSlug,
        title: movie?.title || "",
        poster: movie?.poster || "",
        backdrop: movie?.backdrop || "",
        epIndex,
        progress: preservedProgress,
        currentTime: preservedCurrentTime,
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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

  triggerCloudSync(debounceMs = 1200) {
    if (this.cloudSyncDebounce) clearTimeout(this.cloudSyncDebounce);
    this.cloudSyncDebounce = setTimeout(() => {
      this.syncToCloud(false);
    }, debounceMs);
  },

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
  },

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
  },

  hasUnsyncedLocalChanges(cloudData) {
    if (!cloudData) return true;
    if (cloudData.forceReset || cloudData.action === "RESET_CLOUD") return false;
    if (!Array.isArray(cloudData.history)) return true;
    const cloudSlugs = new Set(cloudData.history.map((h) => h?.slug).filter(Boolean));
    for (const h of (this.watchHistory || [])) {
      if (h?.slug && !cloudSlugs.has(h.slug)) return true;
    }
    return false;
  },

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
  },

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
  },

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
  },

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
  },

  async syncWithGoogleAccount(email, notify = false) {
    if (!email) return;
    await this.syncFromCloud(notify);
    await this.syncToCloud(false);
  },

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
  },

  copyCloudKey() {
    const key = this.cloudObjId || this.cloudSyncKey;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(key).then(() => {
        this.showToast(`📋 Đã sao chép Mã Đám Mây: ${key}`);
      });
    } else {
      prompt("Sao chép Mã Đám Mây của bạn:", key);
    }
  },

  promptImportCloudData() {
    const code = prompt("Nhập Mã Đám Mây (Cloud ID) từ Điện thoại, iPad, hoặc máy tính khác của bạn:", "");
    if (code) {
      this.syncFromCloud(code.trim(), true);
    }
  },

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
  },

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
  },

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
  },

  toggleNotificationCenter(e) {
    if (e) e.stopPropagation();
    const flyout = document.getElementById("visionNotifFlyout");
    const backdrop = document.getElementById("visionNotifBackdrop");
    const bellBtn = document.getElementById("notifBellBtn");
    if (!flyout) return;
    const isClosed = flyout.style.display === "none" || !flyout.style.display;
    if (isClosed) {
      this.renderNotificationFlyout(this.activeNotifTab || "today");
      this.positionNotificationFlyout();
      flyout.classList.add("ps5-flyout-anim");
      flyout.style.display = "flex";
      if (backdrop) {
        backdrop.style.display = "block";
        requestAnimationFrame(() => backdrop.classList.add("open"));
      }
      if (bellBtn) bellBtn.classList.add("active");
      const dot = document.querySelector(".vision-notif-dot");
      if (dot) dot.style.display = "none";

      if (!this._notifAnchorBound) {
        this._notifAnchorBound = true;
        const reAnchor = () => {
          if (flyout.style.display !== "none") {
            this.positionNotificationFlyout();
          }
        };
        window.addEventListener("resize", reAnchor);
        window.addEventListener("scroll", reAnchor, { passive: true });
      }
    } else {
      this.closeNotificationCenter();
    }
  },

  positionNotificationFlyout() {
    const flyout = document.getElementById("visionNotifFlyout");
    const bellBtn = document.getElementById("notifBellBtn");
    if (!flyout || !bellBtn) return;

    const rect = bellBtn.getBoundingClientRect();
    const isMobile = window.innerWidth <= 640;

    if (isMobile) {
      // Trên điện thoại: Neo ngay dưới chân nút chuông, không che đè topbar
      const topPos = Math.round(rect.bottom + 8);
      flyout.style.setProperty("top", `${topPos}px`, "important");
      flyout.style.setProperty("left", "10px", "important");
      flyout.style.setProperty("right", "10px", "important");
      flyout.style.setProperty("width", "auto", "important");
      flyout.style.setProperty("max-width", "none", "important");
      flyout.style.setProperty("max-height", `calc(100dvh - ${topPos + 18}px)`, "important");
    } else {
      // Trên PC, Laptop, iPad:
      // Neo ngay dưới chân icon chuông thông báo (cách 10px),
      // Căn mép phải gióng thẳng hàng với nút chuông để menu xổ xuống tự nhiên
      const topPos = Math.round(rect.bottom + 10);
      const rightPos = Math.max(16, Math.round(window.innerWidth - rect.right));
      flyout.style.setProperty("top", `${topPos}px`, "important");
      flyout.style.setProperty("right", `${rightPos}px`, "important");
      flyout.style.setProperty("left", "auto", "important");
      flyout.style.setProperty("width", "min(420px, 92vw)", "important");
      flyout.style.setProperty("max-height", `calc(100vh - ${topPos + 24}px)`, "important");
    }
  },

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
  },

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
  },

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
    } else if (activeTab === "requests") {
      let requests = [];
      try {
        requests = JSON.parse(localStorage.getItem("ngwyren_movie_requests") || "[]");
      } catch (_) {
        requests = [];
      }

      if (requests.length === 0) {
        bodyHTML = `
          <div style="text-align: center; padding: 36px 16px; color: rgba(255,255,255,0.6);">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(10,132,255,0.15); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; color: #0a84ff; font-size: 1.3rem;">
              <i class="fas fa-film"></i>
            </div>
            <div style="font-weight: 700; color: #fff; margin-bottom: 6px; font-size: 0.95rem;">Chưa có phim yêu cầu</div>
            <p style="font-size: 0.82rem; margin: 0; line-height: 1.45; color: rgba(255,255,255,0.6);">
              Khi tìm kiếm phim hoặc phần phim chưa có trong rạp, bạn có thể gửi yêu cầu để hệ thống tự động quét đa nguồn và nạp phim cho bạn.
            </p>
          </div>
        `;
      } else {
        bodyHTML = requests.map((req, idx) => {
          const isReady = req.status === "auto_ingested" || req.status === "ready";
          const timeStr = req.timestamp ? new Date(req.timestamp).toLocaleDateString("vi-VN") : "";
          const foundSlug = req.foundSlug || "";

          return `
            <div class="notif-movie-item" style="--item-stagger: ${idx}; align-items: flex-start; cursor: default; padding: 10px 12px;">
              <div style="width: 42px; height: 56px; border-radius: 8px; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; margin-top: 2px; border: 1px solid rgba(255,255,255,0.1);">
                ${
                  req.image
                    ? `<img src="${req.image}" alt="${req.title}" style="width: 100%; height: 100%; object-fit: cover;" />`
                    : `<i class="fas fa-clapperboard" style="font-size: 1.15rem; color: ${isReady ? '#34c759' : '#0a84ff'};"></i>`
                }
              </div>
              <div class="notif-movie-info" style="flex: 1; min-width: 0; padding-left: 2px;">
                <div class="notif-movie-title" style="font-weight: 700; color: #ffffff; font-size: 0.88rem;" title="${req.title}">${req.title}</div>
                <div style="display: flex; gap: 6px; align-items: center; margin: 4px 0; flex-wrap: wrap;">
                  ${
                    isReady
                      ? `<span style="background: rgba(52, 199, 89, 0.2); color: #34c759; border: 1px solid rgba(52, 199, 89, 0.4); padding: 1px 7px; border-radius: 4px; font-size: 0.68rem; font-weight: 700;"><i class="fas fa-check-circle"></i> ĐÃ NẠP THÀNH CÔNG</span>`
                      : `<span style="background: rgba(255, 159, 10, 0.2); color: #ff9f0a; border: 1px solid rgba(255, 159, 10, 0.4); padding: 1px 7px; border-radius: 4px; font-size: 0.68rem; font-weight: 700;"><i class="fas fa-rotate fa-spin"></i> ĐANG TỰ ĐỘNG QUÉT</span>`
                  }
                  ${timeStr ? `<span style="font-size: 0.72rem; color: rgba(255,255,255,0.45);"><i class="far fa-clock"></i> ${timeStr}</span>` : ""}
                </div>
                ${req.note ? `<div style="font-size: 0.74rem; color: rgba(255,255,255,0.65); margin-bottom: 2px;">📝 ${req.note}</div>` : ""}
                ${req.email ? `<div style="font-size: 0.72rem; color: rgba(10,132,255,0.9);"><i class="far fa-envelope"></i> ${req.email}</div>` : ""}
              </div>
              <div style="display: flex; align-items: center; align-self: center; margin-left: 8px;">
                ${
                  isReady && foundSlug
                    ? `<button class="vision-btn-watch" onclick="app.openMovieModal('${foundSlug}', true); app.closeNotificationCenter();" style="padding: 6px 12px; font-size: 0.78rem; font-weight: 600; border-radius: 8px; cursor: pointer; white-space: nowrap; background: linear-gradient(135deg, #34c759, #248a3d);" title="Xem phim ngay">
                         <i class="fas fa-play" style="font-size: 0.68rem; margin-right: 4px;"></i> Xem
                       </button>`
                    : `<button id="retryBtn-${req.id}" class="vision-btn-outline" onclick="app.retryMovieRequest('${req.id}')" style="padding: 5px 9px; font-size: 0.74rem; border-radius: 8px; cursor: pointer; white-space: nowrap;" title="Thử quét tìm phim ngay">
                         <i class="fas fa-bolt"></i> Quét Lại
                       </button>`
                }
              </div>
            </div>
          `;
        }).join("");
      }
    }
    return bodyHTML;
  },

  renderNotificationFlyout(activeTab = "today") {
    const flyout = document.getElementById("visionNotifFlyout");
    if (!flyout) return;

    this.activeNotifTab = activeTab;

    const schedule = window.NGWYREN_AIR_SCHEDULE || {};
    const now = new Date();
    const jsDay = now.getDay();
    const todayKey = jsDay === 0 ? "chu-nhat" : `thu-${jsDay + 1}`;
    const todayItems = schedule[todayKey] || [];

    let reqItems = [];
    try {
      reqItems = JSON.parse(localStorage.getItem("ngwyren_movie_requests") || "[]");
    } catch (_) {}
    const reqCount = reqItems.length;

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

      <div class="notif-tabs-bar" style="overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch;">
        <button class="notif-tab-btn ${activeTab === "today" ? "active" : ""}" data-tab="today" onclick="app.switchNotifTab('today')">
          <i class="fas fa-play-circle"></i> Hôm Nay (${todayItems.length})
        </button>
        <button class="notif-tab-btn ${activeTab === "requests" ? "active" : ""}" data-tab="requests" onclick="app.switchNotifTab('requests')">
          <i class="fas fa-film"></i> Yêu Cầu (${reqCount})
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
  },

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
  },

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
  },

  toggleQuickGmailInput() {
    const box = document.getElementById("quickGmailBox");
    if (box) {
      box.style.display = box.style.display === "none" ? "flex" : "none";
      const input = document.getElementById("quickGmailInput");
      if (input && box.style.display !== "none") input.focus();
    }
  },

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
  },

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
  },

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
  },

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
  };

  window.NgwyrenSystem.attachModule(window.AppleCinemaApp, "UserCloudSync", UserCloudSyncMethods, {
    isolateErrors: true
  });
})();
