"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/i18n/server";
import { requireTrainer } from "@/lib/require-session";
import { isExerciseCategory } from "@/lib/blocks";
import type { Translate } from "@/i18n/translator";


type ActionState = { error?: string; success?: string } | undefined;

function parseExerciseForm(formData: FormData, t: Translate) {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "OTHER");
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) return { error: t("errors.exerciseName") } as const;
  if (!isExerciseCategory(category)) return { error: t("errors.invalidCategory") } as const;
  if (videoUrl) {
    let url: URL;
    try {
      url = new URL(videoUrl);
    } catch {
      return { error: t("errors.invalidVideo") } as const;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { error: t("errors.videoHttps") } as const;
    }
  }

  return {
    data: { name, category, videoUrl: videoUrl || null, notes: notes || null },
  } as const;
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createExerciseAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getI18n();
  const session = await requireTrainer();
  const parsed = parseExerciseForm(formData, t);
  if ("error" in parsed) return { error: parsed.error };

  try {
    await prisma.exercise.create({ data: { ...parsed.data, trainerId: session.user.id } });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: t("errors.exerciseExists") };
    throw error;
  }

  revalidatePath("/trainer/exercises");
  return { success: t("success.exerciseCreated") };
}

export async function updateExerciseAction(
  exerciseId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getI18n();
  const session = await requireTrainer();
  const parsed = parseExerciseForm(formData, t);
  if ("error" in parsed) return { error: parsed.error };

  try {
    const { count } = await prisma.exercise.updateMany({
      where: { id: exerciseId, trainerId: session.user.id },
      data: parsed.data,
    });
    if (count === 0) return { error: t("errors.exerciseNotFound") };
  } catch (error) {
    if (isUniqueViolation(error)) return { error: t("errors.exerciseExists") };
    throw error;
  }

  revalidatePath("/trainer", "layout");
  revalidatePath("/student", "layout");
  return { success: t("success.exerciseUpdated") };
}

export async function deleteExerciseAction(
  exerciseId: string,
  _prev: ActionState
): Promise<ActionState> {
  const { t } = await getI18n();
  const session = await requireTrainer();

  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, trainerId: session.user.id },
    include: { _count: { select: { personalRecords: true } } },
  });
  if (!exercise) return { error: t("errors.exerciseNotFound") };
  if (exercise._count.personalRecords > 0) {
    return { error: t("errors.exerciseHasRecords") };
  }

  // Blocks keep their content; they just lose the link to the exercise.
  await prisma.$transaction([
    prisma.workoutBlock.updateMany({ where: { exerciseId }, data: { exerciseId: null } }),
    prisma.exercise.delete({ where: { id: exerciseId } }),
  ]);

  revalidatePath("/trainer", "layout");
  return { success: t("success.exerciseDeleted") };
}
