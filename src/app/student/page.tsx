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

const STATE_STYLES: Record<CompletionState, { label: string; className: string }> = {
  done: { label: "Feito ✓", className: "bg-emerald-100 text-emerald-700" },
  partial: { label: "Em curso", className: "bg-sky-100 text-sky-700" },
  missed: { label: "Por registar", className: "bg-amber-100 text-amber-800" },
  pending: { label: "Por fazer", className: "bg-slate-100 text-slate-600" },
};

export default async function StudentHomePage({ searchParams }: PageProps<"/student">) {
  const { week } = (await searchParams) as { week?: string };
  const session = await requireStudent();
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
          aria-label="Semana anterior"
        >
          ←
        </Link>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900">{formatWeekRange(weekStart)}</p>
          {toDateKey(weekStart) !== toDateKey(resolveWeekStart(undefined)) && (
            <Link href="/student" className="text-xs text-slate-500 underline">
              Voltar a hoje
            </Link>
          )}
        </div>
        <Link
          href={`/student?week=${toDateKey(addDays(weekStart, 7))}`}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
          aria-label="Semana seguinte"
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
                isToday ? "border-slate-900 bg-white shadow-sm" : "border-slate-200 bg-white/60"
              }`}
            >
              <p className={`text-sm font-semibold capitalize ${isToday ? "text-slate-900" : "text-slate-500"}`}>
                {isToday ? "Hoje · " : ""}
                {formatWeekday(day)} <span className="font-normal">{formatDayMonth(day)}</span>
              </p>

              {dayWorkouts.length === 0 ? (
                <p className="mt-1 text-xs text-slate-400">Sem treino</p>
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
                          <p className="text-xs text-slate-500">{w.blocks.length} blocos</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATE_STYLES[state].className}`}
                        >
                          {STATE_STYLES[state].label}
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
