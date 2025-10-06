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
  // state = { timerId, lastSeenValue, mutationCount }
  const states = new WeakMap();

  // Per-element mutation counter increments on every mutation observed
  const mutationCounts = new WeakMap();

  function ensureMutationCount(el) {
    if (!mutationCounts.has(el)) mutationCounts.set(el, 0);
  }

  function onMutationForEl(el) {
    ensureMutationCount(el);
    mutationCounts.set(el, mutationCounts.get(el) + 1);
  }

  function scheduleCheck(el) {
    // clear existing timer
    const st = states.get(el);
    if (st && st.timerId) {
      clearTimeout(st.timerId);
    }

    // snapshot current value and mutation count
    ensureMutationCount(el);
    const snapshotValue = el.textContent;
    const snapshotMutCount = mutationCounts.get(el);

    const timerId = setTimeout(() => {
      // when timer fires, read current state
      const currentValue = el.textContent;
      const currentMutCount = mutationCounts.get(el) || 0;

      if (currentValue === snapshotValue && currentMutCount === snapshotMutCount) {
        // stable: call callback
        try {
          callback(el);
        } catch (err) {
          console.error('waitForElement callback error', err);
        }

        // cleanup if once requested
        if (once) {
          // clear timer entry and leave mutationCounts (weakmap will GC)
          states.delete(el);
        } else {
          // keep state but clear timerId
          const existing = states.get(el) || {};
          existing.timerId = null;
          states.set(el, existing);
        }
      } else {
        // not stable yet -> reschedule another check
        // update lastSeenValue to current (optional)
        states.set(el, { timerId: null, lastSeenValue: currentValue });
        scheduleCheck(el);
      }
    }, debounce);

    states.set(el, { timerId, lastSeenValue: snapshotValue, mutationCount: snapshotMutCount });
  }

  function observeElement(el) {
    // If already observing, nothing to do
    if (states.has(el) && states.get(el).observing) return;

    // Create a MutationObserver for this element to detect changes and bump mutation count
    const obs = new MutationObserver((mutations) => {
      // increment per-element mutation counter for each callback
      onMutationForEl(el);
      // schedule a stability check
      scheduleCheck(el);
    });

    obs.observe(el, { childList: true, subtree: true, characterData: true, attributes: true });

    // attach observer reference so we can disconnect if needed
    const st = states.get(el) || {};
    st.observer = obs;
    st.observing = true;
    states.set(el, st);
  }

  function start(root) {
    if (!root) return;

    // If element already present
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
        // still observe for future changes if not once
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
