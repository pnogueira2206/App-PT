// Persistence in chrome.storage.local.
// Per-athlete data lives under "athlete:<slug>", shared settings under "global".
(function () {
  const ATHLETE_DEFAULTS = () => ({
    template: { mon: ["", ""], tue: ["", ""], wed: ["", ""], thu: ["", ""], fri: ["", ""], sat: ["", ""], sun: ["", ""] },
    priorities: { strength: "", gymnastics: "", conditioning: "", sportSpecific: "", movement: "" },
    season: {}, // { "2026-01-05": "phase text" } keyed by the Monday of each week
    hrMax: null,
    targets: {}, // { "Burpee": { min: 36, max: 180 } } weekly, per movement
  });

  const GLOBAL_DEFAULTS = () => ({
    panelOpen: true,
    activeTab: "template",
    movements: window.CRX.defaultMovements(), // movement list and synonyms, shared by all athletes
    zones: [
      { name: "Z1", low: null, high: null },
      { name: "Z2", low: null, high: null },
      { name: "Z3", low: null, high: null },
      { name: "Z4", low: null, high: null },
      { name: "Z5", low: null, high: null },
    ],
  });

  function merge(defaults, saved) {
    const out = { ...defaults, ...(saved || {}) };
    for (const key of Object.keys(defaults)) {
      const d = defaults[key];
      if (d && typeof d === "object" && !Array.isArray(d) && saved && saved[key]) {
        out[key] = { ...d, ...saved[key] };
      }
    }
    return out;
  }

  async function get(key, defaults) {
    const res = await chrome.storage.local.get(key);
    return merge(defaults(), res[key]);
  }

  const timers = {};
  function saveLater(key, value, delay = 400) {
    clearTimeout(timers[key]);
    timers[key] = setTimeout(() => chrome.storage.local.set({ [key]: value }), delay);
  }

  window.CRX = window.CRX || {};
  window.CRX.store = {
    getAthlete: (slug) => get(`athlete:${slug}`, ATHLETE_DEFAULTS),
    saveAthlete: (slug, data) => saveLater(`athlete:${slug}`, data),
    getGlobal: () => get("global", GLOBAL_DEFAULTS),
    saveGlobal: (data) => saveLater("global", data, 0),
  };
})();
