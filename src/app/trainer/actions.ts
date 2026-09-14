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
