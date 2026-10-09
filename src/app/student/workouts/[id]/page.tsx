import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/require-session";
import { formatLongDate, toDateKey } from "@/lib/dates";
import { getI18n } from "@/i18n/server";
import { loadFromPercent } from "@/lib/blocks";
import { findStudentWorkout, getOneRepMaxes } from "@/lib/workouts";
import { BlockView } from "@/components/block-view";
import { ResultForm } from "@/components/result-form";
import { CompleteWorkoutForm } from "@/components/complete-workout-form";

export default async function StudentWorkoutPage({ params }: PageProps<"/student/workouts/[id]">) {
  const { id } = await params;
  const session = await requireStudent();
  const studentId = session.user.id;
  const i18n = await getI18n();
  const { t, intlLocale } = i18n;

  if (!(await findStudentWorkout(id, studentId))) {
    // An old link to a group workout that was later adjusted for this student.
    const override = await prisma.workout.findFirst({
      where: { sourceWorkoutId: id, studentId, status: "PUBLISHED" },
      select: { id: true },
    });
    if (override) redirect(`/student/workouts/${override.id}`);
    notFound();
  }

  const workout = await prisma.workout.findUniqueOrThrow({
    where: { id },
    include: {
      trainer: { select: { name: true } },
      completions: { where: { studentId } },
      blocks: {
        orderBy: { order: "asc" },
        include: {
          exercise: true,
          results: { where: { studentId }, include: { sets: true } },
        },
      },
    },
  });

  const oneRepMaxes = await getOneRepMaxes(
    studentId,
    workout.blocks.filter((b) => b.percent1RM && b.exerciseId).map((b) => b.exerciseId!)
  );

  return (
    <div className="space-y-4 pb-4">
      <div>
        <Link
          href={`/student?week=${toDateKey(workout.date)}`}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          {t("studentHome.backToCalendar")}
        </Link>
        <h1 className="mt-1 text-xl font-bold text-slate-900">{workout.title}</h1>
        <p className="text-sm text-slate-500 first-letter:uppercase">
          {formatLongDate(workout.date, intlLocale)}
          {" · "}
          {workout.trainer.name}
        </p>
        {workout.description && (
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{workout.description}</p>
        )}
      </div>

      <div className="space-y-3">
        {workout.blocks.map((block, idx) => {
          const oneRepMax = block.exerciseId ? oneRepMaxes.get(block.exerciseId) : undefined;
          return (
            <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <BlockView
                block={block}
                index={idx}
                oneRepMaxKg={oneRepMax}
                i18n={i18n}

                exerciseHref={block.exercise ? `/student/exercises/${block.exercise.id}/history` : undefined}
              />
              <ResultForm
                block={block}
                existing={block.results[0] ?? null}
                suggestedLoadKg={
                  block.percent1RM && oneRepMax ? loadFromPercent(oneRepMax, block.percent1RM) : undefined
                }
              />
            </div>
          );
        })}
      </div>

      <CompleteWorkoutForm workoutId={workout.id} existing={workout.completions[0] ?? null} />
    </div>
  );
}
