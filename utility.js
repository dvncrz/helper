(function (global) {
  "use strict";

  // Namespace for your helpers
  const Helper = {};

  /**
   * Wait for an element to appear in the DOM
   * @param {string} selector - CSS selector of the element
   * @param {Function} callback - Function to run once element exists
   * @param {Object} options - { once: true|false } default true
   */
  // Replace only the Helper.waitForElement implementation with this
  Helper.waitForElement = function (selector, callback, options = {}) {
  const { once = false, stable = false, debounce = 100 } = options;

  // Per-element state
  // state = { timerId, lastSeenValue, mutationCount, observer }
  const states = new WeakMap();

  // Per-element mutation counter
  const mutationCounts = new WeakMap();

  // Keep last value we processed so we don't call the callback repeatedly with same data
  const lastProcessed = new WeakMap();

  function ensureMutationCount(el) {
    if (!mutationCounts.has(el)) mutationCounts.set(el, 0);
  }

  function incMutationCount(el) {
    ensureMutationCount(el);
    mutationCounts.set(el, mutationCounts.get(el) + 1);
  }

  function scheduleCheck(el) {
    // clear existing timer
    const st = states.get(el);
    if (st && st.timerId) clearTimeout(st.timerId);

    // snapshot current value and mutation count
    ensureMutationCount(el);
    const snapshotValue = el.textContent;
    const snapshotMutCount = mutationCounts.get(el);

    const timerId = setTimeout(() => {
      const currentValue = el.textContent;
      const currentMutCount = mutationCounts.get(el) || 0;

      if (currentValue === snapshotValue && currentMutCount === snapshotMutCount) {
        // Avoid calling callback repeatedly for the same processed value
        if (lastProcessed.get(el) === currentValue) {
          // cleanup timer entry
          const existing = states.get(el) || {};
          existing.timerId = null;
          states.set(el, existing);
          return;
        }

        // stable: call callback
        try {
          callback(el);
        } catch (err) {
          console.error('waitForElement callback error', err);
        }
        lastProcessed.set(el, currentValue);

        // cleanup if once requested: disconnect observer for this element
        if (once) {
          const s = states.get(el);
          if (s && s.observer) {
            try { s.observer.disconnect(); } catch (_) {}
          }
          states.delete(el);
          mutationCounts.delete(el);
          return;
        } else {
          // clear timerId but keep observer
          const existing = states.get(el) || {};
          existing.timerId = null;
          states.set(el, existing);
        }
      } else {
        // not stable yet -> reschedule another check
        states.set(el, { timerId: null, lastSeenValue: currentValue, observer: st?.observer });
        scheduleCheck(el);
      }
    }, debounce);

    states.set(el, { timerId, lastSeenValue: snapshotValue, mutationCount: snapshotMutCount, observer: st?.observer });
  }

  function observeElement(el) {
    // If already observing, do nothing
    const s = states.get(el);
    if (s && s.observer) return;

    const obs = new MutationObserver((mutations) => {
      // increment per-element mutation counter and schedule a check
      incMutationCount(el);
      scheduleCheck(el);
    });

    obs.observe(el, { childList: true, subtree: true, characterData: true, attributes: true });

    const cur = states.get(el) || {};
    cur.observer = obs;
    cur.observing = true;
    states.set(el, cur);
  }

  function start(root) {
    if (!root) return;

    const el = root.querySelector(selector);
    if (el) {
      if (stable) {
        ensureMutationCount(el);
        observeElement(el);
        scheduleCheck(el);
      } else {
        // immediate call with current content
        try { callback(el); } catch (e) { console.error(e); }
        if (once) return;
        ensureMutationCount(el);
        observeElement(el);
      }
    }

    // Observe root for element additions (lightweight)
    const observer = new MutationObserver((mutations) => {
      const found = root.querySelector(selector);
      if (found) {
        if (stable) {
          ensureMutationCount(found);
          observeElement(found);
          scheduleCheck(found);
        } else {
          try { callback(found); } catch (e) { console.error(e); }
          if (once) {
            observer.disconnect();
            return;
          }
          ensureMutationCount(found);
          observeElement(found);
        }
      }
    });

    observer.observe(root, { childList: true, subtree: true });
  }

  function init() {
    let root = document.getElementById("root") || document.body;
    if (root) start(root);
    else {
      const bodyObserver = new MutationObserver(() => {
        const body = document.body;
        if (body) {
          const root = document.getElementById("root") || body;
          start(root);
          bodyObserver.disconnect();
        }
      });
      bodyObserver.observe(document.documentElement, { childList: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
};

  // add these after Helper.waitForElement inside the same IIFE
Helper.getUuidByTitle = function (name) {
  if (!window.eventBundle || !Array.isArray(window.eventBundle.sessionsPreviews)) {
    console.warn("getUuidByTitle: eventBundle.sessionsPreviews not available");
    return null;
  }

  const session = window.eventBundle.sessionsPreviews.find((item) => {
    const t = item.title?.en ?? item.title?.base ?? "";
    return t === name;
  });

  return session ? session.uuid : null;
};

Helper.msToHMS = function (ms) {
  if (typeof ms !== "number" || Number.isNaN(ms) || ms < 0) return null;

  let seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}H`);
  if (minutes > 0) parts.push(`${minutes}M`);
  parts.push(`${seconds}S`);

  return parts.join(" ");
};

Helper.getDuration = async function (sessionId) {
  if (!sessionId) return null;
  if (!window.eventBundle || !window.eventBundle.uuid) {
    console.warn("getDuration: eventBundle.uuid not available");
    return null;
  }

  try {
    const res = await fetch(
      `https://api-hv.brandlive.com/e3-get-session-static-videos/${window.eventBundle.uuid}/${sessionId}`
    );
    if (!res.ok) {
      console.error(`getDuration: HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();

    const durationMs = data[getLangID()]?.duration_ms;

    if (durationMs == null) return null;
    return Helper.msToHMS(durationMs);
  } catch (err) {
    console.error("getDuration error:", err);
    return null;
  }
};

Helper.getDurationLabels = async function (name) {
  const uuid = Helper.getUuidByTitle(name);
  if (!uuid) {
    console.warn("getDurationLabels: Session not found for name", name);
    return null;
  }
  return await Helper.getDuration(uuid);
};


  // Example extra utility
  Helper.replaceSubmenuText = function (oldText, newText) {
    Helper.waitForElement(".submenu-text", (submenu) => {
      if (submenu.textContent.includes(oldText)) {
        submenu.textContent = submenu.textContent.replace(oldText, newText);
      }
    });
  };

  /**
   * Detect if the current device is mobile
   * @returns {boolean}
   */
  Helper.isMobile = function () {
    return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile/i.test(
      navigator.userAgent
    );
  };

  // Expose Helper globally
  global.Helper = Helper;

})(window);
