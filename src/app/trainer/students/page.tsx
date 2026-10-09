import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { NewStudentForm } from "@/components/new-student-form";
import { getI18n } from "@/i18n/server";
import { getStudentStats, percent, type Ratio, type StudentStats } from "@/lib/adherence";
import { addDays, formatDate, parseDateKey, todayKey } from "@/lib/dates";
import { setStudentArchivedAction } from "@/app/trainer/actions";
import { GroupIcon } from "@/components/icons";

type Period = "7" | "28";

function percentClass(value: number | null) {
  if (value == null) return "text-slate-400";
  if (value >= 80) return "text-emerald-600";
  if (value >= 50) return "text-amber-600";
  return "text-red-600";
}

function Percent({ ratio }: { ratio: Ratio }) {
  const value = percent(ratio);
  return <span className={`font-semibold ${percentClass(value)}`}>{value == null ? "—" : `${value}%`}</span>;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/** Average of the students' percentages for the period (students with nothing planned are skipped). */
function averageCompliance(stats: StudentStats[], period: Period): number | null {
  const values = stats
    .map((s) => percent(period === "7" ? s.last7 : s.month))
    .filter((v): v is number => v != null);
  return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
}

export default async function StudentsPage({ searchParams }: PageProps<"/trainer/students">) {
  const params = (await searchParams) as { tab?: string; q?: string; period?: string };
  const archivedTab = params.tab === "archived";
  const query = (params.q ?? "").trim().toLowerCase();
  const period: Period = params.period === "7" ? "7" : "28";

  const session = await requireTrainer();
  const { t, intlLocale } = await getI18n();
  const today = parseDateKey(todayKey())!;

  const allStudents = await prisma.user.findMany({
    where: { trainerId: session.user.id, role: "STUDENT" },
    orderBy: { name: "asc" },
    include: { memberships: { include: { group: true } } },
  });
  const active = allStudents.filter((s) => !s.archivedAt);
  const archived = allStudents.filter((s) => s.archivedAt);

  const stats = await getStudentStats(session.user.id);
  const activeStats = active.map((s) => stats.get(s.id)).filter((s): s is StudentStats => !!s);
  const compliance = averageCompliance(activeStats, period);
  const runningOut = activeStats.filter(
    (s) => !s.programmedUntil || s.programmedUntil < addDays(today, 3)
  ).length;

  const list = (archivedTab ? archived : active).filter((s) => {
    if (!query) return true;
    const haystack = [s.name, s.email, ...s.memberships.map((m) => m.group.name)].join(" ").toLowerCase();
    return haystack.includes(query);
  });

  const href = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { tab: archivedTab ? "archived" : undefined, q: params.q, period, ...changes };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    const qs = next.toString();
    return `/trainer/students${qs ? `?${qs}` : ""}`;
  };

  const programmedBadge = (s: StudentStats | undefined) => {
    const until = s?.programmedUntil ?? null;
    if (!until || until < today) {
      return (
        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
          {until ? formatDate(until, intlLocale, { day: "numeric", month: "short" }) : t("students.notProgrammed")}
        </span>
      );
    }
    const soon = until < addDays(today, 3);
    return (
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
          soon ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {formatDate(until, intlLocale, { weekday: "short", day: "numeric", month: "short" })}
      </span>
    );
  };

  const metric = (value: string, label: string, hint?: string, extra?: React.ReactNode) => (
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="text-3xl font-semibold text-brand-text">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-700">{label}</p>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {extra}
    </div>
  );

  const tab = (isActive: boolean) =>
    `-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
      isActive ? "border-brand text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
    }`;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 rounded-xl border border-slate-200 bg-white px-4 py-6 sm:grid-cols-3">
        {metric(String(active.length), t("students.summaryTotal"))}
        {metric(
          compliance == null ? "—" : `${compliance}%`,
          t("students.summaryCompliance"),
          t("students.summaryComplianceHint"),
          <div className="mt-1 flex gap-1 rounded-lg bg-slate-50 p-0.5 text-xs">
            {(["7", "28"] as Period[]).map((p) => (
              <Link
                key={p}
                href={href({ period: p })}
                className={`rounded-md px-2 py-1 ${p === period ? "bg-brand font-semibold text-brand-ink" : "text-slate-500"}`}
              >
                {p === "7" ? t("students.period7") : t("students.period28")}
              </Link>
            ))}
          </div>
        )}
        {metric(String(runningOut), t("students.summaryRunningOut"), t("students.summaryRunningOutHint"))}
      </section>

      <div className="flex flex-wrap items-start gap-3">
        <form action="/trainer/students" className="flex min-w-60 flex-1 gap-2">
          {archivedTab && <input type="hidden" name="tab" value="archived" />}
          <input type="hidden" name="period" value={period} />
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder={t("students.searchPlaceholder")}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            {t("students.search")}
          </button>
        </form>
        <NewStudentForm />
      </div>

      <nav className="flex gap-2 border-b border-slate-200">
        <Link href={href({ tab: undefined })} className={tab(!archivedTab)}>
          {t("students.tabActive")}{" "}
          <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs">{active.length}</span>
        </Link>
        <Link href={href({ tab: "archived" })} className={tab(archivedTab)}>
          {t("students.tabArchived")}{" "}
          <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs">{archived.length}</span>
        </Link>
      </nav>

      {list.length === 0 ? (
        <p className="text-sm text-slate-500">
          {query
            ? t("students.noResults")
            : archivedTab
              ? t("students.noArchived")
              : t("students.empty")}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-[2fr_1fr_1.2fr_1.6fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-500 md:grid">
            <span>{t("students.colName")}</span>
            <span>{t("students.colProgrammed")}</span>
            <span>
              {t("students.colCompliance")}
              <span className="block font-normal text-slate-400">{t("students.colComplianceHint")}</span>
            </span>
            <span>{t("students.colGroups")}</span>
            <span />
          </div>
          <ul className="divide-y divide-slate-100">
            {list.map((student) => {
              const s = stats.get(student.id);
              return (
                <li
                  key={student.id}
                  className="grid gap-3 px-4 py-4 md:grid-cols-[2fr_1fr_1.2fr_1.6fr_auto] md:items-center md:gap-4"
                >
                  <Link href={`/trainer/students/${student.id}`} className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-brand/60 bg-slate-100 text-sm font-semibold text-slate-700">
                      {initials(student.name)}
                    </span>
                    <span>
                      <span className="block font-medium text-slate-900 hover:underline">{student.name}</span>
                      <span className="block text-xs text-slate-500">
                        {s?.lastCompletedDate
                          ? t("adherence.lastWorkout", { date: formatDate(s.lastCompletedDate, intlLocale) })
                          : archivedTab
                            ? t("students.archivedBadge")
                            : t("adherence.noneDone")}
                      </span>
                    </span>
                  </Link>

                  <div className="flex items-center gap-2 text-xs text-slate-500 md:block">
                    <span className="md:hidden">{t("students.colProgrammed")}:</span>
                    {archivedTab ? <span className="text-slate-400">—</span> : programmedBadge(s)}
                  </div>

                  <div className="text-sm text-slate-500">
                    <span className="mr-1 text-xs md:hidden">{t("students.colCompliance")}:</span>
                    {s ? (
                      <>
                        <Percent ratio={s.last7} /> · <Percent ratio={s.month} />
                      </>
                    ) : (
                      "—"
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {student.memberships.map((m) => (
                      <Link
                        key={m.id}
                        href={`/trainer/groups/${m.groupId}`}
                        className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 hover:bg-indigo-100"
                      >
                        <GroupIcon className="mr-0.5" />{m.group.name}
                      </Link>
                    ))}
                  </div>

                  <form action={setStudentArchivedAction.bind(null, student.id, !archivedTab)}>
                    <button className="text-xs font-medium text-slate-500 hover:text-slate-900">
                      {archivedTab ? t("students.unarchive") : t("students.archive")}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
