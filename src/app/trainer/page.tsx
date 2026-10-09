import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { formatLongDate, parseDateKey, todayKey } from "@/lib/dates";
import { getI18n } from "@/i18n/server";

export default async function TrainerHomePage() {
  const session = await requireTrainer();
  const { t, intlLocale } = await getI18n();
  const today = parseDateKey(todayKey())!;

  const [students, groups, todayWorkouts] = await Promise.all([
    prisma.user.findMany({
      where: { trainerId: session.user.id, role: "STUDENT" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.group.findMany({
      where: { trainerId: session.user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, _count: { select: { members: true } } },
    }),
    prisma.workout.findMany({
      where: { trainerId: session.user.id, date: today },
      include: {
        group: { include: { _count: { select: { members: true } } } },
        student: true,
        _count: { select: { completions: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          {t("dashboard.hello", { name: session.user.name ?? "" })}
        </h1>
        <p className="text-sm text-slate-500 first-letter:uppercase">
          {formatLongDate(today, intlLocale)}
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-900">{t("dashboard.todayWorkouts")}</h2>
        {todayWorkouts.length === 0 ? (
          <p className="text-sm text-slate-500">{t("dashboard.noWorkoutsToday")}</p>
        ) : (
          <ul className="space-y-2">
            {todayWorkouts.map((w) => {
              const expected = w.group ? w.group._count.members : 1;
              return (
                <li key={w.id}>
                  <Link
                    href={`/trainer/workouts/${w.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{w.title}</p>
                      <p className="text-xs text-slate-500">
                        {w.group ? `👥 ${w.group.name}` : w.student?.name}
                      </p>
                    </div>
                    {w.status === "DRAFT" ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                        {t("common.draft")}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500">
                        {t("dashboard.completedOf", { done: w._count.completions, total: expected })}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">{t("dashboard.studentCalendars")}</h2>
            <Link href="/trainer/students" className="text-sm text-slate-500 hover:text-slate-900">
              {t("dashboard.manage")}
            </Link>
          </div>
          {students.length === 0 ? (
            <p className="text-sm text-slate-500">{t("dashboard.noStudents")}</p>
          ) : (
            <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
              {students.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/trainer/students/${s.id}`}
                    className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50"
                  >
                    <span className="font-medium text-slate-800">{s.name}</span>
                    <span className="text-slate-400">📅 →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">{t("groups.title")}</h2>
            <Link href="/trainer/groups" className="text-sm text-slate-500 hover:text-slate-900">
              {t("dashboard.manage")}
            </Link>
          </div>
          {groups.length === 0 ? (
            <p className="text-sm text-slate-500">{t("dashboard.noGroups")}</p>
          ) : (
            <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
              {groups.map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/trainer/groups/${g.id}`}
                    className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50"
                  >
                    <span className="font-medium text-slate-800">👥 {g.name}</span>
                    <span className="text-slate-400">
                      {t("common.students", { count: g._count.members })} →
                    </span>

                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
