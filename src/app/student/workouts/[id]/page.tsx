import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/require-session";
import { ResultForm } from "@/components/result-form";

export default async function StudentWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireStudent();

  const memberships = await prisma.groupMember.findMany({
    where: { studentId: session.user.id },
    select: { groupId: true },
  });
  const groupIds = memberships.map((m) => m.groupId);

  const workout = await prisma.workout.findFirst({
    where: {
      id,
      OR: [{ studentId: session.user.id }, { groupId: { in: groupIds } }],
    },
    include: {
      trainer: true,
      blocks: {
        orderBy: { order: "asc" },
        include: {
          exercise: true,
          results: { where: { studentId: session.user.id } },
        },
      },
    },
  });
  if (!workout) notFound();

  return (
    <div className="space-y-4 pb-4">
      <div>
        <Link href="/student" className="text-sm text-slate-500 hover:text-slate-900">
          ← Os meus treinos
        </Link>
        <h1 className="mt-1 text-xl font-bold text-slate-900">{workout.title}</h1>
        <p className="text-sm text-slate-500">
          {workout.date ? new Date(workout.date).toLocaleDateString("pt-PT") : ""}
          {" · "}
          {workout.trainer.name}
        </p>
        {workout.description && (
          <p className="mt-2 text-sm text-slate-600">{workout.description}</p>
        )}
      </div>

      <div className="space-y-3">
        {workout.blocks.map((block, idx) => {
          const result = block.results[0] ?? null;
          return (
            <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Bloco {idx + 1}
              </p>
              <h3 className="font-semibold text-slate-900">{block.title}</h3>
              {block.exercise && (
                <Link
                  href={`/student/exercises/${block.exercise.id}/history`}
                  className="text-sm text-slate-600 underline decoration-slate-300 underline-offset-2"
                >
                  {block.exercise.name} · ver histórico
                </Link>
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
                <p className="mt-1 rounded-lg bg-slate-50 p-2 text-sm text-slate-600">
                  {block.trainerNotes}
                </p>
              )}

              <ResultForm blockId={block.id} existing={result} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
