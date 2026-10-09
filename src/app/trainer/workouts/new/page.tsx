import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { NewWorkoutForm } from "@/components/new-workout-form";
import { parseDateKey, todayKey } from "@/lib/dates";
import { getI18n } from "@/i18n/server";

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string; date?: string; groupId?: string; studentId?: string }>;
}) {
  const session = await requireTrainer();
  const { t } = await getI18n();
  const params = await searchParams;

  const [groups, students] = await Promise.all([
    prisma.group.findMany({
      where: { trainerId: session.user.id },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { trainerId: session.user.id, role: "STUDENT" },
      orderBy: { name: "asc" },
    }),
  ]);

  const defaultTarget =
    params.target ??
    (params.groupId
      ? `group:${params.groupId}`
      : params.studentId
        ? `student:${params.studentId}`
        : undefined);
  const defaultDate = params.date && parseDateKey(params.date) ? params.date : todayKey();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">{t("workouts.newWorkoutTitle")}</h1>

      <NewWorkoutForm
        groups={groups}
        students={students}
        defaultTarget={defaultTarget}
        defaultDate={defaultDate}
      />
    </div>
  );
}
