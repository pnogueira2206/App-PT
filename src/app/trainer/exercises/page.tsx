import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { EXERCISE_CATEGORIES } from "@/lib/blocks";
import { getI18n } from "@/i18n/server";
import { ExerciseItem, NewExerciseForm } from "@/components/exercise-form";

export default async function ExercisesPage() {
  const session = await requireTrainer();
  const { t } = await getI18n();

  const exercises = await prisma.exercise.findMany({
    where: { trainerId: session.user.id },
    orderBy: { name: "asc" },
  });

  const categories = EXERCISE_CATEGORIES.filter((c) => exercises.some((e) => e.category === c));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("exercises.title")}</h1>
          <p className="text-sm text-slate-500">{t("exercises.subtitle")}</p>
        </div>
        <NewExerciseForm />
      </div>

      {exercises.length === 0 ? (
        <p className="text-sm text-slate-500">{t("exercises.empty")}</p>
      ) : (
        categories.map((category) => (
          <section key={category} className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {t(`exercises.categories.${category}`)}

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
