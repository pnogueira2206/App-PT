import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { addDays, resolveWeekStart } from "@/lib/dates";
import { readClipboard } from "@/lib/clipboard";
import { WeekCalendar } from "@/components/week-calendar";
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
  const weekStart = resolveWeekStart(week);

  const group = await prisma.group.findFirst({
    where: { id, trainerId: session.user.id },
    include: {
      members: { include: { student: true }, orderBy: { student: { name: "asc" } } },
      workouts: {
        where: { date: { gte: weekStart, lt: addDays(weekStart, 7) } },
        include: {
          _count: { select: { blocks: true } },
          completions: { select: { studentId: true } },
          overrides: { select: { completions: { select: { studentId: true } } } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!group) notFound();

  const clipboard = await readClipboard();

  const memberIds = new Set(group.members.map((m) => m.studentId));
  const availableStudents = await prisma.user.findMany({
    where: {
      trainerId: session.user.id,
      role: "STUDENT",
      id: { notIn: [...memberIds] },
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
          ← Grupos
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">👥 {group.name}</h1>
            <p className="text-sm text-slate-500">
              Os treinos deste calendário aparecem no calendário de cada membro. Cada aluno
              reporta o seu resultado individualmente.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <form action={deleteGroup}>
              <button
                type="submit"
                className="text-sm text-red-500 hover:text-red-700"
              >
                Eliminar grupo
              </button>
            </form>
          </div>
        </div>
      </div>

      <WeekCalendar
        owner={{ type: "group", id: group.id }}
        basePath={`/trainer/groups/${group.id}`}
        weekStart={weekStart}
        clipboard={clipboard}
        workouts={group.workouts.map((w) => ({
          id: w.id,
          title: w.title,
          date: w.date,
          status: w.status,
          blocksCount: w._count.blocks,
          progress:
            w.status === "PUBLISHED" && memberIds.size > 0
              ? `${countCompleted(w, memberIds)}/${memberIds.size} concluíram`
              : undefined,
        }))}
      />

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Membros</h2>
        {availableStudents.length > 0 && (
          <form action={addMember} className="flex flex-wrap items-center gap-2">
            <select
              name="studentId"
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Adicionar aluno...
              </option>
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Adicionar
            </button>
          </form>
        )}

        {group.members.length === 0 ? (
          <p className="text-sm text-slate-500">Ainda sem alunos neste grupo.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {group.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-2.5">
                <Link
                  href={`/trainer/students/${m.studentId}`}
                  className="font-medium text-slate-800 hover:underline"
                >
                  {m.student.name}
                </Link>
                <form action={removeMember}>
                  <input type="hidden" name="studentId" value={m.studentId} />
                  <button
                    type="submit"
                    className="text-sm text-slate-400 hover:text-red-600"
                  >
                    Remover
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

/** Members who completed the group workout or their adjusted version of it. */
function countCompleted(
  workout: {
    completions: { studentId: string }[];
    overrides: { completions: { studentId: string }[] }[];
  },
  memberIds: Set<string>
) {
  const done = new Set(
    [...workout.completions, ...workout.overrides.flatMap((o) => o.completions)]
      .map((c) => c.studentId)
      .filter((studentId) => memberIds.has(studentId))
  );
  return done.size;
}
