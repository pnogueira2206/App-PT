/**
 * Reads workouts pasted from the coach's Google Sheets programming:
 * one tab per student/group, one row per week (the week's date in the first
 * column), one column per day (Monday → Sunday), one workout per cell:
 *
 *   Bridge/Intensification Phase - Week 3/6      ← title
 *   Warmup                                       ← warm-up until the first block
 *   5' Bike
 *   ...
 *   A. Every 2:00 x 4:                           ← block: title = line after the letter
 *   3 Overhead Squat @ 65-75% of Snatch          ← prescription
 *   *stay tight in the bottom                    ← "*" lines are the coach's notes
 *   B. Back Squat
 *   ...
 *   Cooldown                                     ← optional, until the end
 *
 * Pure functions: used by the paste preview (client) and re-checked on save (server).
 */

export type ParsedBlock = { title: string; description: string; notes: string };
export type ParsedWorkout =
  | { kind: "REST" }
  | {
      kind: "TRAINING";
      title: string;
      description: string;
      warmup: string;
      cooldown: string;
      blocks: ParsedBlock[];
    };
export type ParsedDay = { date: string; workout: ParsedWorkout };
export type SheetPaste = { days: ParsedDay[]; weeks: string[]; warnings: string[] };

/** Google Sheets copies cells as TSV: tabs between cells, multi-line cells in quotes. */
export function parseTsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let atCellStart = true;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"' && atCellStart) {
      quoted = true;
      atCellStart = false;
    } else if (ch === "\t") {
      row.push(cell);
      cell = "";
      atCellStart = true;
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      atCellStart = true;
    } else {
      cell += ch;
      atCellStart = false;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const WARMUP = /^(warm[\s-]?up|aquecimento)\b[\s:.-]*/i;
const COOLDOWN = /^(cool[\s-]?down|retorno [àa] calma)\b[\s:.-]*/i;
// "A." / "B)" / "A1." at the start of a line ("Advanced)" or "1)" don't count).
const BLOCK = /^([A-Z])(\d?)[.)](?:\s+(.*)|\s*)$/;
const REST = /^(rest|descanso|off|day off|recovery|recupera[çc][ãa]o)\.?$/i;

const tidy = (lines: string[]) => lines.join("\n").replace(/^\s*\n+|\n+\s*$/g, "").trim();

/** One cell → a workout (null for an empty cell). */
export function parseWorkoutCell(raw: string): ParsedWorkout | null {
  const text = raw.replace(/\r/g, "").trim();
  if (!text) return null;
  if (REST.test(text)) return { kind: "REST" };

  const lines = text.split("\n").map((l) => l.replace(/\s+$/, ""));
  let title = "";
  const description: string[] = [];
  const warmup: string[] = [];
  const cooldown: string[] = [];
  const blocks: { title: string; body: string[]; notes: string[] }[] = [];
  let section: "head" | "warmup" | "block" | "cooldown" = "head";
  let waitingTitle = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const block = trimmed.match(BLOCK);
    if (block) {
      const label = block[2] ? `${block[1]}${block[2]}. ` : "";
      blocks.push({ title: block[3] ? label + block[3].trim() : label.trim(), body: [], notes: [] });
      waitingTitle = !block[3];
      section = "block";
      return;
    }
    if (WARMUP.test(trimmed) && section !== "block") {
      section = "warmup";
      const rest = trimmed.replace(WARMUP, "");
      if (rest) warmup.push(rest);
      return;
    }
    if (COOLDOWN.test(trimmed)) {
      section = "cooldown";
      const rest = trimmed.replace(COOLDOWN, "");
      if (rest) cooldown.push(rest);
      return;
    }
    if (section === "head") {
      if (index === 0) title = trimmed;
      else description.push(line);
    } else if (section === "warmup") {
      warmup.push(line);
    } else if (section === "cooldown") {
      cooldown.push(line);
    } else {
      const current = blocks[blocks.length - 1];
      if (waitingTitle && trimmed) {
        // "C." alone on its line: the next line is the title.
        current.title = (current.title ? current.title + " " : "") + trimmed;
        waitingTitle = false;
      } else if (trimmed.startsWith("*")) {
        current.notes.push(line);
      } else {
        current.body.push(line);
      }
    }
  });

  return {
    kind: "TRAINING",
    title: title.slice(0, 200),
    description: tidy(description),
    warmup: tidy(warmup),
    cooldown: tidy(cooldown),
    blocks: blocks.map((b, i) => {
      // "Bench Press - 3x5 @ more than last week": the name is the title, the rest the prescription.
      const split = b.title.match(/^(.+?)\s+[-–]\s+(\d.*)$/);
      const body = split ? [split[2], ...b.body] : b.body;
      return {
        title: ((split ? split[1] : b.title) || `Bloco ${i + 1}`).slice(0, 200),
        description: tidy(body),
        notes: tidy(b.notes),
      };
    }),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const utc = (y: number, m: number, d: number) => {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? date : null;
};
const monday = (d: Date) => new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86_400_000);
const plusDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

/** A date anywhere in the first cell: "12/10/2026", "12/10", "2026-10-12", "S42 - 12.10"… */
export function findDate(cell: string, nearYear: number): Date | null {
  const iso = cell.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return utc(+iso[1], +iso[2], +iso[3]);
  const dmy = cell.match(/(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?/);
  if (!dmy) return null;
  if (dmy[3]) {
    const year = dmy[3].length === 2 ? 2000 + +dmy[3] : +dmy[3];
    return utc(year, +dmy[2], +dmy[1]);
  }
  // No year: the one closest to the calendar being viewed.
  const candidates = [nearYear - 1, nearYear, nearYear + 1]
    .map((y) => utc(y, +dmy[2], +dmy[1]))
    .filter((d): d is Date => !!d);
  const target = Date.UTC(nearYear, 6, 1);
  return candidates.sort((a, b) => Math.abs(a.getTime() - target) - Math.abs(b.getTime() - target))[0] ?? null;
}

/**
 * Whole paste → one workout per day. Rows with 8+ cells start with the week's
 * date; rows with ≤7 cells are just the days, placed from `fallbackWeek`
 * (one week per row).
 */
export function parseSheetPaste(text: string, fallbackWeek: string): SheetPaste {
  const warnings: string[] = [];
  const fallback = monday(new Date(`${fallbackWeek}T00:00:00Z`));
  const days: ParsedDay[] = [];
  const weeks: string[] = [];

  parseTsv(text).forEach((cells, rowIndex) => {
    let week = plusDays(fallback, rowIndex * 7);
    let dayCells = cells;
    if (cells.length >= 8) {
      const found = findDate(cells[0], fallback.getUTCFullYear());
      if (found) week = monday(found);
      else if (cells[0].trim()) warnings.push(`row:${rowIndex + 1}`);
      dayCells = cells.slice(1, 8);
    } else {
      dayCells = cells.slice(0, 7);
    }
    weeks.push(keyOf(week));
    dayCells.forEach((cell, i) => {
      const workout = parseWorkoutCell(cell);
      if (workout) days.push({ date: keyOf(plusDays(week, i)), workout });
    });
  });
  return { days, weeks, warnings };
}
