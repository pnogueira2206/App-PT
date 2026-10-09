import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { addDays, formatDate, parseDateKey, todayKey } from "@/lib/dates";
import { getStudentStats, percent, type Ratio, type StudentStats } from "@/lib/adherence";
import { OwnerCalendar, type CalendarSearchParams } from "@/components/owner-calendar";
import { getI18n } from "@/i18n/server";
import {
  addStudentToGroupAction,
  removeStudentFromGroupAction,
  deleteGroupAction,
} from "@/app/trainer/actions";
import { CalendarCheckIcon, GroupIcon } from "@/components/icons";

/** Average of the members' percentages (members with nothing planned are skipped). */
function average(stats: StudentStats[], pick: (s: StudentStats) => Ratio) {
  const values = stats.map((s) => percent(pick(s))).filter((v): v is number => v != null);
  return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
}

function complianceCell(value: number | null) {
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

export default async function GroupDetailPage({
  params,
  searchParams,
}: PageProps<"/trainer/groups/[id]">) {
  const { id } = await params;
  const session = await requireTrainer();
  const { t, intlLocale } = await getI18n();
  const today = parseDateKey(todayKey())!;

  const group = await prisma.group.findFirst({
    where: { id, trainerId: session.user.id },
    include: {
      members: { include: { student: true }, orderBy: { student: { name: "asc" } } },
      trainingDays: true,
    },
  });
  if (!group) notFound();

  const activeIds = group.members.filter((m) => !m.student.archivedAt).map((m) => m.studentId);
  const [availableStudents, statsMap, lastWorkout] = await Promise.all([
    prisma.user.findMany({
      where: {
        trainerId: session.user.id,
        role: "STUDENT",
        archivedAt: null,
        id: { notIn: group.members.map((m) => m.studentId) },
      },
      orderBy: { name: "asc" },
    }),
    activeIds.length > 0 ? getStudentStats(session.user.id, activeIds) : new Map<string, StudentStats>(),
    prisma.workout.findFirst({
      where: { groupId: group.id, kind: "TRAINING", status: "PUBLISHED", date: { gte: today } },
      orderBy: { date: "desc" },
      select: { date: true },
    }),
  ]);
  const stats = [...statsMap.values()];
  const until = lastWorkout?.date ?? null;
  const untilTone = !until ? "text-red-600" : until < addDays(today, 3) ? "text-amber-600" : "text-emerald-600";

  const focus = Array.from(
    { length: 7 },
    (_, weekday) => group.trainingDays.find((d) => d.weekday === weekday)?.focus ?? null
  );

  const addMember = addStudentToGroupAction.bind(null, group.id);
  const removeMember = removeStudentFromGroupAction.bind(null, group.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
        <Link href="/trainer/groups" className="text-sm text-slate-500 hover:text-slate-900">
          {t("groups.back")}
        </Link>

        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-brand/60 bg-slate-100 text-2xl">
            <GroupIcon />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-900">{group.name}</h1>
            <p className="text-xs text-slate-500">{t("groups.membersCount", { count: activeIds.length })}</p>
          </div>
        </div>
        <p className="text-xs text-slate-500">{t("groups.description")}</p>

        <dl className="space-y-2 border-y border-slate-200 py-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-slate-500"><CalendarCheckIcon className="mr-1.5" />{t("students.colProgrammed")}</dt>
            <dd className={`font-semibold ${untilTone}`}>
              {until ? formatDate(until, intlLocale, { weekday: "short", day: "numeric", month: "short" }) : t("students.notProgrammed")}
            </dd>
          </div>
        </dl>

        {stats.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">{t("groups.averageCompliance")}</p>
            <div className="grid grid-cols-3 gap-1 text-center text-[11px] font-semibold text-slate-500">
              <span>7D</span>
              <span>30D</span>
              <span>90D</span>
              {complianceCell(average(stats, (s) => s.last7))}
              {complianceCell(average(stats, (s) => s.last30))}
              {complianceCell(average(stats, (s) => s.last90))}
            </div>
          </div>
        )}

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-slate-700">{t("groups.members")}</h2>
          {group.members.length === 0 ? (
            <p className="text-sm text-slate-500">{t("groups.noMembers")}</p>
          ) : (
            <ul className="space-y-1">
              {group.members.map((m) => {
                const value = percent(statsMap.get(m.studentId)?.last7 ?? { done: 0, planned: 0 });
                return (
                  <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                    <Link href={`/trainer/students/${m.studentId}`} className="truncate font-medium text-slate-800 hover:underline">
                      {m.student.name}
                      {m.student.archivedAt && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          {t("students.archivedBadge")}
                        </span>
                      )}
                    </Link>
                    <span className="flex shrink-0 items-center gap-2">
                      {value != null && <span className="text-xs text-slate-500">{value}%</span>}
                      <form action={removeMember}>
                        <input type="hidden" name="studentId" value={m.studentId} />
                        <button className="text-slate-400 hover:text-red-600" title={t("common.remove")}>
                          ×
                        </button>
                      </form>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {availableStudents.length > 0 && (
            <form action={addMember} className="flex gap-2">
              <select
                name="studentId"
                required
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  {t("groups.addStudent")}
                </option>
                {availableStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-ink hover:bg-brand-hover">
                {t("common.add")}
              </button>
            </form>
          )}
        </section>

        <form action={deleteGroupAction.bind(null, group.id)} className="border-t border-slate-200 pt-3">
          <button className="text-sm text-red-500 hover:text-red-700">{t("groups.deleteGroup")}</button>
        </form>
      </aside>

      <div className="min-w-0">
        <OwnerCalendar
          trainerId={session.user.id}
          owner={{ type: "group", id: group.id }}
          basePath={`/trainer/groups/${group.id}`}
          params={(await searchParams) as CalendarSearchParams}
          focus={focus}
        />
      </div>
    </div>
  );
}
