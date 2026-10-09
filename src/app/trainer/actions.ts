"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { getI18n } from "@/i18n/server";

type ActionState = { error?: string; success?: string } | undefined;

export async function createStudentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireTrainer();
  const { t } = await getI18n();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: t("errors.fillStudent") };
  }
  if (password.length < 6) {
    return { error: t("errors.passwordMin6") };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: t("errors.emailExists") };
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
  return { success: t("success.studentCreated") };
}

export async function createGroupAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireTrainer();
  const { t } = await getI18n();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: t("errors.groupName") };

  await prisma.group.create({
    data: { name, trainerId: session.user.id },
  });

  revalidatePath("/trainer/groups");
  return { success: t("success.groupCreated") };
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
  const { t } = await getI18n();
  const studentId = String(formData.get("studentId") ?? "");
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) {
    return { error: t("errors.passwordMin6") };
  }

  const student = await prisma.user.findFirst({
    where: { id: studentId, trainerId: session.user.id, role: "STUDENT" },
  });
  if (!student) return { error: t("errors.studentNotFound") };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: studentId },
    data: { passwordHash },
  });

  return { success: t("success.passwordReset") };
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
  const { t } = await getI18n();
  await requireOwnedStudent(session.user.id, studentId);

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
    where: { id: studentId },
    data: {
      dateOfBirth: dateOfBirthRaw ? new Date(dateOfBirthRaw) : null,
      weightKg,
      heightCm,
    },
  });

  revalidatePath(`/trainer/students/${studentId}`);
  return { success: t("success.dataUpdated") };
}

export async function addStudentRecordAction(
  studentId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireTrainer();
  const { t } = await getI18n();
  await requireOwnedStudent(session.user.id, studentId);

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
  return { success: t("success.recordAdded") };
}

export async function updateStudentRecordAction(
  studentId: string,
  recordId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireTrainer();
  const { t } = await getI18n();
  await requireOwnedStudent(session.user.id, studentId);

  const record = await prisma.personalRecord.findFirst({
    where: { id: recordId, studentId },
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

  revalidatePath(`/trainer/students/${studentId}`);
  return { success: t("success.recordUpdated") };
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

/** Archived students can't sign in and drop out of stats; their history is kept. */
export async function setStudentArchivedAction(studentId: string, archived: boolean) {
  const session = await requireTrainer();
  await requireOwnedStudent(session.user.id, studentId);

  await prisma.user.update({
    where: { id: studentId },
    data: { archivedAt: archived ? new Date() : null },
  });

  revalidatePath("/trainer", "layout");
}
