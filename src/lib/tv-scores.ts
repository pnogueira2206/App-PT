import type { BenchmarkKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseDuration } from "@/lib/blocks";
import { syncBenchmarkRecord } from "@/lib/benchmark";
import type { CalendarOwner } from "@/lib/workouts";

/** What the coach types on the TV for a block: one number for benchmarks, free text otherwise. */
export type TvScoreKind = BenchmarkKind | "TEXT";

const resultInclude = { sets: true } as const;

/**
 * A block of a group's or student's calendar as the TV scoring screen needs it:
 * the athletes (active group members, or the student) and, for each, the block
 * their score goes to — a member's adjusted version of a group workout has its
 * own copy of the block.
 */
export async function loadTvBlock(trainerId: string, owner: CalendarOwner, blockId: string) {
  const block = await prisma.workoutBlock.findUnique({
    where: { id: blockId },
    include: { workout: { include: { group: { include: { members: { include: { student: true } } } } } } },
  });
  if (!block || block.workout.trainerId !== trainerId || block.workout.kind !== "TRAINING") return null;
  const workout = block.workout;

  let athletes: { id: string; name: string }[];
  if (owner.type === "group") {
    if (workout.groupId !== owner.id) return null;
    athletes = (workout.group?.members ?? [])
      .filter((m) => !m.student.archivedAt)
      .map((m) => ({ id: m.student.id, name: m.student.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } else {
    const student = await prisma.user.findFirst({ where: { id: owner.id, trainerId, role: "STUDENT" } });
    const visible =
      !!student &&
      (workout.studentId === owner.id || !!workout.group?.members.some((m) => m.studentId === owner.id));
    if (!visible) return null;
    athletes = [{ id: student.id, name: student.name }];
  }

  // Members with an adjusted version of this group workout score on their own copy of the block.
  const overrides = workout.groupId
    ? await prisma.workout.findMany({
        where: { sourceWorkoutId: workout.id, studentId: { in: athletes.map((a) => a.id) } },
        include: { blocks: true },
      })
    : [];

  const rows = await Promise.all(
    athletes.map(async (athlete) => {
      const override = overrides.find((o) => o.studentId === athlete.id);
      const target =
        override?.blocks.find((b) => b.order === block.order && b.title === block.title) ??
        override?.blocks.find((b) => b.order === block.order) ??
        block;
      const result = await prisma.blockResult.findUnique({
        where: { blockId_studentId: { blockId: target.id, studentId: athlete.id } },
        include: resultInclude,
      });
      return { ...athlete, targetBlockId: target.id, result };
    })
  );

  const kind: TvScoreKind = block.benchmark ?? "TEXT";
  return { block, workout, kind, athletes: rows };
}

/**
 * Saves the scores typed on the TV. Empty rows are left alone; a value that
 * can't be read (e.g. "abc" as a time) is skipped and counted.
 */
export async function saveTvScores(
  trainerId: string,
  owner: CalendarOwner,
  blockId: string,
  form: FormData
): Promise<{ saved: number; invalid: number } | null> {
  const loaded = await loadTvBlock(trainerId, owner, blockId);
  if (!loaded) return null;
  const { kind, athletes, workout } = loaded;
  let saved = 0;
  let invalid = 0;

  for (const athlete of athletes) {
    const field = (name: string) => String(form.get(`${name}_${athlete.id}`) ?? "").trim();
    let data: { loadKg?: number; timeSeconds?: number; rounds?: number | null; reps?: number | null; scoreText?: string };
    if (kind === "MAX_LOAD") {
      const raw = field("kg");
      if (!raw) continue;
      const kg = Number(raw.replace(",", "."));
      if (!Number.isFinite(kg) || kg <= 0) { invalid++; continue; }
      data = { loadKg: kg };
    } else if (kind === "TIME") {
      const raw = field("time");
      if (!raw) continue;
      const seconds = parseDuration(raw);
      if (seconds == null || Number.isNaN(seconds) || seconds <= 0) { invalid++; continue; }
      data = { timeSeconds: seconds };
    } else if (kind === "ROUNDS_REPS") {
      const rawRounds = field("rounds");
      const rawReps = field("reps");
      if (!rawRounds && !rawReps) continue;
      const rounds = rawRounds ? Number(rawRounds) : null;
      const reps = rawReps ? Number(rawReps) : null;
      if ([rounds, reps].some((n) => n != null && (!Number.isInteger(n) || n < 0))) { invalid++; continue; }
      data = { rounds, reps };
    } else {
      const text = field("text");
      if (!text) continue;
      data = { scoreText: text.slice(0, 500) };
    }

    await prisma.$transaction(async (tx) => {
      const values = { done: true, ...data, seenAt: new Date(), completedAt: new Date() };
      const result = await tx.blockResult.upsert({
        where: { blockId_studentId: { blockId: athlete.targetBlockId, studentId: athlete.id } },
        create: { blockId: athlete.targetBlockId, studentId: athlete.id, ...values },
        update: values,
      });
      const target = await tx.workoutBlock.findUniqueOrThrow({ where: { id: athlete.targetBlockId } });
      await syncBenchmarkRecord(tx, target, result, athlete.id, workout.date);
    });
    saved++;
  }
  return { saved, invalid };
}
