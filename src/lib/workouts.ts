import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseRecordKg } from "@/lib/blocks";
import { toDateKey } from "@/lib/dates";

export type CalendarOwner = { type: "student" | "group"; id: string };

export function calendarPath(owner: CalendarOwner, date?: Date): string {
  const base = owner.type === "student" ? "/trainer/students" : "/trainer/groups";
  return `${base}/${owner.id}${date ? `?week=${toDateKey(date)}` : ""}`;
}

export type CompletionState = "done" | "partial" | "missed" | "pending" | "rest";

export async function getStudentGroupIds(studentId: string): Promise<string[]> {
  const memberships = await prisma.groupMember.findMany({
    where: { studentId },
    select: { groupId: true },
  });
  return memberships.map((m) => m.groupId);
}

/** Workouts a student receives: their own plus their groups'. */
export function studentWorkoutsWhere(
  studentId: string,
  groupIds: string[],
  options: { publishedOnly?: boolean } = {}
): Prisma.WorkoutWhereInput {
  return {
    OR: [{ studentId }, { groupId: { in: groupIds } }],
    ...(options.publishedOnly ? { status: "PUBLISHED" } : {}),
  };
}

/**
 * Drops group workouts that were adjusted for this student: the individual
 * version replaces the group one (whatever the status of either).
 */
export async function withoutOverridden<T extends { id: string; groupId: string | null }>(
  workouts: T[],
  studentId: string
): Promise<T[]> {
  const groupWorkoutIds = workouts.filter((w) => w.groupId).map((w) => w.id);
  if (groupWorkoutIds.length === 0) return workouts;

  const overrides = await prisma.workout.findMany({
    where: { studentId, sourceWorkoutId: { in: groupWorkoutIds } },
    select: { sourceWorkoutId: true },
  });
  const overridden = new Set(overrides.map((o) => o.sourceWorkoutId));
  return workouts.filter((w) => !overridden.has(w.id));
}

export function completionState(
  workout: { date: Date; status: string; kind?: string },
  todayKeyValue: string,
  info: { completed: boolean; resultsCount: number }
): CompletionState {
  if (workout.kind === "REST") return "rest";
  if (info.completed) return "done";
  if (info.resultsCount > 0) return "partial";
  if (workout.status === "PUBLISHED" && workout.date.toISOString().slice(0, 10) < todayKeyValue) {
    return "missed";
  }
  return "pending";
}

/** Published workout visible to the student, unless it was replaced by an individual version. */
export async function findStudentWorkout(workoutId: string, studentId: string) {
  const workout = await prisma.workout.findFirst({
    where: {
      id: workoutId,
      status: "PUBLISHED",
      kind: "TRAINING",
      OR: [{ studentId }, { group: { members: { some: { studentId } } } }],
    },
  });
  if (!workout) return null;
  if (workout.groupId) {
    const override = await prisma.workout.findFirst({
      where: { sourceWorkoutId: workout.id, studentId },
      select: { id: true },
    });
    if (override) return null;
  }
  return workout;
}

/** Best numeric weight record (kg) per exercise, used to turn %1RM into kg. */
export async function getOneRepMaxes(
  studentId: string,
  exerciseIds: string[]
): Promise<Map<string, number>> {
  const maxes = new Map<string, number>();
  if (exerciseIds.length === 0) return maxes;

  const records = await prisma.personalRecord.findMany({
    where: { studentId, type: "WEIGHT", exerciseId: { in: exerciseIds } },
    select: { exerciseId: true, value: true, unit: true },
  });
  for (const record of records) {
    const kg = parseRecordKg(record.value, record.unit);
    if (kg == null) continue;
    maxes.set(record.exerciseId, Math.max(kg, maxes.get(record.exerciseId) ?? 0));
  }
  return maxes;
}

/** Copies a workout (with its blocks, without results) to another calendar/day as a draft. */
export async function duplicateWorkout(
  tx: Prisma.TransactionClient,
  sourceId: string,
  target: { owner: CalendarOwner; date: Date; sourceWorkoutId?: string; status?: "DRAFT" | "PUBLISHED" }
) {
  const source = await tx.workout.findUniqueOrThrow({
    where: { id: sourceId },
    include: { blocks: { orderBy: { order: "asc" } } },
  });

  return tx.workout.create({
    data: {
      title: source.title,
      description: source.description,
      warmup: source.warmup,
      cooldown: source.cooldown,
      date: target.date,
      kind: source.kind,
      status: target.status ?? "DRAFT",
      trainerId: source.trainerId,
      studentId: target.owner.type === "student" ? target.owner.id : null,
      groupId: target.owner.type === "group" ? target.owner.id : null,
      sourceWorkoutId: target.sourceWorkoutId ?? null,
      blocks: {
        create: source.blocks.map((block) => {
          const { id: _id, workoutId: _workoutId, ...rest } = block;
          return rest;
        }),
      },
    },
  });
}
