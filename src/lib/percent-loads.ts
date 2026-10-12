import { prisma } from "@/lib/prisma";
import { loadFromPercent, parseRecordKg } from "@/lib/blocks";

/** A student's 1RM per exercise name (best 1RM record, 3RM/5RM excluded). */
export type Maxes = { name: string; kg: number }[];

export type PercentSegment = { text: string; kg?: { min: number; max: number } };

export async function loadMaxes(studentId: string): Promise<Maxes> {
  const records = await prisma.personalRecord.findMany({
    where: { studentId, type: "WEIGHT", OR: [{ reps: null }, { reps: 1 }] },
    select: { value: true, unit: true, exercise: { select: { name: true } } },
  });
  const best = new Map<string, number>();
  for (const r of records) {
    const kg = parseRecordKg(r.value, r.unit);
    if (kg != null) best.set(r.exercise.name, Math.max(kg, best.get(r.exercise.name) ?? 0));
  }
  return [...best].map(([name, kg]) => ({ name, kg }));
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const hasWord = (haystack: string, word: string) =>
  new RegExp(`(^|[^a-zà-ÿ])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-zà-ÿ]|$)`).test(haystack);

/** 1RM for a name: exact match, else the heaviest exercise containing it ("Snatch" → Squat Snatch). */
function maxFor(maxes: Maxes, name: string): number | null {
  const n = norm(name);
  if (!n || n === "1rm") return null;
  const exact = maxes.find((m) => norm(m.name) === n);
  if (exact) return exact.kg;
  const partial = maxes.filter((m) => hasWord(norm(m.name), n));
  return partial.length > 0 ? Math.max(...partial.map((m) => m.kg)) : null;
}

/** Exercise named in a piece of text (the longest one, so "Power Snatch" beats "Snatch"). */
function maxNamedIn(maxes: Maxes, text: string): number | null {
  const t = norm(text);
  const found = maxes.filter((m) => hasWord(t, norm(m.name))).sort((a, b) => b.name.length - a.name.length);
  return found[0]?.kg ?? null;
}

// "65%", "65-75%", "65 – 75 %", optionally followed by "of Snatch" / "do Back Squat".
const PERCENT =
  /(\d{1,3}(?:[.,]\d+)?)(?:\s*[-–]\s*(\d{1,3}(?:[.,]\d+)?))?\s*%(?:\s+(?:of|do|da|de|del)\s+([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+){0,2}))?/gi;

/**
 * Splits a free-text prescription so each percentage can show the load in kg,
 * worked out from the student's 1RM. The lift is, in order: an explicit
 * "% of X", an exercise named earlier on the same line, or the block's own
 * exercise/title. Percentages with no known 1RM are left as they are.
 */
export function percentSegments(text: string, maxes: Maxes, fallbackNames: (string | null | undefined)[]): PercentSegment[] {
  if (maxes.length === 0 || !text.includes("%")) return [{ text }];
  const fallback = () => {
    for (const name of fallbackNames) {
      if (!name) continue;
      const kg = maxFor(maxes, name) ?? maxNamedIn(maxes, name);
      if (kg != null) return kg;
    }
    return null;
  };

  const segments: PercentSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(PERCENT)) {
    const end = match.index! + match[0].length;
    const lineStart = text.lastIndexOf("\n", match.index!) + 1;
    let rm: number | null = null;
    if (match[3]) {
      // Try "Back Squat Tng", then "Back Squat", then "Back".
      const words = match[3].split(/\s+/);
      for (let n = words.length; n > 0 && rm == null; n--) rm = maxFor(maxes, words.slice(0, n).join(" "));
      // "% of something" we don't know (e.g. "% de esforço"): not a load.
      if (rm == null) continue;
    }
    rm ??= maxNamedIn(maxes, text.slice(lineStart, match.index!)) ?? fallback();
    if (rm == null) continue;

    const low = Number(match[1].replace(",", "."));
    const high = match[2] ? Number(match[2].replace(",", ".")) : low;
    if (!(low > 0 && low <= 150 && high >= low && high <= 150)) continue;
    segments.push({ text: text.slice(last, end), kg: { min: loadFromPercent(rm, low), max: loadFromPercent(rm, high) } });
    last = end;
  }
  segments.push({ text: text.slice(last) });
  return segments;
}
