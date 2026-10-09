import type { BlockType, MetconFormat, RecordType } from "@prisma/client";
import { formatDuration, parseDuration, parseRecordKg } from "@/lib/blocks";

export type RecordCandidate = {
  type: RecordType;
  /** Value as stored in PersonalRecord.value ("105" or "4:12"). */
  value: string;
  unit: string | null;
  /** True when there was no previous record of this kind for the exercise. */
  first: boolean;
};

type BlockForRecord = {
  type: BlockType;
  metconFormat: MetconFormat | null;
  exerciseId: string | null;
};

type ResultForRecord = {
  done: boolean;
  loadKg: number | null;
  timeSeconds: number | null;
  reps: number | null;
  rx: boolean | null;
  sets: { reps: number | null; loadKg: number | null }[];
};

type ExistingRecord = { type: RecordType; value: string; unit: string | null };

/**
 * Checks whether a result beats the student's records for the block's exercise:
 * - strength: heaviest set with at least 1 rep (lifting it for reps also raises the 1RM);
 * - metcon "max load": the load;
 * - metcon "for time" (benchmarks like Fran): a faster finished time, Rx only.
 */
export function detectRecord(
  block: BlockForRecord,
  result: ResultForRecord,
  records: ExistingRecord[]
): RecordCandidate | null {
  if (!block.exerciseId || !result.done) return null;

  let loadKg: number | null = null;
  if (block.type === "STRENGTH") {
    const loads = result.sets
      .filter((s) => (s.reps ?? 0) >= 1 && s.loadKg != null && s.loadKg > 0)
      .map((s) => s.loadKg!);
    loadKg = loads.length > 0 ? Math.max(...loads) : null;
  } else if (block.type === "METCON" && block.metconFormat === "MAX_LOAD") {
    loadKg = result.loadKg && result.loadKg > 0 ? result.loadKg : null;
  }

  if (loadKg != null) {
    const best = records
      .filter((r) => r.type === "WEIGHT")
      .map((r) => parseRecordKg(r.value, r.unit))
      .filter((kg): kg is number => kg != null);
    const previous = best.length > 0 ? Math.max(...best) : null;
    if (previous != null && loadKg <= previous) return null;
    return { type: "WEIGHT", value: String(loadKg), unit: "kg", first: previous == null };
  }

  const finishedForTime =
    block.type === "METCON" &&
    block.metconFormat === "FOR_TIME" &&
    result.timeSeconds != null &&
    result.timeSeconds > 0 &&
    result.reps == null && // reps are only logged when the time cap was hit
    result.rx !== false;
  if (finishedForTime) {
    const times = records
      .filter((r) => r.type === "TIME")
      .map((r) => parseDuration(r.value))
      .filter((s): s is number => s != null && !Number.isNaN(s));
    const previous = times.length > 0 ? Math.min(...times) : null;
    if (previous != null && result.timeSeconds! >= previous) return null;
    return {
      type: "TIME",
      value: formatDuration(result.timeSeconds!),
      unit: null,
      first: previous == null,
    };
  }

  return null;
}
