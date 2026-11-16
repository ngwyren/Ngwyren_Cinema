/**
 * @fileoverview SearchFilter Domain Module for Ngwyren Cinema
 * Isolated feature module registered safely onto AppleCinemaApp via NgwyrenSystem.
 */
(() => {
  "use strict";
  if (!window.AppleCinemaApp || !window.NgwyrenSystem) {
    console.error("[NgwyrenSystem] Missing core dependency while loading SearchFilter");
    return;
  }

  const SearchFilterMethods = {
  handleSearchInput(rawValue) {
    this.ensureFullCatalogLoaded();
    const query = (rawValue || "").trim();
    const clearBtn = document.getElementById("searchClearBtn");
    const dropdown = document.getElementById("searchDropdown");

    if (clearBtn) clearBtn.classList.toggle("visible", query.length > 0);

    if (this._localSearchDebounce) {
      clearTimeout(this._localSearchDebounce);
      this._localSearchDebounce = null;
    }
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
      this.searchDebounce = null;
    }

    if (!query) {
      this._searchSubmitted = false;
      if (dropdown) {
        dropdown.classList.remove("open");
        dropdown.innerHTML = "";
      }
      return;
    }

    // Reset cờ submitted để cho phép gợi ý lại khi người dùng gõ từ khóa mới
    this._searchSubmitted = false;

    // 1. TÌM KIẾM TỨC THÌ VỚI CHỈ MỤC ĐÃ ĐƯỢC TIỀN TÍNH TOÁN (Micro-debounce 25ms chống nghẽn phím khi gõ nhanh)
    this._localSearchDebounce = setTimeout(() => {
      if (this._searchSubmitted) return;
      this._executeLocalSearch(query, dropdown);
    }, 25);
  },

  _executeLocalSearch(query, dropdown) {
    const q = query.toLowerCase();
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
    const rawMatches = scored.map((it) => it.movie);
    const quickMatches = (typeof this.dedupeMovieList === "function"
      ? this.dedupeMovieList(rawMatches)
      : rawMatches).slice(0, 8);

    // Hiển thị kết quả khớp ngay lập tức nếu chưa submit
    if (!this._searchSubmitted) {
      this.renderSearchDropdown(query, quickMatches, false);
    }

    // 2. TÌM NÂNG CAO TRỰC TUYẾN PHIMAPI (Debounce 120ms để mở rộng kết quả)
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
      this.searchDebounce = null;
    }
    this.searchDebounce = setTimeout(async () => {
      if (this._searchSubmitted) return;
      try {
        const fullMatches = await this.service.searchMovies(query);
        if (this._searchSubmitted) return;
        const dedupedFull = typeof this.dedupeMovieList === "function"
          ? this.dedupeMovieList(fullMatches)
          : fullMatches;
        const currentInput = (document.getElementById("topSearchInput")?.value || "").trim();
        if (!this._searchSubmitted && currentInput === query) {
          this.lastSearchQuery = query;
          this.lastSearchResults = dedupedFull;
          this.renderSearchDropdown(query, dedupedFull.slice(0, 8), true);
        }
      } catch (e) {
        console.warn("[SearchFilter] live search error:", e);
      }
    }, 120);
  },

  renderSearchDropdown(query, results, isLiveDone) {
    const dropdown = document.getElementById("searchDropdown");
    if (!dropdown) return;

    // Ngăn chặn tuyệt đối dropdown mở đè lên kết quả tìm kiếm toàn trang khi đã submit
    if (this._searchSubmitted) {
      dropdown.classList.remove("open");
      dropdown.innerHTML = "";
      return;
    }

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
            </button>
            <div style="text-align: center; margin-top: 6px; font-size: 0.78rem; color: rgba(255,255,255,0.6); cursor: pointer;" onclick="app.showFullSearchResults('${query.replace(/'/g, "\\'")}')">
              <i class="fas fa-wand-magic-sparkles" style="color: #34c759; margin-right: 4px;"></i> Chưa có phần phim bạn tìm? Bấm để nạp ngay
            </div>`
          : `<div style="padding: 14px 12px; text-align: center; color: var(--text-secondary); font-size: 0.85rem;">
              <div style="font-weight: 600; color: #fff; margin-bottom: 8px;">Không tìm thấy "${query}"</div>
              <button class="btn-sync-now" style="width: 100%; padding: 8px 12px; font-size: 0.82rem; font-weight: 600;" onclick="app.showFullSearchResults('${query.replace(/'/g, "\\'")}')">
                <i class="fas fa-bolt" style="margin-right: 5px;"></i> Yêu Cầu & Nạp Phim
              </button>
            </div>`
      }
    `;
    dropdown.classList.add("open");
  },

  selectSearchResult(slug) {
    this._searchSubmitted = true;
    if (this._localSearchDebounce) {
      clearTimeout(this._localSearchDebounce);
      this._localSearchDebounce = null;
    }
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
      this.searchDebounce = null;
    }
    const dropdown = document.getElementById("searchDropdown");
    if (dropdown) {
      dropdown.classList.remove("open");
      dropdown.innerHTML = "";
    }
    document.getElementById("topSearchInput")?.blur();
    document.getElementById("sidebarSearchInput")?.blur();
    this.openMovieModal(slug, false);
  },

  focusSearch() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const topInput = document.getElementById("topSearchInput");
    if (topInput) {
      topInput.focus();
      topInput.select();
      const val = (topInput.value || "").trim();
      if (val) {
        this.handleSearchInput(val);
      }
    }
  },

  async showFullSearchResults(query) {
    this.ensureFullCatalogLoaded();
    this._searchSubmitted = true;
    this.currentNav = "search-results";
    if (this._localSearchDebounce) {
      clearTimeout(this._localSearchDebounce);
      this._localSearchDebounce = null;
    }
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
      this.searchDebounce = null;
    }
    const dropdown = document.getElementById("searchDropdown");
    if (dropdown) {
      dropdown.classList.remove("open");
      dropdown.innerHTML = "";
    }
    // Thu gọn bàn phím và nhả focus trên cả thiết bị di động & máy tính
    document.getElementById("topSearchInput")?.blur();
    document.getElementById("sidebarSearchInput")?.blur();

    const cleanQ = (query || "").trim();
    this.lastSearchQuery = cleanQ;

    // 1. Phản hồi tức thì 0ms: lấy kết quả có sẵn trong kho local hiển thị ngay, không bắt người dùng chờ
    const immediateMatches = typeof this.service.searchLocalOnly === "function"
      ? this.service.searchLocalOnly(cleanQ)
      : (this.lastSearchResults || []);
    this.lastSearchResults = immediateMatches;

    this.transitionView(() => {
      this.renderMainView();
      const dd = document.getElementById("searchDropdown");
      if (dd) {
        dd.classList.remove("open");
        dd.innerHTML = "";
      }
    });

    // 2. Chạy tìm kiếm mở rộng trực tuyến trên nền và cập nhật kết quả tự động
    try {
      const fullMatches = await this.service.searchMovies(cleanQ);
      if (this.currentNav === "search-results" && this.lastSearchQuery === cleanQ) {
        this.lastSearchResults = fullMatches;
        this.renderMainView();
        const dd = document.getElementById("searchDropdown");
        if (dd) {
          dd.classList.remove("open");
          dd.innerHTML = "";
        }
      }
    } catch (err) {
      console.warn("[SearchFilter] Online search background sync error:", err);
    }
  },

  clearSearch() {
    this._searchSubmitted = false;
    if (this._localSearchDebounce) {
      clearTimeout(this._localSearchDebounce);
      this._localSearchDebounce = null;
    }
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
      this.searchDebounce = null;
    }
    const input = document.getElementById("topSearchInput");
    const sideInput = document.getElementById("sidebarSearchInput");
    if (input) input.value = "";
    if (sideInput) sideInput.value = "";
    document.getElementById("searchClearBtn")?.classList.remove("visible");
    const dropdown = document.getElementById("searchDropdown");
    if (dropdown) {
      dropdown.classList.remove("open");
      dropdown.innerHTML = "";
    }
    if (this.currentNav === "search-results") {
      this.resetAllFilters();
    }
  },

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
  },

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
  },

  filterByPerson(personName) {
    if (!personName || personName === "Đang cập nhật" || personName.includes("Dàn diễn viên")) {
      this.showToast("ℹ️ Thông tin nhân sự đang được cập nhật", "info");
      return;
    }
    this.closeMovieModal();
    this.customFilterValue = personName;
    this.currentNav = "person-filter";
    this.syncLeftDockIndicator("kham-pha");
    this.transitionView(() => {
      this.renderMainView();
    });
  },

  getActiveFiltersCount() {
    let count = 0;
    if (this.filters.type !== "all") count++;
    if (this.filters.genre !== "all") count++;
    if (this.filters.country !== "all") count++;
    if (this.filters.year !== "all") count++;
    if (this.filters.sort !== "latest") count++;
    return count;
  },

  updateFilterButtonBadge() {
    const badge = document.getElementById("visionFilterBadge");
    const btn = document.getElementById("visionFilterBtn");
    const count = this.getActiveFiltersCount();
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = "inline-flex";
      } else {
        badge.style.display = "none";
      }
    }
    if (btn) {
      btn.classList.toggle("active", count > 0);
    }
  },

  toggleFilterPanel(e) {
    if (e) e.stopPropagation();
    const flyout = document.getElementById("visionFilterFlyout");
    if (!flyout) return;
    if (flyout.style.display === "none" || !flyout.style.display) {
      this.openFilterPanel();
    } else {
      this.closeFilterPanel();
    }
  },

  openFilterPanel() {
    const flyout = document.getElementById("visionFilterFlyout");
    const backdrop = document.getElementById("visionFilterBackdrop");
    if (!flyout) return;

    this.closeNotificationCenter?.();
    flyout.innerHTML = this.renderFilterFlyoutHTML();
    flyout.style.display = "flex";
    this.positionFilterFlyout();
    if (backdrop) {
      backdrop.style.display = "block";
      requestAnimationFrame(() => backdrop.classList.add("open"));
    }
  },

  closeFilterPanel() {
    const flyout = document.getElementById("visionFilterFlyout");
    const backdrop = document.getElementById("visionFilterBackdrop");
    if (flyout) flyout.style.display = "none";
    if (backdrop) {
      backdrop.classList.remove("open");
      backdrop.style.display = "none";
    }
  },

  setFilterOption(group, val) {
    this.filters[group] = val;
    this.updateFilterButtonBadge();
    const flyout = document.getElementById("visionFilterFlyout");
    if (flyout && flyout.style.display !== "none") {
      flyout.innerHTML = this.renderFilterFlyoutHTML();
    }
  },

  resetFilters() {
    this.filters = { type: "all", genre: "all", country: "all", year: "all", sort: "latest" };
    this.updateFilterButtonBadge();
    const flyout = document.getElementById("visionFilterFlyout");
    if (flyout && flyout.style.display !== "none") {
      flyout.innerHTML = this.renderFilterFlyoutHTML();
    }
    if (this.currentNav === "filter-results") {
      this.setNavigation("kham-pha");
    } else {
      this.renderMainView();
    }
  },

  removeFilterOption(group) {
    if (group === "sort") {
      this.filters.sort = "latest";
    } else {
      this.filters[group] = "all";
    }
    this.updateFilterButtonBadge();
    if (this.getActiveFiltersCount() === 0 && this.currentNav === "filter-results") {
      this.setNavigation("kham-pha");
    } else {
      this.renderMainView();
    }
  },

  applyFilterPanel() {
    this.closeFilterPanel();
    this.updateFilterButtonBadge();
    this.visibleGridLimit = 100;
    this.currentNav = "filter-results";
    this.renderMainView();
    window.scrollTo({ top: 0, behavior: "smooth" });
    const count = this.applyMovieFilters(this.service.movies).length;
    this.showToast(`🔍 Đã tìm thấy ${count} phim phù hợp với bộ lọc!`);
  },

  applyMovieFilters(list) {
    let result = [...list];
    const { type, genre, country, year, sort } = this.filters;

    if (type !== "all") {
      if (type === "chieu-rap") {
        result = result.filter(m => (m.sectionTags && m.sectionTags.includes("chieu-rap")) || (m.genres && m.genres.some(g => (g || "").toLowerCase().includes("chiếu rạp"))));
      } else if (type === "single") {
        result = result.filter(m => m.type === "single");
      } else if (type === "series") {
        result = result.filter(m => m.type === "series");
      } else if (type === "anime") {
        result = result.filter(m => (m.sectionTags && m.sectionTags.includes("anime")) || (m.genres && m.genres.some(g => /anime|hoạt hình/i.test(g || ""))));
      } else if (type === "vietsub") {
        result = result.filter(m => (m.sectionTags && m.sectionTags.includes("vietsub")) || /vietsub/i.test(m.language || ""));
      }
    }

    if (genre !== "all") {
      const gNorm = (genre || "").toLowerCase();
      result = result.filter(m => Array.isArray(m.genres) && m.genres.some(g => (g || "").toLowerCase().includes(gNorm)));
    }

    if (country !== "all") {
      if (country === "viet-nam") {
        result = result.filter(m => m.countrySlug === "viet-nam" || /việt\s*nam/i.test(m.country || "") || (m.sectionTags && m.sectionTags.includes("vietnam")));
      } else if (country === "han-quoc") {
        result = result.filter(m => m.countrySlug === "han-quoc" || /hàn\s*quốc/i.test(m.country || ""));
      } else if (country === "au-my") {
        result = result.filter(m => m.countrySlug === "au-my" || /âu\s*mỹ/i.test(m.country || "") || /mỹ/i.test(m.country || ""));
      } else if (country === "trung-quoc") {
        result = result.filter(m => m.countrySlug === "trung-quoc" || /trung\s*quốc/i.test(m.country || ""));
      } else if (country === "nhat-ban") {
        result = result.filter(m => m.countrySlug === "nhat-ban" || /nhật\s*bản/i.test(m.country || ""));
      } else if (country === "thai-lan") {
        result = result.filter(m => m.countrySlug === "thai-lan" || /thái\s*lan/i.test(m.country || ""));
      } else if (country === "an-do") {
        result = result.filter(m => m.countrySlug === "an-do" || /ấn\s*độ/i.test(m.country || ""));
      }
    }

    if (year !== "all") {
      if (year === "2010s") {
        result = result.filter(m => m.year >= 2010 && m.year <= 2019);
      } else if (year === "classic") {
        result = result.filter(m => m.year < 2010);
      } else {
        const yNum = parseInt(year, 10);
        if (!isNaN(yNum)) {
          result = result.filter(m => m.year === yNum);
        }
      }
    }

    if (sort === "rating") {
      result.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    } else if (sort === "matches") {
      result.sort((a, b) => (Number(b.matchScore) || 0) - (Number(a.matchScore) || 0));
    } else if (sort === "year-desc") {
      result.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    }

    return result;
  },

  renderFilterFlyoutHTML() {
    const matchedCount = this.applyMovieFilters(this.service.movies).length;
    const { type, genre, country, year, sort } = this.filters;

    const typeList = [
      { id: "all", label: "Tất Cả" },
      { id: "chieu-rap", label: "🎟️ Chiếu Rạp" },
      { id: "single", label: "🎬 Phim Lẻ" },
      { id: "series", label: "📺 Phim Bộ" },
      { id: "anime", label: "⚡ Anime / Hoạt Hình" },
      { id: "vietsub", label: "🔥 Vietsub Hot" }
    ];

    const countryList = [
      { id: "all", label: "Tất Cả" },
      { id: "viet-nam", label: "🇻🇳 Việt Nam" },
      { id: "au-my", label: "🇺🇸 Âu Mỹ" },
      { id: "han-quoc", label: "🇰🇷 Hàn Quốc" },
      { id: "trung-quoc", label: "🇨🇳 Trung Quốc" },
      { id: "nhat-ban", label: "🇯🇵 Nhật Bản" },
      { id: "thai-lan", label: "🇹🇭 Thái Lan" },
      { id: "an-do", label: "🇮🇳 Ấn Độ" }
    ];

    const genreList = [
      "all", "Hành Động", "Hài Hước", "Tình Cảm", "Kinh Dị", "Viễn Tưởng", "Tâm Lý", "Cổ Trang", "Võ Thuật", "Bí Ẩn", "Phiêu Lưu", "Chiếu Rạp"
    ];

    const yearList = [
      { id: "all", label: "Tất Cả" },
      { id: "2026", label: "2026" },
      { id: "2025", label: "2025" },
      { id: "2024", label: "2024" },
      { id: "2023", label: "2023" },
      { id: "2022", label: "2022" },
      { id: "2021", label: "2021" },
      { id: "2010s", label: "2010 - 2019" },
      { id: "classic", label: "Kinh Điển (< 2010)" }
    ];

    const sortList = [
      { id: "latest", label: "Mới Nhất" },
      { id: "rating", label: "⭐ Điểm Cao Nhất" },
      { id: "matches", label: "🎯 Phù Hợp Nhất" },
      { id: "year-desc", label: "📅 Năm Giảm Dần" }
    ];

    return `
      <div class="vision-filter-header">
        <div class="vision-filter-header-left">
          <i class="fas fa-sliders" style="color: #60a5fa; font-size: 1.15rem;"></i>
          <div>
            <h3 class="vision-filter-title">Bộ Lọc Phim Chuyên Sâu</h3>
            <p class="vision-filter-sub">Lọc theo định dạng, thể loại, quốc gia & năm phát hành</p>
          </div>
        </div>
        <div class="vision-filter-header-actions">
          <button class="vision-filter-reset-link" onclick="app.resetFilters()" title="Đặt lại tất cả bộ lọc">
            <i class="fas fa-rotate-left"></i> Đặt Lại
          </button>
          <button class="vision-filter-close-btn" onclick="app.closeFilterPanel()" title="Đóng">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div class="vision-filter-body">
        <!-- Định Dạng -->
        <div class="vision-filter-group">
          <div class="vision-filter-group-label">Định Dạng Phim</div>
          <div class="vision-filter-pills">
            ${typeList.map(t => `<button class="filter-pill ${type === t.id ? 'active' : ''}" onclick="app.setFilterOption('type', '${t.id}')">${t.label}</button>`).join("")}
          </div>
        </div>

        <!-- Quốc Gia -->
        <div class="vision-filter-group">
          <div class="vision-filter-group-label">Quốc Gia Sản Xuất</div>
          <div class="vision-filter-pills">
            ${countryList.map(c => `<button class="filter-pill ${country === c.id ? 'active' : ''}" onclick="app.setFilterOption('country', '${c.id}')">${c.label}</button>`).join("")}
          </div>
        </div>

        <!-- Thể Loại -->
        <div class="vision-filter-group">
          <div class="vision-filter-group-label">Thể Loại Phim</div>
          <div class="vision-filter-pills">
            ${genreList.map(g => `<button class="filter-pill ${genre.toLowerCase() === g.toLowerCase() ? 'active' : ''}" onclick="app.setFilterOption('genre', '${g}')">${g === 'all' ? 'Tất Cả' : g}</button>`).join("")}
          </div>
        </div>

        <!-- Năm Phát Hành -->
        <div class="vision-filter-group">
          <div class="vision-filter-group-label">Năm Phát Hành</div>
          <div class="vision-filter-pills">
            ${yearList.map(y => `<button class="filter-pill ${year === y.id ? 'active' : ''}" onclick="app.setFilterOption('year', '${y.id}')">${y.label}</button>`).join("")}
          </div>
        </div>

        <!-- Sắp Xếp -->
        <div class="vision-filter-group">
          <div class="vision-filter-group-label">Sắp Xếp Theo</div>
          <div class="vision-filter-pills">
            ${sortList.map(s => `<button class="filter-pill ${sort === s.id ? 'active' : ''}" onclick="app.setFilterOption('sort', '${s.id}')">${s.label}</button>`).join("")}
          </div>
        </div>
      </div>

      <div class="vision-filter-footer">
        <div class="vision-filter-matched-count">
          Tìm thấy <strong style="color: #60a5fa;" id="filterLiveCount">${matchedCount}</strong> phim phù hợp
        </div>
        <div class="vision-filter-footer-btns">
          <button class="vision-btn-outline" onclick="app.closeFilterPanel()">Đóng</button>
          <button class="explore-load-all-btn" onclick="app.applyFilterPanel()">
            <i class="fas fa-check"></i> Xem Kết Quả (${matchedCount})
          </button>
        </div>
      </div>
    `;
  },

  renderActiveFilterChipsHTML() {
    const chips = [];
    const { type, genre, country, year, sort } = this.filters;

    const typeNames = {
      "chieu-rap": "🎟️ Chiếu Rạp",
      "single": "🎬 Phim Lẻ",
      "series": "📺 Phim Bộ",
      "anime": "⚡ Anime / Hoạt Hình",
      "vietsub": "🔥 Vietsub Hot"
    };

    const countryNames = {
      "viet-nam": "🇻🇳 Việt Nam",
      "au-my": "🇺🇸 Âu Mỹ",
      "han-quoc": "🇰🇷 Hàn Quốc",
      "trung-quoc": "🇨🇳 Trung Quốc",
      "nhat-ban": "🇯🇵 Nhật Bản",
      "thai-lan": "🇹🇭 Thái Lan",
      "an-do": "🇮🇳 Ấn Độ"
    };

    const sortNames = {
      "rating": "⭐ Điểm Cao Nhất",
      "matches": "🎯 Phù Hợp Nhất",
      "year-desc": "📅 Năm Giảm Dần"
    };

    if (type !== "all" && typeNames[type]) {
      chips.push(`<button class="active-filter-chip" onclick="app.removeFilterOption('type')">${typeNames[type]} <i class="fas fa-times"></i></button>`);
    }
    if (country !== "all" && countryNames[country]) {
      chips.push(`<button class="active-filter-chip" onclick="app.removeFilterOption('country')">${countryNames[country]} <i class="fas fa-times"></i></button>`);
    }
    if (genre !== "all") {
      chips.push(`<button class="active-filter-chip" onclick="app.removeFilterOption('genre')">Thể Loại: ${genre} <i class="fas fa-times"></i></button>`);
    }
    if (year !== "all") {
      const yLabel = year === "2010s" ? "2010-2019" : (year === "classic" ? "Kinh Điển (<2010)" : year);
      chips.push(`<button class="active-filter-chip" onclick="app.removeFilterOption('year')">Năm: ${yLabel} <i class="fas fa-times"></i></button>`);
    }
    if (sort !== "latest" && sortNames[sort]) {
      chips.push(`<button class="active-filter-chip" onclick="app.removeFilterOption('sort')">${sortNames[sort]} <i class="fas fa-times"></i></button>`);
    }

    if (chips.length === 0) return "";

    return `
      <div class="active-filter-chips-bar">
        <span class="active-filter-label"><i class="fas fa-sliders"></i> Bộ Lọc:</span>
        ${chips.join("")}
        <button class="active-filter-chip clear-all" onclick="app.resetFilters()">
          <i class="fas fa-rotate-left"></i> Xóa Tất Cả Lọc
        </button>
      </div>
    `;
  },

  positionFilterFlyout() {
    const flyout = document.getElementById("visionFilterFlyout");
    const btn = document.getElementById("visionFilterBtn");
    if (!flyout || !btn || flyout.style.display === "none") return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = btn.getBoundingClientRect();

    if (vw <= 767) {
      const top = Math.min(rect.bottom + 8, vh * 0.25);
      flyout.style.left = "10px";
      flyout.style.right = "10px";
      flyout.style.width = "auto";
      flyout.style.top = `${Math.max(64, Math.round(top))}px`;
      flyout.style.maxHeight = `${Math.max(260, Math.round(vh - top - 96))}px`;
      return;
    }

    const panelW = Math.min(480, vw - 32);
    const left = Math.max(16, Math.min(rect.left, vw - panelW - 16));
    const top = Math.round(rect.bottom + 10);
    flyout.style.right = "auto";
    flyout.style.width = `${panelW}px`;
    flyout.style.left = `${Math.round(left)}px`;
    flyout.style.top = `${top}px`;
    flyout.style.maxHeight = `${Math.max(320, Math.round(vh - top - 28))}px`;
  },

  handleMovieRequestImageSelect(input) {
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    const nameEl = document.getElementById("reqMovieImageFileName");
    const previewWrap = document.getElementById("reqMovieImagePreviewWrap");
    const previewImg = document.getElementById("reqMovieImagePreview");
    const imageBtn = document.getElementById("reqMovieImageBtn");

    if (nameEl) nameEl.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      this._tempReqImageBase64 = e.target.result;
      if (previewImg) previewImg.src = e.target.result;
      if (previewWrap) previewWrap.style.display = "block";
      if (imageBtn) imageBtn.classList.add("has-image");
    };
    reader.readAsDataURL(file);
  },

  async submitMovieRequest() {
    const titleInput = document.getElementById("reqMovieTitleInput");
    const emailInput = document.getElementById("reqMovieEmailInput");
    const noteInput = document.getElementById("reqMovieNoteInput");
    const statusEl = document.getElementById("reqMovieStatus");
    const submitBtn = document.getElementById("reqMovieSubmitBtn");

    const movieTitle = (titleInput?.value || this.lastSearchQuery || "").trim();
    const movieEmail = (emailInput?.value || "").trim();
    const movieNote = (noteInput?.value || "").trim();
    const movieImage = this._tempReqImageBase64 || "";

    if (movieEmail) {
      try {
        localStorage.setItem("ngwyren_user_email", movieEmail);
      } catch (_) {}
    }

    // Xin quyền web notification nếu chưa cấp để có thể nhận thông báo đẩy
    if ("Notification" in window && Notification.permission === "default") {
      try {
        Notification.requestPermission();
      } catch (_) {}
    }

    if (!movieTitle) {
      if (statusEl) {
        statusEl.style.display = "block";
        statusEl.style.background = "linear-gradient(135deg, rgba(255, 69, 58, 0.18), rgba(255, 59, 48, 0.1))";
        statusEl.style.border = "1px solid rgba(255, 69, 58, 0.4)";
        statusEl.style.color = "#ff453a";
        statusEl.innerHTML = '<i class="fas fa-circle-exclamation" style="margin-right: 6px;"></i> Vui lòng nhập tên phim bạn muốn yêu cầu!';
      }
      return;
    }

    if (statusEl) {
      statusEl.style.display = "block";
      statusEl.style.background = "linear-gradient(135deg, rgba(10, 132, 255, 0.18), rgba(0, 240, 255, 0.1))";
      statusEl.style.border = "1px solid rgba(10, 132, 255, 0.35)";
      statusEl.style.color = "#5ac8fa";
      statusEl.innerHTML = `<i class="fas fa-circle-notch fa-spin" style="margin-right: 6px;"></i> Đang tự động quét PhimAPI, NguonC, Film4K và kho dữ liệu để nạp phim <b>"${movieTitle}"</b>...`;
    }
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.7";
    }

    try {
      // 1. Thử tự động nạp phim trực tuyến ngay lập tức qua searchAndIngestMovie
      const ingested = await this.service.searchAndIngestMovie(movieTitle);
      if (ingested && ingested.slug) {
        // Lưu lịch sử yêu cầu
        this._saveMovieRequestRecord({
          id: Date.now(),
          title: movieTitle,
          email: movieEmail,
          note: movieNote,
          image: movieImage,
          status: "auto_ingested",
          foundSlug: ingested.slug,
          timestamp: new Date().toISOString()
        });

        // Bắn thông báo qua chuông, web push notification, toast và gửi email
        if (typeof this.dispatchMovieIngestedAlert === "function") {
          this.dispatchMovieIngestedAlert({
            movie: ingested,
            targetEmail: movieEmail,
            note: movieNote,
            isImmediate: true
          });
        }

        if (statusEl) {
          statusEl.style.background = "linear-gradient(135deg, rgba(52, 199, 89, 0.2), rgba(48, 209, 88, 0.12))";
          statusEl.style.border = "1px solid rgba(52, 199, 89, 0.4)";
          statusEl.style.color = "#34c759";
          statusEl.innerHTML = `<div style="display: flex; gap: 8px; align-items: flex-start;"><i class="fas fa-circle-check" style="font-size: 1.1rem; color: #34c759; margin-top: 2px;"></i><div><b>Nạp phim thành công!</b> Đã tìm thấy và tích hợp phim <b>"${ingested.title}"</b> vào rạp.${movieEmail ? `<br><span style="font-size: 0.78rem; color: #a1e3a1;"><i class="fas fa-envelope"></i> Đã gửi email thông báo tới <b>${movieEmail}</b></span>` : ""}<br><span style="font-size: 0.78rem; color: rgba(255,255,255,0.7);">Đang mở phim để bạn thưởng thức ngay...</span></div></div>`;
        }

        setTimeout(() => {
          this.openMovieModal(ingested.slug, true);
        }, 700);
        return;
      }

      // 2. Nếu các API đối tác chưa có sẵn luồng ngay, lưu vào hàng đợi để background watcher tự động quét nền định kỳ
      const pendingRecord = {
        id: Date.now(),
        title: movieTitle,
        email: movieEmail,
        note: movieNote,
        image: movieImage,
        status: "pending_auto",
        timestamp: new Date().toISOString()
      };
      this._saveMovieRequestRecord(pendingRecord);
      this._savePendingAutoIngest(pendingRecord);

      if (statusEl) {
        statusEl.style.background = "linear-gradient(135deg, rgba(52, 199, 89, 0.16), rgba(10, 132, 255, 0.14))";
        statusEl.style.border = "1px solid rgba(52, 199, 89, 0.35)";
        statusEl.style.color = "#ffffff";
        statusEl.innerHTML = `<div style="display: flex; gap: 8px; align-items: flex-start;"><i class="fas fa-circle-check" style="font-size: 1.1rem; color: #34c759; margin-top: 2px;"></i><div><b style="color: #34c759;">Đã kích hoạt chế độ tự động nạp phim!</b><br>Hệ thống đã ghi nhận <b>"${movieTitle}"</b> và bắt đầu quét nền liên tục qua các máy chủ đối tác.<br><span style="font-size: 0.78rem; color: rgba(255,255,255,0.75);">Ngay khi có luồng phát, phim sẽ được nạp tự động vào rạp và gửi thông báo ${movieEmail ? `tới email <b>${movieEmail}</b>` : "trên chuông thông báo"} cho bạn ngay.</span></div></div>`;
      }
    } catch (err) {
      console.error("[MovieRequest] Error:", err);
      if (statusEl) {
        statusEl.style.background = "linear-gradient(135deg, rgba(255, 69, 58, 0.18), rgba(255, 59, 48, 0.1))";
        statusEl.style.border = "1px solid rgba(255, 69, 58, 0.4)";
        statusEl.style.color = "#ff453a";
        statusEl.innerHTML = `<i class="fas fa-circle-exclamation" style="margin-right: 6px;"></i> Có lỗi khi gửi yêu cầu. Vui lòng thử lại!`;
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
      }
    }
  },

  _saveMovieRequestRecord(record) {
    try {
      const existing = JSON.parse(localStorage.getItem("ngwyren_movie_requests") || "[]");
      existing.unshift(record);
      localStorage.setItem("ngwyren_movie_requests", JSON.stringify(existing.slice(0, 50)));
    } catch (_) {}
  },

  _savePendingAutoIngest(record) {
    try {
      const pending = JSON.parse(localStorage.getItem("ngwyren_pending_movie_requests") || "[]");
      if (!pending.some((p) => p.title.toLowerCase() === record.title.toLowerCase())) {
        pending.unshift(record);
        localStorage.setItem("ngwyren_pending_movie_requests", JSON.stringify(pending.slice(0, 30)));
      }
    } catch (_) {}
  }
  };

  window.NgwyrenSystem.attachModule(window.AppleCinemaApp, "SearchFilter", SearchFilterMethods, {
    isolateErrors: false
  });
})();
