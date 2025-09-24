
// waitForElement.js
(function (global) {
  function waitForElement(selector, callback) {
    const el = document.querySelector(selector);
    if (el) {
      callback(el);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        callback(el);
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Export for browser or Node
  if (typeof module !== "undefined" && module.exports) {
    module.exports = waitForElement;
  } else {
    global.waitForElement = waitForElement;
  }
})(this);
