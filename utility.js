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
  const { once = false, stable = false, debounce = 100, stableChecks = 2 } = options;

  const timers = new WeakMap();           // el -> { timerId, lastValue, consecutive }
  const elementObservers = new WeakMap(); // el -> MutationObserver

  function observeElementForStability(el) {
    if (elementObservers.has(el)) return;

    const obs = new MutationObserver(() => {
      scheduleStableCheck(el);
    });

    obs.observe(el, { childList: true, subtree: true, characterData: true, attributes: true });
    elementObservers.set(el, obs);
  }

  function scheduleStableCheck(el) {
    // read current snapshot immediately
    const current = el.textContent;

    // clear previous timer
    const entry = timers.get(el);
    if (entry && entry.timerId) clearTimeout(entry.timerId);

    // start a new timer; on fire, validate content hasn't changed since last check
    const timerId = setTimeout(() => {
      // When timer fires, read the latest textContent
      const latest = el.textContent;

      // If we don't have an entry yet, create one
      let e = timers.get(el);
      if (!e) {
        e = { lastValue: latest, consecutive: 1, timerId: null };
      } else {
        // If the latest equals the previous saved value, increment consecutive, otherwise reset
        if (latest === e.lastValue) {
          e.consecutive = (e.consecutive || 0) + 1;
        } else {
          e.lastValue = latest;
          e.consecutive = 1;
        }
      }

      timers.set(el, e);

      if (e.consecutive >= stableChecks) {
        // stable: call callback with latest DOM state
        try {
          callback(el);
        } catch (err) {
          console.error('waitForElement callback error', err);
        }

        // cleanup if once is requested
        if (once && elementObservers.has(el)) {
          try { elementObservers.get(el).disconnect(); } catch (_) {}
          elementObservers.delete(el);
        }
        // remove timers entry (we already called)
        timers.delete(el);
      } else {
        // not stable enough yet: schedule another check after debounce ms
        const nextId = setTimeout(() => scheduleStableCheck(el), debounce);
        e.timerId = nextId;
        timers.set(el, e);
      }
    }, debounce);

    // save timer and lastValue snapshot (use current read)
    timers.set(el, { timerId, lastValue: current, consecutive: 0 });
  }

  function start(root) {
    if (!root) return;

    const el = root.querySelector(selector);
    if (el) {
      if (stable) {
        observeElementForStability(el);
        scheduleStableCheck(el);
      } else {
        callback(el);
        if (once) return;
        observeElementForStability(el);
      }
    }

    // watch for future additions
    const observer = new MutationObserver(() => {
      const found = root.querySelector(selector);
      if (found) {
        if (stable) {
          observeElementForStability(found);
          scheduleStableCheck(found);
        } else {
          callback(found);
          if (once) {
            observer.disconnect();
            return;
          }
          observeElementForStability(found);
        }
      }
    });

    observer.observe(root, { childList: true, subtree: true });
  }

  function init() {
    const root = document.getElementById("root") || document.body;
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
