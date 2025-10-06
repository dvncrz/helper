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
  
    // Map to store per-element debounce timers and observers
    const timers = new WeakMap();
    const elementObservers = new WeakMap();
  
    function observeElementForStability(el) {
      // If already observing, keep it
      if (elementObservers.has(el)) return;
  
      const obs = new MutationObserver((mutations) => {
        // When anything changes, (re)start debounce timer
        scheduleStableCallback(el);
      });
  
      // Observe subtree and characterData so changes inside elements are caught
      obs.observe(el, { childList: true, subtree: true, characterData: true, attributes: true });
  
      elementObservers.set(el, obs);
    }
  
    function scheduleStableCallback(el) {
      // clear previous timer if present
      const prev = timers.get(el);
      if (prev) clearTimeout(prev);
  
      const id = setTimeout(() => {
        timers.delete(el);
        // Call the callback with the latest content
        try {
          callback(el);
        } catch (e) {
          console.error('waitForElement callback error', e);
        }
  
        // If once is true, disconnect observer for this element
        if (once && elementObservers.has(el)) {
          try { elementObservers.get(el).disconnect(); } catch (e) {}
          elementObservers.delete(el);
        }
      }, debounce);
  
      timers.set(el, id);
    }
  
    function start(root) {
      if (!root) return;
  
      // If element already present
      const el = root.querySelector(selector);
      if (el) {
        // If stable requested, observe changes on the element and schedule a stable callback
        if (stable) {
          observeElementForStability(el);
          scheduleStableCallback(el);
        } else {
          // immediate call
          callback(el);
          if (once) return;
          // still start observing for future occurrences (non-once)
          observeElementForStability(el);
        }
      }
  
      // Observe root for element additions
      const observer = new MutationObserver((mutations) => {
        // If element appears, handle it
        const found = root.querySelector(selector);
        if (found) {
          if (stable) {
            observeElementForStability(found);
            scheduleStableCallback(found);
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
      let root = document.getElementById("root") || document.body;
      if (root) {
        start(root);
      } else {
        // wait for body if it's not ready yet
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
