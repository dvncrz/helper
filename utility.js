(function (global) {
  const Helper = {};

  /**
   * Wait for a DOM element to appear
   */
  Helper.waitForElement = function (selector, callback, options = {}) {
    const once = options.once !== false; // default true

    function start(root) {
      if (!root) return;

      const el = root.querySelector(selector);
      if (el) {
        callback(el);
        if (once) return;
      }

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
      let root = document.getElementById("root") || document.body;
      if (root) {
        start(root);
      } else {
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

  /**
   * Example placeholder for a future helper function
   * (you can add as many as you want here)
   */
  Helper.log = function (message) {
    console.log("[Helper]", message);
  };

  // Export
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Helper;
  } else {
    global.Helper = Helper;
  }
})(this);
