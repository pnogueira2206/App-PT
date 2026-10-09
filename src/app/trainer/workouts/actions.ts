"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma, WorkoutStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/i18n/server";
import { requireTrainer } from "@/lib/require-session";
import { parseDateKey } from "@/lib/dates";
import {
  isBlockType,
  isCardioModality,
  isMetconFormat,
  parseDuration,
} from "@/lib/blocks";
import { calendarPath, duplicateWorkout, type CalendarOwner } from "@/lib/workouts";

type ActionState = { error?: string; success?: string } | undefined;

function revalidateAll() {
  revalidatePath("/trainer", "layout");
  revalidatePath("/student", "layout");
}

async function requireOwnedWorkout(trainerId: string, workoutId: string) {
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, trainerId },
  });
  if (!workout) throw new Error("Not found");
  return workout;
}

async function resolveOwner(
  trainerId: string,
  target: string
): Promise<CalendarOwner | null> {
  const [kind, id] = target.split(":");
  if (!id) return null;
  if (kind === "group") {
    const group = await prisma.group.findFirst({ where: { id, trainerId } });
    return group ? { type: "group", id } : null;
  }
  if (kind === "student") {
    const student = await prisma.user.findFirst({
      where: { id, trainerId, role: "STUDENT" },
    });
    return student ? { type: "student", id } : null;
  }
  return null;
}

export async function createWorkoutAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getI18n();
  const session = await requireTrainer();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const date = parseDateKey(String(formData.get("date") ?? ""));
  const target = String(formData.get("target") ?? "");

  if (!title) return { error: t("errors.workoutTitle") };
  if (!date) return { error: t("errors.workoutDay") };
  if (!target) return { error: t("errors.workoutTarget") };

  const owner = await resolveOwner(session.user.id, target);
  if (!owner) return { error: t("errors.invalidTarget") };

  const workout = await prisma.workout.create({
    data: {
      title,
      description: description || null,
      date,
      trainerId: session.user.id,
      groupId: owner.type === "group" ? owner.id : null,
      studentId: owner.type === "student" ? owner.id : null,
    },
  });

  revalidateAll();
  redirect(`/trainer/workouts/${workout.id}`);
}

export async function updateWorkoutDetailsAction(
  workoutId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getI18n();
  const session = await requireTrainer();
  await requireOwnedWorkout(session.user.id, workoutId);

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const warmup = String(formData.get("warmup") ?? "").trim();
  const cooldown = String(formData.get("cooldown") ?? "").trim();
  const date = parseDateKey(String(formData.get("date") ?? ""));

  if (!title) return { error: t("errors.workoutTitle") };
  if (!date) return { error: t("errors.workoutDay") };

  await prisma.workout.update({
    where: { id: workoutId },
    data: { title, description: description || null, warmup: warmup || null, cooldown: cooldown || null, date },
  });

  revalidateAll();
  return { success: t("success.workoutUpdated") };
}

export async function setWorkoutStatusAction(workoutId: string, status: WorkoutStatus) {
  const session = await requireTrainer();
  await requireOwnedWorkout(session.user.id, workoutId);

  await prisma.workout.update({ where: { id: workoutId }, data: { status } });
  revalidateAll();
}

export async function deleteWorkoutAction(workoutId: string) {
  const session = await requireTrainer();
  const workout = await requireOwnedWorkout(session.user.id, workoutId);

  await prisma.workout.delete({ where: { id: workoutId } });
  revalidateAll();

  const ownerId = workout.studentId ?? workout.groupId;
  if (!ownerId) redirect("/trainer/workouts");
  redirect(
    calendarPath(
      { type: workout.studentId ? "student" : "group", id: ownerId },
      workout.date
    )
  );
}

