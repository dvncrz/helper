(function (global) {
  function waitForElement(selector, callback) {
    function startObserving(root) {
      // Check if element is already there
      const el = root.querySelector(selector);
      if (el) {
        callback(el);
        return;
      }

      // Otherwise, wait for React to render it
      const observer = new MutationObserver(() => {
        const el = root.querySelector(selector);
        if (el) {
          callback(el);
          observer.disconnect();
        }
      });

      observer.observe(root, { childList: true, subtree: true });
    }

    // Ensure we have the React root
    function init() {
      const root = document.getElementById("root"); // adjust if different
      if (root) {
        startObserving(root);
      } else {
        // If root itself hasn’t been created yet, retry
        const bodyObserver = new MutationObserver(() => {
          const root = document.getElementById("root");
          if (root) {
            startObserving(root);
            bodyObserver.disconnect();
          }
        });
        bodyObserver.observe(document.body, { childList: true });
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
