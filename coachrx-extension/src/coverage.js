// Coverage tab. The volume rules are not defined yet, so for now it only checks that
// the athlete's workouts can be read and lists what was found in the last 28 days.
(function () {
  const { h } = window.CRX;

  async function renderCoverage(root, ctx) {
    const status = h("p", { class: "hint" }, "Loading the last 28 days…");
    root.append(status);

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 27);

    let workouts;
    try {
      workouts = await CRX.api.getWorkouts(ctx.slug, start, end);
    } catch (err) {
      status.textContent = `Could not read workouts: ${err.message}`;
      return;
    }

    const items = workouts.flatMap((w) =>
      (w.workout_items || []).map((it) => ({ ...it, due_date: w.due_date }))
    );
    const done = items.filter((it) => it.status === "completed").length;

    status.textContent =
      `${workouts.length} sessions, ${items.length} blocks (${done} completed) in the last 28 days. ` +
      "Volume tracking rules are still being defined.";

    root.append(
      h("table", { class: "zones" },
        h("thead", {}, h("tr", {}, h("th", {}, "Date"), h("th", {}, "Block"), h("th", {}, "Status"))),
        h("tbody", {},
          items.map((it) =>
            h("tr", {},
              h("td", { class: "date" }, it.due_date.slice(5)),
              h("td", {}, it.name),
              h("td", { class: `st ${it.status}` }, it.status)
            )
          )
        )
      )
    );
  }

  window.CRX.renderCoverage = renderCoverage;
})();
