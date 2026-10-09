import { notFound } from "next/navigation";
import type { Goal, GoalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { getI18n } from "@/i18n/server";
import { formatDate } from "@/lib/dates";
import { addGoalAction, deleteGoalAction, setGoalStatusAction } from "@/app/trainer/actions";
import { GoalForm } from "@/components/note-form";
import type { MessageKey } from "@/i18n/translator";

const SECTIONS: { status: GoalStatus; label: MessageKey; icon: string }[] = [
  { status: "ACTIVE", label: "goals.active", icon: "🎯" },
  { status: "ACHIEVED", label: "goals.achieved", icon: "✅" },
  { status: "DROPPED", label: "goals.dropped", icon: "⏸️" },
];

export default async function StudentGoalsPage({ params }: PageProps<"/trainer/students/[id]/goals">) {
  const { id } = await params;
  const session = await requireTrainer();
  const { t, intlLocale } = await getI18n();

  const student = await prisma.user.findFirst({
    where: { id, trainerId: session.user.id, role: "STUDENT" },
    include: { goals: { orderBy: [{ targetDate: "asc" }, { createdAt: "desc" }] } },
  });
  if (!student) notFound();

  const action = (goal: Goal, status: GoalStatus, label: MessageKey) => (
    <form action={setGoalStatusAction.bind(null, student.id, goal.id, status)}>
      <button className="text-xs font-medium text-slate-500 hover:text-slate-900">{t(label)}</button>
    </form>
  );

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t("goals.title")}</h2>
        <p className="text-sm text-slate-500">{t("goals.subtitle")}</p>
      </div>
      <GoalForm action={addGoalAction.bind(null, student.id)} />

      {student.goals.length === 0 && <p className="text-sm text-slate-500">{t("goals.empty")}</p>}

      {SECTIONS.map(({ status, label, icon }) => {
        const goals = student.goals.filter((g) => g.status === status);
        if (goals.length === 0) return null;
        return (
          <section key={status} className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">
              {icon} {t(label)}
            </h3>
            <ul className="space-y-2">
              {goals.map((goal) => (
                <li key={goal.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className={`font-medium ${status === "ACTIVE" ? "text-slate-900" : "text-slate-500"}`}>
                        {goal.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {goal.targetDate
                          ? t("goals.targetOn", { date: formatDate(goal.targetDate, intlLocale) })
                          : t("goals.noTarget")}
                        {goal.achievedAt &&
                          ` · ${t("goals.achievedOn", { date: formatDate(goal.achievedAt, intlLocale) })}`}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      {status === "ACTIVE" ? (
                        <>
                          {action(goal, "ACHIEVED", "goals.markAchieved")}
                          {action(goal, "DROPPED", "goals.markDropped")}
                        </>
                      ) : (
                        action(goal, "ACTIVE", "goals.reopen")
                      )}
                      <form action={deleteGoalAction.bind(null, student.id, goal.id)}>
                        <button className="text-xs text-slate-400 hover:text-red-600">{t("common.delete")}</button>
                      </form>
                    </div>
                  </div>
                  {goal.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{goal.notes}</p>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
