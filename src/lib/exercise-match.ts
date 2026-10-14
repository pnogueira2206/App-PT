const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasWord = (haystack: string, word: string) =>
  new RegExp(`(^|[^a-zà-ÿ0-9])${escape(word)}([^a-zà-ÿ0-9]|$)`).test(haystack);

/**
 * The library exercise a block title is about, for blocks typed as free text
 * ("Overhead Squat", "B. Back Squat 5x3"): the exact name, else the longest
 * name found in the title as whole words ("Power Snatch" beats "Snatch").
 */
export function matchExercise<T extends { name: string }>(title: string, exercises: T[]): T | null {
  const t = norm(title);
  if (!t) return null;
  const exact = exercises.find((e) => norm(e.name) === t);
  if (exact) return exact;
  const found = exercises
    .filter((e) => norm(e.name).length >= 3 && hasWord(t, norm(e.name)))
    .sort((a, b) => b.name.length - a.name.length);
  return found[0] ?? null;
}
