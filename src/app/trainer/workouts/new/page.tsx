import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { NewWorkoutForm } from "@/components/new-workout-form";

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string; studentId?: string }>;
}) {
  const session = await requireTrainer();
  const params = await searchParams;

  const [groups, students] = await Promise.all([
    prisma.group.findMany({
      where: { trainerId: session.user.id },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { trainerId: session.user.id, role: "STUDENT" },
      orderBy: { name: "asc" },
    }),
  ]);

  const defaultTarget = params.groupId
    ? `group:${params.groupId}`
    : params.studentId
      ? `student:${params.studentId}`
      : undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Novo treino</h1>
      <NewWorkoutForm groups={groups} students={students} defaultTarget={defaultTarget} />
    </div>
  );
}
