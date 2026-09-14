"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";

type ActionState = { error?: string; success?: string } | undefined;

export async function createStudentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireTrainer();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "Preenche nome, email e palavra-passe." };
  }
  if (password.length < 6) {
    return { error: "A palavra-passe deve ter pelo menos 6 caracteres." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Já existe uma conta com este email." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "STUDENT",
      trainerId: session.user.id,
    },
  });

  revalidatePath("/trainer/students");
  return { success: "Aluno criado com sucesso." };
}

export async function createGroupAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireTrainer();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Indica um nome para o grupo." };

  await prisma.group.create({
    data: { name, trainerId: session.user.id },
  });

  revalidatePath("/trainer/groups");
  return { success: "Grupo criado com sucesso." };
}

export async function addStudentToGroupAction(
  groupId: string,
  formData: FormData
) {
  const session = await requireTrainer();
  const studentId = String(formData.get("studentId") ?? "");

  const group = await prisma.group.findFirst({
    where: { id: groupId, trainerId: session.user.id },
  });
  const student = await prisma.user.findFirst({
    where: { id: studentId, trainerId: session.user.id, role: "STUDENT" },
  });
  if (!group || !student) throw new Error("Not found");

  await prisma.groupMember.upsert({
    where: { groupId_studentId: { groupId, studentId } },
    create: { groupId, studentId },
    update: {},
  });

  revalidatePath(`/trainer/groups/${groupId}`);
}

export async function removeStudentFromGroupAction(
  groupId: string,
  formData: FormData
) {
  const session = await requireTrainer();
  const studentId = String(formData.get("studentId") ?? "");
  const group = await prisma.group.findFirst({
    where: { id: groupId, trainerId: session.user.id },
  });
  if (!group) throw new Error("Not found");

  await prisma.groupMember.deleteMany({ where: { groupId, studentId } });
  revalidatePath(`/trainer/groups/${groupId}`);
}

export async function deleteGroupAction(groupId: string) {
  const session = await requireTrainer();
  const group = await prisma.group.findFirst({
    where: { id: groupId, trainerId: session.user.id },
  });
  if (!group) throw new Error("Not found");

  await prisma.group.delete({ where: { id: groupId } });
  revalidatePath("/trainer/groups");
  redirect("/trainer/groups");
}

export async function resetStudentPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireTrainer();
  const studentId = String(formData.get("studentId") ?? "");
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) {
    return { error: "A palavra-passe deve ter pelo menos 6 caracteres." };
  }

  const student = await prisma.user.findFirst({
    where: { id: studentId, trainerId: session.user.id, role: "STUDENT" },
  });
  if (!student) return { error: "Aluno não encontrado." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: studentId },
    data: { passwordHash },
  });

  return { success: "Palavra-passe redefinida." };
}

async function requireOwnedStudent(trainerId: string, studentId: string) {
  const student = await prisma.user.findFirst({
    where: { id: studentId, trainerId, role: "STUDENT" },
  });
  if (!student) throw new Error("Not found");
  return student;
}

export async function updateStudentProfileAction(
  studentId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireTrainer();
  await requireOwnedStudent(session.user.id, studentId);

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
    where: { id: studentId },
    data: {
      dateOfBirth: dateOfBirthRaw ? new Date(dateOfBirthRaw) : null,
      weightKg,
      heightCm,
    },
  });

  revalidatePath(`/trainer/students/${studentId}`);
  return { success: "Dados atualizados." };
}

export async function addStudentRecordAction(
  studentId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireTrainer();
  await requireOwnedStudent(session.user.id, studentId);

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
    where: { trainerId_name: { trainerId: session.user.id, name: exerciseName } },
    create: { name: exerciseName, trainerId: session.user.id },
    update: {},
  });

  await prisma.personalRecord.create({
    data: {
      studentId,
      exerciseId: exercise.id,
      type,
      value,
      unit: unit || null,
      notes: notes || null,
      recordDate: recordDateRaw ? new Date(recordDateRaw) : new Date(),
    },
  });

  revalidatePath(`/trainer/students/${studentId}`);
  return { success: "Recorde adicionado." };
}

export async function updateStudentRecordAction(
  studentId: string,
  recordId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireTrainer();
  await requireOwnedStudent(session.user.id, studentId);

  const record = await prisma.personalRecord.findFirst({
    where: { id: recordId, studentId },
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

  revalidatePath(`/trainer/students/${studentId}`);
  return { success: "Recorde atualizado." };
}

export async function deleteStudentRecordAction(
  studentId: string,
  recordId: string
) {
  const session = await requireTrainer();
  await requireOwnedStudent(session.user.id, studentId);

  await prisma.personalRecord.deleteMany({
    where: { id: recordId, studentId },
  });

  revalidatePath(`/trainer/students/${studentId}`);
}
