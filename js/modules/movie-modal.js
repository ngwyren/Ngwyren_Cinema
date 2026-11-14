/**
 * @fileoverview MovieModal Domain Module for Ngwyren Cinema
 * Isolated feature module registered safely onto AppleCinemaApp via NgwyrenSystem.
 */
(() => {
  "use strict";
  if (!window.AppleCinemaApp || !window.NgwyrenSystem) {
    console.error("[NgwyrenSystem] Missing core dependency while loading MovieModal");
    return;
  }

  const MovieModalMethods = {
  findScheduleMovie(slug) {
    if (!slug || typeof window === "undefined" || !window.NGWYREN_AIR_SCHEDULE) return null;
    for (const day of Object.keys(window.NGWYREN_AIR_SCHEDULE)) {
      const items = window.NGWYREN_AIR_SCHEDULE[day] || [];
      const found = items.find((it) => it && it.slug === slug);
      if (found) return found;
    }
    return null;
  },

  async openMovieModal(slug, autoPlay = true, epIndex = 0) {
    const movie = this.findMovie(slug);
    if (!movie) {
      const sched = this.findScheduleMovie(slug);
      if (sched) {
        this.showToast(`📅 "${sched.title}" dự kiến phát sóng lúc ${sched.airTime || "sớm nhất"}. Vui lòng quay lại sau!`, "info");
      } else {
        this.showToast("Phim đang cập nhật tập mới, vui lòng quay lại sau!", "info");
      }
      return;
    }

    // Tự động khôi phục đúng tập phim đang xem dở nếu người dùng click từ trang chủ hoặc tìm kiếm
    if ((epIndex === 0 || epIndex === undefined) && movie.type === "series") {
      const histItem = (this.watchHistory || []).find((h) => h && h.slug === movie.slug);
      if (histItem && typeof histItem.epIndex === "number" && histItem.epIndex > 0) {
        epIndex = histItem.epIndex;
      }
    }

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
  },

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
  },

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
  },

  minimizeToMiniPlayer() {
    if (this.selectedMovie) {
      this.setNowPlayingBar(this.selectedMovie, this.currentEpisodeIndex, true);
      this.showToast(`Đang thu nhỏ "${this.selectedMovie.title}" xuống thanh phát Ngwyren Cinema`);
    }
    this.closeMovieModal();
  },

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
  },

  getMovieBackdrop(movie) {
    if (!movie) return "";
    let b = movie.backdrop || "";
    if (movie.slug === "ky-niem-20-nam-harry-potter-tro-lai-hogwarts" || (b && (b.includes("582cfc3e5dfd9d5926c8df377cfdae8e.jpg") || b.includes("c9fa0002166699dae85f43924f0c4bb2.jpg")))) {
      b = "https://phimimg.com/upload/vod/20231020-1/51606bf1d40a501b93ecdc3cdcfd90e9.jpg";
      movie.backdrop = b;
    }
    if (movie.slug === "nhung-ke-dot-nhap" || (b && b.includes("6fef435967db666de4292991d5362450.jpg"))) {
      b = "https://phimimg.com/upload/vod/20260128-1/ad88fd9f6544ed2266385be6051ef4e2.jpg";
      movie.backdrop = b;
    }
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
  },

  getMoviePoster(movie) {
    if (!movie) return "";
    let p = movie.poster || "";
    if (movie.slug === "ky-niem-20-nam-harry-potter-tro-lai-hogwarts" || (p && (p.includes("c9fa0002166699dae85f43924f0c4bb2.jpg") || p.includes("582cfc3e5dfd9d5926c8df377cfdae8e.jpg")))) {
      p = "https://phimimg.com/upload/vod/20231020-1/dbb3bcb8568615af4f47ff62b055be5c.jpg";
      movie.poster = p;
      movie.backdrop = "https://phimimg.com/upload/vod/20231020-1/51606bf1d40a501b93ecdc3cdcfd90e9.jpg";
    }
    if (movie.slug === "nhung-ke-dot-nhap" || (p && p.includes("6fef435967db666de4292991d5362450.jpg"))) {
      p = "https://phimimg.com/upload/vod/20260128-1/ad88fd9f6544ed2266385be6051ef4e2.jpg";
      movie.poster = p;
      movie.backdrop = p;
    }
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
  },

  handleImageFallback(imgEl, slug) {
    if (!imgEl) return;
    if (imgEl.dataset.fallbackTried === "done") return;
    imgEl.dataset.fallbackTried = "done";

    if (slug) {
      const cleanSlug = slug.replace(/^pm-|^wp-|^pa-|^nc-/, "");
      fetch(`https://phimapi.com/phim/${cleanSlug}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.status && data.movie) {
            const m = data.movie;
            let newImg = m.thumb_url || m.poster_url;
            if (newImg) {
              if (!newImg.startsWith("http")) newImg = `https://phimimg.com/${newImg.replace(/^\//, "")}`;
              if (newImg !== imgEl.src) {
                imgEl.src = newImg;
                const localMovie = this.findMovie(slug);
                if (localMovie) {
                  localMovie.poster = newImg;
                  localMovie.backdrop = newImg;
                  localMovie._cachedPoster = newImg;
                  localMovie._cachedBackdrop = newImg;
                }
                return;
              }
            }
          }
          this.applyDefaultPosterFallback(imgEl);
        })
        .catch(() => {
          this.applyDefaultPosterFallback(imgEl);
        });
    } else {
      this.applyDefaultPosterFallback(imgEl);
    }
  },

  applyDefaultPosterFallback(imgEl) {
    if (!imgEl) return;
    imgEl.src = "https://phimimg.com/upload/vod/20250602-1/0f3aebe145b25b985a1deece53635c99.jpg";
  },

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
  },

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

    const hasReal4kStream = Boolean(
      (this.detectedHlsLevels &&
        this.detectedHlsLevels.length > 0 &&
        this.detectedHlsLevels.some((l) => l.height >= 2160 || l.width >= 3800)) ||
      movie?.hasReal4k === true ||
      (movie?.quality === "4K" && movie?.hasReal4k !== false && movie?.slug !== "thanh-guom-diet-quy-vo-han-thanh-465645") ||
      movie?.episodes?.[this.currentEpisodeIndex || 0]?.is4k === true ||
      movie?.episodes?.[this.currentEpisodeIndex || 0]?.altSources?.some((a) => a.is4k === true)
    );
    const is4k = (this.currentQuality === "4K" || this.currentQuality === "4k") && hasReal4kStream;

    sheet.innerHTML = `
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
                  <!-- YouTube-Style Settings Cluster (Chất lượng & Tùy chọn phát hiển thị khi rê chuột) -->
                  <div class="apple-setting-cluster" id="appleSettingCluster">
                    <button type="button" class="apple-ctrl-btn apple-setting-btn" id="appleSettingBtn" onclick="app.togglePlayerSettingMenu(event)" title="Cài đặt phát (Chất lượng & Tốc độ)">
                      <i class="fas fa-gear"></i>
                      ${is4k ? '<span class="setting-gear-badge">4K</span>' : ""}
                    </button>
                    <div class="apple-setting-menu" id="applePlayerSettingMenu" onclick="event.stopPropagation()">
                      <div class="setting-menu-header">
                        <i class="fas fa-sliders"></i>
                        <span>Chất lượng video</span>
                      </div>
                      <button type="button" class="setting-menu-item ${!is4k ? "active" : ""}" onclick="app.switchQualityTier('1080', event)">
                        <div class="setting-item-left">
                          <i class="fas fa-check setting-check-icon"></i>
                          <span>Full HD 1080p</span>
                        </div>
                        <span class="setting-item-tag">1080p</span>
                      </button>
                      ${
                        hasReal4kStream
                          ? `<button type="button" class="setting-menu-item is-4k ${is4k ? "active" : ""}" onclick="app.switchQualityTier('4K', event)">
                              <div class="setting-item-left">
                                <i class="fas fa-check setting-check-icon"></i>
                                <span>4K Ultra HD</span>
                              </div>
                              <span class="setting-item-tag tag-4k">4K</span>
                            </button>`
                          : ""
                      }
                      <div class="setting-menu-divider"></div>
                      <div class="setting-menu-header" style="margin-top: 4px;">
                        <i class="fas fa-gauge-high"></i>
                        <span>Tốc độ phát</span>
                      </div>
                      <div class="setting-speed-row">
                        <button type="button" class="setting-speed-btn ${this.playbackSpeed === 0.75 ? "active" : ""}" onclick="app.setPlaybackSpeed(0.75, event)">0.75x</button>
                        <button type="button" class="setting-speed-btn ${!this.playbackSpeed || this.playbackSpeed === 1 ? "active" : ""}" onclick="app.setPlaybackSpeed(1.0, event)">1.0x</button>
                        <button type="button" class="setting-speed-btn ${this.playbackSpeed === 1.25 ? "active" : ""}" onclick="app.setPlaybackSpeed(1.25, event)">1.25x</button>
                        <button type="button" class="setting-speed-btn ${this.playbackSpeed === 1.5 ? "active" : ""}" onclick="app.setPlaybackSpeed(1.5, event)">1.5x</button>
                        <button type="button" class="setting-speed-btn ${this.playbackSpeed === 2.0 ? "active" : ""}" onclick="app.setPlaybackSpeed(2.0, event)">2.0x</button>
                      </div>
                    </div>
                  </div>

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

      <!-- Server & Stream Switcher Toolbar (Gộp Server 1 / Server 2 / Thuyết Minh / Trailer & Tinh Gọn) -->
      <div class="player-toolbar" id="playerToolbarContainer">
        <div class="player-toolbar-left" id="playerToolbarServers">
          ${this.buildServerButtonsHTML(movie, this.currentEpisodeIndex)}
        </div>

        <div class="player-toolbar-right">
          ${this.buildQualityButtonsHTML(movie)}
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
              <span class="meta-pill ${movie.quality === "4K" || movie.has4k ? "badge-4k" : "badge-1080"}" id="modalQualityPill">${movie.quality === "4K" || movie.has4k ? "<i class='fas fa-sparkles'></i> 4K Ultra HD" : "Full HD 1080p"}</span>
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
  },

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
  },

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
  },

  switchModalTab(tabName) {
    document.getElementById("tabBtnRelated")?.classList.toggle("active", tabName === "related");
    document.getElementById("tabBtnFranchise")?.classList.toggle("active", tabName === "franchise");
    const p1 = document.getElementById("modalTabPanelRelated");
    const p2 = document.getElementById("modalTabPanelFranchise");
    if (p1) p1.style.display = tabName === "related" ? "block" : "none";
    if (p2) p2.style.display = tabName === "franchise" ? "block" : "none";
  },

  renderServerButtons(movie, epIndex = 0) {
    const el = document.getElementById("playerToolbarServers");
    const toolbar = document.getElementById("playerToolbarContainer");
    if (el) {
      el.innerHTML = this.buildServerButtonsHTML(movie, epIndex);
    }
    if (toolbar) {
      toolbar.classList.remove("has-server-rack");
    }
  },

  buildServerButtonsHTML(movie, epIndex = 0) {
    if (!movie) return "";
    const ep = movie.episodes?.[epIndex] || movie.episodes?.[0];
    const isVtvgoMovie = Boolean(movie.vtvgoUrl || ep?.vtvgoUrl);

    if (isVtvgoMovie) {
      const vtvUrl = ep?.vtvgoUrl || movie.vtvgoUrl || "https://vtvgo.vn/watch/2E4t";
      const isYtActive = this.currentServerMode === "youtube" || !this.currentServerMode || this.currentServerMode === "hls-1";
      const isVtvActive = this.currentServerMode === "vtvgo";
      return `
        <button class="server-btn ${isYtActive ? "active" : ""}" id="srvBtnYouTube"
                onclick="app.startVideoPlayback(app.selectedMovie, app.currentEpisodeIndex, 'youtube')" title="Phát Server 1: YouTube 4K (Miễn Phí • Không Cần Gói Trả Phí)">
          <i class="fab fa-youtube"></i> Server 1 (YouTube 4K Miễn Phí)
        </button>
        <button class="server-btn ${isVtvActive ? "active" : ""}" id="srvBtnVtvgo"
                onclick="app.startVideoPlayback(app.selectedMovie, app.currentEpisodeIndex, 'vtvgo')" title="Server 2: VTVgo Bản Gốc Đài VTV (Yêu cầu tài khoản VTVgo MAX 95k)">
          <i class="fas fa-tv"></i> Server VTVgo (Gói 95k)
        </button>
        <a href="${vtvUrl}" target="_blank" rel="noopener noreferrer" class="server-btn" style="text-decoration: none;" title="Mở trực tiếp trên VTVgo (Dành cho tài khoản VTVgo MAX)">
          <i class="fas fa-arrow-up-right-from-square"></i> Mở trên VTVgo
        </a>
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

    const hasEmbed2 = Boolean(movie.nguoncEpisodes && movie.nguoncEpisodes.length > 0) || Boolean(ep?.embed);
    const hasFilm4k = Boolean(
      (movie.film4kEpisodes && movie.film4kEpisodes.length > 0) ||
      ep?.isFilm4k ||
      ep?.altSources?.some((a) => a.isFilm4k)
    );
    const hasServer2 = hasFilm4k || hasEmbed2;
    const hasDub = Boolean(movie.dubEpisodes && movie.dubEpisodes.length > 0);
    const isServer2Active = this.currentServerMode === "server-2" || this.currentServerMode === "film4k-1" || this.currentServerMode === "embed-1";
    const isF4k4k = Boolean(
      (this.detectedHlsLevels && this.detectedHlsLevels.some((l) => l.height >= 2160 || l.width >= 3800)) ||
      movie.hasReal4k === true ||
      ep?.is4k ||
      ep?.altSources?.some((a) => a.is4k)
    );

    return `
      <button class="server-btn ${this.currentServerMode === "hls-1" || !this.currentServerMode || this.currentServerMode.startsWith("alt-") ? "active" : ""}" id="srvBtnHls1"
              onclick="app.startVideoPlayback(app.selectedMovie, app.currentEpisodeIndex, 'hls-1')" title="Phát Server 1 (Vietsub) chất lượng tốt nhất">
        <i class="fas fa-server"></i> Server 1
      </button>
      ${
        hasServer2
          ? `<button class="server-btn ${isServer2Active ? "active" : ""}" id="srvBtnServer2"
                    onclick="app.startVideoPlayback(app.selectedMovie, app.currentEpisodeIndex, 'server-2')" title="Phát Server 2 (Film4K / Dự Phòng ${isF4k4k ? "• 4K Ultra HD" : "• Full HD"})">
              <i class="fas fa-server"></i> Server 2 ${isF4k4k ? '<span class="badge-mini-4k" style="margin-left:4px; font-size:0.68em; background:#38ef7d; color:#000; border-radius:3px; padding:1px 4px; font-weight:800;">4K</span>' : ""}
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
  },

  buildQualityButtonsHTML(movie) {
    const mov = movie || this.selectedMovie || this.playingMovie;
    const ep = mov?.episodes?.[this.currentEpisodeIndex || 0] || mov?.episodes?.[0];
    // CHỈ kích hoạt 4K khi phim có định dạng 4K thực tế (hasReal4k) hoặc HLS manifest có 2160p
    const hasReal4kStream = Boolean(
      (this.detectedHlsLevels &&
        this.detectedHlsLevels.length > 0 &&
        this.detectedHlsLevels.some((l) => l.height >= 2160 || l.width >= 3800)) ||
      mov?.hasReal4k === true ||
      (mov?.quality === "4K" && mov?.hasReal4k !== false && mov?.slug !== "thanh-guom-diet-quy-vo-han-thanh-465645") ||
      ep?.is4k === true ||
      ep?.altSources?.some((a) => a.is4k === true)
    );

    // Phim không có định dạng 4K thực tế thì không hiện nút chất lượng ở ngoài toolbar (tránh nút Full HD đơn độc)
    if (!hasReal4kStream) {
      return "";
    }

    const is4k = this.currentQuality === "4K" || this.currentQuality === "4k";
    return `
      <div class="quality-selector-group" id="qualitySelectorGroup" role="group" aria-label="Chọn độ phân giải thực tế">
        <button class="quality-pill-btn ${!is4k ? "active" : ""}" 
                onclick="app.switchQualityTier('1080')" 
                title="Full HD 1080p • Nét Chuẩn Bản Quyền">
          Full HD
        </button>
        <button class="quality-pill-btn is-4k-quality ${is4k ? "active" : ""}" 
                onclick="app.switchQualityTier('4K')" 
                title="4K Ultra HD • Siêu Nét HDR • Apple Reality Engine">
          4K
        </button>
      </div>
    `;
  },

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
  },

  renderDynamicResumeButtons() {
    const group = document.getElementById("resumeToolbarContainer");
    if (group && this.selectedMovie) {
      group.innerHTML = this.buildResumeButtonsHTML(this.selectedMovie, this.currentEpisodeIndex);
    }
  },

  showResumeFloatingBanner(savedProg) {
    // Đã loại bỏ banner nổi "Tiếp tục xem" theo yêu cầu người dùng
    this.dismissResumeBanner();
  },

  dismissResumeBanner() {
    clearTimeout(this._resumeBannerTimeout);
    const existing = document.getElementById("appleResumeBanner");
    if (existing) {
      existing.style.animation = "appleResumeFadeOut 0.25s ease forwards";
      setTimeout(() => existing.remove(), 250);
    }
  },

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
  },

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
  };

  window.NgwyrenSystem.attachModule(window.AppleCinemaApp, "MovieModal", MovieModalMethods, {
    isolateErrors: false
  });
})();
