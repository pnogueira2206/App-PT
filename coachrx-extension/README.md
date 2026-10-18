# CoachRx Athlete Panel (Chrome extension)

Side panel that opens next to an athlete's calendar on `dashboard.coachrx.app`.

Tabs: Template, Priorities, Season, Readiness (placeholder), Zones, Coverage (in progress).

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
