// Turns CoachRx workout blocks into volume per movement.
//
// Rules agreed with the coach:
// - Only the athlete's result counts. A block with no result counts as not done.
// - A result with no numbers ("Feito", "done") means the block was done as written.
// - Blocks named "... BM" are ignored.
// - Erg and Run/swim count in km; everything else in reps.
// - Warm-ups and cool-downs are ignored.
(function () {
  function normalize(s) {
    return String(s || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[’‘`´]/g, "'")
      .replace(/_/g, " ")
      .replace(/(?<!\d)-|-(?!\d)/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Finds the movement named in a piece of text, preferring the longest synonym so that
  // "Burpee Box Jump-Over" wins over "Burpee". Plurals ("DUs", "Ring Dips") also match.
  function buildMatcher(movements) {
    const patterns = [];
    for (const m of movements) {
      for (const alias of [m.name, ...(m.aliases || [])]) {
        const words = normalize(alias).replace(/&/g, " & ").split(" ").filter(Boolean);
        if (!words.length) continue;
        const body = words.map((w) => escapeRe(w) + (/[a-z]$/.test(w) ? "s?" : "")).join("\\s*");
        patterns.push({ movement: m, re: new RegExp(`(?:^|[^a-z0-9])${body}(?=$|[^a-z0-9])`), len: words.join(" ").length });
      }
    }
    patterns.sort((a, b) => b.len - a.len);
    return (text) => {
      const t = normalize(text).replace(/&/g, " & ");
      for (const p of patterns) if (p.re.test(t)) return p.movement;
      return null;
    };
  }

  const num = (s) => parseFloat(String(s).replace(",", "."));

  // Distance in km from text like "5km", "1250m", "5k". Bare "m" under 50 is read as minutes.
  function distanceKm(text) {
    const t = normalize(text);
    let total = 0;
    let found = false;
    const re = /(\d+(?:[.,]\d+)?)\s*(km|k|m|mi)(?![a-z])/g;
    let m;
    while ((m = re.exec(t))) {
      const v = num(m[1]);
      if (m[2] === "km" || m[2] === "k") total += v;
      else if (m[2] === "mi") total += v * 1.609;
      else if (v >= 50) total += v / 1000;
      else continue;
      found = true;
    }
    return found ? total : null;
  }

  // "3x5", "2x6-8", "2-3x8-12", "4xAMRAP", "EMOM 4': 1 Strict LRC". Timed sets ("3x25''") are flagged.
  function parsePrescription(desc) {
    const t = normalize(desc);
    const emom = t.match(/e(?:\d+)?mom\s*(\d+)\s*'?\s*:?\s*(\d+)\s/);
    if (emom) return { sets: +emom[1], reps: +emom[2] };
    const m = t.match(/(\d+)(?:\s*-\s*(\d+))?\s*x\s*(?:(\d+)(?:\s*-\s*(\d+))?\s*('|"|s\b|seg|sec|min)?|amrap)/);
    if (!m) return null;
    const sets = m[2] ? Math.floor((+m[1] + +m[2]) / 2) : +m[1];
    if (m[5]) return { sets, timed: true };
    if (!m[3]) return { sets, reps: null };
    const reps = m[4] ? Math.floor((+m[3] + +m[4]) / 2) : +m[3];
    return { sets, reps, repsHigh: m[4] ? +m[4] : +m[3] };
  }

  const LOAD = /(kg|lb|lbs|bw|%|kgs)\b/;

  function slashList(s) {
    const m = s.match(/\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)+/);
    return m ? m[0].split("/").map(num) : null;
  }

  // Reps from the result of a single-exercise block. Returns a number, "asWritten", or null (unreadable).
  function repsFromResult(result, presc) {
    const lines = String(result).split("\n").map(normalize).filter(Boolean);
    const line = lines.find((l) => /\d/.test(l));
    if (!line) return "asWritten";
    const setsWord = line.match(/(\d+)\s*(?:sets?|series|series)\b/);
    const explicitSets = setsWord ? +setsWord[1] : null;
    const clean = setsWord ? line.replace(setsWord[0], " ") : line;

    const x = clean.match(/^(.*?)\s*[x×]\s*(.*)$/);
    if (x) {
      const [, left, right] = x;
      const rList = slashList(right);
      if (rList && !LOAD.test(right)) return rList.reduce((a, b) => a + b, 0);
      const rNum = right.match(/\d+/);
      if (!rNum) return null;
      const r = +rNum[0];
      const lList = slashList(left);
      const lNum = left.match(/\d+(?:[.,]\d+)?/);
      if (!lNum && !LOAD.test(left)) return r; // "seated x 7": total reps
      let sets;
      if (explicitSets) sets = explicitSets;
      else if (lList) sets = lList.length; // one load per set: "10/10/12/12 x 6"
      else if (lNum && !LOAD.test(left) && num(lNum[0]) <= 10) sets = num(lNum[0]); // "4x2"
      else sets = presc?.sets || 1; // "65 x 8", "Bw x 6"
      return sets * r;
    }

    const list = slashList(clean);
    if (list) return LOAD.test(clean) ? "asWritten" : list.reduce((a, b) => a + b, 0);
    if (LOAD.test(clean) && !/\breps?\b/.test(clean)) return "asWritten";
    const repsWord = clean.match(/(\d+)\s*reps?\b/);
    if (repsWord) return +repsWord[1];
    const n = clean.match(/\d+/);
    if (!n) return "asWritten";
    const v = +n[0];
    // "7" under a "3x6-7" prescription means 7 per set
    if (presc?.sets > 1 && presc.repsHigh && v <= presc.repsHigh * 1.5) return presc.sets * v;
    return v;
  }

  // Movements and quantities in a multi-line description (circuits, WODs, intervals).
  // Rounds come from "2x", "3 rounds" lines; "21-15-9" schemes apply to lines without a number.
  function parseCircuit(desc, match) {
    const segments = [];
    let seg = null;
    const newSeg = () => (seg = { rounds: 1, scheme: null, open: false, entries: [] }) && segments.push(seg);
    newSeg();

    for (const raw of String(desc || "").split("\n")) {
      const line = normalize(raw);
      if (!line || line.startsWith("*")) continue; // coach notes
      if (line === "+") {
        newSeg();
        continue;
      }
      const movement = match(line);
      const rounds = line.match(/^(\d+)\s*(?:x|rounds?|rds?|rondas?|voltas?)\b(.*)$/);
      if (rounds && !movement) {
        seg.rounds = +rounds[1];
        if (/amrap|emom|every|alternating|interval/.test(line)) seg.open = true;
        continue;
      }
      if (/amrap|emom|every \d|alternating/.test(line) && !movement) {
        seg.open = true;
        continue;
      }
      const scheme = line.match(/^(\d+(?:\s*-\s*\d+)+)(?:\s|$)/);
      if (scheme && !movement) {
        seg.scheme = scheme[1].split("-").reduce((a, b) => a + +b, 0);
        continue;
      }
      if (!movement) continue;

      const entry = { movement, reps: 0, km: 0 };
      const inlineSets = line.match(/^(\d+)\s*x\s*(\d+(?:[.,]\d+)?\s*(?:km|k|m)\b)/);
      if (inlineSets) {
        entry.km = inlineSets[1] * (distanceKm(inlineSets[2]) || 0);
      } else if (/^max\b/.test(line)) {
        entry.max = true;
      } else {
        const q = line.match(/^(\d+(?:[.,]\d+)?)\s*(\/\s*(?:lado|side|perna|leg|braco|arm))?\s*(cal|cals|calorias|km|k|m)?\b/);
        if (q && q[3] && q[3].startsWith("cal")) entry.calories = true;
        else if (q && q[3]) entry.km = distanceKm(q[1] + q[3]) || 0;
        else if (q) entry.reps = num(q[1]) * (q[2] ? 2 : 1);
        else if (seg.scheme) entry.reps = seg.scheme;
        else entry.km = distanceKm(line) || 0;
      }
      seg.entries.push(entry);
    }
    return segments.filter((s) => s.entries.length);
  }

  function addTo(out, movement, amount) {
    if (!amount) return;
    out.set(movement, (out.get(movement) || 0) + amount);
  }

  // Volume of one block: { volumes: Map(movement -> amount), status }
  // status: "ok" | "partial" (some parts unreadable, e.g. calories) | "noResult" | "unread" | "ignored"
  function blockVolume(item, match, bucketUnit) {
    const name = item.name || "";
    if (/\bbm\b/.test(normalize(name))) return { status: "ignored" };
    const volumes = new Map();
    const result = String(item.result || "").trim();
    const isKm = (m) => bucketUnit(m.bucket) === "km";

    const own = match(name);
    const segments = parseCircuit(item.description, match);

    // Single exercise block: the block name is the movement
    if (own && !item.is_circuit && !segments.some((s) => s.entries.length > 1)) {
      // "Chinese Row", "SA Cable Row": an erg/run name with no distance anywhere is not cardio
      if (isKm(own) && distanceKm(item.description) === null && distanceKm(result) === null && !/\b(min|cal)/.test(normalize(item.description + " " + result)))
        return { status: "ignored" };
      if (!result) return { status: "noResult", movements: [own] };
      if (isKm(own)) {
        const km = distanceKm(result);
        if (km !== null) addTo(volumes, own, km);
        else if (!/\d/.test(result)) {
          const planned = distanceKm(item.description) ?? segments.reduce((a, s) => a + s.rounds * s.entries.reduce((b, e) => b + e.km, 0), 0);
          addTo(volumes, own, planned);
        } else return { status: "unread", movements: [own] };
        return { status: "ok", volumes };
      }
      const presc = parsePrescription(item.description);
      if (presc?.timed) return { status: "ignored" };
      const reps = repsFromResult(result, presc);
      if (reps === null) return { status: "unread", movements: [own] };
      if (reps === "asWritten") {
        if (!presc || presc.reps == null) return { status: "unread", movements: [own] };
        addTo(volumes, own, presc.sets * presc.reps);
      } else addTo(volumes, own, reps);
      return { status: "ok", volumes };
    }

    if (!segments.length) return { status: "ignored" };
    const movements = [...new Set(segments.flatMap((s) => s.entries.map((e) => e.movement)))];
    if (!result) return { status: "noResult", movements };

    const amount = (e) => (isKm(e.movement) ? e.km : e.reps);
    const unreadable = segments.some((s) => s.entries.some((e) => e.max));
    // calorie entries cannot be turned into km: count the rest and report them as partly read
    const calorieMovements = segments.flatMap((s) => s.entries.filter((e) => e.calories).map((e) => e.movement));
    const t = normalize(result);
    const roundsPlus = t.match(/^(\d+)\s*(?:rounds?|rds?|r|rondas?|voltas?)?\s*\+\s*(\d+)/);
    const roundsOnly = t.match(/^(\d+)\s*(?:rounds?|rds?|rondas?|voltas?)\b/);
    const isTime = /\b\d{1,2}\s*[:']\s*\d{2}\b/.test(t) || !/\d/.test(t);

    if ((roundsPlus || roundsOnly) && segments.length === 1) {
      const s = segments[0];
      const R = +(roundsPlus || roundsOnly)[1];
      let partial = roundsPlus ? +roundsPlus[2] : 0;
      for (const e of s.entries) {
        addTo(volumes, e.movement, R * amount(e));
        if (e.calories) calorieMovements.includes(e.movement) || calorieMovements.push(e.movement);
        if (partial > 0 && !isKm(e.movement)) {
          const take = Math.min(partial, e.reps);
          addTo(volumes, e.movement, take);
          partial -= take;
        }
      }
      if (calorieMovements.length) return { status: "partial", volumes, movements: calorieMovements };
      return { status: "ok", volumes };
    }
    if (isTime && !unreadable && !segments.some((s) => s.open)) {
      for (const s of segments) for (const e of s.entries) addTo(volumes, e.movement, s.rounds * amount(e));
      if (calorieMovements.length) return { status: "partial", volumes, movements: calorieMovements };
      return { status: "ok", volumes };
    }
    return { status: "unread", movements };
  }

  const api = { normalize, buildMatcher, distanceKm, parsePrescription, repsFromResult, parseCircuit, blockVolume };
  if (typeof window !== "undefined") {
    window.CRX = window.CRX || {};
    window.CRX.parse = api;
  }
  if (typeof module !== "undefined") module.exports = api;
})();
