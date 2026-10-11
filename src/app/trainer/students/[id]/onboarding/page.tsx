import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { loadOnboarding } from "@/lib/onboarding-load";
import { OnboardingForm } from "@/components/onboarding-form";
import { getI18n } from "@/i18n/server";

export default async function StudentOnboardingPage({ params }: PageProps<"/trainer/students/[id]/onboarding">) {
  const { id } = await params;
  const session = await requireTrainer();
  const { t, intlLocale } = await getI18n();
  const student = await prisma.user.findFirst({
    where: { id, trainerId: session.user.id, role: "STUDENT" },
    select: { id: true },
  });
  if (!student) notFound();

  const props = await loadOnboarding(student.id, session.user.id, intlLocale);
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">{t("onboarding.title")}</h2>
      {!props.updatedAt && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t("onboarding.notStartedTrainer")}
        </p>
      )}
      <OnboardingForm
        studentId={student.id}
        initial={props.initial}
        initialProfile={props.initialProfile}
        levels={props.levels}
        canEditLevels
        updatedLabel={props.updatedAt ? t("onboarding.updated", { date: props.updatedAt }) : null}
      />
    </div>
  );
}
