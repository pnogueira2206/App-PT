"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";

type ActionState = { error?: string; success?: string } | undefined;

export async function createWorkoutAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireTrainer();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dateRaw = String(formData.get("date") ?? "");
  const target = String(formData.get("target") ?? "");

  if (!title) return { error: "Indica um título para o treino." };
  if (!target) return { error: "Escolhe um grupo ou aluno." };

  const [kind, targetId] = target.split(":");
  if (!targetId) return { error: "Destinatário inválido." };

  if (kind === "group") {
    const group = await prisma.group.findFirst({
      where: { id: targetId, trainerId: session.user.id },
    });
    if (!group) return { error: "Grupo inválido." };
  } else if (kind === "student") {
    const student = await prisma.user.findFirst({
      where: { id: targetId, trainerId: session.user.id, role: "STUDENT" },
    });
    if (!student) return { error: "Aluno inválido." };
  } else {
    return { error: "Destinatário inválido." };
  }

  const workout = await prisma.workout.create({
    data: {
      title,
      description: description || null,
      date: dateRaw ? new Date(dateRaw) : null,
      trainerId: session.user.id,
      groupId: kind === "group" ? targetId : null,
      studentId: kind === "student" ? targetId : null,
    },
  });

  revalidatePath("/trainer/workouts");
  redirect(`/trainer/workouts/${workout.id}`);
}

export async function addBlockAction(
  workoutId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireTrainer();

  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, trainerId: session.user.id },
  });
  if (!workout) return { error: "Treino não encontrado." };

  const title = String(formData.get("title") ?? "").trim();
  const exerciseName = String(formData.get("exerciseName") ?? "").trim();
  const prescribedSets = formData.get("prescribedSets");
  const prescribedReps = String(formData.get("prescribedReps") ?? "").trim();
  const prescribedWeight = String(formData.get("prescribedWeight") ?? "").trim();
  const restSeconds = formData.get("restSeconds");
  const trainerNotes = String(formData.get("trainerNotes") ?? "").trim();

  if (!title) return { error: "Indica um nome para o bloco." };

  let exerciseId: string | null = null;
  if (exerciseName) {
    const exercise = await prisma.exercise.upsert({
      where: {
        trainerId_name: { trainerId: session.user.id, name: exerciseName },
      },
      create: { name: exerciseName, trainerId: session.user.id },
      update: {},
    });
    exerciseId = exercise.id;
  }

  const count = await prisma.workoutBlock.count({ where: { workoutId } });

  await prisma.workoutBlock.create({
    data: {
      workoutId,
      order: count + 1,
      title,
      exerciseId,
      prescribedSets: prescribedSets ? Number(prescribedSets) : null,
      prescribedReps: prescribedReps || null,
      prescribedWeight: prescribedWeight || null,
      restSeconds: restSeconds ? Number(restSeconds) : null,
      trainerNotes: trainerNotes || null,
    },
  });

  revalidatePath(`/trainer/workouts/${workoutId}`);
  return { success: "Bloco adicionado." };
}

export async function deleteBlockAction(workoutId: string, formData: FormData) {
  const session = await requireTrainer();
  const blockId = String(formData.get("blockId") ?? "");

  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, trainerId: session.user.id },
  });
  if (!workout) throw new Error("Not found");

  await prisma.workoutBlock.delete({ where: { id: blockId } });
  revalidatePath(`/trainer/workouts/${workoutId}`);
}

export async function deleteWorkoutAction(workoutId: string) {
  const session = await requireTrainer();
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, trainerId: session.user.id },
  });
  if (!workout) throw new Error("Not found");

  await prisma.workout.delete({ where: { id: workoutId } });
  revalidatePath("/trainer/workouts");
  redirect("/trainer/workouts");
}
