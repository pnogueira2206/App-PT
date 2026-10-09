import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { ProfileNav } from "@/components/profile-nav";
import { getI18n } from "@/i18n/server";
import { setStudentArchivedAction } from "@/app/trainer/actions";
import { getStudentStats, percent, type Ratio } from "@/lib/adherence";
import { addDays, formatDate, formatWeekday, parseDateKey, startOfWeek, todayKey } from "@/lib/dates";
import { formatNumber } from "@/lib/blocks";

function complianceCell(ratio: Ratio) {
  const value = percent(ratio);
  const tone =
    value == null
      ? "bg-slate-100 text-slate-400"
      : value >= 80
        ? "bg-emerald-100 text-emerald-700"
        : value >= 50
          ? "bg-amber-100 text-amber-800"
          : "bg-red-100 text-red-700";
  return <span className={`rounded-md py-1.5 text-center text-sm font-semibold ${tone}`}>{value ?? "—"}</span>;
}

function ageFrom(dateOfBirth: Date, today: Date) {
  let age = today.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < dateOfBirth.getUTCMonth() ||
    (today.getUTCMonth() === dateOfBirth.getUTCMonth() && today.getUTCDate() < dateOfBirth.getUTCDate());
  if (beforeBirthday) age--;
  return age;
}

export default async function StudentLayout({ children, params }: LayoutProps<"/trainer/students/[id]">) {
  const { id } = await params;
  const session = await requireTrainer();
  const { t, intlLocale } = await getI18n();
  const today = parseDateKey(todayKey())!;

  const student = await prisma.user.findFirst({
    where: { id, trainerId: session.user.id, role: "STUDENT" },
    include: {
      memberships: { include: { group: true } },
      trainingDays: { orderBy: { weekday: "asc" } },
      goals: { where: { status: "ACTIVE" }, orderBy: [{ targetDate: "asc" }, { createdAt: "asc" }], take: 3 },
    },
  });
  if (!student) notFound();
  const stats = (await getStudentStats(session.user.id, [student.id], { history: "all" })).get(student.id);

  const base = `/trainer/students/${student.id}`;
  const initials = student.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

  const details = [
    student.weightKg ? `${formatNumber(student.weightKg, intlLocale)} kg` : null,
    student.dateOfBirth ? t("profileSidebar.age", { age: ageFrom(student.dateOfBirth, today) }) : null,
  ].filter(Boolean);

  const until = stats?.programmedUntil ?? null;
  const untilTone = !until || until < today ? "text-red-600" : until < addDays(today, 3) ? "text-amber-600" : "text-emerald-600";
  const weekdayName = (weekday: number) => formatWeekday(addDays(startOfWeek(today), weekday), intlLocale);

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
        <Link href="/trainer/students" className="text-sm text-slate-500 hover:text-slate-900">
          {t("students.back")}
        </Link>

        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-brand/60 bg-slate-100 text-lg font-semibold text-slate-700">
            {initials}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-900">{student.name}</h1>
            {details.length > 0 && <p className="text-sm text-slate-500">{details.join(" · ")}</p>}
            <p className="text-xs text-slate-500">
              {t("profileSidebar.clientSince", {
                date: formatDate(student.createdAt, intlLocale, { month: "short", year: "numeric" }),
              })}
              {" · "}
              {t("profileSidebar.sessions", { count: stats?.total.done ?? 0 })}
            </p>
          </div>
        </div>

        {(student.trainingDays.length > 0 || student.memberships.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {student.trainingDays.map((d) => (
              <span
                key={d.id}
                title={d.focus}
                className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 first-letter:uppercase"
              >
                {weekdayName(d.weekday)} · {d.focus.split("\n")[0]}
              </span>
            ))}
            {student.memberships.map((m) => (
              <Link
                key={m.id}
                href={`/trainer/groups/${m.groupId}`}
                className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 hover:bg-indigo-100"
              >
                👥 {m.group.name}
              </Link>
            ))}
          </div>
        )}

        {student.archivedAt && (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            🗄️ {t("students.archivedNotice")}
          </p>
        )}

        <dl className="space-y-2 border-y border-slate-200 py-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">🔥 {t("profileSidebar.streak")}</dt>
            <dd className="font-semibold text-slate-900">{stats?.streak ?? 0}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">🗓️ {t("students.colProgrammed")}</dt>
            <dd className={`font-semibold ${untilTone}`}>
              {until ? formatDate(until, intlLocale, { weekday: "short", day: "numeric", month: "short" }) : t("students.notProgrammed")}
            </dd>
          </div>
        </dl>

        {stats && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">% {t("students.colCompliance")}</p>
            <div className="grid grid-cols-4 gap-1 text-center text-[11px] font-semibold text-slate-500">
              <span>7D</span>
              <span>30D</span>
              <span>90D</span>
              <span>{t("profileSidebar.all")}</span>
              {complianceCell(stats.last7)}
              {complianceCell(stats.last30)}
              {complianceCell(stats.last90)}
              {complianceCell(stats.total)}
            </div>
          </div>
        )}

        {student.goals.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-slate-700">🎯 {t("goals.active")}</p>
            <ul className="space-y-1 text-sm text-slate-700">
              {student.goals.map((goal) => (
                <li key={goal.id} className="flex justify-between gap-2">
                  <span className="truncate">{goal.title}</span>
                  {goal.targetDate && (
                    <span className="shrink-0 text-xs text-slate-400">
                      {formatDate(goal.targetDate, intlLocale, { day: "numeric", month: "short" })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <ProfileNav
          items={[
            { href: base, label: t("students.tabCalendar"), icon: "📅" },
            { href: `${base}/profile`, label: t("students.tabProfile"), icon: "🏆" },
            { href: `${base}/notes`, label: t("notes.title"), icon: "📝" },
            { href: `${base}/goals`, label: t("goals.title"), icon: "🎯" },
          ]}
        />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 pt-3">
          <ResetPasswordForm studentId={student.id} />
          <form action={setStudentArchivedAction.bind(null, student.id, !student.archivedAt)}>
            <button className="text-sm font-medium text-slate-500 hover:text-slate-900">
              {student.archivedAt ? t("students.unarchive") : t("students.archive")}
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
