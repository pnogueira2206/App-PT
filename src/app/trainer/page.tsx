import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { addDays, formatDate, formatLongDate, parseDateKey, startOfWeek, todayKey } from "@/lib/dates";
import { getStudentStats, percent } from "@/lib/adherence";
import { getFeed } from "@/lib/feed";
import { formatNumber } from "@/lib/blocks";
import { getI18n } from "@/i18n/server";
import type { MessageKey } from "@/i18n/translator";
import { AdherencePills } from "@/components/adherence";

type TodayState = "done" | "partial" | "pending";

const TODAY_STYLES: Record<TodayState, { label: MessageKey; className: string }> = {
  done: { label: "states.done", className: "bg-emerald-100 text-emerald-700" },
  partial: { label: "states.partial", className: "bg-sky-100 text-sky-700" },
  pending: { label: "states.pending", className: "bg-slate-100 text-slate-600" },
};

function StatTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {detail && <p className="text-xs text-slate-400">{detail}</p>}
    </div>
  );
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-semibold text-slate-900">{children}</h2>
      {action}
    </div>
  );
}

export default async function TrainerHomePage() {
  const session = await requireTrainer();
  const trainerId = session.user.id;
  const i18n = await getI18n();
  const { t, intlLocale } = i18n;
  const today = parseDateKey(todayKey())!;
  const weekStart = startOfWeek(today);

  const [students, stats, unseen, todayWorkouts, recordsThisWeek, completionsThisWeek, drafts] =
    await Promise.all([
      prisma.user.findMany({
        where: { trainerId, role: "STUDENT", archivedAt: null },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      getStudentStats(trainerId),
      getFeed(trainerId, { onlyUnseen: true }),
      prisma.workout.findMany({
        where: { trainerId, date: today },
        include: {
          student: { select: { id: true, name: true } },
          group: {
            include: {
              members: {
                where: { student: { archivedAt: null } },
                include: { student: { select: { id: true, name: true } } },
              },
            },
          },

          overrides: { select: { studentId: true } },
          completions: { select: { studentId: true } },
          blocks: { select: { results: { select: { studentId: true } } } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.personalRecord.count({
        where: { student: { trainerId, archivedAt: null }, recordDate: { gte: weekStart, lte: today } },
      }),
      prisma.workoutCompletion.findMany({
        where: { student: { trainerId, archivedAt: null }, workout: { date: { gte: weekStart, lte: today } } },
        select: { sessionRpe: true },
      }),
      prisma.workout.count({
        where: { trainerId, status: "DRAFT", date: { gte: today, lte: addDays(today, 14) } },
      }),
    ]);

  // ---- Week summary
  const studentPercents = [...stats.values()]
    .map((s) => percent(s.week))
    .filter((p): p is number => p != null);
  const avgAdherence =
    studentPercents.length > 0
      ? Math.round(studentPercents.reduce((a, b) => a + b, 0) / studentPercents.length)
      : null;
  const weekDone = [...stats.values()].reduce((n, s) => n + s.week.done, 0);
  const weekPlanned = [...stats.values()].reduce((n, s) => n + s.week.planned, 0);
  const rpes = completionsThisWeek.map((c) => c.sessionRpe).filter((r): r is number => r != null);
  const avgRpe = rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null;

  // ---- Alerts
  type Alert = { key: string; text: string; href: string };
  const alerts: Alert[] = [];
  for (const student of students) {
    const s = stats.get(student.id);
    if (!s) continue;
    const href = `/trainer/students/${student.id}`;
    if (s.missedInARow >= 2) {
      alerts.push({
        key: `missed-${student.id}`,
        text: t("dashboard.alertMissed", { name: student.name, count: s.missedInARow }),
        href,
      });
    }
    const monthPercent = percent(s.month);
    if (s.month.planned >= 4 && monthPercent != null && monthPercent < 60) {
      alerts.push({
        key: `low-${student.id}`,
        text: t("dashboard.alertLowAdherence", { name: student.name, percent: monthPercent }),
        href: `${href}/profile`,
      });
    }
    if (s.upcoming === 0) {
      alerts.push({
        key: `upcoming-${student.id}`,
        text: t("dashboard.alertNoUpcoming", { name: student.name }),
        href,
      });
    }
  }
  if (drafts > 0) {
    alerts.push({ key: "drafts", text: t("dashboard.alertDrafts", { count: drafts }), href: "/trainer/workouts" });
  }

  // ---- Today: one row per athlete per workout
  const todayRows = todayWorkouts.map((w) => {
    const overridden = new Set(w.overrides.map((o) => o.studentId));
    const athletes = w.group
      ? w.group.members.map((m) => m.student).filter((s) => !overridden.has(s.id))
      : w.student
        ? [w.student]
        : [];
    return {
      workout: w,
      athletes: athletes.map((athlete) => {
        const done = w.completions.some((c) => c.studentId === athlete.id);
        const started = w.blocks.some((b) => b.results.some((r) => r.studentId === athlete.id));
        const state: TodayState = done ? "done" : started ? "partial" : "pending";
        return { athlete, state };
      }),
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          {t("dashboard.hello", { name: session.user.name ?? "" })}
        </h1>
        <p className="text-sm text-slate-500 first-letter:uppercase">{formatLongDate(today, intlLocale)}</p>
      </div>

      <section className="space-y-3">
        <SectionTitle>{t("dashboard.weekSummary")}</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Link href="/trainer/students" className="contents">
            <StatTile label={t("dashboard.statStudents")} value={String(students.length)} />
          </Link>
          <StatTile label={t("dashboard.statAdherence")}
 value={avgAdherence == null ? "—" : `${avgAdherence}%`} />
          <StatTile
            label={t("dashboard.statSessions")}
            value={t("dashboard.statSessionsValue", { done: weekDone, planned: weekPlanned })}
          />
          <StatTile label={t("dashboard.statRecords")} value={String(recordsThisWeek)} />
          <StatTile
            label={t("dashboard.statRpe")}
            value={avgRpe == null ? "—" : formatNumber(Math.round(avgRpe * 10) / 10, intlLocale)}
          />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          <section className="space-y-3">
            <SectionTitle
              action={
                <Link href="/trainer/feed" className="text-sm text-slate-500 hover:text-slate-900">
                  {t("feed.viewAll")}
                </Link>
              }
            >
              {t("dashboard.unseenTitle")}{" "}
              {unseen.length > 0 && (
                <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 align-middle text-[11px] font-bold text-white">
                  {unseen.length}
                </span>
              )}
            </SectionTitle>
            {unseen.length === 0 ? (
              <p className="text-sm text-slate-500">{t("feed.empty")}</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                {unseen.slice(0, 5).map((entry) => {
                  const records = entry.results.filter((r) => r.recordSaved || r.recordCandidate).length;
                  const comments = entry.results.reduce(
                    (n, r) => n + r.comments.filter((c) => !c.fromTrainer).length,
                    0
                  );
                  return (
                    <li key={entry.key}>
                      <Link
                        href="/trainer/feed"
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {entry.student.name}
                            <span className="font-normal text-slate-500"> · {entry.workout.title}</span>
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(entry.workout.date, intlLocale, { day: "numeric", month: "short" })} ·{" "}
                            {entry.completion
                              ? `✅ ${entry.completion.sessionRpe != null ? t("common.rpe", { value: entry.completion.sessionRpe }) : t("feed.sessionCompleted")}`
                              : t("common.blocks", { count: entry.results.length })}
                          </p>
                        </div>
                        <span className="flex gap-2 text-xs text-slate-600">
                          {records > 0 && <span>🏆 {records}</span>}
                          {comments > 0 && <span>💬 {comments}</span>}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <SectionTitle>{t("dashboard.todayWorkouts")}</SectionTitle>
            {todayRows.length === 0 ? (
              <p className="text-sm text-slate-500">{t("dashboard.noWorkoutsToday")}</p>
            ) : (
              <ul className="space-y-2">
                {todayRows.map(({ workout, athletes }) => (
                  <li key={workout.id} className="rounded-xl border border-slate-200 bg-white">
                    <Link
                      href={`/trainer/workouts/${workout.id}`}
                      className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 hover:bg-slate-50"
                    >
                      <span className="text-sm font-medium text-slate-900">
                        {workout.title}
                        {workout.group && <span className="font-normal text-slate-500"> · 👥 {workout.group.name}</span>}
                      </span>
                      {workout.status === "DRAFT" && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                          {t("common.draft")}
                        </span>
                      )}
                    </Link>
                    {athletes.length === 0 ? (
                      <p className="px-4 py-2 text-xs text-slate-400">{t("dashboard.noTodayStudents")}</p>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {athletes.map(({ athlete, state }) => (
                          <li key={athlete.id} className="flex items-center justify-between px-4 py-2 text-sm">
                            <span className="text-slate-700">{athlete.name}</span>
                            {workout.status === "PUBLISHED" && (
                              <span className={`rounded-full px-2 py-0.5 text-xs ${TODAY_STYLES[state].className}`}>
                                {t(TODAY_STYLES[state].label)}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="space-y-3">
          <SectionTitle>{t("dashboard.alerts")}</SectionTitle>
          {alerts.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              ✅ {t("dashboard.noAlerts")}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-amber-200 bg-white">
              {alerts.map((alert) => (
                <li key={alert.key}>
                  <Link href={alert.href} className="flex gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    <span aria-hidden>⚠️</span>
                    <span>{alert.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <SectionTitle
          action={
            <Link href="/trainer/students" className="text-sm text-slate-500 hover:text-slate-900">
              {t("dashboard.manage")}
            </Link>
          }
        >
          {t("dashboard.studentCalendars")}
        </SectionTitle>
        {students.length === 0 ? (
          <p className="text-sm text-slate-500">{t("dashboard.noStudents")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => {
              const s = stats.get(student.id);
              return (
                <Link
                  key={student.id}
                  href={`/trainer/students/${student.id}`}
                  className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 hover:border-brand"
                >
                  <p className="font-medium text-slate-900">{student.name}</p>
                  {s && <AdherencePills stats={s} t={t} />}
                  {s && (
                    <div className="space-y-0.5 text-xs text-slate-500">
                      <p>
                        {s.lastCompletedDate
                          ? t("adherence.lastWorkout", { date: formatDate(s.lastCompletedDate, intlLocale) })
                          : t("adherence.noneDone")}
                      </p>
                      <p>
                        {s.nextWorkoutDate
                          ? t("adherence.nextWorkout", { date: formatDate(s.nextWorkoutDate, intlLocale) })
                          : t("adherence.noNext")}
                      </p>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
