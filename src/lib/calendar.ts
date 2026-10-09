import type { BlockType, CardioModality, MetconFormat, WorkoutKind, WorkoutStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addDays, todayKey } from "@/lib/dates";
import {
  completionState,
  getStudentGroupIds,
  studentWorkoutsWhere,
  withoutOverridden,
  type CalendarOwner,
  type CompletionState,
} from "@/lib/workouts";

/** Everything the multi-week grid shows for one workout. */
export type GridWorkout = {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  status: WorkoutStatus;
  kind: WorkoutKind;
  /** Inherited from a group (student calendar). */
  groupName: string | null;
  /** Owned by this calendar (can be copied/edited here). */
  owned: boolean;
  isOverride: boolean;
  state: CompletionState | null;
  /** Group calendars: members who completed it. */
  progress: { done: number; total: number } | null;
  blocks: {
    id: string;
    order: number;
    type: BlockType;
    title: string;
    exerciseName: string | null;
    description: string | null;
    prescribedSets: number | null;
    prescribedReps: string | null;
    prescribedWeight: string | null;
    percent1RM: number | null;
    tempo: string | null;
    restSeconds: number | null;
    metconFormat: MetconFormat | null;
    timeCapSeconds: number | null;
    cardioModality: CardioModality | null;
    targetDistanceM: number | null;
    targetTimeSeconds: number | null;
    targetCalories: number | null;
    targetPace: string | null;
  }[];
};

const blockSelect = {
  orderBy: { order: "asc" as const },
  include: { exercise: { select: { name: true } } },
};

type GridBlock = GridWorkout["blocks"][number];

function toBlocks(blocks: (Omit<GridBlock, "exerciseName"> & { exercise: { name: string } | null })[]): GridBlock[] {
  return blocks.map((b) => ({
    id: b.id,
    order: b.order,
    type: b.type,
    title: b.title,
    exerciseName: b.exercise?.name ?? null,
    description: b.description,
    prescribedSets: b.prescribedSets,
    prescribedReps: b.prescribedReps,
    prescribedWeight: b.prescribedWeight,
    percent1RM: b.percent1RM,
    tempo: b.tempo,
    restSeconds: b.restSeconds,
    metconFormat: b.metconFormat,
    timeCapSeconds: b.timeCapSeconds,
    cardioModality: b.cardioModality,
    targetDistanceM: b.targetDistanceM,
    targetTimeSeconds: b.targetTimeSeconds,
    targetCalories: b.targetCalories,
    targetPace: b.targetPace,
  }));
}


/** Workouts of a student or group calendar between `start` (inclusive) and `start + days`. */
export async function loadCalendar(
  trainerId: string,
  owner: CalendarOwner,
  start: Date,
  days: number
): Promise<GridWorkout[]> {
  const end = addDays(start, days);
  const today = todayKey();

  if (owner.type === "student") {
    const groupIds = await getStudentGroupIds(owner.id);
    const workouts = await prisma.workout
      .findMany({
        where: {
          ...studentWorkoutsWhere(owner.id, groupIds),
          trainerId,
          date: { gte: start, lt: end },
        },
        include: {
          group: { select: { name: true } },
          completions: { where: { studentId: owner.id }, select: { id: true } },
          blocks: {
            ...blockSelect,
            include: {
              ...blockSelect.include,
              _count: { select: { results: { where: { studentId: owner.id } } } },
            },
          },
        },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      })
      .then((list) => withoutOverridden(list, owner.id));

    return workouts.map((w) => ({
      id: w.id,
      title: w.title,
      description: w.description,
      date: w.date,
      status: w.status,
      kind: w.kind,
      groupName: w.group?.name ?? null,
      owned: w.studentId === owner.id,
      isOverride: !!w.sourceWorkoutId,
      state: completionState(w, today, {
        completed: w.completions.length > 0,
        resultsCount: w.blocks.reduce((n, b) => n + b._count.results, 0),
      }),
      progress: null,
      blocks: toBlocks(w.blocks),
    }));
  }

  const group = await prisma.group.findFirstOrThrow({
    where: { id: owner.id, trainerId },
    include: { members: { where: { student: { archivedAt: null } }, select: { studentId: true } } },
  });
  const memberIds = new Set(group.members.map((m) => m.studentId));
  const workouts = await prisma.workout.findMany({
    where: { trainerId, groupId: owner.id, date: { gte: start, lt: end } },
    include: {
      completions: { select: { studentId: true } },
      overrides: { select: { completions: { select: { studentId: true } } } },
      blocks: blockSelect,
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  return workouts.map((w) => {
    // Members who completed the group workout or their adjusted version of it.
    const done = new Set(
      [...w.completions, ...w.overrides.flatMap((o) => o.completions)]
        .map((c) => c.studentId)
        .filter((id) => memberIds.has(id))
    );
    return {
      id: w.id,
      title: w.title,
      description: w.description,
      date: w.date,
      status: w.status,
      kind: w.kind,
      groupName: null,
      owned: true,
      isOverride: false,
      state: w.kind === "REST" ? "rest" : null,
      progress:
        w.kind === "TRAINING" && w.status === "PUBLISHED" && memberIds.size > 0
          ? { done: done.size, total: memberIds.size }
          : null,
      blocks: toBlocks(w.blocks),
    };
  });
}
