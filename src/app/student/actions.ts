"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/i18n/server";
import { requireStudent } from "@/lib/require-session";
import { parseDuration } from "@/lib/blocks";
import { findStudentWorkout } from "@/lib/workouts";

type ActionState = { error?: string; success?: string } | undefined;

function intField(formData: FormData, name: string, max = 100000): number | null | "invalid" {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 && value <= max ? value : "invalid";
}

function floatField(formData: FormData, name: string): number | null | "invalid" {
  const raw = String(formData.get(name) ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 && value <= 100000 ? value : "invalid";
}

function durationField(formData: FormData, name: string): number | null | "invalid" {
  const value = parseDuration(String(formData.get(name) ?? ""));
  return Number.isNaN(value) ? "invalid" : value;
}

export async function submitResultAction(
  blockId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getI18n();
  const session = await requireStudent();
  const studentId = session.user.id;

  const block = await prisma.workoutBlock.findUnique({ where: { id: blockId } });
  if (!block || !(await findStudentWorkout(block.workoutId, studentId))) {
    return { error: t("errors.blockNotFound") };
  }

  const done = formData.get("done") !== "false";
  const rpe = intField(formData, "rpe", 10);
  const timeSeconds = durationField(formData, "timeSeconds");
  const rounds = intField(formData, "rounds");
  const reps = intField(formData, "reps");
  const loadKg = floatField(formData, "loadKg");
  const distanceM = floatField(formData, "distanceM");
  const calories = intField(formData, "calories");
  const rxRaw = String(formData.get("rx") ?? "");

  if (rpe === "invalid") return { error: t("errors.invalidRpe") };
  if (timeSeconds === "invalid") return { error: t("errors.invalidTime") };
  if (rounds === "invalid" || reps === "invalid") return { error: t("errors.invalidRoundsReps") };
  if (loadKg === "invalid") return { error: t("errors.invalidLoad") };
  if (distanceM === "invalid") return { error: t("errors.invalidDistance") };
  if (calories === "invalid") return { error: t("errors.invalidCalories") };

  // Set rows come in as setReps[] / setLoad[] pairs (strength and accessory blocks).
  const setReps = formData.getAll("setReps").map(String);
  const setLoads = formData.getAll("setLoad").map(String);
  const sets: { setNumber: number; reps: number | null; loadKg: number | null }[] = [];
  for (let i = 0; i < Math.max(setReps.length, setLoads.length); i++) {
    const r = (setReps[i] ?? "").trim();
    const l = (setLoads[i] ?? "").trim().replace(",", ".");
    if (!r && !l) continue;
    const repsValue = r ? Number(r) : null;
    const loadValue = l ? Number(l) : null;
    if (repsValue != null && (!Number.isInteger(repsValue) || repsValue < 0)) {
      return { error: t("errors.invalidSetReps", { number: i + 1 }) };
    }
    if (loadValue != null && (!Number.isFinite(loadValue) || loadValue < 0)) {
      return { error: t("errors.invalidSetLoad", { number: i + 1 }) };
    }
    sets.push({ setNumber: sets.length + 1, reps: repsValue, loadKg: loadValue });
  }

  const usesSets = block.type === "STRENGTH" || block.type === "ACCESSORY";
  const data = {
    done,
    rpe,
    timeSeconds: block.type === "METCON" || block.type === "CARDIO" ? timeSeconds : null,
    rounds: block.type === "METCON" ? rounds : null,
    reps: block.type === "METCON" ? reps : null,
    loadKg: block.type === "METCON" ? loadKg : null,
    distanceM: block.type === "CARDIO" ? distanceM : null,
    calories: block.type === "CARDIO" ? calories : null,
    rx: block.type === "METCON" && rxRaw ? rxRaw === "rx" : null,
    scoreText: String(formData.get("scoreText") ?? "").trim() || null,
    studentNotes: String(formData.get("studentNotes") ?? "").trim() || null,
  };

  await prisma.$transaction(async (tx) => {
    const result = await tx.blockResult.upsert({
      where: { blockId_studentId: { blockId, studentId } },
      create: { blockId, studentId, ...data },
      // Editing a result makes it "new" again in the trainer's feed.
      update: { ...data, completedAt: new Date(), seenAt: null },
    });
    await tx.setLog.deleteMany({ where: { resultId: result.id } });
    if (usesSets && sets.length > 0) {
      await tx.setLog.createMany({
        data: sets.map((set) => ({ ...set, resultId: result.id })),
      });
    }
  });

  revalidatePath("/student", "layout");
  revalidatePath("/trainer", "layout");
  return { success: t("success.resultSaved") };
}

export async function completeWorkoutAction(
  workoutId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getI18n();
  const session = await requireStudent();
  const studentId = session.user.id;

  if (!(await findStudentWorkout(workoutId, studentId))) {
    return { error: t("errors.workoutNotFound") };
  }

  const sessionRpe = intField(formData, "sessionRpe", 10);
  if (sessionRpe === "invalid") return { error: t("errors.invalidRpe") };
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await prisma.workoutCompletion.upsert({
    where: { workoutId_studentId: { workoutId, studentId } },
    create: { workoutId, studentId, sessionRpe, notes },
    update: { sessionRpe, notes, seenAt: null },

  });

  revalidatePath("/student", "layout");
  revalidatePath("/trainer", "layout");
  return { success: t("success.workoutCompleted") };
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getI18n();
  const session = await requireStudent();

  const dateOfBirthRaw = String(formData.get("dateOfBirth") ?? "");
  const weightRaw = String(formData.get("weightKg") ?? "").trim();
  const heightRaw = String(formData.get("heightCm") ?? "").trim();

  const weightKg = weightRaw ? Number(weightRaw.replace(",", ".")) : null;
  const heightCm = heightRaw ? Number(heightRaw.replace(",", ".")) : null;

  if (weightRaw && (Number.isNaN(weightKg) || (weightKg as number) <= 0)) {
    return { error: t("errors.invalidWeight") };
  }
  if (heightRaw && (Number.isNaN(heightCm) || (heightCm as number) <= 0)) {
    return { error: t("errors.invalidHeight") };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      dateOfBirth: dateOfBirthRaw ? new Date(dateOfBirthRaw) : null,
      weightKg,
      heightCm,
    },
  });

  revalidatePath("/student/profile");
  return { success: t("success.dataUpdated") };
}

