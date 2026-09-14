import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/require-session";

export default async function StudentHomePage() {
  const session = await requireStudent();

  const memberships = await prisma.groupMember.findMany({
    where: { studentId: session.user.id },
    select: { groupId: true },
  });
  const groupIds = memberships.map((m) => m.groupId);

  const workouts = await prisma.workout.findMany({
    where: {
      OR: [{ studentId: session.user.id }, { groupId: { in: groupIds } }],
    },
    include: {
      blocks: { include: { results: { where: { studentId: session.user.id } } } },
      trainer: true,
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Os meus treinos</h1>

      {workouts.length === 0 ? (
        <p className="text-sm text-slate-500">
          Ainda não tens treinos atribuídos. Fala com o teu treinador.
        </p>
      ) : (
        <ul className="space-y-2">
          {workouts.map((w) => {
            const total = w.blocks.length;
            const done = w.blocks.filter((b) => b.results.length > 0).length;
            const complete = total > 0 && done === total;
            return (
              <li key={w.id}>
                <Link
                  href={`/student/workouts/${w.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{w.title}</p>
                      <p className="text-xs text-slate-500">
                        {w.date ? new Date(w.date).toLocaleDateString("pt-PT") : "Sem data"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        complete
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {done}/{total}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
