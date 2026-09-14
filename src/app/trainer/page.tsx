import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";

export default async function TrainerHomePage() {
  const session = await requireTrainer();

  const [studentCount, groupCount, recentWorkouts] = await Promise.all([
    prisma.user.count({ where: { trainerId: session.user.id, role: "STUDENT" } }),
    prisma.group.count({ where: { trainerId: session.user.id } }),
    prisma.workout.findMany({
      where: { trainerId: session.user.id },
      include: { group: true, student: true, blocks: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">
        Olá, {session.user.name}
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Link
          href="/trainer/students"
          className="rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50"
        >
          <p className="text-2xl font-bold text-slate-900">{studentCount}</p>
          <p className="text-sm text-slate-500">Alunos</p>
        </Link>
        <Link
          href="/trainer/groups"
          className="rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50"
        >
          <p className="text-2xl font-bold text-slate-900">{groupCount}</p>
          <p className="text-sm text-slate-500">Grupos</p>
        </Link>
        <Link
          href="/trainer/workouts/new"
          className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          + Criar treino
        </Link>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Treinos recentes</h2>
          <Link href="/trainer/workouts" className="text-sm text-slate-500 hover:text-slate-900">
            Ver todos
          </Link>
        </div>
        {recentWorkouts.length === 0 ? (
          <p className="text-sm text-slate-500">
            Ainda não criaste nenhum treino.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentWorkouts.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/trainer/workouts/${w.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{w.title}</p>
                    <p className="text-xs text-slate-500">
                      {w.group?.name ?? w.student?.name ?? "Sem destinatário"} ·{" "}
                      {w.blocks.length} blocos
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {w.date ? new Date(w.date).toLocaleDateString("pt-PT") : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
