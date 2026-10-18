// Reads data from CoachRx's own API using the coach's logged-in session (same-origin cookies).
(function () {
  const BASE = "/api/v1";

  async function getJSON(path) {
    const res = await fetch(BASE + path, {
      credentials: "include",
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`CoachRx ${res.status} on ${path}`);
    return res.json();
  }

  function isoDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  // Athlete slug from URLs like /clients/<slug> or /clients/<slug>/calendar
  function currentSlug() {
    const m = location.pathname.match(/^\/clients\/([^/?#]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  async function getClient(slug) {
    const data = await getJSON(`/clients/${encodeURIComponent(slug)}.json`);
    return data.client;
  }

  // Workouts between two dates (inclusive). CoachRx answers in chunks of a few weeks,
  // so long ranges are split into 4-week requests.
  async function getWorkouts(slug, start, end) {
    const all = [];
    let from = new Date(start);
    while (from <= end) {
      const to = new Date(from);
      to.setDate(to.getDate() + 27);
      const until = to > end ? end : to;
      const q = `start_date=${isoDate(from)}&end_date=${isoDate(until)}&shape=lean`;
      const data = await getJSON(`/clients/${encodeURIComponent(slug)}/workouts.json?${q}`);
      all.push(...(data.workouts || []));
      from = new Date(until);
      from.setDate(from.getDate() + 1);
    }
    const seen = new Set();
    return all.filter((w) => !seen.has(w.id) && seen.add(w.id));
  }

  window.CRX = window.CRX || {};
  window.CRX.api = { currentSlug, getClient, getWorkouts, isoDate };
})();
