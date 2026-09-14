"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/require-session";

type ActionState = { error?: string; success?: string } | undefined;

async function assertBlockAssignedToStudent(blockId: string, studentId: string) {
  const block = await prisma.workoutBlock.findUnique({
    where: { id: blockId },
    include: { workout: { include: { group: { include: { members: true } } } } },
  });
  if (!block) return null;

  const isDirect = block.workout.studentId === studentId;
  const isViaGroup = block.workout.group?.members.some((m) => m.studentId === studentId);
  if (!isDirect && !isViaGroup) return null;

  return block;
}

export async function submitResultAction(
  blockId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireStudent();

  const block = await assertBlockAssignedToStudent(blockId, session.user.id);
  if (!block) return { error: "Bloco não encontrado." };

  const setsCompleted = formData.get("setsCompleted");
  const repsCompleted = String(formData.get("repsCompleted") ?? "").trim();
  const weightUsed = String(formData.get("weightUsed") ?? "").trim();
  const rpe = formData.get("rpe");
  const studentNotes = String(formData.get("studentNotes") ?? "").trim();

  await prisma.blockResult.upsert({
    where: { blockId_studentId: { blockId, studentId: session.user.id } },
    create: {
      blockId,
      studentId: session.user.id,
      setsCompleted: setsCompleted ? Number(setsCompleted) : null,
      repsCompleted: repsCompleted || null,
      weightUsed: weightUsed || null,
      rpe: rpe ? Number(rpe) : null,
      studentNotes: studentNotes || null,
    },
    update: {
      setsCompleted: setsCompleted ? Number(setsCompleted) : null,
      repsCompleted: repsCompleted || null,
      weightUsed: weightUsed || null,
      rpe: rpe ? Number(rpe) : null,
      studentNotes: studentNotes || null,
      completedAt: new Date(),
    },
  });

  revalidatePath(`/student/workouts/${block.workoutId}`);
  return { success: "Resultado guardado." };
}

export async function addPersonalRecordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireStudent();

  const student = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!student?.trainerId) return { error: "Sem treinador associado." };

  const exerciseName = String(formData.get("exerciseName") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const recordDateRaw = String(formData.get("recordDate") ?? "");

  if (!exerciseName || !value) {
    return { error: "Indica o exercício e o valor do recorde." };
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
      value,
      unit: unit || null,
      notes: notes || null,
      recordDate: recordDateRaw ? new Date(recordDateRaw) : new Date(),
    },
  });

  revalidatePath("/student/records");
  return { success: "Recorde adicionado." };
}

export async function deletePersonalRecordAction(formData: FormData) {
  const session = await requireStudent();
  const id = String(formData.get("id") ?? "");

  await prisma.personalRecord.deleteMany({
    where: { id, studentId: session.user.id },
  });

  revalidatePath("/student/records");
}
