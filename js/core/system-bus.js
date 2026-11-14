/* ==========================================================================
   NGWYREN CINEMA — CORE SYSTEM BUS, SMART DISPATCHER & FAULT ISOLATION
   Tầng lõi điều phối đa luồng thông minh, cách ly lỗi module & tối ưu iOS/iPadOS
   ========================================================================== */
(function (global) {
  "use strict";

  const DeviceProfiler = (() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
    const platform = typeof navigator !== "undefined" ? navigator.platform || "" : "";
    const maxTouch = typeof navigator !== "undefined" ? navigator.maxTouchPoints || 0 : 0;

    const isIPadUA = /iPad/i.test(ua) || (platform === "MacIntel" && maxTouch > 1);
    const isIPhoneUA = /iPhone|iPod/i.test(ua);
    const isIOS = isIPadUA || isIPhoneUA;
    const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua);
    const isTouch =
      isIOS ||
      (typeof window !== "undefined" &&
        ("ontouchstart" in window || maxTouch > 0 || window.matchMedia?.("(hover: none)").matches));
    const isStandalone =
      typeof window !== "undefined" &&
      (window.navigator?.standalone === true ||
        window.matchMedia?.("(display-mode: standalone)")?.matches === true);

    if (typeof document !== "undefined" && document.documentElement) {
      const root = document.documentElement;
      if (isIOS) root.classList.add("ios-device");
      if (isIPhoneUA) root.classList.add("iphone-device");
      if (isIPadUA) root.classList.add("ipad-device");
      if (isSafari) root.classList.add("safari-browser");
      if (isTouch) root.classList.add("touch-device");
      if (isStandalone) root.classList.add("pwa-standalone");
    }

    return {
      isIOS,
      isIPhone: isIPhoneUA,
      isIPad: isIPadUA,
      isSafari,
      isTouch,
      isStandalone
    };
  })();

  const SafeStorage = {
    get(key, fallback) {
      try {
        if (typeof window === "undefined" || !window.localStorage) return fallback;
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (_) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        if (typeof window === "undefined" || !window.localStorage) return false;
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (err) {
        console.warn(`[SafeStorage] Lưu key "${key}" thất bại:`, err?.message || err);
        return false;
      }
    }
  };

  class SmartDispatcher {
    constructor() {
      this._rafMap = new Map();
      this._idleTimers = new Map();
      this._streamToken = 0;
    }

    /** Luồng 1 (Critical UI): Gộp frame render chuẩn 60/120fps, tự hủy frame cũ tránh nghẽn */
    scheduleFrame(key, fn) {
      if (typeof window === "undefined" || !window.requestAnimationFrame) {
        return fn();
      }
      const prev = this._rafMap.get(key);
      if (prev) window.cancelAnimationFrame(prev);
      const id = window.requestAnimationFrame(() => {
        this._rafMap.delete(key);
        try {
          fn();
        } catch (err) {
          console.error(`[SmartDispatcher:UI:${key}]`, err);
        }
      });
      this._rafMap.set(key, id);
      return id;
    }

    /** Luồng 2 (Stream & Playback Token): Ngăn race-condition khi đổi tập/đổi phim nhanh */
    nextStreamToken() {
      this._streamToken += 1;
      return this._streamToken;
    }

    isCurrentStreamToken(token) {
      return token === this._streamToken;
    }

    /** Luồng 3 (Background Idle): Dành cho đồng bộ ngầm, dựng index, dọn cache — không làm giật cuộn iOS */
    scheduleIdle(key, fn, delayMs = 200) {
      const prev = this._idleTimers.get(key);
      if (prev) clearTimeout(prev);
      const timerId = setTimeout(() => {
        this._idleTimers.delete(key);
        if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
          window.requestIdleCallback(
            () => {
              try {
                fn();
              } catch (err) {
                console.warn(`[SmartDispatcher:Idle:${key}]`, err);
              }
            },
            { timeout: 1500 }
          );
        } else {
          try {
            fn();
          } catch (err) {
            console.warn(`[SmartDispatcher:Idle:${key}]`, err);
          }
        }
      }, delayMs);
      this._idleTimers.set(key, timerId);
      return timerId;
    }
  }

  class EventBus {
    constructor() {
      this._listeners = new Map();
    }

    on(event, handler) {
      if (typeof handler !== "function") return () => {};
      if (!this._listeners.has(event)) this._listeners.set(event, new Set());
      const set = this._listeners.get(event);
      set.add(handler);
      return () => set.delete(handler);
    }

    emit(event, payload) {
      const set = this._listeners.get(event);
      if (!set || set.size === 0) return;
      for (const handler of set) {
        try {
          handler(payload);
        } catch (err) {
          console.warn(`[EventBus:${event}]`, err);
        }
      }
    }
  }

  const modulesRegistry = {};

  /**
   * Gắn module chức năng vào Class chính một cách an toàn & có ranh giới lỗi (Error Boundary).
   * Nếu 1 module gặp sự cố nội bộ khi thực thi, lỗi được cô lập để không làm sập toàn app.
   */
  function attachModule(TargetClass, moduleName, methodsObj, options = {}) {
    if (!TargetClass || !TargetClass.prototype || !methodsObj) return false;
    const { isolateErrors = false } = options;
    const methodNames = Object.keys(methodsObj);

    for (let i = 0; i < methodNames.length; i++) {
      const name = methodNames[i];
      const fn = methodsObj[name];
      if (typeof fn !== "function") continue;

      if (isolateErrors) {
        const isAsync = fn.constructor && fn.constructor.name === "AsyncFunction";
        TargetClass.prototype[name] = isAsync
          ? async function (...args) {
              try {
                return await fn.apply(this, args);
              } catch (err) {
                console.error(`[Module:${moduleName}.${name}]`, err);
                NgwyrenSystem.bus.emit("module:error", { moduleName, method: name, error: err });
                return undefined;
              }
            }
          : function (...args) {
              try {
                return fn.apply(this, args);
              } catch (err) {
                console.error(`[Module:${moduleName}.${name}]`, err);
                NgwyrenSystem.bus.emit("module:error", { moduleName, method: name, error: err });
                return undefined;
              }
            };
      } else {
        TargetClass.prototype[name] = fn;
      }
    }

    modulesRegistry[moduleName] = {
      loaded: true,
      methods: methodNames.length,
      timestamp: Date.now()
    };
    return true;
  }

  function safeRun(contextLabel, fn, fallbackValue = undefined) {
    try {
      return fn();
    } catch (err) {
      console.warn(`[SafeRun:${contextLabel}]`, err);
      return fallbackValue;
    }
  }

  const NgwyrenSystem = {
    version: "2.4.0",
    device: DeviceProfiler,
    storage: SafeStorage,
    dispatcher: new SmartDispatcher(),
    bus: new EventBus(),
    modules: modulesRegistry,
    attachModule,
    safeRun
  };

  global.NgwyrenSystem = NgwyrenSystem;
})(typeof window !== "undefined" ? window : this);