export async function addPersonalRecordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getI18n();
  const session = await requireStudent();

  const student = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!student?.trainerId) return { error: t("errors.noTrainer") };

  const exerciseName = String(formData.get("exerciseName") ?? "").trim();
  const type = String(formData.get("type") ?? "WEIGHT").trim();
  const value = String(formData.get("value") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const recordDateRaw = String(formData.get("recordDate") ?? "");

  if (!exerciseName || !value) {
    return { error: t("errors.recordRequired") };
  }
  if (type !== "WEIGHT" && type !== "TIME") {
    return { error: t("errors.invalidRecordType") };
  }

  const exercise = await prisma.exercise.upsert({
    where: { trainerId_name: { trainerId: student.trainerId, name: exerciseName } },
    create: { name: exerciseName, trainerId: student.trainerId },
    update: {},
  });

  await prisma.personalRecord.create({
    data: {
      studentId: session.user.id,
      exerciseId: exercise.id,
      type,
      value,
      unit: unit || null,
      notes: notes || null,
      recordDate: recordDateRaw ? new Date(recordDateRaw) : new Date(),
    },
  });

  revalidatePath("/student/profile");
  return { success: t("success.recordAdded") };
}

export async function updatePersonalRecordAction(
  recordId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getI18n();
  const session = await requireStudent();

  const record = await prisma.personalRecord.findFirst({
    where: { id: recordId, studentId: session.user.id },
  });
  if (!record) return { error: t("errors.recordNotFound") };

  const type = String(formData.get("type") ?? "WEIGHT").trim();
  const value = String(formData.get("value") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const recordDateRaw = String(formData.get("recordDate") ?? "");

  if (!value) return { error: t("errors.recordValueRequired") };
  if (type !== "WEIGHT" && type !== "TIME") {
    return { error: t("errors.invalidRecordType") };
  }

  await prisma.personalRecord.update({
    where: { id: recordId },
    data: {
      type,
      value,
      unit: unit || null,
      notes: notes || null,
      recordDate: recordDateRaw ? new Date(recordDateRaw) : record.recordDate,
    },
  });

  revalidatePath("/student/profile");
  return { success: t("success.recordUpdated") };
}

export async function deletePersonalRecordAction(recordId: string) {
  const session = await requireStudent();

  await prisma.personalRecord.deleteMany({
    where: { id: recordId, studentId: session.user.id },
  });

  revalidatePath("/student/profile");
}
