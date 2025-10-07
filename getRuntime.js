(function (global) {
  "use strict";

  // Namespace for your helpers
  const Helper = {};

  // add these after Helper.waitForElement inside the same IIFE
  Helper.getUuidByTitle = function (name) {
    if (!window.eventBundle || !Array.isArray(window.eventBundle.sessionsPreviews)) {
      console.warn("getUuidByTitle: eventBundle.sessionsPreviews not available");
      return null;
    }
  
    const session = window.eventBundle.sessionsPreviews.find((item) => {
      const t = item.title?.en ?? item.title?.base ?? "";
      return t === name;
    });
  
    return session ? session.uuid : null;
  };
  
  Helper.msToHMS = function (ms) {
    if (typeof ms !== "number" || Number.isNaN(ms) || ms < 0) return null;
  
    let seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;
  
    const parts = [];
    if (hours > 0) parts.push(`${hours}H`);
    if (minutes > 0) parts.push(`${minutes}M`);
    parts.push(`${seconds}S`);
  
    return parts.join(" ");
  };
  
  Helper.getDuration = async function (sessionId) {
    if (!sessionId) return null;
    if (!window.eventBundle || !window.eventBundle.uuid) {
      console.warn("getDuration: eventBundle.uuid not available");
      return null;
    }
  
    try {
      const res = await fetch(
        `https://api-hv.brandlive.com/e3-get-session-static-videos/${window.eventBundle.uuid}/${sessionId}`
      );
      if (!res.ok) {
        console.error(`getDuration: HTTP ${res.status}`);
        return null;
      }
  
      const data = await res.json();
  
      const durationMs = data[getLangID()]?.duration_ms;
  
      if (durationMs == null) return null;
      return Helper.msToHMS(durationMs);
    } catch (err) {
      console.error("getDuration error:", err);
      return null;
    }
  };
  
  Helper.getDurationLabels = async function (name) {
    const uuid = Helper.getUuidByTitle(name);
    if (!uuid) {
      console.warn("getDurationLabels: Session not found for name", name);
      return null;
    }
    return await Helper.getDuration(uuid);
  };

  // Expose Helper globally
  global.Helper = Helper;

})(window);
