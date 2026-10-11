"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireActiveStudent, requireTrainer } from "@/lib/require-session";
import { parseDateKey } from "@/lib/dates";
import { sanitizeLevels, sanitizeOnboarding } from "@/lib/onboarding";
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

  const data = sanitizeOnboarding(payload.data) as unknown as Prisma.InputJsonValue;
  await prisma.$transaction([
    prisma.onboarding.upsert({ where: { studentId: id }, create: { studentId: id, data }, update: { data } }),
    prisma.user.update({ where: { id }, data: { dateOfBirth, heightCm, weightKg } }),
  ]);

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
