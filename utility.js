(function (global) {
  function waitForElement(selector, callback, options = {}) {
    const root = document.getElementById("root") || document.body;
    const once = options.once !== false; // default true

    const observer = new MutationObserver(() => {
      const el = root.querySelector(selector);
      if (el) {
        callback(el);

        // Only disconnect if "once" is true
        if (once) observer.disconnect();
      }
    });

    observer.observe(root, { childList: true, subtree: true });

    // In case it's already in DOM before observer starts
    const el = root.querySelector(selector);
    if (el) {
      callback(el);
      if (once) observer.disconnect();
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = waitForElement;
  } else {
    global.waitForElement = waitForElement;
  }
})(this);
