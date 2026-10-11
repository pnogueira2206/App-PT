"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireActiveStudent, requireTrainer } from "@/lib/require-session";
import { parseDateKey } from "@/lib/dates";
import { MAX_LIFTS, parseKg, sanitizeLevels, sanitizeOnboarding, type OnboardingData } from "@/lib/onboarding";
import { getI18n } from "@/i18n/server";

export type OnboardingProfile = { dateOfBirth: string; heightCm: string; weightKg: string };
type Result = { error?: string; success?: string };

function positive(raw: string): number | null | "invalid" {
  const value = raw.trim();
  if (!value) return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : "invalid";
}

/**
 * Saves the athlete onboarding. Students save their own (studentId = null);
 * the coach can also fill it in for one of their students.
 * The "Athlete Profile" answers are the student's profile data (birth date, height, weight).
 */
export async function saveOnboardingAction(
  studentId: string | null,
  payload: { data: unknown; profile: OnboardingProfile }
): Promise<Result> {
  const { t } = await getI18n();
  let id: string;
  if (studentId) {
    const session = await requireTrainer();
    const student = await prisma.user.findFirst({
      where: { id: studentId, trainerId: session.user.id, role: "STUDENT" },
      select: { id: true },
    });
    if (!student) return { error: t("errors.studentNotFound") };
    id = student.id;
  } else {
    id = (await requireActiveStudent()).user.id;
  }

  const heightCm = positive(payload.profile.heightCm);
  const weightKg = positive(payload.profile.weightKg);
  if (heightCm === "invalid") return { error: t("errors.invalidHeight") };
  if (weightKg === "invalid") return { error: t("errors.invalidWeight") };
  const dateOfBirth = payload.profile.dateOfBirth ? parseDateKey(payload.profile.dateOfBirth) : null;

  const answers = sanitizeOnboarding(payload.data);
  const data = answers as unknown as Prisma.InputJsonValue;
  const trainerId = (await prisma.user.findUniqueOrThrow({ where: { id }, select: { trainerId: true } })).trainerId;
  await prisma.$transaction(async (tx) => {
    await tx.onboarding.upsert({ where: { studentId: id }, create: { studentId: id, data }, update: { data } });
    await tx.user.update({ where: { id }, data: { dateOfBirth, heightCm, weightKg } });
    if (trainerId) await syncOnboardingRecords(tx, id, trainerId, answers);
  });

  revalidatePath("/student", "layout");
  revalidatePath("/trainer", "layout");
  return { success: t("onboarding.saved") };
}

/** Coach's reference levels (Open / QF / SF / Games) for each lift and test. */
export async function saveOnboardingLevelsAction(levels: unknown): Promise<Result> {
  const { t } = await getI18n();
  const session = await requireTrainer();
  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingLevels: sanitizeLevels(levels) as unknown as Prisma.InputJsonValue },
  });
  revalidatePath("/trainer", "layout");
  revalidatePath("/student", "layout");
  return { success: t("onboarding.levelsSaved") };
}

/**
 * The 1RMs typed in "Max Lifts / Benchmarks" become the student's 1RM records (one per
 * lift, marked fromOnboarding and kept in sync: edited when the value changes, removed
 * when it is cleared), so %1RM loads and benchmarks start from them.
 */
async function syncOnboardingRecords(
  tx: Prisma.TransactionClient,
  studentId: string,
  trainerId: string,
  answers: OnboardingData
) {
  for (const row of MAX_LIFTS.liftGroups.flatMap((g) => g.rows)) {
    const kg = parseKg(answers.lifts[row.id]?.value);
    const exercise = await tx.exercise.findFirst({
      where: { trainerId, name: { equals: row.name, mode: "insensitive" } },
      select: { id: true },
    });
    const existing = exercise
      ? await tx.personalRecord.findFirst({ where: { studentId, exerciseId: exercise.id, fromOnboarding: true } })
      : null;

    if (kg == null) {
      if (existing) await tx.personalRecord.delete({ where: { id: existing.id } });
      continue;
    }
    const date = answers.lifts[row.id]?.date ? parseDateKey(answers.lifts[row.id]!.date!) : null;
    const fields = { type: "WEIGHT" as const, value: String(kg), unit: "kg", reps: 1, ...(date ? { recordDate: date } : {}) };
    if (existing) {
      await tx.personalRecord.update({ where: { id: existing.id }, data: fields });
    } else {
      const exerciseId =
        exercise?.id ??
        (await tx.exercise.create({ data: { trainerId, name: row.name, category: "STRENGTH" }, select: { id: true } })).id;
      await tx.personalRecord.create({ data: { ...fields, studentId, exerciseId, fromOnboarding: true } });
    }
  }
}
