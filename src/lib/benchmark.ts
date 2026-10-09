import type { BenchmarkKind, Prisma } from "@prisma/client";
import { formatDuration, parseDuration, parseRecordKg } from "@/lib/blocks";

type BenchmarkBlock = { benchmark: BenchmarkKind | null; benchmarkReps: number | null; exerciseId: string | null };
type BenchmarkResult = { id: string; done: boolean; loadKg: number | null; timeSeconds: number | null };

/**
 * Keeps the student's record in sync with a benchmark result: the record saved from
 * this result follows its edits, otherwise a new record is created when it beats the
 * best one (heavier for max load, faster for time). Returns true when a record was written.
 */
export async function syncBenchmarkRecord(
  tx: Prisma.TransactionClient,
  block: BenchmarkBlock,
  result: BenchmarkResult,
  studentId: string,
  date: Date
): Promise<boolean> {
  if (!block.benchmark || !block.exerciseId) return false;
  const isLoad = block.benchmark === "MAX_LOAD";
  const score = isLoad ? result.loadKg : result.timeSeconds;
  const linked = await tx.personalRecord.findFirst({ where: { sourceResultId: result.id } });

  if (!result.done || score == null || score <= 0) {
    if (linked) await tx.personalRecord.delete({ where: { id: linked.id } });
    return false;
  }

  const reps = isLoad ? (block.benchmarkReps ?? 1) : null;
  const value = isLoad ? String(score) : formatDuration(score);
  const data = { type: isLoad ? ("WEIGHT" as const) : ("TIME" as const), value, unit: isLoad ? "kg" : null, reps };

  if (linked) {
    await tx.personalRecord.update({ where: { id: linked.id }, data: { ...data, exerciseId: block.exerciseId } });
    return true;
  }

  const others = await tx.personalRecord.findMany({
    where: {
      studentId,
      exerciseId: block.exerciseId,
      type: data.type,
      ...(isLoad ? (reps === 1 ? { OR: [{ reps: null }, { reps: 1 }] } : { reps }) : {}),
    },
    select: { value: true, unit: true },
  });
  const previous = others
    .map((r) => (isLoad ? parseRecordKg(r.value, r.unit) : parseDuration(r.value)))
    .filter((v): v is number => v != null && !Number.isNaN(v));
  const best = previous.length === 0 ? null : isLoad ? Math.max(...previous) : Math.min(...previous);
  if (best != null && (isLoad ? score <= best : score >= best)) return false;

  await tx.personalRecord.create({
    data: { ...data, studentId, exerciseId: block.exerciseId, recordDate: date, sourceResultId: result.id },
  });
  return true;
}
