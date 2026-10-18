// Coverage tab: weekly volume per movement and bucket, acute (last 7 days) vs
// chronic (weekly average of the 4 weeks before), weekly targets and alerts.
(function () {
  const { h, BUCKETS, parse } = window.CRX;

  const HISTORY_DAYS = 84; // enough for "last exposure" and the 4-week chronic average
  const cache = new Map(); // slug -> { at, workouts }
  const openSections = new Map(); // section title -> open, kept across re-renders

  const unitOf = (bucketId) => BUCKETS.find((b) => b.id === bucketId)?.unit || "reps";

  function fmt(v, unit) {
    if (v === null || v === undefined) return "–";
    if (unit === "km") return v === 0 ? "0" : `${v < 10 ? v.toFixed(1) : Math.round(v)} km`;
    return v < 10 && v % 1 ? v.toFixed(1) : String(Math.round(v));
  }

  function daysAgo(dueDate, today) {
    const d = new Date(dueDate.replace(/\//g, "-") + "T00:00:00");
    return Math.round((today - d) / 86400000);
  }

  async function loadWorkouts(slug, force) {
    const hit = cache.get(slug);
    if (hit && !force && Date.now() - hit.at < 10 * 60 * 1000) return hit.workouts;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (HISTORY_DAYS - 1));
    const workouts = await CRX.api.getWorkouts(slug, start, end);
    cache.set(slug, { at: Date.now(), workouts });
    return workouts;
  }

  function emptyStats() {
    return { days: new Set(), last: null, wk: 0, prev: 0, chronicSum: 0 };
  }

  function addEvent(st, ago, amount) {
    if (!(amount > 0)) return;
    if (ago < 28) st.days.add(ago);
    if (st.last === null || ago < st.last) st.last = ago;
    if (ago <= 6) st.wk += amount;
    else if (ago <= 13) st.prev += amount;
    if (ago >= 7 && ago <= 34) st.chronicSum += amount;
  }

  function compute(workouts, movements) {
    const match = parse.buildMatcher(movements);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const byMovement = new Map(movements.map((m) => [m, emptyStats()]));
    const byBucket = new Map(BUCKETS.map((b) => [b.id, emptyStats()]));
    const issues = [];
    let blocks7 = 0;
    let logged7 = 0;

    for (const w of workouts) {
      const ago = daysAgo(w.due_date, today);
      if (ago < 0 || ago >= HISTORY_DAYS) continue;
      for (const item of w.workout_items || []) {
        const r = parse.blockVolume(item, match, unitOf);
        if (r.status === "ignored") continue;
        if (ago <= 6) {
          blocks7++;
          if (String(item.result || "").trim()) logged7++;
        }
        if ((r.status === "unread" || r.status === "partial") && ago < 28) {
          issues.push({ date: w.due_date, name: item.name, result: item.result, status: r.status, movements: r.movements });
        }
        for (const [m, amount] of r.volumes || []) {
          addEvent(byMovement.get(m), ago, amount);
          addEvent(byBucket.get(m.bucket), ago, amount);
        }
      }
    }
    for (const st of [...byMovement.values(), ...byBucket.values()]) st.usual = st.chronicSum / 4;
    return { byMovement, byBucket, issues, logged: blocks7 ? Math.round((100 * logged7) / blocks7) : null };
  }

  function strip(days) {
    // oldest on the left, today on the right
    return h("span", { class: "strip" },
      Array.from({ length: 28 }, (_, i) => h("i", { class: days.has(27 - i) ? "on" : "" }))
    );
  }

  function bucketAlerts(stats, ctx) {
    const alerts = [];
    const linked = (bucketId) =>
      CRX.PRIORITIES.filter(([key]) => (ctx.athlete.priorityBuckets[key] || []).includes(bucketId)).map(([, label]) => label);
    for (const b of BUCKETS) {
      const st = stats.byBucket.get(b.id);
      if (!(st.usual > 0)) continue;
      const ratio = st.wk / st.usual;
      let text = null;
      let major = false;
      if (ratio < 0.5) [text, major] = ["well below usual", true];
      else if (ratio < 0.8) text = "below usual";
      else if (ratio > 1.5) [text, major] = ["well above usual", true];
      else if (ratio > 1.3) text = "above usual";
      if (!text) continue;
      const pr = linked(b.id);
      alerts.push({
        major: major || pr.length > 0,
        text: `${b.label} ${text}: ${fmt(st.wk, b.unit)} vs ${fmt(st.usual, b.unit)} (last 7d vs 4-wk avg)` +
          (pr.length ? ` · linked to priority ${pr.join(", ")}` : ""),
      });
    }
    return alerts;
  }

  function targetRows(stats, ctx) {
    const rows = [];
    for (const [name, t] of Object.entries(ctx.athlete.targets)) {
      const m = ctx.global.movements.find((x) => x.name === name);
      if (!m) continue;
      const st = stats.byMovement.get(m);
      const unit = unitOf(m.bucket);
      let status = "OK";
      if (st.wk === 0) status = "MISS";
      else if (t.min != null && st.wk < t.min) status = "LOW";
      else if (t.max != null && st.wk > t.max) status = "HIGH";
      const range = `${t.min ?? "–"}–${t.max ?? "–"}${unit === "km" ? " km" : ""}`;
      rows.push({ name, status, st, unit, range });
    }
    const order = { MISS: 0, LOW: 1, HIGH: 2, OK: 3 };
    return rows.sort((a, b) => order[a.status] - order[b.status]);
  }

  function section(title, open, ...content) {
    const key = title.replace(/\s*\(.*\)$/, "");
    const d = h("details", { class: "section" }, h("summary", {}, title), ...content);
    d.open = openSections.get(key) ?? open;
    d.addEventListener("toggle", () => openSections.set(key, d.open));
    return d;
  }

  function targetsEditor(ctx, rerender) {
    const targets = ctx.athlete.targets;
    const names = ctx.global.movements.map((m) => m.name).sort();
    const rows = Object.entries(targets).map(([name, t]) => {
      const numIn = (field) => {
        const i = h("input", { type: "number", min: 0, step: "any", class: "pct" });
        i.value = t[field] ?? "";
        i.addEventListener("change", () => {
          t[field] = i.value === "" ? null : Number(i.value);
          ctx.saveAthlete();
          rerender();
        });
        return i;
      };
      return h("tr", {},
        h("td", {}, name),
        h("td", {}, numIn("min"), " – ", numIn("max")),
        h("td", {}, h("button", { class: "link", title: "Remove", onclick: () => { delete targets[name]; ctx.saveAthlete(); rerender(); } }, "×"))
      );
    });
    const select = h("select", {}, h("option", { value: "" }, "Add movement…"),
      names.filter((n) => !targets[n]).map((n) => h("option", { value: n }, n)));
    select.addEventListener("change", () => {
      if (!select.value) return;
      targets[select.value] = { min: null, max: null };
      ctx.saveAthlete();
      rerender();
    });
    return [
      h("p", { class: "hint" }, "Weekly range for this athlete (reps, or km for Erg and Run/swim)."),
      h("table", {}, h("thead", {}, h("tr", {}, h("th", {}, "Movement"), h("th", {}, "Min – max / week"), h("th", {}))), h("tbody", {}, rows)),
      select,
    ];
  }

  function movementsEditor(ctx, rerender) {
    const list = ctx.global.movements;
    const save = () => {
      ctx.saveGlobal();
      rerender();
    };
    const groups = BUCKETS.map((b) => {
      const rows = list.filter((m) => m.bucket === b.id).map((m) => {
        const name = h("input", { type: "text", class: "mname" });
        name.value = m.name;
        name.addEventListener("change", () => {
          const old = m.name;
          m.name = name.value.trim() || old;
          if (ctx.athlete.targets[old] && old !== m.name) {
            ctx.athlete.targets[m.name] = ctx.athlete.targets[old];
            delete ctx.athlete.targets[old];
            ctx.saveAthlete();
          }
          save();
        });
        const syn = h("input", { type: "text", placeholder: "synonyms, comma separated" });
        syn.value = m.aliases.join(", ");
        syn.addEventListener("change", () => {
          m.aliases = syn.value.split(",").map((s) => s.trim()).filter(Boolean);
          save();
        });
        const bucket = h("select", {}, BUCKETS.map((x) => h("option", { value: x.id, selected: x.id === m.bucket ? "" : null }, x.label)));
        bucket.addEventListener("change", () => {
          m.bucket = bucket.value;
          save();
        });
        return h("div", { class: "mrow" }, name, syn, bucket,
          h("button", { class: "link", title: "Remove", onclick: () => { list.splice(list.indexOf(m), 1); save(); } }, "×"));
      });
      return h("div", { class: "mgroup" },
        h("div", { class: "label" }, `${b.label} (${b.unit})`),
        rows,
        h("button", { class: "link add", onclick: () => { list.push({ name: "New movement", bucket: b.id, aliases: [] }); save(); } }, "+ add movement")
      );
    });
    return [
      h("p", { class: "hint" }, "Shared by all athletes. A block counts for a movement when its name or a line of the workout contains the name or a synonym."),
      groups,
      h("button", {
        class: "link",
        onclick: () => {
          if (!confirm("Replace the movement list with the default one?")) return;
          ctx.global.movements = CRX.defaultMovements();
          save();
        },
      }, "Reset to default list"),
    ];
  }

  async function renderCoverage(root, ctx, force = false) {
    const gen = (root._gen = (root._gen || 0) + 1);
    // Deferred so that an input's change/blur handlers finish before the tab is rebuilt
    const rerender = (refetch = false) => {
      clearTimeout(root._timer);
      root._timer = setTimeout(() => {
        root.getRootNode().activeElement?.blur();
        const scroll = root.parentElement?.scrollTop;
        root.replaceChildren();
        renderCoverage(root, ctx, refetch).then(() => {
          if (scroll !== undefined && root.parentElement) root.parentElement.scrollTop = scroll;
        });
      }, 0);
    };

    const status = h("p", { class: "hint" }, "Loading the last 12 weeks…");
    root.append(status);
    let workouts;
    try {
      workouts = await loadWorkouts(ctx.slug, force);
    } catch (err) {
      status.textContent = `Could not read workouts: ${err.message}`;
      return;
    }
    if (gen !== root._gen) return; // a newer render started meanwhile
    status.remove();

    const stats = compute(workouts, ctx.global.movements);
    const alerts = [
      ...targetRows(stats, ctx)
        .filter((r) => r.status !== "OK")
        .map((r) => ({ major: true, text: `${r.name}: ${fmt(r.st.wk, r.unit)} last 7d (prev 7d ${fmt(r.st.prev, r.unit)}), target ${r.range}` })),
      ...bucketAlerts(stats, ctx),
    ];
    const majors = alerts.filter((a) => a.major);
    const minors = alerts.filter((a) => !a.major);

    const minorBox = h("div", { class: "minors", hidden: "" }, minors.map((a) => h("div", { class: "alert minor" }, a.text)));
    const header = h("div", { class: "cov-head" },
      h("strong", {}, "Coverage"),
      h("span", { class: "hint" }, stats.logged === null ? "no blocks in the last 7d" : `${stats.logged}% logged (7d)`),
      h("button", { class: "link", title: "Reload from CoachRx", onclick: () => rerender(true) }, "↻")
    );

    // bucket table
    const table = h("table", { class: "cov" },
      h("thead", {}, h("tr", {}, h("th", {}, "Bucket"), h("th", {}, "28 days"), h("th", {}, "Last"), h("th", {}, "Wk / usual")))
    );
    const tbody = h("tbody");
    for (const b of BUCKETS) {
      const st = stats.byBucket.get(b.id);
      const linked = CRX.PRIORITIES.some(([key]) => (ctx.athlete.priorityBuckets[key] || []).includes(b.id));
      const children = ctx.global.movements
        .filter((m) => m.bucket === b.id)
        .map((m) => ({ m, st: stats.byMovement.get(m) }))
        .filter(({ m, st: s }) => s.last !== null || ctx.athlete.targets[m.name])
        .sort((a, c) => (a.st.last ?? 999) - (c.st.last ?? 999));
      const down = st.usual > 0 && st.wk < st.usual * 0.8;
      const up = st.usual > 0 && st.wk > st.usual * 1.3;
      const row = h("tr", { class: "bucket" },
        h("td", {}, h("span", { class: "caret" }, children.length ? "▸" : " "), b.label, linked ? h("span", { class: "dot", title: "Linked to a priority" }) : null),
        h("td", {}, strip(st.days)),
        h("td", {}, st.last === null ? "–" : `${st.last}d`),
        h("td", { class: down ? "down" : up ? "up" : "" }, `${fmt(st.wk, b.unit)} / ${fmt(st.usual, b.unit)}`, down ? " ▾" : up ? " ▴" : "")
      );
      const kids = children.map(({ m, st: s }) =>
        h("tr", { class: "mov", hidden: "" },
          h("td", {}, m.name),
          h("td", { class: "muted" }, `${s.days.size}× in 28d`),
          h("td", {}, s.last === null ? "–" : `${s.last}d`),
          h("td", {}, `${fmt(s.wk, b.unit)} / ${fmt(s.usual, b.unit)}`)
        )
      );
      row.addEventListener("click", () => {
        const open = row.classList.toggle("open");
        row.querySelector(".caret").textContent = children.length ? (open ? "▾" : "▸") : " ";
        kids.forEach((k) => (k.hidden = !open));
      });
      tbody.append(row, ...kids);
    }
    table.append(tbody);

    const targets = targetRows(stats, ctx);
    const parts = [
      header,
      majors.map((a) => h("div", { class: "alert" }, a.text)),
      minors.length
        ? h("button", { class: "link", onclick: (e) => { minorBox.hidden = !minorBox.hidden; e.target.textContent = minorBox.hidden ? `Show ${minors.length} minor` : "Hide minor"; } }, `Show ${minors.length} minor`)
        : null,
      minorBox,
      table,
      targets.length
        ? h("div", { class: "targets" },
            h("div", { class: "caps" }, "Weekly targets (last 7 days)"),
            targets.map((r) =>
              h("div", { class: "trow" },
                h("span", { class: `tag ${r.status.toLowerCase()}` }, r.status),
                h("strong", {}, r.name),
                ` ${fmt(r.st.wk, r.unit)} / ${r.range} (prev 7d ${fmt(r.st.prev, r.unit)})`
              )
            )
          )
        : null,
      stats.issues.length
        ? section(`Results not read (${stats.issues.length}, last 28 days)`, false,
            h("p", { class: "hint" }, "These blocks have a result the rules could not turn into volume. Partly read blocks counted what they could (e.g. calories are skipped)."),
            stats.issues.map((i) =>
              h("div", { class: "issue" },
                h("span", { class: "muted" }, i.date.slice(5)), " ", h("strong", {}, i.name),
                i.status === "partial" ? " (partly read)" : "",
                h("div", { class: "muted" }, `${(i.movements || []).map((m) => m.name).join(", ")} · “${String(i.result || "").slice(0, 80)}”`)
              )
            )
          )
        : null,
      section("Weekly targets – edit", false, ...targetsEditor(ctx, () => rerender())),
      section("Movements & synonyms – edit", false, ...movementsEditor(ctx, () => rerender())),
    ];
    root.append(...parts.flat().filter(Boolean));
  }

  window.CRX.renderCoverage = renderCoverage;
})();
