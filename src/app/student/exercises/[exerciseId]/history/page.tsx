import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/require-session";
import { getI18n } from "@/i18n/server";
import { ExerciseHistory } from "@/components/exercise-history";

export default async function ExerciseHistoryPage({
  params,
}: PageProps<"/student/exercises/[exerciseId]/history">) {
  const { exerciseId } = await params;
  const session = await requireStudent();
  const i18n = await getI18n();

  const student = await prisma.user.findUnique({ where: { id: session.user.id } });
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, trainerId: student?.trainerId ?? undefined },
  });
  if (!exercise) notFound();

  return (
    <ExerciseHistory studentId={session.user.id} exercise={exercise} backHref="/student/profile" i18n={i18n} />
  );
}
