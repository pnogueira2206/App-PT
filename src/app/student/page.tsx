import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/require-session";
import {
  addDays,
  formatDayMonth,
  formatWeekRange,
  formatWeekday,
  resolveWeekStart,
  toDateKey,
  todayKey,
  weekDays,
} from "@/lib/dates";
import {
  completionState,
  getStudentGroupIds,
  studentWorkoutsWhere,
  withoutOverridden,
  type CompletionState,
} from "@/lib/workouts";
import { getI18n } from "@/i18n/server";
import type { MessageKey } from "@/i18n/translator";

const STATE_STYLES: Record<CompletionState, { label: MessageKey; className: string }> = {
  done: { label: "states.studentDone", className: "bg-emerald-100 text-emerald-700" },
  partial: { label: "states.partial", className: "bg-sky-100 text-sky-700" },
  missed: { label: "states.studentMissed", className: "bg-amber-100 text-amber-800" },
  pending: { label: "states.pending", className: "bg-slate-100 text-slate-600" },
};

export default async function StudentHomePage({ searchParams }: PageProps<"/student">) {
  const { week } = (await searchParams) as { week?: string };
  const session = await requireStudent();
  const { t, intlLocale } = await getI18n();
  const studentId = session.user.id;

  const weekStart = resolveWeekStart(week);
  const today = todayKey();
  const groupIds = await getStudentGroupIds(studentId);

  const workouts = await prisma.workout
    .findMany({
      where: {
        ...studentWorkoutsWhere(studentId, groupIds, { publishedOnly: true }),
        date: { gte: weekStart, lt: addDays(weekStart, 7) },
      },
      include: {
        completions: { where: { studentId } },
        blocks: {
          select: { _count: { select: { results: { where: { studentId } } } } },
        },
      },
      orderBy: { createdAt: "asc" },
    })
    .then((list) => withoutOverridden(list, studentId));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href={`/student?week=${toDateKey(addDays(weekStart, -7))}`}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
          aria-label={t("common.previousWeek")}
        >
          ←
        </Link>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900">{formatWeekRange(weekStart, intlLocale)}</p>
          {toDateKey(weekStart) !== toDateKey(resolveWeekStart(undefined)) && (
            <Link href="/student" className="text-xs text-slate-500 underline">
              {t("studentHome.backToToday")}
            </Link>
          )}
        </div>
        <Link
          href={`/student?week=${toDateKey(addDays(weekStart, 7))}`}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
          aria-label={t("common.nextWeek")}
        >
          →
        </Link>
      </div>

      <ul className="space-y-2">
        {weekDays(weekStart).map((day) => {
          const key = toDateKey(day);
          const isToday = key === today;
          const dayWorkouts = workouts.filter((w) => toDateKey(w.date) === key);

          return (
            <li
              key={key}
              className={`rounded-xl border p-3 ${
                isToday ? "border-brand bg-white shadow-sm" : "border-slate-200 bg-white/60"
              }`}
            >
              <p className={`text-sm font-semibold first-letter:uppercase ${isToday ? "text-slate-900" : "text-slate-500"}`}>
                {isToday ? t("studentHome.todayPrefix") : ""}
                {formatWeekday(day, intlLocale)}{" "}
                <span className="font-normal">{formatDayMonth(day, intlLocale)}</span>
              </p>

              {dayWorkouts.length === 0 ? (
                <p className="mt-1 text-xs text-slate-400">{t("studentHome.noWorkout")}</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {dayWorkouts.map((w) => {
                    const state = completionState(w, today, {
                      completed: w.completions.length > 0,
                      resultsCount: w.blocks.reduce((n, b) => n + b._count.results, 0),
                    });
                    return (
                      <Link
                        key={w.id}
                        href={`/student/workouts/${w.id}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 hover:bg-slate-50"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{w.title}</p>
                          <p className="text-xs text-slate-500">
                            {t("common.blocks", { count: w.blocks.length })}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATE_STYLES[state].className}`}
                        >
                          {t(STATE_STYLES[state].label)}

                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
