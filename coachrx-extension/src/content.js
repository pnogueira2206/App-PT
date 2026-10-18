// Injects the side panel into CoachRx and keeps it in sync with the athlete page that is open.
(function () {
  const { h, store, api, tabs } = window.CRX;

  const STYLE = `
    :host { all: initial; }
    * { box-sizing: border-box; font-family: -apple-system, "Segoe UI", Roboto, sans-serif; }
    .toggle {
      position: fixed; right: 0; top: 50%; transform: translateY(-50%); z-index: 2147483647;
      writing-mode: vertical-rl; padding: 10px 6px; border: 0; border-radius: 6px 0 0 6px;
      background: #1f2937; color: #fff; font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .panel {
      position: fixed; top: 0; right: 0; bottom: 0; width: 400px; z-index: 2147483646;
      display: flex; flex-direction: column; background: #fff; color: #111827;
      border-left: 1px solid #e5e7eb; box-shadow: -4px 0 16px rgba(0,0,0,.08); font-size: 13px;
    }
    .panel.hidden { display: none; }
    .head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
    .head strong { font-size: 14px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .head button { border: 0; background: none; font-size: 18px; cursor: pointer; color: #6b7280; }
    nav { display: flex; overflow-x: auto; border-bottom: 1px solid #e5e7eb; }
    nav button {
      flex: 1 1 auto; padding: 8px 6px; border: 0; border-bottom: 2px solid transparent;
      background: none; font-size: 12px; color: #6b7280; cursor: pointer;
    }
    nav button.active { color: #111827; border-bottom-color: #2563eb; font-weight: 600; }
    .body { flex: 1; overflow-y: auto; padding: 12px; }
    .hint { color: #6b7280; margin: 0 0 10px; }
    .day { margin-bottom: 10px; }
    .label { font-weight: 600; font-size: 12px; margin-bottom: 4px; }
    textarea, input[type=text], input[type=number] {
      width: 100%; border: 1px solid #d1d5db; border-radius: 4px; padding: 5px 7px;
      font-size: 13px; color: inherit; background: #fff; resize: none; margin-bottom: 4px;
    }
    textarea:focus, input:focus { outline: 2px solid #93c5fd; border-color: #60a5fa; }
    table { width: 100%; border-collapse: collapse; font-size: inherit; color: inherit; }
    th { text-align: left; font-size: 11px; color: #6b7280; font-weight: 600; padding: 4px; }
    td { padding: 2px 4px; vertical-align: middle; border-top: 1px solid #f3f4f6; }
    td.date { white-space: nowrap; color: #4b5563; width: 70px; font-variant-numeric: tabular-nums; }
    td input { margin: 0; }
    tr.current td { background: #ecfdf5; }
    .year { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 8px; }
    .year button { border: 1px solid #d1d5db; background: #fff; border-radius: 4px; width: 28px; cursor: pointer; }
    .field { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-weight: 600; }
    .field span { flex: 1; }
    input.hrmax { width: 80px; margin: 0; }
    input.pct { width: 56px; margin: 0; display: inline-block; }
    td.bpm { white-space: nowrap; font-variant-numeric: tabular-nums; }
    .chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px; }
    .chip { border: 1px solid #d1d5db; background: #fff; border-radius: 10px; padding: 1px 8px; font-size: 11px; color: #6b7280; cursor: pointer; }
    .chip.on { background: #dbeafe; border-color: #93c5fd; color: #1e40af; }
    button.link { border: 0; background: none; color: #2563eb; cursor: pointer; font-size: 12px; padding: 2px 0; }
    select { border: 1px solid #d1d5db; border-radius: 4px; padding: 3px; font-size: 12px; background: #fff; color: inherit; max-width: 100%; }
    .cov-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
    .cov-head strong { font-size: 15px; } .cov-head .hint { margin: 0; flex: 1; }
    .alert { background: #fef3c7; border-left: 3px solid #d97706; padding: 5px 8px; margin-bottom: 4px; border-radius: 2px; font-size: 12px; }
    .alert.minor { background: #fffbeb; border-left-color: #fbbf24; }
    table.cov { margin-top: 8px; font-size: 12px; }
    table.cov tr.bucket { cursor: pointer; font-weight: 600; }
    table.cov tr.bucket:hover td { background: #f9fafb; }
    table.cov tr.mov td:first-child { padding-left: 18px; color: #374151; }
    table.cov td:nth-child(3), table.cov td:nth-child(4) { white-space: nowrap; font-variant-numeric: tabular-nums; }
    .caret { display: inline-block; width: 12px; color: #9ca3af; }
    .dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #2563eb; margin-left: 4px; vertical-align: middle; }
    .muted { color: #6b7280; font-weight: 400; }
    .down { color: #b45309; } .up { color: #b91c1c; }
    .strip { display: inline-flex; gap: 1px; vertical-align: middle; }
    .strip i { width: 3px; height: 12px; background: #e5e7eb; }
    .strip i.on { background: #1f2937; }
    .targets { margin-top: 14px; }
    .caps { font-size: 11px; letter-spacing: .05em; text-transform: uppercase; color: #6b7280; font-weight: 600; margin-bottom: 4px; }
    .trow { font-size: 12px; margin-bottom: 3px; }
    .tag { display: inline-block; width: 40px; font-size: 10px; font-weight: 700; }
    .tag.miss { color: #dc2626; } .tag.low { color: #d97706; } .tag.high { color: #b91c1c; } .tag.ok { color: #059669; }
    details.section { margin-top: 14px; border-top: 1px solid #e5e7eb; padding-top: 8px; }
    details.section summary { cursor: pointer; font-weight: 600; font-size: 12px; }
    .issue { font-size: 12px; margin: 6px 0; }
    .mgroup { margin: 10px 0; }
    .mrow { display: grid; grid-template-columns: 1fr 1.3fr 90px 16px; gap: 4px; align-items: center; margin-bottom: 3px; }
    .mrow input { margin: 0; font-size: 12px; padding: 3px 5px; }
    td.st.completed { color: #059669; } td.st.missed { color: #dc2626; } td.st.pending { color: #6b7280; }
  `;

  const host = h("div", { id: "crx-athlete-panel" });
  const shadow = host.attachShadow({ mode: "open" });
  const panel = h("div", { class: "panel" });
  const toggle = h("button", { class: "toggle" }, "Athlete panel");
  shadow.append(h("style", {}, STYLE), panel, toggle);
  document.body.append(host);

  let global;
  let state = { slug: null, athlete: null, name: "" };

  function ctx() {
    return {
      slug: state.slug,
      athlete: state.athlete,
      global,
      saveAthlete: () => store.saveAthlete(state.slug, state.athlete),
      saveGlobal: () => store.saveGlobal(global),
    };
  }

  function render() {
    host.style.display = state.slug ? "" : "none";
    panel.classList.toggle("hidden", !global.panelOpen);
    toggle.style.display = global.panelOpen ? "none" : "";
    if (!state.slug || !global.panelOpen) return;

    const body = h("div", { class: "body" });
    const nav = h("nav", {},
      tabs.map((t) =>
        h("button", {
          class: t.id === global.activeTab ? "active" : "",
          onclick: () => {
            global.activeTab = t.id;
            store.saveGlobal(global);
            render();
          },
        }, t.label)
      )
    );
    panel.replaceChildren(
      h("div", { class: "head" },
        h("strong", {}, state.name || state.slug),
        h("button", { title: "Close", onclick: () => setOpen(false) }, "×")
      ),
      nav,
      body
    );
    const tab = tabs.find((t) => t.id === global.activeTab) || tabs[0];
    tab.render(body, ctx());
  }

  function setOpen(open) {
    global.panelOpen = open;
    store.saveGlobal(global);
    render();
  }
  toggle.addEventListener("click", () => setOpen(true));

  async function syncAthlete() {
    const slug = api.currentSlug();
    if (slug === state.slug) return;
    state = { slug, athlete: null, name: "" };
    if (slug) {
      state.athlete = await store.getAthlete(slug);
      try {
        state.name = (await api.getClient(slug)).name;
      } catch {
        // name is cosmetic; keep the slug
      }
    }
    render();
  }

  (async () => {
    global = await store.getGlobal();
    await syncAthlete();
    // CoachRx is a single-page app: watch for navigation between athletes
    setInterval(syncAthlete, 1000);
  })();
})();
