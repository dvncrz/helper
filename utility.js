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
  Helper.waitForElement = function (selector, callback, options = { once: false }) {
    const once = options.once

    function start(root) {
      if (!root) return;

      // Run immediately if element already exists
      const el = root.querySelector(selector);
      if (el) {
        callback(el);
        if (once) return;
      }

      // Observe for changes
      const observer = new MutationObserver(() => {
        const el = root.querySelector(selector);
        if (el) {
          callback(el);
          if (once) observer.disconnect();
        }
      });

      observer.observe(root, { childList: true, subtree: true });
    }

    function init() {
      // Prefer #root, otherwise fallback to body
      let root = document.getElementById("root") || document.body;
      if (root) {
        start(root);
      } else {
        // If body not ready, wait for it
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

  // Expose Helper globally
  global.Helper = Helper;

})(window);
