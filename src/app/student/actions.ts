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

  const scoreText = String(formData.get("scoreText") ?? "").trim();
  const studentNotes = String(formData.get("studentNotes") ?? "").trim();

  await prisma.blockResult.upsert({
    where: { blockId_studentId: { blockId, studentId: session.user.id } },
    create: {
      blockId,
      studentId: session.user.id,
      scoreText: scoreText || null,
      studentNotes: studentNotes || null,
    },
    update: {
      scoreText: scoreText || null,
      studentNotes: studentNotes || null,
      completedAt: new Date(),
    },
  });

  revalidatePath(`/student/workouts/${block.workoutId}`);
  return { success: "Resultado guardado." };
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireStudent();

  const dateOfBirthRaw = String(formData.get("dateOfBirth") ?? "");
  const weightRaw = String(formData.get("weightKg") ?? "").trim();
  const heightRaw = String(formData.get("heightCm") ?? "").trim();

  const weightKg = weightRaw ? Number(weightRaw.replace(",", ".")) : null;
  const heightCm = heightRaw ? Number(heightRaw.replace(",", ".")) : null;

  if (weightRaw && (Number.isNaN(weightKg) || (weightKg as number) <= 0)) {
    return { error: "Peso inválido." };
  }
  if (heightRaw && (Number.isNaN(heightCm) || (heightCm as number) <= 0)) {
    return { error: "Altura inválida." };
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
  return { success: "Dados atualizados." };
}

export async function addPersonalRecordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireStudent();

  const student = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!student?.trainerId) return { error: "Sem treinador associado." };

  const exerciseName = String(formData.get("exerciseName") ?? "").trim();
  const type = String(formData.get("type") ?? "WEIGHT").trim();
  const value = String(formData.get("value") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const recordDateRaw = String(formData.get("recordDate") ?? "");

  if (!exerciseName || !value) {
    return { error: "Indica o exercício/treino e o valor do recorde." };
  }
  if (type !== "WEIGHT" && type !== "TIME") {
    return { error: "Tipo de recorde inválido." };
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
  return { success: "Recorde adicionado." };
}

export async function updatePersonalRecordAction(
  recordId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireStudent();

  const record = await prisma.personalRecord.findFirst({
    where: { id: recordId, studentId: session.user.id },
  });
  if (!record) return { error: "Recorde não encontrado." };

  const type = String(formData.get("type") ?? "WEIGHT").trim();
  const value = String(formData.get("value") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const recordDateRaw = String(formData.get("recordDate") ?? "");

  if (!value) return { error: "Indica o valor do recorde." };
  if (type !== "WEIGHT" && type !== "TIME") {
    return { error: "Tipo de recorde inválido." };
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
  return { success: "Recorde atualizado." };
}

export async function deletePersonalRecordAction(recordId: string) {
  const session = await requireStudent();

  await prisma.personalRecord.deleteMany({
    where: { id: recordId, studentId: session.user.id },
  });

  revalidatePath("/student/profile");
}
