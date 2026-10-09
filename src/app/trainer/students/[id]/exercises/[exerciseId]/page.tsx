import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { getI18n } from "@/i18n/server";
import { ExerciseHistory } from "@/components/exercise-history";

export default async function StudentExerciseHistoryPage({
  params,
}: PageProps<"/trainer/students/[id]/exercises/[exerciseId]">) {
  const { id, exerciseId } = await params;
  const session = await requireTrainer();
  const i18n = await getI18n();

  const [student, exercise] = await Promise.all([
    prisma.user.findFirst({ where: { id, trainerId: session.user.id, role: "STUDENT" } }),
    prisma.exercise.findFirst({ where: { id: exerciseId, trainerId: session.user.id } }),
  ]);
  if (!student || !exercise) notFound();

  return (
    <ExerciseHistory
      studentId={student.id}
      exercise={exercise}
      backHref={`/trainer/students/${student.id}/profile`}
      i18n={i18n}
    />
  );
}
