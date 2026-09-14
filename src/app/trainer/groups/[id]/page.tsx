import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import {
  addStudentToGroupAction,
  removeStudentFromGroupAction,
  deleteGroupAction,
} from "@/app/trainer/actions";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireTrainer();

  const group = await prisma.group.findFirst({
    where: { id, trainerId: session.user.id },
    include: {
      members: { include: { student: true }, orderBy: { student: { name: "asc" } } },
      workouts: { orderBy: { date: "desc" } },
    },
  });
  if (!group) notFound();

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
          <h1 className="text-xl font-bold text-slate-900">{group.name}</h1>
          <div className="flex items-center gap-3">
            <Link
              href={`/trainer/workouts/new?groupId=${group.id}`}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              + Treino para o grupo
            </Link>
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

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Treinos do grupo</h2>
        {group.workouts.length === 0 ? (
          <p className="text-sm text-slate-500">Ainda sem treinos atribuídos a este grupo.</p>
        ) : (
          <ul className="space-y-2">
            {group.workouts.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/trainer/workouts/${w.id}`}
                  className="block rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
                >
                  <p className="font-medium text-slate-900">{w.title}</p>
                  <p className="text-xs text-slate-500">
                    {w.date ? new Date(w.date).toLocaleDateString("pt-PT") : "Sem data"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
