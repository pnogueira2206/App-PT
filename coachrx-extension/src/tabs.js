// Tab renderers. Each receives a container and a context:
// { slug, athlete, global, saveAthlete(), saveGlobal() }
(function () {
  function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") el.className = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined && v !== false) el.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c === null || c === undefined || c === false) continue;
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  // Textarea that grows with its content and saves on input
  function autoText(value, placeholder, onChange) {
    const ta = h("textarea", { rows: 1, placeholder });
    ta.value = value || "";
    const fit = () => {
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    };
    ta.addEventListener("input", () => {
      fit();
      onChange(ta.value);
    });
    requestAnimationFrame(fit);
    return ta;
  }

  const DAYS = [
    ["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"], ["thu", "Thursday"],
    ["fri", "Friday"], ["sat", "Saturday"], ["sun", "Sunday"],
  ];

  function renderTemplate(root, ctx) {
    const t = ctx.athlete.template;
    root.append(
      h("p", { class: "hint" }, "Weekly template. Use the second line when there is a second session that day."),
      ...DAYS.map(([key, label]) =>
        h("div", { class: "day" },
          h("div", { class: "label" }, label),
          ...[0, 1].map((i) =>
            autoText(t[key][i], i === 0 ? "Session 1" : "Session 2", (v) => {
              t[key][i] = v;
              ctx.saveAthlete();
            })
          )
        )
      )
    );
  }

  const PRIORITIES = [
    ["strength", "Strength"], ["gymnastics", "Gymnastics"], ["conditioning", "Conditioning"],
    ["sportSpecific", "Sport Specific"], ["movement", "Movement"],
  ];

  function renderPriorities(root, ctx) {
    const p = ctx.athlete.priorities;
    root.append(
      ...PRIORITIES.map(([key, label]) =>
        h("div", { class: "day" },
          h("div", { class: "label" }, label),
          autoText(p[key], "", (v) => {
            p[key] = v;
            ctx.saveAthlete();
          })
        )
      )
    );
  }

  function mondaysOf(year) {
    const d = new Date(year, 0, 1);
    while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
    const out = [];
    while (d.getFullYear() === year) {
      out.push(new Date(d));
      d.setDate(d.getDate() + 7);
    }
    return out;
  }

  function currentMonday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  }

  function renderSeason(root, ctx, year = new Date().getFullYear()) {
    const season = ctx.athlete.season;
    const thisWeek = CRX.api.isoDate(currentMonday());
    const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

    const rerender = (y) => {
      root.replaceChildren();
      renderSeason(root, ctx, y);
    };

    const rows = mondaysOf(year).map((monday) => {
      const key = CRX.api.isoDate(monday);
      const input = h("input", { type: "text", placeholder: "" });
      input.value = season[key] || "";
      input.addEventListener("input", () => {
        if (input.value) season[key] = input.value;
        else delete season[key];
        ctx.saveAthlete();
      });
      return h("tr", { class: key === thisWeek ? "current" : "" },
        h("td", { class: "date" }, fmt.format(monday)),
        h("td", {}, input)
      );
    });

    // two columns (first and second half of the year) so the whole season fits on screen
    const half = Math.ceil(rows.length / 2);
    const column = (part) =>
      h("table", { class: "season" },
        h("thead", {}, h("tr", {}, h("th", {}, "Week"), h("th", {}, "Phase"))),
        h("tbody", {}, part)
      );
    root.append(
      h("div", { class: "year" },
        h("button", { onclick: () => rerender(year - 1), title: "Previous year" }, "‹"),
        h("strong", {}, String(year)),
        h("button", { onclick: () => rerender(year + 1), title: "Next year" }, "›")
      ),
      h("div", { class: "season-cols" }, column(rows.slice(0, half)), column(rows.slice(half)))
    );
  }

  function renderReadiness(root) {
    root.append(h("p", { class: "hint" }, "Readiness: coming later."));
  }

  function renderZones(root, ctx) {
    const zones = ctx.global.zones;
    const bpm = (pct) => {
      const max = Number(ctx.athlete.hrMax);
      if (!max || pct === null || pct === "" || isNaN(pct)) return "–";
      return Math.round((max * Number(pct)) / 100);
    };

    const ranges = zones.map(() => h("td", { class: "bpm" }));
    const paint = () => {
      zones.forEach((z, i) => (ranges[i].textContent = `${bpm(z.low)} – ${bpm(z.high)} bpm`));
    };
    const tbody = h("tbody", {},
      zones.map((z, idx) => {
        const pctInput = (field) => {
          const i = h("input", { type: "number", min: 0, max: 100, step: 1, class: "pct" });
          i.value = z[field] ?? "";
          i.addEventListener("input", () => {
            z[field] = i.value === "" ? null : Number(i.value);
            ctx.saveGlobal();
            paint();
          });
          return i;
        };
        return h("tr", {},
          h("td", { class: "label" }, z.name),
          h("td", {}, pctInput("low"), " – ", pctInput("high"), " %"),
          ranges[idx]
        );
      })
    );

    const max = h("input", { type: "number", min: 100, max: 230, step: 1, class: "hrmax" });
    max.value = ctx.athlete.hrMax ?? "";
    max.addEventListener("input", () => {
      ctx.athlete.hrMax = max.value === "" ? null : Number(max.value);
      ctx.saveAthlete();
      paint();
    });

    paint();
    root.append(
      h("label", { class: "field" }, h("span", {}, "Max HR (this athlete)"), max, " bpm"),
      h("table", { class: "zones" },
        h("thead", {}, h("tr", {}, h("th", {}, "Zone"), h("th", {}, "% of max HR (all athletes)"), h("th", {}, "Range"))),
        tbody
      )
    );
  }

  window.CRX = window.CRX || {};
  window.CRX.h = h;
  window.CRX.tabs = [
    { id: "template", label: "Template", render: renderTemplate },
    { id: "priorities", label: "Priorities", render: renderPriorities },
    { id: "season", label: "Season", render: renderSeason },
    { id: "readiness", label: "Readiness", render: renderReadiness },
    { id: "zones", label: "Zones", render: renderZones },
    { id: "coverage", label: "Coverage", render: (root, ctx) => CRX.renderCoverage(root, ctx) },
  ];
})();
