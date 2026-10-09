import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { resolveWeekStart } from "@/lib/dates";
import { loadCalendar } from "@/lib/calendar";
import { readClipboard } from "@/lib/clipboard";
import { CalendarGrid, GRID_WEEKS, gridStart } from "@/components/calendar-grid";
import { getI18n } from "@/i18n/server";
import {
  addStudentToGroupAction,
  removeStudentFromGroupAction,
  deleteGroupAction,
} from "@/app/trainer/actions";

export default async function GroupDetailPage({
  params,
  searchParams,
}: PageProps<"/trainer/groups/[id]">) {
  const { id } = await params;
  const { week } = (await searchParams) as { week?: string };
  const session = await requireTrainer();
  const { t } = await getI18n();
  const anchorWeek = resolveWeekStart(week);

  const group = await prisma.group.findFirst({
    where: { id, trainerId: session.user.id },
    include: {
      members: { include: { student: true }, orderBy: { student: { name: "asc" } } },
    },
  });
  if (!group) notFound();

  const owner = { type: "group" as const, id: group.id };
  const [workouts, clipboard] = await Promise.all([
    loadCalendar(session.user.id, owner, gridStart(anchorWeek), GRID_WEEKS * 7),
    readClipboard(),
  ]);

  const availableStudents = await prisma.user.findMany({
    where: {
      trainerId: session.user.id,
      role: "STUDENT",
      archivedAt: null,
      id: { notIn: group.members.map((m) => m.studentId) },
    },

    orderBy: { name: "asc" },
  });

  const addMember = addStudentToGroupAction.bind(null, group.id);
  const removeMember = removeStudentFromGroupAction.bind(null, group.id);
  const deleteGroup = deleteGroupAction.bind(null, group.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/trainer/groups" className="text-sm text-slate-500 hover:text-slate-900">
          {t("groups.back")}
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">👥 {group.name}</h1>
            <p className="text-sm text-slate-500">{t("groups.description")}</p>
          </div>
          <div className="flex items-center gap-3">
            <form action={deleteGroup}>
              <button
                type="submit"
                className="text-sm text-red-500 hover:text-red-700"
              >
                {t("groups.deleteGroup")}
              </button>
            </form>
          </div>
        </div>
      </div>

      <CalendarGrid
        owner={owner}
        basePath={`/trainer/groups/${group.id}`}
        anchorWeek={anchorWeek}
        workouts={workouts}
        clipboard={clipboard}
      />

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">{t("groups.members")}</h2>
        {availableStudents.length > 0 && (
          <form action={addMember} className="flex flex-wrap items-center gap-2">
            <select
              name="studentId"
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
            <button
              type="submit"
              className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-ink hover:bg-brand-hover"
            >
              {t("common.add")}
            </button>
          </form>
        )}

        {group.members.length === 0 ? (
          <p className="text-sm text-slate-500">{t("groups.noMembers")}</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {group.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-2.5">
                <Link
                  href={`/trainer/students/${m.studentId}`}
                  className="font-medium text-slate-800 hover:underline"
                >
                  {m.student.name}
                  {m.student.archivedAt && (
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {t("students.archivedBadge")}
                    </span>
                  )}
                </Link>
                <form action={removeMember}>
                  <input type="hidden" name="studentId" value={m.studentId} />
                  <button
                    type="submit"
                    className="text-sm text-slate-400 hover:text-red-600"
                  >
                    {t("common.remove")}

                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}
