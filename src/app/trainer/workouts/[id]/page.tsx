import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { formatDate, toDateKey } from "@/lib/dates";
import { formatResult } from "@/lib/blocks";
import { calendarPath } from "@/lib/workouts";
import { AddBlockForm } from "@/components/add-block-form";
import { BlockEditor } from "@/components/block-editor";
import { BlockView } from "@/components/block-view";
import { WorkoutDetailsForm } from "@/components/workout-details-form";
import {
  createOverrideAction,
  deleteBlockAction,
  deleteWorkoutAction,
  duplicateBlockAction,
  moveBlockAction,
  setWorkoutStatusAction,
} from "@/app/trainer/workouts/actions";
import { copyWorkoutAction } from "@/app/trainer/calendar/actions";

const smallButton = "text-xs text-slate-400 hover:text-slate-800 disabled:opacity-30";

export default async function WorkoutDetailPage({ params }: PageProps<"/trainer/workouts/[id]">) {
  const { id } = await params;
  const session = await requireTrainer();

  const workout = await prisma.workout.findFirst({
    where: { id, trainerId: session.user.id },
    include: {
      group: {
        include: {
          members: { include: { student: true }, orderBy: { student: { name: "asc" } } },
        },
      },
      student: true,
      sourceWorkout: { include: { group: true } },
      overrides: { select: { id: true, studentId: true } },
      completions: true,
      blocks: {
        orderBy: { order: "asc" },
        include: {
          exercise: true,
          results: { include: { sets: true } },
        },
      },
    },
  });
  if (!workout) notFound();

  const exercises = await prisma.exercise.findMany({
    where: { trainerId: session.user.id },
    orderBy: { name: "asc" },
    select: { name: true },
  });
  const exerciseNames = exercises.map((e) => e.name);

  const overrideByStudent = new Map(workout.overrides.map((o) => [o.studentId, o.id]));
  const targetStudents = workout.group
    ? workout.group.members.map((m) => m.student)
    : workout.student
      ? [workout.student]
      : [];
  const reportingStudents = targetStudents.filter((s) => !overrideByStudent.has(s.id));

  const owner = workout.studentId
    ? ({ type: "student", id: workout.studentId } as const)
    : workout.groupId
      ? ({ type: "group", id: workout.groupId } as const)
      : null;
  const isPublished = workout.status === "PUBLISHED";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href={owner ? calendarPath(owner, workout.date) : "/trainer/workouts"}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← Calendário de {workout.group?.name ?? workout.student?.name ?? "—"}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{workout.title}</h1>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  isPublished ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                }`}
              >
                {isPublished ? "Publicado" : "Rascunho"}
              </span>
            </div>
            <p className="text-sm text-slate-500 first-letter:uppercase">
              {formatDate(workout.date, { weekday: "long", day: "numeric", month: "long" })}
              {" · "}
              {workout.group ? `👥 ${workout.group.name}` : workout.student?.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <form action={setWorkoutStatusAction.bind(null, workout.id, isPublished ? "DRAFT" : "PUBLISHED")}>
              <button
                className={
                  isPublished
                    ? "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    : "rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                }
              >
                {isPublished ? "Voltar a rascunho" : "Publicar"}
              </button>
            </form>
            <form action={copyWorkoutAction.bind(null, workout.id)}>
              <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                Copiar
              </button>
            </form>
            <form action={deleteWorkoutAction.bind(null, workout.id)}>
              <button className="px-1 text-sm text-red-500 hover:text-red-700">Eliminar</button>
            </form>
          </div>
        </div>

        {workout.description && <p className="text-sm text-slate-600">{workout.description}</p>}

        <WorkoutDetailsForm
          workoutId={workout.id}
          title={workout.title}
          description={workout.description}
          date={toDateKey(workout.date)}
        />
      </div>

      {workout.sourceWorkout && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
          Versão ajustada para {workout.student?.name} do treino de grupo{" "}
          <Link href={`/trainer/workouts/${workout.sourceWorkout.id}`} className="font-medium underline">
            {workout.sourceWorkout.title}
            {workout.sourceWorkout.group ? ` (${workout.sourceWorkout.group.name})` : ""}
          </Link>
          . As alterações aqui só afetam este aluno.
        </div>
      )}

      {workout.group && workout.group.members.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-sm font-medium text-slate-700">
            Ajustar este treino para um aluno (lesão, escala, carga diferente...)
          </p>
          <div className="flex flex-wrap gap-2">
            {workout.group.members.map(({ student }) => {
              const overrideId = overrideByStudent.get(student.id);
              return overrideId ? (
                <Link
                  key={student.id}
                  href={`/trainer/workouts/${overrideId}`}
                  className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800 hover:bg-indigo-200"
                >
                  {student.name} · versão ajustada →
                </Link>
              ) : (
                <form key={student.id} action={createOverrideAction.bind(null, workout.id, student.id)}>
                  <button className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50">
                    Ajustar para {student.name}
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      )}

      <section className="space-y-3">
        {workout.blocks.length === 0 && (
          <p className="text-sm text-slate-500">Ainda sem blocos. Adiciona o primeiro abaixo.</p>
        )}
        {workout.blocks.map((block, idx) => (
          <div key={block.id} className="rounded-xl border border-slate-200 bg-white">
            <BlockEditor
              workoutId={workout.id}
              blockId={block.id}
              exerciseNames={exerciseNames}
              initial={{ ...block, exerciseName: block.exercise?.name ?? null }}
            >
              <div className="p-4">
                <BlockView block={block} index={idx} />
              </div>
            </BlockEditor>

            <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-2">
              <form action={moveBlockAction.bind(null, workout.id, block.id, "up")}>
                <button className={smallButton} disabled={idx === 0} aria-label="Mover para cima">
                  ↑
                </button>
              </form>
              <form action={moveBlockAction.bind(null, workout.id, block.id, "down")}>
                <button
                  className={smallButton}
                  disabled={idx === workout.blocks.length - 1}
                  aria-label="Mover para baixo"
                >
                  ↓
                </button>
              </form>
              <form action={duplicateBlockAction.bind(null, workout.id, block.id)}>
                <button className={smallButton}>Duplicar</button>
              </form>
              <form action={deleteBlockAction.bind(null, workout.id, block.id)} className="ml-auto">
                <button className="text-xs text-slate-400 hover:text-red-600">Remover</button>
              </form>
            </div>

            {isPublished && reportingStudents.length > 0 && (
              <div className="space-y-1.5 border-t border-slate-100 px-4 py-3">
                {reportingStudents.map((student) => {
                  const result = block.results.find((r) => r.studentId === student.id);
                  return (
                    <div key={student.id} className="flex flex-wrap items-baseline justify-between gap-1 text-sm">
                      <span className="font-medium text-slate-700">{student.name}</span>
                      {result ? (
                        <span className="text-right text-slate-700">
                          {formatResult(block, result)}
                          {result.studentNotes && (
                            <span className="block text-xs italic text-slate-400">{result.studentNotes}</span>
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

      <AddBlockForm workoutId={workout.id} exerciseNames={exerciseNames} />

      {isPublished && reportingStudents.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-slate-900">Sessão</h2>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {reportingStudents.map((student) => {
              const completion = workout.completions.find((c) => c.studentId === student.id);
              return (
                <li key={student.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5 text-sm">
                  <Link href={`/trainer/students/${student.id}`} className="font-medium text-slate-800 hover:underline">
                    {student.name}
                  </Link>
                  {completion ? (
                    <span className="text-right text-slate-700">
                      ✅ Concluído {formatDate(completion.completedAt, { day: "numeric", month: "short", timeZone: "Europe/Lisbon" })}
                      {completion.sessionRpe ? ` · RPE ${completion.sessionRpe}` : ""}
                      {completion.notes && (
                        <span className="block text-xs italic text-slate-500">{completion.notes}</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-400">Por concluir</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
