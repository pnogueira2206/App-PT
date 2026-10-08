import type { ExerciseCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { EXERCISE_CATEGORY_LABELS } from "@/lib/blocks";
import { ExerciseItem, NewExerciseForm } from "@/components/exercise-form";

export default async function ExercisesPage() {
  const session = await requireTrainer();

  const exercises = await prisma.exercise.findMany({
    where: { trainerId: session.user.id },
    orderBy: { name: "asc" },
  });

  const categories = (Object.keys(EXERCISE_CATEGORY_LABELS) as ExerciseCategory[]).filter((c) =>
    exercises.some((e) => e.category === c)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Exercícios</h1>
          <p className="text-sm text-slate-500">
            Os alunos veem o vídeo de demonstração em cada bloco que use o exercício.
          </p>
        </div>
        <NewExerciseForm />
      </div>

      {exercises.length === 0 ? (
        <p className="text-sm text-slate-500">
          Ainda sem exercícios. Também são criados automaticamente quando os usas num bloco.
        </p>
      ) : (
        categories.map((category) => (
          <section key={category} className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {EXERCISE_CATEGORY_LABELS[category]}
            </h2>
            <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
              {exercises
                .filter((e) => e.category === category)
                .map((exercise) => (
                  <ExerciseItem
                    key={exercise.id}
                    exercise={{
                      id: exercise.id,
                      name: exercise.name,
                      category: exercise.category,
                      videoUrl: exercise.videoUrl,
                      notes: exercise.notes,
                    }}
                  />
                ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
