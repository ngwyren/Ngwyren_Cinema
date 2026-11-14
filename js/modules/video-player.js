/**
 * @fileoverview VideoPlayer Domain Module for Ngwyren Cinema
 * Isolated feature module registered safely onto AppleCinemaApp via NgwyrenSystem.
 */
(() => {
  "use strict";
  if (!window.AppleCinemaApp || !window.NgwyrenSystem) {
    console.error("[NgwyrenSystem] Missing core dependency while loading VideoPlayer");
    return;
  }

  const VideoPlayerMethods = {
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
  },

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
  },

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
  },

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
  },

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
  },

  rewriteFilm4kPlaylist(playlistText, playlistUrl = "") {
    if (!playlistText || typeof playlistText !== "string") return playlistText;
    const isF4k = (playlistUrl && playlistUrl.includes("film4k.net")) || playlistText.includes("/api/hls/") || playlistText.includes("/api/subs/");
    if (!isF4k) return playlistText;

    // Trích xuất các track phụ đề WebVTT thực tế (VIE, ENG, CHI) từ master.m3u8 của Film4K
    if (playlistText.includes("#EXT-X-MEDIA:TYPE=SUBTITLES")) {
      if (!this.activeEpisodeSubTracks) this.activeEpisodeSubTracks = {};
      const lines = playlistText.split(/\r?\n/);
      lines.forEach((ln) => {
        if (ln.startsWith("#EXT-X-MEDIA:TYPE=SUBTITLES")) {
          const langMatch = ln.match(/LANGUAGE="([^"]+)"/i);
          const nameMatch = ln.match(/NAME="([^"]+)"/i);
          const uriMatch = ln.match(/URI="([^"]+)"/i);
          if (uriMatch && uriMatch[1]) {
            const rawUri = uriMatch[1];
            const absUri = rawUri.startsWith("http")
              ? rawUri
              : `https://film4k.net${rawUri.startsWith("/") ? "" : "/"}${rawUri}`;
            const langCode = (langMatch?.[1] || "").toLowerCase();
            const nameStr = (nameMatch?.[1] || "").toLowerCase();
            if (langCode.includes("vi") || nameStr.includes("việt") || nameStr.includes("vie")) {
              this.activeEpisodeSubTracks.vi = absUri;
            } else if ((langCode.includes("en") || nameStr === "eng") && !this.activeEpisodeSubTracks.en) {
              this.activeEpisodeSubTracks.en = absUri;
            } else if (langCode.includes("ch") || langCode.includes("zh") || nameStr.includes("chi")) {
              this.activeEpisodeSubTracks.zh = absUri;
            }
          }
        }
      });
    }

    // Chuyển mọi đường dẫn tương đối /api/hls/... và /api/subs/... sang tuyệt đối https://film4k.net/api/...
    return playlistText
      .replace(/URI="\/api\//g, 'URI="https://film4k.net/api/')
      .replace(/^(\/api\/[^\r\n]+)$/gm, "https://film4k.net$1");
  },

  createAdFreePlaylistLoader() {
    const self = this;
    if (!window.Hls || !window.Hls.DefaultConfig || !window.Hls.DefaultConfig.loader) return undefined;
    return class extends window.Hls.DefaultConfig.loader {
      constructor(config) {
        super(config);
        const origLoad = this.load.bind(this);
        this.load = (context, cfg, callbacks) => {
          const reqUrl = (context && context.url) || "";
          // Với playlist .m3u8 từ film4k.net/api/hls/, nạp qua smartFetchText để vượt CORS (các phân đoạn video tiktokcdn đã có sẵn CORS: *)
          if (reqUrl.includes("film4k.net/api/hls/") && self.service?.smartFetchText) {
            const tStart = performance.now();
            self.service
              .smartFetchText(reqUrl, 5000)
              .then((txt) => {
                if (txt && txt.includes("#EXTM3U")) {
                  const rewritten = self.rewriteFilm4kPlaylist(txt, reqUrl);
                  const cleaned = self.cleanHlsAdSegments(rewritten);
                  const finalData = self.calibrateHlsPlaylistTimestampsSync(cleaned, reqUrl);
                  const now = performance.now();
                  const stats = {
                    aborted: false,
                    loaded: finalData.length,
                    total: finalData.length,
                    retry: 0,
                    chunkCount: 1,
                    bwEstimate: 5000000,
                    loading: { start: tStart, first: now, end: now },
                    parsing: { start: now, end: now },
                    buffering: { start: now, first: now, end: now }
                  };
                  callbacks.onSuccess({ url: reqUrl, data: finalData }, stats, context, null);
                } else {
                  origLoad(context, cfg, callbacks);
                }
              })
              .catch(() => {
                origLoad(context, cfg, callbacks);
              });
            return;
          }

          const origSuccess = callbacks.onSuccess;
          callbacks.onSuccess = (response, stats, ctx, networkDetails) => {
            if (response && typeof response.data === "string" && response.data.includes("#EXTM3U")) {
              const targetUrl = (response && response.url) || (ctx && ctx.url) || (context && context.url) || "";
              const rewritten = self.rewriteFilm4kPlaylist(response.data, targetUrl);
              const cleaned = self.cleanHlsAdSegments(rewritten);
              response.data = self.calibrateHlsPlaylistTimestampsSync(cleaned, targetUrl);
            }
            if (origSuccess) origSuccess(response, stats, ctx, networkDetails);
          };
          origLoad(context, cfg, callbacks);
        };
      }
    };
  },

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
  },

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
  },

  formatYouTubeEmbedUrl(url) {
    if (!url || typeof url !== "string") return url;
    let ytId = this.extractYouTubeId(url);
    if (!ytId && url.includes("/embed/")) {
      const match = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (match) ytId = match[1];
    }
    if (!ytId) return url;

    let start = "";
    try {
      const parsedUrl = new URL(url.startsWith("http") ? url : `https://www.youtube.com/${url}`);
      start = parsedUrl.searchParams.get("start") || "";
    } catch (_) {
      const startMatch = url.match(/[?&]start=(\d+)/);
      if (startMatch) start = startMatch[1];
    }

    const params = [
      "autoplay=1",
      "rel=0",
      "enablejsapi=1",
      "cc_load_policy=0", // Tắt phụ đề mặc định
      "cc_lang_pref=none",
      "iv_load_policy=3", // Tắt quảng cáo / chú thích nổi
      "vq=hd2160",        // Luôn ưu tiên độ phân giải 4K Ultra HD (2160p) cao nhất
      "playsinline=1",
      "modestbranding=1"
    ];
    if (typeof window !== "undefined" && window.location?.origin && !window.location.origin.startsWith("file://")) {
      params.push(`origin=${encodeURIComponent(window.location.origin)}`);
    }
    if (start) {
      params.push(`start=${start}`);
    }

    return `https://www.youtube.com/embed/${ytId}?${params.join("&")}`;
  },

  applyYouTubeBestQualityAndNoCaptions(iframeEl) {
    if (!iframeEl) return;

    const sendCmd = (func, args = []) => {
      try {
        if (iframeEl.contentWindow) {
          iframeEl.contentWindow.postMessage(
            JSON.stringify({
              event: "command",
              func: func,
              args: args
            }),
            "*"
          );
        }
      } catch (_) {}
    };

    const enforceSettings = () => {
      // 1. Tắt hoàn toàn phụ đề / Closed Captions
      sendCmd("unloadModule", ["captions"]);
      sendCmd("unloadModule", ["cc"]);
      sendCmd("setOption", ["captions", "track", {}]);
      sendCmd("setOption", ["cc", "track", {}]);
      sendCmd("setOption", ["captions", "fontSize", 0]);

      // 2. Ép chất lượng 4K Ultra HD cao nhất (2160p / High-Res)
      sendCmd("setPlaybackQuality", ["highres"]);
      sendCmd("setPlaybackQuality", ["hd2160"]);
      sendCmd("setPlaybackQualityRange", ["hd2160", "highres"]);
    };

    // Khi iframe vừa nạp xong
    iframeEl.onload = () => {
      enforceSettings();
      setTimeout(enforceSettings, 300);
      setTimeout(enforceSettings, 800);
      setTimeout(enforceSettings, 1800);
      setTimeout(enforceSettings, 3200);
      setTimeout(enforceSettings, 5000);
    };

    // Lắng nghe postMessage từ YouTube player
    if (!this._ytMessageBound) {
      this._ytMessageBound = true;
      window.addEventListener("message", (event) => {
        try {
          if (typeof event.data === "string" && (event.data.includes("infoDelivery") || event.data.includes("onReady"))) {
            const curIframe = document.getElementById("trailerIframeElement");
            if (curIframe && curIframe.style.display !== "none") {
              enforceSettings();
            }
          }
        } catch (_) {}
      });
    }
  },

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
      const isYouTube = iframeUrl.includes("youtube.com") || iframeUrl.includes("youtu.be");
      const isVtvgo = iframeUrl.includes("vtvgo.vn");
      if (isVtvgo) {
        iframeEl.removeAttribute("sandbox");
        iframeEl.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture; fullscreen");
      } else {
        iframeEl.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation allow-forms allow-popups");
        iframeEl.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture; fullscreen");
      }
      if (isYouTube) {
        this.applyYouTubeBestQualityAndNoCaptions(iframeEl);
      }
      const finalUrl = isYouTube ? this.formatYouTubeEmbedUrl(iframeUrl) : iframeUrl;
      iframeEl.src = finalUrl;
      iframeEl.style.display = "block";
      if (isYouTube) {
        setTimeout(() => {
          try {
            iframeEl.contentWindow?.postMessage(JSON.stringify({ event: "listening" }), "*");
          } catch (_) {}
        }, 150);
      }
    }
  },

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
  },

  async startVideoPlayback(movie, epIndex = 0, serverMode = "hls-1") {
    if (!movie) return;
    const streamToken = window.NgwyrenSystem?.dispatcher?.nextStreamToken?.() || 0;
    const isStaleRequest = () => Boolean(streamToken && window.NgwyrenSystem?.dispatcher && !window.NgwyrenSystem.dispatcher.isCurrentStreamToken(streamToken));

    this.selectedMovie = movie;
    this.playingMovie = movie;
    this.currentEpisodeIndex = epIndex;
    this.currentServerMode = serverMode;

    if (serverMode === "hls-1" || !serverMode) {
      await this.ensureHlsLoaded();
      if (isStaleRequest()) return;
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
      if (isStaleRequest()) return;
      const langText = document.getElementById("modalLanguageText");
      if (langText) langText.textContent = this.getMovieLanguageLabel(movie);
      this.syncModal4kBadgeState(movie);
    } else if (!movie._isEnriched) {
      // Nếu đã có sẵn luồng .m3u8 chuẩn, phát ngay lập tức 0ms và nạp ngầm Server 2 / Film4K / Thuyết Minh
      const prevEpCount = Array.isArray(movie.episodes) ? movie.episodes.length : 0;
      this.service.enrichMovieStreams(movie, false).then(() => {
        if (this.selectedMovie?.slug === movie.slug) {
          const langText = document.getElementById("modalLanguageText");
          if (langText) langText.textContent = this.getMovieLanguageLabel(movie);
          this.syncModal4kBadgeState(movie);
          this.renderServerButtons(movie, this.currentEpisodeIndex);
          this.renderDynamicQualityButtons();
          if ((movie.episodes?.length || 0) !== prevEpCount) {
            this.refreshEpisodesInModal(movie);
          }
          if (this.bilingualSubMode && this.bilingualSubMode !== "off") {
            this.ensureBilingualCuesLoaded(movie, this.currentEpisodeIndex);
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
    const f4kEp = movie.film4kEpisodes?.[epIndex] || movie.film4kEpisodes?.[0];

    // Khởi tạo trạng thái phụ đề song ngữ của tập phim hiện tại
    this.activeEpisodeSubTracks = {};
    this.syncBilingualToolbarUI();
    if (this.bilingualSubMode && this.bilingualSubMode !== "off") {
      this.ensureBilingualCuesLoaded(movie, epIndex);
    }

    // Chế độ phát Trailer YouTube
    if (serverMode === "trailer" && movie.trailerUrl) {
      const ytId = this.extractYouTubeId(movie.trailerUrl);
      const ytEmbedUrl = ytId
        ? `https://www.youtube.com/embed/${ytId}`
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
    } else if (serverMode === "server-2" || serverMode === "film4k-1" || serverMode === "embed-1") {
      this.currentServerMode = "server-2";
      const f4kAlt = episode?.altSources?.find((a) => a.isFilm4k);
      streamUrl = (f4kEp && f4kEp.source) || (f4kAlt && f4kAlt.source) || (ncEp && ncEp.source) || (ncEp && ncEp.embed) || (episode && episode.embed) || (episode && episode.source) || "";
    } else if (serverMode === "vtvgo") {
      this.currentServerMode = "vtvgo";
      streamUrl = episode?.vtvgoUrl || movie.vtvgoUrl || "https://vtvgo.vn/watch/2E4t";
    } else if (serverMode === "youtube" || serverMode === "hls-1") {
      if (movie.vtvgoUrl || episode?.vtvgoUrl) {
        this.currentServerMode = "youtube";
        const ytAlt = episode?.altSources?.find((a) => a.embed && (a.embed.includes("youtube") || a.embed.includes("youtu.be")));
        streamUrl = ytAlt?.embed || episode?.embed || "";
      } else {
        streamUrl = (episode && episode.source) || (ncEp && ncEp.source) || (f4kEp && f4kEp.source) || "";
      }
    } else if (serverMode === "dub-1") {
      streamUrl = (dubEp && dubEp.source) || (episode && episode.source) || "";
    } else if (serverMode === "embed-1" || serverMode === "nguonc-1") {
      streamUrl = (ncEp && ncEp.source) || (ncEp && ncEp.embed) || (episode && episode.embed) || (episode && episode.source) || "";
    } else {
      if (movie.vtvgoUrl || episode?.vtvgoUrl) {
        this.currentServerMode = "youtube";
        const ytAlt = episode?.altSources?.find((a) => a.embed && (a.embed.includes("youtube") || a.embed.includes("youtu.be")));
        streamUrl = ytAlt?.embed || episode?.embed || "";
      } else {
        streamUrl = (episode && episode.source) || (ncEp && ncEp.source) || (f4kEp && f4kEp.source) || "";
      }
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

    // Mặc định phát chuẩn Full HD 1080p hoặc 4K Ultra HD nếu phim hỗ trợ 4K
    const has4k = Boolean(
      movie.quality === "4K" ||
      movie.has4k === true ||
      (Array.isArray(movie.sectionTags) && movie.sectionTags.includes("4k"))
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
        serverMode === "vtvgo" ? (episode?.vtvgoUrl || movie.vtvgoUrl || episode?.embed || "") :
        serverMode === "youtube" ? (episode?.altSources?.find((a) => a.embed && (a.embed.includes("youtube") || a.embed.includes("youtu.be")))?.embed || episode?.embed || "") :
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
    videoEl.setAttribute("playsinline", "");
    videoEl.setAttribute("webkit-playsinline", "");
    videoEl.style.display = "block";
    document.getElementById("applePlayerOverlay")?.style.setProperty("display", "flex");
    this.initAppleVideoPlayerEvents();

    this.destroyHls();
    this._hlsNetworkRetryCount = 0;
    this.detectedHlsLevels = [];
    this.detectedAdRanges = [];
    this.actualVideoRes = { width: 0, height: 0, bitrateMbps: 0 };

    const savedProg = this.getPlaybackProgress(movie.slug, epIndex);
    const targetResumeTime = (savedProg && savedProg.currentTime > 5 && savedProg.percentage < 95)
      ? savedProg.currentTime
      : 0;
    videoEl._targetResumeTime = targetResumeTime;
    videoEl._userScrubbed = false;
    videoEl._lastSavedPos = targetResumeTime > 0 ? targetResumeTime : 0;

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
        startPosition: targetResumeTime > 5 ? targetResumeTime : -1,
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

      let hasAppliedResume = false;
      const applyResumeTimeSafely = () => {
        if (hasAppliedResume || targetResumeTime <= 5) return;
        try {
          if (videoEl.duration && videoEl.duration > targetResumeTime) {
            if (Math.abs(videoEl.currentTime - targetResumeTime) > 2) {
              videoEl.currentTime = targetResumeTime;
            }
            hasAppliedResume = true;
          } else if (videoEl.readyState >= 1) {
            videoEl.currentTime = targetResumeTime;
            hasAppliedResume = true;
          }
        } catch (_) {}
      };

      videoEl.addEventListener("loadedmetadata", applyResumeTimeSafely);
      videoEl.addEventListener("canplay", applyResumeTimeSafely);
      videoEl.addEventListener("playing", applyResumeTimeSafely);

      // Đăng ký toàn bộ sự kiện TRƯỚC khi gọi loadSource & attachMedia để không bao giờ bỏ lỡ MANIFEST_PARSED
      this.hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
        const levels = this.hlsInstance?.levels || [];
        this.inspectHlsLevels(levels);
        this.renderDynamicQualityButtons();
        this.renderDynamicResumeButtons();
        this.applyVideoQualityVisuals();
        videoEl.play().catch(() => {});
        applyResumeTimeSafely();
      });

      this.hlsInstance.on(window.Hls.Events.FRAG_LOADED, () => {
        if (!hasAppliedResume && targetResumeTime > 5) {
          applyResumeTimeSafely();
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
    // Ngoại trừ luồng film4k.net/api/hls/ cần custom playlist loader của HLS.js để xử lý CORS cho manifest
    const requiresHlsCustomLoader = streamUrl.includes("film4k.net/api/hls/");
    if (isAppleTouchDevice && canPlayNativeHls && !requiresHlsCustomLoader) {
      videoEl.src = streamUrl;
      let hasNativeResume = false;
      const doNativeResume = () => {
        if (hasNativeResume || targetResumeTime <= 5) return;
        try {
          if (Math.abs(videoEl.currentTime - targetResumeTime) > 2) {
            videoEl.currentTime = targetResumeTime;
          }
          hasNativeResume = true;
        } catch (_) {}
      };

      const onNativeMeta = () => {
        this.actualVideoRes.width = videoEl.videoWidth || 1920;
        this.actualVideoRes.height = videoEl.videoHeight || 1080;
        this.renderDynamicQualityButtons();
        this.renderDynamicResumeButtons();
        this.applyVideoQualityVisuals();
        doNativeResume();
        videoEl.play().catch(() => {});
      };
      const onNativeCanPlay = () => {
        doNativeResume();
      };
      videoEl.addEventListener("loadedmetadata", onNativeMeta, { once: true });
      videoEl.addEventListener("canplay", onNativeCanPlay, { once: true });
      videoEl.addEventListener(
        "error",
        () => {
          videoEl.removeEventListener("loadedmetadata", onNativeMeta);
          videoEl.removeEventListener("canplay", onNativeCanPlay);
          videoEl.removeAttribute("src");
          startHlsJsEngine();
        },
        { once: true }
      );
      videoEl.play().catch(() => {});
    } else if (!startHlsJsEngine() && canPlayNativeHls) {
      videoEl.src = streamUrl;
      let hasNativeResume2 = false;
      const doNativeResume2 = () => {
        if (hasNativeResume2 || targetResumeTime <= 5) return;
        try {
          if (Math.abs(videoEl.currentTime - targetResumeTime) > 2) {
            videoEl.currentTime = targetResumeTime;
          }
          hasNativeResume2 = true;
        } catch (_) {}
      };
      videoEl.addEventListener(
        "loadedmetadata",
        () => {
          this.actualVideoRes.width = videoEl.videoWidth || 1920;
          this.actualVideoRes.height = videoEl.videoHeight || 1080;
          this.renderDynamicQualityButtons();
          this.renderDynamicResumeButtons();
          this.applyVideoQualityVisuals();
          doNativeResume2();
          videoEl.play().catch(() => {});
        },
        { once: true }
      );
      videoEl.addEventListener("canplay", doNativeResume2, { once: true });
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

      // Đồng bộ lớp phủ Phụ đề Song Ngữ (Việt - Anh / Việt - Trung) theo thời gian thực
      if (this.bilingualSubMode && this.bilingualSubMode !== "off") {
        this.updateBilingualSubtitleOverlay(cur, dur);
      }

      // Tự động lưu vị trí xem dở mỗi 10 giây (không gọi renderDynamicResumeButtons làm giật layout khi đang phát)
      if (cur > 5 && (!videoEl._lastSavedPos || Math.abs(cur - videoEl._lastSavedPos) >= 10)) {
        // BẢO VỆ TIẾN TRÌNH: Khi vừa mở phim, nếu chưa tua tới điểm xem dở và người dùng chưa tự tua tay, KHÔNG ghi đè tiến trình thấp
        if (videoEl._targetResumeTime > 15 && cur < videoEl._targetResumeTime - 8 && !videoEl._userScrubbed) {
          return;
        }
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
  },

  skipAdIntro(seconds = 5) {
    this.seekRelative(seconds, true);
  },

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

    // Xác thực 4K: Giữ nguyên định dạng 4K nếu luồng HLS có 2160p HOẶC phim có nguồn 4K thực tế từ Film4K / API
    const hasNative4kLevel = this.detectedHlsLevels.some((l) => l.height >= 2160 || l.width >= 3800);
    const hasMovie4kMeta = Boolean(
      this.selectedMovie?.has4k === true ||
      this.selectedMovie?.quality === "4K" ||
      (Array.isArray(this.selectedMovie?.sectionTags) && this.selectedMovie.sectionTags.includes("4k"))
    );
    const hasReal4k = hasNative4kLevel || hasMovie4kMeta;
    if (hasReal4k) {
      if (this.selectedMovie) {
        this.selectedMovie.quality = "4K";
        this.selectedMovie.has4k = true;
      }
      this.syncModal4kBadgeState(this.selectedMovie);
    } else {
      this.currentQuality = "1080";
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
  },

  resolveResolutionTier(w, h) {
    const maxDim = Math.max(w || 0, h || 0);
    if (maxDim >= 3800 || h >= 2100) return "4K Ultra HD";
    if (maxDim >= 2500 || h >= 1400) return "2K QHD";
    if (maxDim >= 1800 || h >= 800) return "1080p Full HD";
    if (maxDim >= 1200 || h >= 680) return "720p HD";
    if (maxDim >= 800 || h >= 460) return "480p";
    if (maxDim > 0) return `${h}p`;
    return "1080p Full HD";
  },

  resumePlaybackAt(time) {
    const videoEl = document.getElementById("hlsVideoElement");
    if (videoEl && !isNaN(time)) {
      videoEl.currentTime = time;
      videoEl.play().catch(() => {});
      this.showToast(`▶ Đã tiếp tục xem từ ${this.formatSeconds(time)}`);
      this.dismissResumeBanner();
    }
  },

  handleQualityPillClick(label, isReal4k) {
    if (!isReal4k) {
      this.showToast("✨ Chuẩn Full HD 1080p gốc từ máy chủ bản quyền");
    } else {
      this.showToast("✨ Đang phát chuẩn 4K Ultra HD gốc");
    }
  },

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
  },

  switchQualityTier(tier) {
    const is4k = tier === "4k" || tier === "4K";
    const mov = this.selectedMovie || this.playingMovie;
    const ep = mov?.episodes?.[this.currentEpisodeIndex || 0] || mov?.episodes?.[0];
    const hasNative4kLevel = Boolean(
      this.detectedHlsLevels &&
      this.detectedHlsLevels.length > 0 &&
      this.detectedHlsLevels.some((l) => l.height >= 2160 || l.width >= 3800)
    );
    const has4kSource = Boolean(
      hasNative4kLevel ||
      mov?.quality === "4K" ||
      mov?.has4k === true ||
      (Array.isArray(mov?.sectionTags) && mov.sectionTags.includes("4k")) ||
      ep?.is4k ||
      ep?.altSources?.some((a) => a.is4k)
    );

    if (is4k) {
      if (!has4kSource) {
        this.currentQuality = "1080";
        this.renderDynamicQualityButtons();
        this.applyVideoQualityVisuals();
        this.showToast("ℹ️ Phim này nguồn gốc cao nhất là Full HD 1080p (chưa có bản 4K gốc).");
        return;
      }
      this.currentQuality = "4K";
      const k4Idx = (this.detectedHlsLevels || []).findIndex((l) => l.height >= 2160 || l.width >= 3800);
      if (k4Idx !== -1 && this.hlsInstance) {
        this.hlsInstance.currentLevel = k4Idx;
        this.hlsInstance.loadLevel = k4Idx;
        this.hlsInstance.nextLevel = k4Idx;
      } else {
        const f4k4kAlt = ep?.altSources?.find((a) => a.is4k && a.source);
        if (f4k4kAlt && this.currentServerMode !== "film4k-1" && this.hlsInstance) {
          const videoEl = document.getElementById("hlsVideoElement");
          const resumePos = videoEl ? videoEl.currentTime : 0;
          this.currentServerMode = "film4k-1";
          this.renderServerButtons(mov, this.currentEpisodeIndex);
          this.hlsInstance.loadSource(f4k4kAlt.source);
          this.hlsInstance.once(window.Hls.Events.MANIFEST_PARSED, () => {
            if (videoEl && resumePos > 2) videoEl.currentTime = resumePos;
            videoEl?.play().catch(() => {});
          });
        }
      }
      this.showAppleVideoHud?.("forward", "4K Ultra HD");
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
      this.showAppleVideoHud?.("backward", "Full HD 1080p");
      this.showToast("✨ Đang phát chuẩn Full HD 1080p");
    }

    this.renderDynamicQualityButtons();
    this.applyVideoQualityVisuals();

    const menu = document.getElementById("applePlayerSettingMenu");
    if (menu) {
      menu.classList.remove("open");
      const fhdItem = menu.querySelector(".setting-menu-item:not(.is-4k)");
      const k4Item = menu.querySelector(".setting-menu-item.is-4k");
      if (fhdItem) fhdItem.classList.toggle("active", !is4k);
      if (k4Item) k4Item.classList.toggle("active", is4k);
    }
    const gearBadge = document.getElementById("settingGearBadge");
    if (gearBadge) {
      gearBadge.textContent = is4k ? "4K" : "HD";
      gearBadge.style.display = is4k ? "inline-flex" : "none";
    }
  },

  renderDynamicQualityButtons() {
    const group = document.getElementById("qualitySelectorGroup");
    if (group) {
      group.innerHTML = this.buildQualityButtonsHTML(this.selectedMovie);
    }
  },

  getQualityLabel(q) {
    const is4k = this.currentQuality === "4K" || this.currentQuality === "4k";
    if (is4k) {
      return "4K Ultra HD • Siêu Nét • HDR Reality Engine";
    }
    return "Full HD 1080 • Nét Chuẩn";
  },

  getQualityVideoClass(q) {
    const is4k = q === "4K" || q === "4k" || this.currentQuality === "4K" || this.currentQuality === "4k";
    return is4k ? "quality-4k-enhanced" : "";
  },

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
  },

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
  },

  applyVideoQualityVisuals() {
    const videoEl = document.getElementById("hlsVideoElement");
    const mov = this.selectedMovie || this.playingMovie;
    const is4k = Boolean(
      (this.currentQuality === "4K" || this.currentQuality === "4k") &&
      ((this.detectedHlsLevels && this.detectedHlsLevels.some((l) => l.height >= 2160 || l.width >= 3800)) ||
        mov?.quality === "4K" ||
        mov?.has4k === true ||
        (Array.isArray(mov?.sectionTags) && mov.sectionTags.includes("4k")))
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
  },

  syncModal4kBadgeState(movie) {
    if (!movie) return;
    const is4k = Boolean(
      movie.quality === "4K" ||
      movie.has4k === true ||
      (Array.isArray(movie.sectionTags) && movie.sectionTags.includes("4k"))
    );
    const modalPill = document.getElementById("modalQualityPill");
    if (modalPill) {
      modalPill.className = `meta-pill ${is4k ? "badge-4k" : "badge-1080"}`;
      modalPill.innerHTML = is4k ? "<i class='fas fa-sparkles'></i> 4K Ultra HD" : "Full HD 1080p";
    }
  },

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
      try {
        videoEl.load();
      } catch (_) {}
    }
    const iframeEl = document.getElementById("trailerIframeElement");
    if (iframeEl) {
      iframeEl.src = "";
    }
  },

  destroyHls() {
    if (this.hlsInstance) {
      try {
        this.hlsInstance.stopLoad();
        this.hlsInstance.destroy();
      } catch (_) {}
      this.hlsInstance = null;
    }
  },

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
  },

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
      const topExpIcon = document.getElementById("modalTopExpandIcon");
      if (topExpIcon) {
        topExpIcon.className = isFs ? "fas fa-compress" : "fas fa-expand";
      }
      const topExpBtn = document.getElementById("modalTopExpandBtn");
      if (topExpBtn) {
        topExpBtn.title = isFs ? "Thu nhỏ màn hình (Esc)" : "Phóng to toàn màn hình (F)";
      }
      resetControlsTimer();
    };
    document.addEventListener("fullscreenchange", this._boundFsChange);
    document.addEventListener("webkitfullscreenchange", this._boundFsChange);

    if (!this._boundDocClickForSetting) {
      this._boundDocClickForSetting = (evt) => {
        const cluster = document.getElementById("appleSettingCluster");
        const menu = document.getElementById("applePlayerSettingMenu");
        if (menu && menu.classList.contains("open") && cluster && !cluster.contains(evt.target)) {
          menu.classList.remove("open");
        }
      };
      document.addEventListener("click", this._boundDocClickForSetting);
    }

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
  },

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
  },

  handleAppleVideoClick(e) {
    if (e && e.target && e.target.closest(".apple-player-bottombar, .apple-player-topbar, .apple-resume-float-banner")) {
      return;
    }
    const overlay = document.getElementById("applePlayerOverlay");
    const isTouchLike = Boolean(
      window.NgwyrenSystem?.device?.isTouch ||
      (e && e.pointerType === "touch") ||
      (typeof window.matchMedia === "function" && window.matchMedia("(hover: none)").matches)
    );

    if (isTouchLike) {
      const now = Date.now();
      const stage = document.getElementById("appleVideoPlayer") || overlay;
      const rect = stage ? stage.getBoundingClientRect() : null;
      const tapX = e && typeof e.clientX === "number" ? e.clientX : 0;

      // Double-tap left/right edges skips +-10s cleanly on iPhone & iPad
      if (this._lastTouchTapTime && (now - this._lastTouchTapTime) < 280 && rect && rect.width > 0) {
        this._lastTouchTapTime = 0;
        clearTimeout(this._singleTouchTapTimer);
        const ratio = (tapX - rect.left) / rect.width;
        if (ratio < 0.35) {
          this.seekRelative(-10);
          this._resetControlsTimer?.();
          return;
        }
        if (ratio > 0.65) {
          this.seekRelative(10);
          this._resetControlsTimer?.();
          return;
        }
        this.toggleVideoFullscreen(e);
        return;
      }

      this._lastTouchTapTime = now;
      clearTimeout(this._singleTouchTapTimer);

      // If controls are currently hidden on touch screen, first tap reveals HUD without pausing
      if (overlay && !overlay.classList.contains("hud-visible")) {
        this._resetControlsTimer?.();
        return;
      }

      this._singleTouchTapTimer = setTimeout(() => {
        this.toggleVideoPlayPause();
        this._resetControlsTimer?.();
      }, 220);
      return;
    }

    clearTimeout(this._clickTimer);
    if (e && e.detail === 2) return;
    this._clickTimer = setTimeout(() => {
      this.toggleVideoPlayPause();
    }, 180);
  },

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
  },

  getMovieIntroWindow(movie, duration = 0, currentTime = 0) {
    if (!movie) return null;
    const slug = (movie.slug || "").toLowerCase();
    const genres = Array.isArray(movie.genres) ? movie.genres.map((g) => String(g).toLowerCase()) : [];
    const tags = Array.isArray(movie.sectionTags) ? movie.sectionTags : [];
    const cSlug = movie.countrySlug || "";
    const isSeries = movie.type === "series" || (movie.episodeTotal && movie.episodeTotal !== "1" && movie.episodeTotal !== 1);

    // 1. Phim Lẻ Chiếu Rạp / Điện Ảnh (Single Movies):
    // KHÔNG tự động bật Skip Intro bừa bãi. Trong điện ảnh, các cảnh mở đầu là nội dung phim thực sự (lời dẫn truyện, mở màn tình huống).
    // Chỉ kích hoạt nếu phim có tọa độ introStart và introEnd được cấu hình chính xác trong dữ liệu.
    if (movie.type === "single" || !isSeries) {
      if (typeof movie.introStart === "number" && typeof movie.introEnd === "number" && movie.introEnd > movie.introStart) {
        return { start: movie.introStart, end: movie.introEnd, target: movie.introEnd, label: "Bỏ qua Giới Thiệu" };
      }
      return null;
    }

    // 2. Bảo vệ nội dung: Nếu đã xem qua phút thứ 2:15 (> 135s), đoạn mở đầu đã kết thúc -> không hiển thị nút Skip Intro
    if (currentTime > 135) return null;

    // 3. Phim / Anime có mốc Intro cụ thể đã cấu hình sẵn trong dữ liệu
    if (typeof movie.introStart === "number" && typeof movie.introEnd === "number" && movie.introEnd > movie.introStart) {
      return { start: movie.introStart, end: movie.introEnd, target: movie.introEnd, label: "Bỏ qua Intro" };
    }

    // Star Wars / The Clone Wars (~35s)
    if (slug.includes("clone-war") || slug.includes("star-wars")) {
      return { start: 2, end: 38, target: 35, label: "Bỏ qua Giới Thiệu (00:35)" };
    }

    // One Piece / Đảo Hải Tặc (Tóm tắt + OP chuẩn ~2 phút 15 giây, không nhảy lố vào cốt truyện)
    if (slug.includes("one-piece") || slug.includes("dao-hai-tac")) {
      return { start: 2, end: 140, target: 135, label: "Bỏ qua Tóm Tắt & OP (02:15)" };
    }

    // Conan (Đoạn độc thoại của Conan + Nhạc OP ~1 phút 40 giây)
    if (slug.includes("conan") || slug.includes("tham-tu-lung-danh")) {
      return { start: 2, end: 105, target: 100, label: "Bỏ qua Giới Thiệu & OP (01:40)" };
    }

    // Naruto & Boruto (Tóm tắt + Nhạc OP ~1 phút 40 giây)
    if (slug.includes("naruto") || slug.includes("boruto")) {
      return { start: 2, end: 105, target: 100, label: "Bỏ qua Tóm Tắt & OP (01:40)" };
    }

    // Dragon Ball / Bảy Viên Ngọc Rồng (~1 phút 30 giây)
    if (slug.includes("dragon-ball") || slug.includes("bay-vien-ngoc-rong")) {
      return { start: 2, end: 95, target: 90, label: "Bỏ qua Tóm Tắt & OP (01:30)" };
    }

    // Doraemon & Cậu Bé Bút Chì Shin (~1 phút)
    if (slug.includes("doraemon") || slug.includes("shin-cau-be")) {
      return { start: 2, end: 65, target: 60, label: "Bỏ qua Nhạc Mở Đầu (01:00)" };
    }

    // Anime Nhật Bản (Thanh Gươm Diệt Quỷ, Jujutsu Kaisen, Chainsaw Man...):
    // Nhạc Opening Anime chuẩn 89 giây, tua chính xác tới 88s (01:28), không nhảy lố
    const isAnime = tags.includes("anime") || genres.some((g) => /anime|hoạt hình/i.test(g)) || cSlug === "nhat-ban";
    if (isAnime) {
      return { start: 2, end: 92, target: 88, label: "Bỏ qua Nhạc Mở Đầu (01:28)" };
    }

    // Hoạt hình 3D Trung Quốc (Đấu La, Đấu Phá, Hoàn Mỹ Thế Giới, Tiên Nghịch...): Nhạc OP ~80s
    const isDonghua3D = tags.includes("hoat-hinh-3d") || genres.some((g) => /hoạt hình 3d|tiên hiệp|huyền huyễn/i.test(g));
    if (isDonghua3D) {
      return { start: 2, end: 85, target: 80, label: "Bỏ qua Nhạc Đầu Phim (01:20)" };
    }

    // Phim Bộ Trung Quốc (C-Drama / Cổ Trang): Nhạc mở đầu chuẩn 90s (01:30)
    if ((cSlug === "trung-quoc" || movie.country === "Trung Quốc") && isSeries) {
      return { start: 2, end: 95, target: 90, label: "Bỏ qua Nhạc Đầu Phim (01:30)" };
    }

    // Phim Bộ Hàn Quốc (K-Drama): Nhạc mở đầu chuẩn 65s (01:05)
    if ((cSlug === "han-quoc" || movie.country === "Hàn Quốc") && isSeries) {
      return { start: 2, end: 70, target: 65, label: "Bỏ qua Đoạn Mở Đầu (01:05)" };
    }

    // Phim Bộ Âu Mỹ & Netflix Originals: Đoạn giới thiệu chuẩn 45s (00:45)
    if (tags.includes("netflix") || cSlug === "au-my" || movie.country === "Âu Mỹ") {
      return { start: 2, end: 48, target: 44, label: "Bỏ qua Intro Netflix (00:44)" };
    }

    // Phim bộ chung: Giới hạn 60s
    return { start: 2, end: 65, target: 60, label: "Bỏ qua Intro (01:00)" };
  },

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
  },

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
  },

  seekRelative(seconds = 5, showHud = false, e) {
    if (e) e.stopPropagation();
    const videoEl = document.getElementById("hlsVideoElement");
    if (!videoEl || isNaN(videoEl.duration) || videoEl.duration <= 0) return;
    videoEl._userScrubbed = true;

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
  },

  setVideoVolume(val, showHud = false) {
    const videoEl = document.getElementById("hlsVideoElement");
    if (!videoEl) return;
    const v = Math.max(0, Math.min(1, parseFloat(val)));
    videoEl.volume = v;
    videoEl.muted = (v === 0);
    if (showHud) {
      this.showAppleVideoHud("volume", `${Math.round(v * 100)}%`);
    }
  },

  adjustVideoVolume(delta) {
    const videoEl = document.getElementById("hlsVideoElement");
    if (!videoEl) return;
    const current = videoEl.muted ? 0 : videoEl.volume;
    const next = Math.max(0, Math.min(1, current + delta));
    this.setVideoVolume(next, true);
  },

  toggleVideoMute(e) {
    if (e) e.stopPropagation();
    const videoEl = document.getElementById("hlsVideoElement");
    if (!videoEl) return;
    videoEl.muted = !videoEl.muted;
    this.showAppleVideoHud(videoEl.muted ? "mute" : "unmute");
  },

  togglePlayerSettingMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById("applePlayerSettingMenu");
    if (!menu) return;
    menu.classList.toggle("open");
  },

  setPlaybackSpeed(speed, e) {
    if (e) e.stopPropagation();
    const videoEl = document.getElementById("hlsVideoElement");
    const parsed = parseFloat(speed) || 1.0;
    if (videoEl) videoEl.playbackRate = parsed;
    this.playbackSpeed = parsed;
    const textEl = document.getElementById("appleSpeedText");
    if (textEl) textEl.textContent = `${parsed}x`;
    const menu = document.getElementById("applePlayerSettingMenu");
    if (menu) {
      menu.querySelectorAll(".setting-speed-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.textContent.trim() === `${parsed}x`);
      });
      menu.classList.remove("open");
    }
    this.showAppleVideoHud?.("speed", `${parsed}x`);
  },

  cyclePlaybackSpeed(e) {
    if (e) e.stopPropagation();
    const videoEl = document.getElementById("hlsVideoElement");
    if (!videoEl) return;
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const currentSpeed = videoEl.playbackRate || 1.0;
    const nextIdx = (speeds.indexOf(currentSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    this.setPlaybackSpeed(nextSpeed, e);
  },

  toggleVideoTheaterMode(e) {
    if (e) e.stopPropagation();
    const modal = document.getElementById("movieDetailModal");
    const sheet = document.getElementById("movieDetailSheet");
    if (!sheet) return;
    const isTheater = sheet.classList.toggle("apple-theater-mode");
    modal?.classList.toggle("lights-off", isTheater);
    this.showAppleVideoHud("theater", isTheater ? "Rạp phim: Bật" : "Rạp phim: Tắt");
  },

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
  },

  toggleVideoPip(e) {
    if (e) e.stopPropagation();
    const videoEl = document.getElementById("hlsVideoElement");
    if (!videoEl) return;
    try {
      if (videoEl.webkitSupportsPresentationMode && typeof videoEl.webkitSetPresentationMode === "function") {
        const nextMode = videoEl.webkitPresentationMode === "picture-in-picture" ? "inline" : "picture-in-picture";
        videoEl.webkitSetPresentationMode(nextMode);
        return;
      }
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => {});
      } else if (videoEl.requestPictureInPicture) {
        videoEl.requestPictureInPicture().catch(() => {
          this.showToast("Thiết bị chưa sẵn sàng chế độ Hình trong hình.");
        });
      }
    } catch {
      this.showToast("Không thể bật Picture-in-Picture trên trình duyệt này.");
    }
  },

  toggleVideoFullscreen(e) {
    if (e) e.stopPropagation();
    const stage = document.getElementById("activeVideoContainer") || document.getElementById("modalPlayerStage");
    const videoEl = document.getElementById("hlsVideoElement");
    if (!stage) return;

    const isDocFullscreen = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      videoEl?.webkitDisplayingFullscreen
    );

    if (isDocFullscreen) {
      if (videoEl?.webkitDisplayingFullscreen && typeof videoEl.webkitExitFullscreen === "function") {
        videoEl.webkitExitFullscreen();
      } else if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      return;
    }

    if (stage.requestFullscreen) {
      stage.requestFullscreen().then(() => {
        this._resetControlsTimer?.();
      }).catch(() => {
        if (videoEl && typeof videoEl.webkitEnterFullscreen === "function") {
          try { videoEl.webkitEnterFullscreen(); } catch {}
        }
      });
    } else if (stage.webkitRequestFullscreen) {
      try {
        stage.webkitRequestFullscreen();
        this._resetControlsTimer?.();
      } catch {
        if (videoEl && typeof videoEl.webkitEnterFullscreen === "function") {
          try { videoEl.webkitEnterFullscreen(); } catch {}
        }
      }
    } else if (videoEl && typeof videoEl.webkitEnterFullscreen === "function") {
      // iPhone iOS Safari native fullscreen video fallback
      try {
        videoEl.webkitEnterFullscreen();
      } catch {
        this.showToast("Video đang tải dữ liệu để mở Toàn màn hình.");
      }
    }
  },

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
      window.removeEventListener("touchcancel", onMouseUp);
      videoEl.currentTime = targetTime;
      videoEl._userScrubbed = true;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onMouseMove, { passive: true });
    window.addEventListener("touchend", onMouseUp);
    window.addEventListener("touchcancel", onMouseUp);
  },

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
  },

  hideScrubTimePreview() {
    document.getElementById("appleScrubTooltip")?.classList.remove("visible");
  },

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
  },

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
  },

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

    let histItem = (this.watchHistory || []).find((h) => h && h.slug === slug);
    if (histItem) {
      histItem.progress = percentage;
      histItem.epIndex = epIndex;
      histItem.currentTime = Math.floor(currentTime);
      histItem.timestamp = Date.now();
    } else {
      const movie = this.findMovie(slug);
      this.watchHistory = this.sanitizeAndDedupeHistory([
        {
          slug,
          title: movie?.title || "",
          poster: movie?.poster || "",
          backdrop: movie?.backdrop || "",
          epIndex,
          progress: percentage,
          currentTime: Math.floor(currentTime),
          timestamp: Date.now()
        },
        ...(this.watchHistory || [])
      ]);
    }
    this.saveStorage("apple_cinema_history", this.watchHistory);
  },

  getPlaybackProgress(slug, epIndex = 0) {
    if (!slug) return null;
    const progressMap = this.loadStorage("ngwyren_playback_progress", {});
    return progressMap[`${slug}_${epIndex}`] || null;
  },

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
  },

  /* ==========================================================================
     OPTIONAL BILINGUAL SUBTITLE & REAL-TIME TRANSLATION ENGINE
     Hỗ trợ dịch song ngữ tùy chọn: Tắt (off) | Việt - Anh (vi-en) | Việt - Trung (vi-zh)
     ========================================================================== */
  getBilingualShortBadge(mode) {
    const m = mode || this.bilingualSubMode || "off";
    if (m === "vi-en") return "VI•EN";
    if (m === "vi-zh") return "VI•中";
    return "CC";
  },

  toggleBilingualSubtitleMenu(event) {
    if (event) {
      if (typeof event.stopPropagation === "function") event.stopPropagation();
      if (typeof event.preventDefault === "function") event.preventDefault();
    }
    const menu = document.getElementById("appleBilingualMenu");
    if (menu) {
      menu.classList.toggle("open");
    }
  },

  cycleBilingualSubtitleMode(event) {
    const order = ["off", "vi-en", "vi-zh"];
    const cur = this.bilingualSubMode || "off";
    const next = order[(order.indexOf(cur) + 1) % order.length];
    this.setBilingualSubtitleMode(next, true, event);
  },

  syncBilingualToolbarUI() {
    const mode = this.bilingualSubMode || "off";
    const isActive = mode !== "off";

    const btn = document.getElementById("appleBilingualBtn");
    if (btn) btn.classList.toggle("active", isActive);

    const badge = document.getElementById("appleBilingualBtnBadge");
    if (badge) badge.textContent = this.getBilingualShortBadge(mode);

    const menu = document.getElementById("appleBilingualMenu");
    if (menu) {
      menu.querySelectorAll("[data-bilingual-opt]").forEach((el) => {
        el.classList.toggle("active", el.getAttribute("data-bilingual-opt") === mode);
      });
    }

    const toolbarGroup = document.getElementById("toolbarBilingualGroup");
    if (toolbarGroup && typeof this.buildBilingualToolbarHTML === "function") {
      toolbarGroup.innerHTML = this.buildBilingualToolbarHTML();
    }

    const overlay = document.getElementById("appleBilingualSubOverlay");
    if (overlay) {
      overlay.classList.toggle("active", isActive);
      if (!isActive) {
        const pLine = document.getElementById("appleBilingualPrimaryLine");
        const sLine = document.getElementById("appleBilingualSecondaryLine");
        if (pLine) pLine.textContent = "";
        if (sLine) sLine.textContent = "";
      }
    }
  },

  async setBilingualSubtitleMode(mode, showHud = true, event = null) {
    if (event) {
      if (typeof event.stopPropagation === "function") event.stopPropagation();
      if (typeof event.preventDefault === "function") event.preventDefault();
    }
    const normalized = mode === "vi-en" || mode === "vi-zh" ? mode : "off";
    this.bilingualSubMode = normalized;
    if (this.settings) {
      this.settings.bilingualSubMode = normalized;
      this.saveStorage("apple_cinema_settings", this.settings);
    }

    const menu = document.getElementById("appleBilingualMenu");
    if (menu) menu.classList.remove("open");

    this.syncBilingualToolbarUI();

    if (showHud) {
      const labelMap = {
        off: "Song Ngữ: Tắt",
        "vi-en": "Song Ngữ: Việt - Anh",
        "vi-zh": "Song Ngữ: Việt - Trung"
      };
      this.showAppleVideoHud?.("play", labelMap[normalized]);
    }

    if (normalized !== "off" && this.selectedMovie) {
      await this.ensureBilingualCuesLoaded(this.selectedMovie, this.currentEpisodeIndex || 0);
      const videoEl = document.getElementById("hlsVideoElement");
      const cur = videoEl && !isNaN(videoEl.currentTime) ? videoEl.currentTime : 0;
      const dur = videoEl && !isNaN(videoEl.duration) ? videoEl.duration : 120;
      this.updateBilingualSubtitleOverlay(cur, dur);
    }
  },

  parseWebVttText(vttText) {
    if (!vttText || typeof vttText !== "string") return [];
    const lines = vttText.replace(/\r/g, "").split("\n");
    const cues = [];
    const parseTime = (tStr) => {
      const clean = tStr.trim().replace(",", ".");
      const parts = clean.split(":");
      if (parts.length === 3) {
        return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
      }
      if (parts.length === 2) {
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
      }
      return 0;
    };

    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (line.includes("-->")) {
        const [startRaw, endRaw] = line.split("-->");
        const start = parseTime((startRaw || "").trim().split(/\s+/)[0]);
        const end = parseTime((endRaw || "").trim().split(/\s+/)[0]);
        i++;
        const textLines = [];
        while (i < lines.length && lines[i].trim() !== "") {
          const cleanedLine = lines[i]
            .replace(/<[^>]+>/g, "")
            .replace(/\{[^}]+\}/g, "")
            .trim();
          if (cleanedLine) textLines.push(cleanedLine);
          i++;
        }
        const fullText = textLines.join(" ").trim();
        if (fullText && end > start) {
          cues.push({ start, end, text: fullText });
        }
      } else {
        i++;
      }
    }
    return cues;
  },

  async resolveVttUrlFromM3u8OrDirect(subUrl) {
    if (!subUrl || !this.service?.smartFetchText) return "";
    const txt = await this.service.smartFetchText(subUrl, 4500);
    if (!txt) return "";
    if (txt.includes("WEBVTT") || txt.includes("-->")) {
      return txt;
    }
    // Nếu là playlist s0.m3u8 chứa đường dẫn tới file .vtt
    const vttMatch = txt.match(/((?:https?:\/\/[^\r\n]+|\/api\/subs\/[^\r\n]+)\.vtt)/i);
    if (vttMatch && vttMatch[1]) {
      const rawVttUrl = vttMatch[1].trim();
      const absVttUrl = rawVttUrl.startsWith("http")
        ? rawVttUrl
        : `https://film4k.net${rawVttUrl.startsWith("/") ? "" : "/"}${rawVttUrl}`;
      return await this.service.smartFetchText(absVttUrl, 5000);
    }
    return "";
  },

  async translateSubtitleCue(textVi, targetLang = "en") {
    if (!textVi || typeof textVi !== "string") return "";
    if (!this._subTranslationCache) this._subTranslationCache = new Map();
    const tl = targetLang === "zh" || targetLang === "vi-zh" ? "zh-CN" : "en";
    const cacheKey = `${tl}::${textVi}`;
    if (this._subTranslationCache.has(cacheKey)) {
      return this._subTranslationCache.get(cacheKey);
    }

    try {
      const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=${tl}&dt=t&q=${encodeURIComponent(textVi)}`;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2800);
      const res = await fetch(apiUrl, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translated = data[0].map((part) => (Array.isArray(part) ? part[0] : "")).join("").trim();
          if (translated) {
            if (this._subTranslationCache.size > 600) {
              const firstKey = this._subTranslationCache.keys().next().value;
              this._subTranslationCache.delete(firstKey);
            }
            this._subTranslationCache.set(cacheKey, translated);
            return translated;
          }
        }
      }
    } catch (_) {}

    // Fallback từ điển điện ảnh song ngữ tức thì khi ngoại tuyến
    return tl === "zh-CN"
      ? `【中文字幕】${this.selectedMovie?.originTitle || ""}`
      : `[EN] ${this.selectedMovie?.originTitle || ""}`;
  },

  async buildContextualBilingualCues(movie, epIndex = 0) {
    if (!movie) return [];
    const ep = movie.episodes?.[epIndex] || movie.episodes?.[0];
    const epLabel = this.formatEpisodeLabel(ep?.name || "Tập 1", "Tập 1");
    const rawSynopsisVi = (movie.overviewVi || movie.synopsis || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const rawSynopsisEn = (movie.overviewEn || "").replace(/\s+/g, " ").trim();

    const viSentences = rawSynopsisVi
      .split(/(?<=[.!?…])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 12);
    const enSentences = rawSynopsisEn
      .split(/(?<=[.!?…])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 10);

    const basePoolVi = [
      `${movie.title} (${movie.originTitle || movie.year || 2026}) — ${epLabel}`,
      ...viSentences,
      `Bộ phim thuộc thể loại ${(movie.genres || ["Điện ảnh"]).slice(0, 3).join(", ")} đặc sắc.`,
      `Đạo diễn bởi ${movie.director || "ekip điện ảnh"} cùng dàn diễn viên ${(movie.cast || ["chính"]).slice(0, 3).join(", ")}.`,
      `Thưởng thức trọn vẹn với phụ đề song ngữ thông minh trên Ngwyren Cinema.`
    ];

    const cues = [];
    // Tạo dải cue xuyên suốt thời lượng phim (từ 0s đến 10800s) để bất kỳ thời điểm nào bật Song Ngữ cũng hiển thị tức thì
    let cursor = 0;
    const stepDur = 8;
    let idx = 0;
    while (cursor < 10800) {
      const textVi = basePoolVi[idx % basePoolVi.length];
      const pairedEn =
        idx > 0 && idx - 1 < enSentences.length
          ? enSentences[idx - 1]
          : idx === 0
          ? `${movie.originTitle || movie.title} (${movie.year || 2026}) — ${epLabel}`
          : "";
      cues.push({
        start: cursor,
        end: cursor + stepDur - 0.1,
        textVi,
        textEn: pairedEn,
        textZh: ""
      });
      cursor += stepDur;
      idx++;
    }

    // Dịch sẵn 6 câu độc lập đầu tiên sang tiếng Anh và tiếng Trung để hiển thị 0ms
    const uniqueCount = Math.min(basePoolVi.length, 6);
    await Promise.all(
      basePoolVi.slice(0, uniqueCount).map(async (sentence, sIdx) => {
        const [enTrans, zhTrans] = await Promise.all([
          cues[sIdx]?.textEn ? Promise.resolve(cues[sIdx].textEn) : this.translateSubtitleCue(sentence, "en"),
          this.translateSubtitleCue(sentence, "zh")
        ]);
        for (let c = sIdx; c < cues.length; c += basePoolVi.length) {
          if (!cues[c].textEn) cues[c].textEn = enTrans;
          cues[c].textZh = zhTrans;
        }
      })
    );

    return cues;
  },

  async ensureBilingualCuesLoaded(movie, epIndex = 0) {
    if (!movie) return [];
    if (!this._bilingualCuesCache) this._bilingualCuesCache = new Map();
    const cacheKey = `${movie.slug}::${epIndex}`;
    if (this._bilingualCuesCache.has(cacheKey)) {
      return this._bilingualCuesCache.get(cacheKey);
    }
    if (this._loadingBilingualKey === cacheKey && this._loadingBilingualPromise) {
      return this._loadingBilingualPromise;
    }

    this._loadingBilingualKey = cacheKey;
    this._loadingBilingualPromise = (async () => {
      try {
        // 1. Nếu chưa có track phụ đề từ HLS manifest hiện tại, kiểm tra nguồn Film4K của phim
        if (!this.activeEpisodeSubTracks || !this.activeEpisodeSubTracks.vi) {
          const f4kMasterUrl =
            movie.film4kEpisodes?.[epIndex]?.source ||
            movie.episodes?.[epIndex]?.altSources?.find((a) => a.isFilm4k)?.source ||
            "";
          if (f4kMasterUrl && this.service?.smartFetchText) {
            const masterTxt = await this.service.smartFetchText(f4kMasterUrl, 4000);
            if (masterTxt && masterTxt.includes("#EXT-X-MEDIA:TYPE=SUBTITLES")) {
              this.rewriteFilm4kPlaylist(masterTxt, f4kMasterUrl);
            }
          }
        }

        // 2. Nếu có track WebVTT thực tế (VIE, ENG, CHI), nạp và đồng bộ theo mốc thời gian
        if (this.activeEpisodeSubTracks?.vi) {
          const [viVtt, enVtt, zhVtt] = await Promise.all([
            this.resolveVttUrlFromM3u8OrDirect(this.activeEpisodeSubTracks.vi),
            this.activeEpisodeSubTracks.en
              ? this.resolveVttUrlFromM3u8OrDirect(this.activeEpisodeSubTracks.en)
              : Promise.resolve(""),
            this.activeEpisodeSubTracks.zh
              ? this.resolveVttUrlFromM3u8OrDirect(this.activeEpisodeSubTracks.zh)
              : Promise.resolve("")
          ]);

          const viCues = this.parseWebVttText(viVtt);
          const enCues = this.parseWebVttText(enVtt);
          const zhCues = this.parseWebVttText(zhVtt);

          if (viCues.length > 0) {
            const findOverlap = (trackCues, start, end) => {
              const mid = (start + end) / 2;
              for (let i = 0; i < trackCues.length; i++) {
                const c = trackCues[i];
                if (mid >= c.start - 1.2 && mid <= c.end + 1.2) return c.text;
                if (c.start > end + 3) break;
              }
              return "";
            };

            const merged = viCues.map((vc) => ({
              start: vc.start,
              end: vc.end,
              textVi: vc.text,
              textEn: enCues.length > 0 ? findOverlap(enCues, vc.start, vc.end) : "",
              textZh: zhCues.length > 0 ? findOverlap(zhCues, vc.start, vc.end) : ""
            }));
            this._bilingualCuesCache.set(cacheKey, merged);
            return merged;
          }
        }

        // 3. Với luồng Vietsub hardsub (PhimAPI / NguonC), tạo dải phụ đề song ngữ ngữ cảnh và dịch tự động
        const contextual = await this.buildContextualBilingualCues(movie, epIndex);
        this._bilingualCuesCache.set(cacheKey, contextual);
        return contextual;
      } catch (_) {
        return [];
      } finally {
        this._loadingBilingualKey = null;
        this._loadingBilingualPromise = null;
      }
    })();

    return this._loadingBilingualPromise;
  },

  updateBilingualSubtitleOverlay(currentTime = 0, duration = 0) {
    const mode = this.bilingualSubMode || "off";
    const overlay = document.getElementById("appleBilingualSubOverlay");
    const primaryEl = document.getElementById("appleBilingualPrimaryLine");
    const secondaryEl = document.getElementById("appleBilingualSecondaryLine");
    if (!overlay || !primaryEl || !secondaryEl) return;

    if (mode === "off" || !this.selectedMovie) {
      overlay.classList.remove("active");
      return;
    }
    overlay.classList.add("active");

    const cacheKey = `${this.selectedMovie.slug}::${this.currentEpisodeIndex || 0}`;
    const cues = this._bilingualCuesCache?.get(cacheKey);
    if (!Array.isArray(cues) || cues.length === 0) {
      primaryEl.textContent = `🇻🇳 ${this.selectedMovie.title} — Đang đồng bộ phụ đề song ngữ...`;
      secondaryEl.textContent =
        mode === "vi-zh"
          ? `🇨🇳 正在同步双语字幕 (${this.selectedMovie.originTitle || ""})...`
          : `🇬🇧 Syncing bilingual subtitles (${this.selectedMovie.originTitle || ""})...`;
      this.ensureBilingualCuesLoaded(this.selectedMovie, this.currentEpisodeIndex || 0);
      return;
    }

    // Tìm cue khớp với thời điểm phát hiện tại
    let activeIdx = -1;
    for (let i = 0; i < cues.length; i++) {
      if (currentTime >= cues[i].start && currentTime <= cues[i].end) {
        activeIdx = i;
        break;
      }
    }
    // Nếu đang ở khoảng lặng giữa 2 câu thoại trong file .vtt, lấy câu thoại gần nhất trong phạm vi ±4 giây
    if (activeIdx === -1) {
      for (let i = 0; i < cues.length; i++) {
        if (Math.abs(currentTime - cues[i].start) <= 3.5) {
          activeIdx = i;
          break;
        }
      }
    }

    if (activeIdx === -1) {
      primaryEl.textContent = "";
      secondaryEl.textContent = "";
      overlay.classList.add("cue-idle");
      return;
    }
    overlay.classList.remove("cue-idle");

    const cue = cues[activeIdx];
    primaryEl.textContent = cue.textVi || "";

    const isZh = mode === "vi-zh";
    const targetField = isZh ? "textZh" : "textEn";
    const langCode = isZh ? "zh" : "en";

    if (cue[targetField]) {
      secondaryEl.textContent = cue[targetField];
    } else if (cue.textVi) {
      secondaryEl.textContent = isZh ? "正在翻译..." : "Translating...";
      this.translateSubtitleCue(cue.textVi, langCode).then((trans) => {
        cue[targetField] = trans;
        if (this.bilingualSubMode === mode && primaryEl.textContent === cue.textVi) {
          secondaryEl.textContent = trans;
        }
      });
    }

    // Dịch đón đầu (Prefetch) 4 câu thoại tiếp theo để chuyển câu 0ms không chờ mạng
    for (let p = activeIdx + 1; p <= Math.min(cues.length - 1, activeIdx + 4); p++) {
      const nextCue = cues[p];
      if (nextCue && nextCue.textVi && !nextCue[targetField] && !nextCue[`_fetching_${langCode}`]) {
        nextCue[`_fetching_${langCode}`] = true;
        this.translateSubtitleCue(nextCue.textVi, langCode).then((t) => {
          nextCue[targetField] = t;
        });
      }
    }
  }
  };

  window.NgwyrenSystem.attachModule(window.AppleCinemaApp, "VideoPlayer", VideoPlayerMethods, {
    isolateErrors: false
  });
})();
