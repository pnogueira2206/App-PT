# CoachRx Athlete Panel (Chrome extension)

Side panel that opens next to an athlete's calendar on `dashboard.coachrx.app`.

Tabs: Template, Priorities, Season, Readiness (placeholder), Zones, Coverage.

## Install (developer mode)

1. Download this `coachrx-extension` folder.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and pick the `coachrx-extension` folder.
4. Open an athlete in CoachRx (`/clients/<athlete>`). The panel appears on the right;
   close it with × and reopen it with the "Athlete panel" tab on the right edge.

After changing the code, click the reload icon on the extension card and refresh CoachRx.

## Data

- Workouts are read from CoachRx's own API (`/api/v1/clients/<slug>/workouts.json`)
  with the coach's logged-in session. Nothing is sent anywhere else.
- Template, priorities, season phases, max HR and weekly targets are saved per athlete
  in `chrome.storage.local`. Zone percentages are shared by all athletes.
  This data stays in this Chrome profile only.

## Coverage rules

- Only the athlete's result counts. No result = not done. A result with no numbers
  ("Feito") = done as written.
- Blocks named "... BM", warm-ups, cool-downs and coach notes (lines starting with `*`) are ignored.
- Erg and Run/swim count in km; calories cannot be converted and are skipped.
- Wk = last 7 days. Usual = weekly average of the 4 weeks before that.
- Circuits: a time ("12:34") or "done" = the whole workout; "5+12" = 5 rounds + 12 reps.
  AMRAP/EMOM/interval blocks need a rounds result, otherwise they show under "Results not read".
- Movements and synonyms are editable in the Coverage tab (shared by all athletes);
  weekly targets are per athlete.

Parser tests: `node coachrx-extension/tests/parse.test.cjs`
