import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";

export default async function WorkoutsPage() {
  const session = await requireTrainer();

  const workouts = await prisma.workout.findMany({
    where: { trainerId: session.user.id },
    include: { group: true, student: true, blocks: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Treinos</h1>
        <Link
          href="/trainer/workouts/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Novo treino
        </Link>
      </div>

      {workouts.length === 0 ? (
        <p className="text-sm text-slate-500">Ainda não criaste nenhum treino.</p>
      ) : (
        <ul className="space-y-2">
          {workouts.map((w) => (
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
    </div>
  );
}
