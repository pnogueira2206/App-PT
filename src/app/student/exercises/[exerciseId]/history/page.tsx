import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/require-session";

export default async function ExerciseHistoryPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  const session = await requireStudent();

  const student = await prisma.user.findUnique({ where: { id: session.user.id } });

  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, trainerId: student?.trainerId ?? undefined },
  });
  if (!exercise) notFound();

  const [results, records] = await Promise.all([
    prisma.blockResult.findMany({
      where: { studentId: session.user.id, block: { exerciseId } },
      include: { block: { include: { workout: true } } },
      orderBy: { completedAt: "desc" },
    }),
    prisma.personalRecord.findMany({
      where: { studentId: session.user.id, exerciseId },
      orderBy: { recordDate: "desc" },
    }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/student/records" className="text-sm text-slate-500 hover:text-slate-900">
          ← Voltar
        </Link>
        <h1 className="mt-1 text-xl font-bold text-slate-900">{exercise.name}</h1>
      </div>

      {records.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-slate-900">Recordes</h2>
          <ul className="space-y-1.5">
            {records.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-800">
                  {r.value} {r.unit ?? ""}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(r.recordDate).toLocaleDateString("pt-PT")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-semibold text-slate-900">Histórico de resultados</h2>
        {results.length === 0 ? (
          <p className="text-sm text-slate-500">
            Ainda não registaste resultados para este exercício.
          </p>
        ) : (
          <ul className="space-y-2">
            {results.map((r) => (
              <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">
                    {r.block.workout.title}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(r.completedAt).toLocaleDateString("pt-PT")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {[
                    r.setsCompleted ? `${r.setsCompleted} séries` : null,
                    r.repsCompleted ? `${r.repsCompleted} reps` : null,
                    r.weightUsed ?? null,
                    r.rpe ? `RPE ${r.rpe}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {r.studentNotes && (
                  <p className="mt-1 text-xs italic text-slate-400">{r.studentNotes}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
