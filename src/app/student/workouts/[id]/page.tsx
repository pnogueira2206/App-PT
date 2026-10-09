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
import { CommentThread } from "@/components/comment-thread";
import { RecordSuggestion } from "@/components/record-suggestion";
import { detectRecord } from "@/lib/records";


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
          results: {
            where: { studentId },
            include: {
              sets: true,
              records: { select: { id: true } },
              comments: {
                orderBy: { createdAt: "asc" },
                include: { author: { select: { name: true, role: true } } },
              },
            },
          },
        },
      },
    },
  });

  const exerciseIds = workout.blocks.map((b) => b.exerciseId).filter((e): e is string => !!e);
  const [oneRepMaxes, records] = await Promise.all([
    getOneRepMaxes(
      studentId,
      workout.blocks.filter((b) => b.percent1RM && b.exerciseId).map((b) => b.exerciseId!)
    ),
    prisma.personalRecord.findMany({
      where: { studentId, exerciseId: { in: exerciseIds } },
      select: { exerciseId: true, type: true, value: true, unit: true },
    }),
  ]);

  // Opening the workout counts as reading the coach's comments on it.
  const resultIds = workout.blocks.flatMap((b) => b.results.map((r) => r.id));
  if (resultIds.length > 0) {
    await prisma.resultComment.updateMany({
      where: { resultId: { in: resultIds }, readAt: null, authorId: { not: studentId } },
      data: { readAt: new Date() },
    });
  }

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

      {workout.warmup && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("editor.warmup")}</p>
            <p className="whitespace-pre-wrap text-slate-700">{workout.warmup}</p>
          </div>
        )}

      <div className="space-y-3">
        {workout.blocks.map((block, idx) => {
          const oneRepMax = block.exerciseId ? oneRepMaxes.get(block.exerciseId) : undefined;
          const result = block.results[0] ?? null;
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
                existing={result}
                suggestedLoadKg={
                  block.percent1RM && oneRepMax ? loadFromPercent(oneRepMax, block.percent1RM) : undefined
                }
              />
              {result && (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  <RecordSuggestion
                    resultId={result.id}
                    saved={result.records.length > 0}
                    candidate={
                      result.records.length > 0 || block.benchmark
                        ? null
                        : detectRecord(
                            block,
                            result,
                            records.filter((r) => r.exerciseId === block.exerciseId)
                          )
                    }
                    i18n={i18n}
                  />
                  <CommentThread
                    resultId={result.id}
                    viewer="student"
                    comments={result.comments.map((c) => ({
                      id: c.id,
                      body: c.body,
                      createdAt: c.createdAt,
                      authorName: c.author.name,
                      fromTrainer: c.author.role === "TRAINER",
                    }))}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {workout.cooldown && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("editor.cooldown")}</p>
          <p className="whitespace-pre-wrap text-slate-700">{workout.cooldown}</p>
        </div>
      )}

      <CompleteWorkoutForm workoutId={workout.id} existing={workout.completions[0] ?? null} />
    </div>
  );
}
