import { prisma } from "@/lib/prisma";
import { formatDate, toDateKey } from "@/lib/dates";
import { EMPTY_ONBOARDING, sanitizeLevels, sanitizeOnboarding } from "@/lib/onboarding";

/** Everything the onboarding form needs for one student. */
export async function loadOnboarding(studentId: string, trainerId: string | null, intlLocale: string) {
  const [student, onboarding, trainer] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: studentId },
      select: { dateOfBirth: true, heightCm: true, weightKg: true },
    }),
    prisma.onboarding.findUnique({ where: { studentId } }),
    trainerId ? prisma.user.findUnique({ where: { id: trainerId }, select: { onboardingLevels: true } }) : null,
  ]);
  return {
    initial: onboarding ? sanitizeOnboarding(onboarding.data) : EMPTY_ONBOARDING,
    initialProfile: {
      dateOfBirth: student.dateOfBirth ? toDateKey(student.dateOfBirth) : "",
      heightCm: student.heightCm?.toString() ?? "",
      weightKg: student.weightKg?.toString() ?? "",
    },
    levels: sanitizeLevels(trainer?.onboardingLevels ?? {}),
    updatedAt: onboarding ? formatDate(onboarding.updatedAt, intlLocale, { day: "numeric", month: "short", year: "numeric" }) : null,
  };
}