/** Creates (or opens) an individual version of a group workout for one member. */
export async function createOverrideAction(workoutId: string, studentId: string) {
  const session = await requireTrainer();
  const workout = await requireOwnedWorkout(session.user.id, workoutId);
  if (!workout.groupId) throw new Error("Not a group workout");

  const member = await prisma.groupMember.findUnique({
    where: { groupId_studentId: { groupId: workout.groupId, studentId } },
  });
  if (!member) throw new Error("Not a member");

  const existing = await prisma.workout.findFirst({
    where: { sourceWorkoutId: workoutId, studentId },
  });
  if (existing) redirect(`/trainer/workouts/${existing.id}`);

  const override = await prisma.$transaction((tx) =>
    duplicateWorkout(tx, workoutId, {
      owner: { type: "student", id: studentId },
      date: workout.date,
      sourceWorkoutId: workoutId,
      status: workout.status,
    })
  );

  revalidateAll();
  redirect(`/trainer/workouts/${override.id}`);
}

// ---------- Blocks ----------

function optionalInt(formData: FormData, name: string): number | null | "invalid" {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : "invalid";
}

function optionalFloat(formData: FormData, name: string): number | null | "invalid" {
  const raw = String(formData.get(name) ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : "invalid";
}

function optionalText(formData: FormData, name: string): string | null {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

function optionalDuration(formData: FormData, name: string): number | null | "invalid" {
  const value = parseDuration(String(formData.get(name) ?? ""));
  return Number.isNaN(value) ? "invalid" : value;
}

type BlockFields = Omit<Prisma.WorkoutBlockUncheckedCreateInput, "workoutId" | "order">;

async function parseBlockForm(
  trainerId: string,
  formData: FormData
): Promise<{ data: BlockFields } | { error: string }> {
  const { t } = await getI18n();
  const type = String(formData.get("type") ?? "");
  if (!isBlockType(type)) return { error: t("errors.invalidBlockType") };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: t("errors.blockTitle") };

  const sets = optionalInt(formData, "prescribedSets");
  const percent1RM = optionalFloat(formData, "percent1RM");
  const rest = optionalDuration(formData, "restSeconds");
  const timeCap = optionalDuration(formData, "timeCapSeconds");
  const distance = optionalInt(formData, "targetDistanceM");
  const targetTime = optionalDuration(formData, "targetTimeSeconds");
  const calories = optionalInt(formData, "targetCalories");

  if (sets === "invalid") return { error: t("errors.invalidSets") };
  if (percent1RM === "invalid" || (percent1RM != null && percent1RM > 200)) {
    return { error: t("errors.invalidPercent") };
  }
  if (rest === "invalid") return { error: t("errors.invalidRest") };
  if (timeCap === "invalid") return { error: t("errors.invalidDuration") };
  if (distance === "invalid") return { error: t("errors.invalidDistance") };
  if (targetTime === "invalid") return { error: t("errors.invalidTargetTime") };
  if (calories === "invalid") return { error: t("errors.invalidCalories") };

  const metconFormat = String(formData.get("metconFormat") ?? "");
  const cardioModality = String(formData.get("cardioModality") ?? "");

  const exerciseName = String(formData.get("exerciseName") ?? "").trim();
  let exerciseId: string | null = null;
  if (exerciseName) {
    const exercise = await prisma.exercise.upsert({
      where: { trainerId_name: { trainerId, name: exerciseName } },
      create: { name: exerciseName, trainerId },
      update: {},
    });
    exerciseId = exercise.id;
  }

  const usesSets = type === "STRENGTH" || type === "ACCESSORY";

  return {
    data: {
      type,
      title,
      exerciseId,
      description: optionalText(formData, "description"),
      trainerNotes: optionalText(formData, "trainerNotes"),
      prescribedSets: usesSets ? sets : null,
      prescribedReps: usesSets ? optionalText(formData, "prescribedReps") : null,
      prescribedWeight: usesSets ? optionalText(formData, "prescribedWeight") : null,
      percent1RM: type === "STRENGTH" ? percent1RM : null,
      tempo: type === "STRENGTH" ? optionalText(formData, "tempo") : null,
      restSeconds: usesSets || type === "CARDIO" ? rest : null,
      metconFormat: type === "METCON" && isMetconFormat(metconFormat) ? metconFormat : null,
      timeCapSeconds: type === "METCON" ? timeCap : null,
      cardioModality:
        type === "CARDIO" && isCardioModality(cardioModality) ? cardioModality : null,
      targetDistanceM: type === "CARDIO" ? distance : null,
      targetTimeSeconds: type === "CARDIO" ? targetTime : null,
      targetCalories: type === "CARDIO" ? calories : null,
      targetPace: type === "CARDIO" ? optionalText(formData, "targetPace") : null,
    },
  };
}

export async function addBlockAction(
  workoutId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getI18n();
  const session = await requireTrainer();
  await requireOwnedWorkout(session.user.id, workoutId);

  const parsed = await parseBlockForm(session.user.id, formData);
  if ("error" in parsed) return parsed;

  const last = await prisma.workoutBlock.findFirst({
    where: { workoutId },
    orderBy: { order: "desc" },
  });

  await prisma.workoutBlock.create({
    data: { ...parsed.data, workoutId, order: (last?.order ?? 0) + 1 },
  });

  revalidateAll();
  return { success: t("success.blockAdded") };
}

export async function updateBlockAction(
  workoutId: string,
  blockId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getI18n();
  const session = await requireTrainer();
  await requireOwnedWorkout(session.user.id, workoutId);

  const parsed = await parseBlockForm(session.user.id, formData);
  if ("error" in parsed) return parsed;

  const { count } = await prisma.workoutBlock.updateMany({
    where: { id: blockId, workoutId },
    data: parsed.data,
  });
  if (count === 0) return { error: t("errors.blockNotFound") };

  revalidateAll();
  return { success: t("success.blockUpdated") };
}

export async function deleteBlockAction(workoutId: string, blockId: string) {
  const session = await requireTrainer();
  await requireOwnedWorkout(session.user.id, workoutId);

  await prisma.workoutBlock.deleteMany({ where: { id: blockId, workoutId } });
  revalidateAll();
}

export async function duplicateBlockAction(workoutId: string, blockId: string) {
  const session = await requireTrainer();
  await requireOwnedWorkout(session.user.id, workoutId);

  const block = await prisma.workoutBlock.findFirst({ where: { id: blockId, workoutId } });
  if (!block) throw new Error("Not found");

  const { id: _id, ...rest } = block;
  await prisma.$transaction([
    prisma.workoutBlock.updateMany({
      where: { workoutId, order: { gt: block.order } },
      data: { order: { increment: 1 } },
    }),
    prisma.workoutBlock.create({ data: { ...rest, order: block.order + 1 } }),
  ]);
  revalidateAll();
}

export async function moveBlockAction(
  workoutId: string,
  blockId: string,
  direction: "up" | "down"
) {
  const session = await requireTrainer();
  await requireOwnedWorkout(session.user.id, workoutId);

  const blocks = await prisma.workoutBlock.findMany({
    where: { workoutId },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  const index = blocks.findIndex((b) => b.id === blockId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= blocks.length) return;

  [blocks[index], blocks[swapWith]] = [blocks[swapWith], blocks[index]];
  // Rewrite the order as 1..n so gaps or duplicates from older data disappear.
  await prisma.$transaction(
    blocks.map((b, i) =>
      prisma.workoutBlock.update({ where: { id: b.id }, data: { order: i + 1 } })
    )
  );
  revalidateAll();
}

// ---------- Day editor (CoachRx-style panel) ----------

/** Library exercise with this name (case-insensitive), created when missing. */
async function findOrCreateExercise(
  tx: Prisma.TransactionClient,
  trainerId: string,
  name: string,
  benchmark: "MAX_LOAD" | "TIME"
): Promise<string> {
  const clean = name.slice(0, 120);
  const existing = await tx.exercise.findFirst({
    where: { trainerId, name: { equals: clean, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await tx.exercise.create({
    data: { trainerId, name: clean, category: benchmark === "MAX_LOAD" ? "STRENGTH" : "OTHER" },
  });
  return created.id;
}

/** A block as the panel edits it: a title and a free-text prescription. */
export type EditorBlockInput = {
  id?: string;
  /** Only used when creating ("+ Exercise" → STRENGTH, "+ Conditioning" → METCON). */
  type: string;
  title: string;
  description: string;
  benchmark: "MAX_LOAD" | "TIME" | null;
  /** MAX_LOAD only (1 = 1RM). */
  benchmarkReps: number | null;
  /** Benchmark only: the exercise whose record it updates (defaults to the title). */
  exerciseName: string;
};

export type WorkoutEditorInput = {
  owner: CalendarOwner;
  date: string;
  workoutId?: string;
  title: string;
  description: string;
  warmup: string;
  cooldown: string;
  publish: boolean;
  blocks: EditorBlockInput[];
  removedBlockIds: string[];
};

const text = (value: string, max: number) => value.trim().slice(0, max) || null;

/**
 * Saves a whole workout from the day editor: creates it if needed, updates the
 * edited block fields (keeping structured fields set in the full editor),
 * creates new blocks, deletes only the blocks the trainer removed, and
 * renumbers them in the order shown.
 */
export async function saveWorkoutEditorAction(
  input: WorkoutEditorInput
): Promise<{ error?: string; workoutId?: string }> {
  const session = await requireTrainer();
  const { t } = await getI18n();
  const trainerId = session.user.id;

  const date = parseDateKey(input.date);
  if (!date) return { error: t("errors.workoutDay") };
  const owner = await resolveOwner(trainerId, `${input.owner.type}:${input.owner.id}`);
  if (!owner) return { error: t("errors.invalidTarget") };

  const blocks = input.blocks.filter((b) => b.title.trim() || b.description.trim());
  if (blocks.some((b) => !b.title.trim())) return { error: t("errors.blockTitle") };

  let workoutId = input.workoutId;
  if (workoutId) await requireOwnedWorkout(trainerId, workoutId);

  // Untitled workouts take the first line of the day's focus ("Lower"), else a default.
  let title = input.title.trim();
  if (!title) {
    const focus = await prisma.trainingDay.findFirst({
      where: {
        ...(owner.type === "student" ? { studentId: owner.id } : { groupId: owner.id }),
        weekday: (date.getUTCDay() + 6) % 7,
      },
    });
    title = focus?.focus.split("\n")[0]?.trim() || t("calendar.defaultTitle");
  }

  const fields = {
    title: title.slice(0, 200),
    description: text(input.description, 5000),
    warmup: text(input.warmup, 5000),
    cooldown: text(input.cooldown, 5000),
    status: input.publish ? ("PUBLISHED" as const) : ("DRAFT" as const),
  };

  await prisma.$transaction(async (tx) => {
    if (workoutId) {
      await tx.workout.update({ where: { id: workoutId }, data: fields });
    } else {
      const created = await tx.workout.create({
        data: {
          ...fields,
          date,
          trainerId,
          studentId: owner.type === "student" ? owner.id : null,
          groupId: owner.type === "group" ? owner.id : null,
        },
      });
      workoutId = created.id;
    }

    if (input.removedBlockIds.length > 0) {
      await tx.workoutBlock.deleteMany({ where: { id: { in: input.removedBlockIds }, workoutId } });
    }
    for (const [index, block] of blocks.entries()) {
      // Type, notes and structured fields set in the full editor are left untouched.
      const benchmark = block.benchmark === "MAX_LOAD" || block.benchmark === "TIME" ? block.benchmark : null;
      const data = {
        order: index + 1,
        title: block.title.trim().slice(0, 200),
        description: text(block.description, 5000),
        benchmark,
        benchmarkReps:
          benchmark === "MAX_LOAD" ? Math.min(Math.max(Math.round(block.benchmarkReps ?? 1), 1), 20) : null,
        // A benchmark is tied to an exercise so the score lands on the right record.
        ...(benchmark
          ? { exerciseId: await findOrCreateExercise(tx, trainerId, block.exerciseName.trim() || block.title.trim(), benchmark) }
          : {}),
      };
      if (block.id) {
        await tx.workoutBlock.updateMany({ where: { id: block.id, workoutId }, data });
      } else {
        const type = isBlockType(block.type) ? block.type : "STRENGTH";
        await tx.workoutBlock.create({
          data: { ...data, type, metconFormat: type === "METCON" ? "FOR_TIME" : null, workoutId: workoutId! },
        });
      }
    }
  });

  revalidateAll();
  return { workoutId };
}
