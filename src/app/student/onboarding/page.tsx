import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/require-session";
import { loadOnboarding } from "@/lib/onboarding-load";
import { OnboardingForm } from "@/components/onboarding-form";
import { getI18n } from "@/i18n/server";

export default async function OnboardingPage() {
  const session = await requireStudent();
  const { t, intlLocale } = await getI18n();
  const me = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { trainerId: true } });
  const props = await loadOnboarding(session.user.id, me.trainerId, intlLocale);

  return (
    <div className="space-y-3">
      <Link href="/student/profile" className="text-sm text-slate-500 hover:text-slate-900">
        {t("onboarding.back")}
      </Link>
      <h1 className="text-xl font-bold text-slate-900">{t("onboarding.title")}</h1>
      <p className="text-sm text-slate-600">{t("onboarding.studentIntro")}</p>
      <OnboardingForm
        studentId={null}
        initial={props.initial}
        initialProfile={props.initialProfile}
        levels={props.levels}
        canEditLevels={false}
        updatedLabel={props.updatedAt ? t("onboarding.updated", { date: props.updatedAt }) : null}
      />
    </div>
  );
}
