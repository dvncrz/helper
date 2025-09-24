(function (global) {
  function waitForElement(selector, callback, options = {}) {
    const once = options.once !== false; // default true

    function start(root) {
      if (!root) return; // safety check

      // Run immediately if element already exists
      const el = root.querySelector(selector);
      if (el) {
        callback(el);
        if (once) return;
      }

      // Start observing
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
      // Try #root, otherwise fall back to body
      let root = document.getElementById("root") || document.body;
      if (root) {
        start(root);
      } else {
        // If neither exists yet, wait until body is created
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
  }

  // Export
  if (typeof module !== "undefined" && module.exports) {
    module.exports = waitForElement;
  } else {
    global.waitForElement = waitForElement;
  }
})(this);
