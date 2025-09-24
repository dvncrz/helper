(function (global) {
  function waitForElement(selector, callback) {
    function start() {
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

      observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.body) {
      start();
    } else {
      window.addEventListener("DOMContentLoaded", start);
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = waitForElement;
  } else {
    global.waitForElement = waitForElement;
  }
})(this);
