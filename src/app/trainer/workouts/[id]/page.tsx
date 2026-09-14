import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { AddBlockForm } from "@/components/add-block-form";
import { deleteBlockAction, deleteWorkoutAction } from "@/app/trainer/workouts/actions";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireTrainer();

  const workout = await prisma.workout.findFirst({
    where: { id, trainerId: session.user.id },
    include: {
      group: { include: { members: { include: { student: true } } } },
      student: true,
      blocks: {
        orderBy: { order: "asc" },
        include: { results: { include: { student: true } }, exercise: true },
      },
    },
  });
  if (!workout) notFound();

  const targetStudents = workout.group
    ? workout.group.members.map((m) => m.student)
    : workout.student
      ? [workout.student]
      : [];

  const removeBlock = deleteBlockAction.bind(null, workout.id);
  const removeWorkout = deleteWorkoutAction.bind(null, workout.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/trainer/workouts" className="text-sm text-slate-500 hover:text-slate-900">
          ← Treinos
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{workout.title}</h1>
            <p className="text-sm text-slate-500">
              {workout.group?.name ?? workout.student?.name ?? "Sem destinatário"}
              {workout.date ? ` · ${new Date(workout.date).toLocaleDateString("pt-PT")}` : ""}
            </p>
          </div>
          <form action={removeWorkout}>
            <button type="submit" className="text-sm text-red-500 hover:text-red-700">
              Eliminar treino
            </button>
          </form>
        </div>
        {workout.description && (
          <p className="mt-2 text-sm text-slate-600">{workout.description}</p>
        )}
      </div>

      <section className="space-y-3">
        {workout.blocks.map((block, idx) => (
          <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Bloco {idx + 1}
                </p>
                <h3 className="font-semibold text-slate-900">{block.title}</h3>
                {block.exercise && (
                  <p className="text-sm text-slate-600">{block.exercise.name}</p>
                )}
                <p className="mt-1 text-sm text-slate-500">
                  {[
                    block.prescribedSets ? `${block.prescribedSets} séries` : null,
                    block.prescribedReps ? `${block.prescribedReps} reps` : null,
                    block.prescribedWeight ? block.prescribedWeight : null,
                    block.restSeconds ? `${block.restSeconds}s descanso` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {block.trainerNotes && (
                  <p className="mt-1 text-sm italic text-slate-500">
                    &ldquo;{block.trainerNotes}&rdquo;
                  </p>
                )}
              </div>
              <form action={removeBlock}>
                <input type="hidden" name="blockId" value={block.id} />
                <button type="submit" className="text-xs text-slate-400 hover:text-red-600">
                  Remover
                </button>
              </form>
            </div>

            {targetStudents.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                {targetStudents.map((student) => {
                  const result = block.results.find((r) => r.studentId === student.id);
                  return (
                    <div
                      key={student.id}
                      className="flex flex-wrap items-center justify-between gap-1 text-sm"
                    >
                      <span className="font-medium text-slate-700">{student.name}</span>
                      {result ? (
                        <span className="text-slate-600">
                          {result.scoreText || "Concluído"}
                          {result.studentNotes && (
                            <span className="italic text-slate-400"> — {result.studentNotes}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-300">Sem resultado</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </section>

      <AddBlockForm workoutId={workout.id} />
    </div>
  );
}
