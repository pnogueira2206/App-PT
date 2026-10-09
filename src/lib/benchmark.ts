import type { BenchmarkKind, Prisma } from "@prisma/client";
import { formatDuration, parseDuration, parseRecordKg } from "@/lib/blocks";

type BenchmarkBlock = { benchmark: BenchmarkKind | null; benchmarkReps: number | null; exerciseId: string | null };
type BenchmarkResult = {
  id: string;
  done: boolean;
  loadKg: number | null;
  timeSeconds: number | null;
  rounds: number | null;
  reps: number | null;
};

/**
 * Keeps the student's record in sync with a benchmark result: the record saved from
 * this result follows its edits, otherwise a new record is created when it beats the
 * best one (heavier for max load, faster for time, more rounds/reps). Returns true when a record was written.
 */
export async function syncBenchmarkRecord(
  tx: Prisma.TransactionClient,
  block: BenchmarkBlock,
  result: BenchmarkResult,
  studentId: string,
  date: Date
): Promise<boolean> {
  if (!block.benchmark || !block.exerciseId) return false;
  const kind = block.benchmark;
  const score = scoreOf(kind, result);
  const linked = await tx.personalRecord.findFirst({ where: { sourceResultId: result.id } });

  if (!result.done || score == null) {
    if (linked) await tx.personalRecord.delete({ where: { id: linked.id } });
    return false;
  }

  const reps = kind === "MAX_LOAD" ? (block.benchmarkReps ?? 1) : null;
  const data = { ...recordValue(kind, result), reps };

  if (linked) {
    await tx.personalRecord.update({ where: { id: linked.id }, data: { ...data, exerciseId: block.exerciseId } });
    return true;
  }

  const others = await tx.personalRecord.findMany({
    where: {
      studentId,
      exerciseId: block.exerciseId,
      type: data.type,
      ...(kind === "MAX_LOAD" ? (reps === 1 ? { OR: [{ reps: null }, { reps: 1 }] } : { reps }) : {}),
    },
    select: { value: true, unit: true },
  });
  const previous = others
    .map((r) => parseRecordScore(kind, r.value, r.unit))
    .filter((v): v is number => v != null && !Number.isNaN(v));
  // Lower is better only for time.
  const best = previous.length === 0 ? null : kind === "TIME" ? Math.min(...previous) : Math.max(...previous);
  if (best != null && (kind === "TIME" ? score >= best : score <= best)) return false;

  await tx.personalRecord.create({
    data: { ...data, studentId, exerciseId: block.exerciseId, recordDate: date, sourceResultId: result.id },
  });
  return true;
}

/** Comparable number for a result: kg, seconds, or rounds·1000 + reps. */
function scoreOf(kind: BenchmarkKind, r: BenchmarkResult): number | null {
  if (kind === "MAX_LOAD") return r.loadKg != null && r.loadKg > 0 ? r.loadKg : null;
  if (kind === "TIME") return r.timeSeconds != null && r.timeSeconds > 0 ? r.timeSeconds : null;
  if (r.rounds == null && r.reps == null) return null;
  return (r.rounds ?? 0) * 1000 + (r.reps ?? 0);
}

function recordValue(kind: BenchmarkKind, r: BenchmarkResult) {
  if (kind === "MAX_LOAD") return { type: "WEIGHT" as const, value: String(r.loadKg), unit: "kg" };
  if (kind === "TIME") return { type: "TIME" as const, value: formatDuration(r.timeSeconds!), unit: null };
  return r.rounds != null
    ? { type: "REPS" as const, value: `${r.rounds}+${r.reps ?? 0}`, unit: null }
    : { type: "REPS" as const, value: String(r.reps), unit: "reps" };
}

function parseRecordScore(kind: BenchmarkKind, value: string, unit: string | null): number | null {
  if (kind === "MAX_LOAD") return parseRecordKg(value, unit);
  if (kind === "TIME") return parseDuration(value);
  const match = value.trim().match(/^(\d+)(?:\s*\+\s*(\d+))?$/);
  if (!match) return null;
  return match[2] != null ? Number(match[1]) * 1000 + Number(match[2]) : Number(match[1]);
}
