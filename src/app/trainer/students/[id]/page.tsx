import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { OwnerCalendar, type CalendarSearchParams } from "@/components/owner-calendar";

export default async function StudentCalendarPage({
  params,
  searchParams,
}: PageProps<"/trainer/students/[id]">) {
  const { id } = await params;
  const session = await requireTrainer();

  const student = await prisma.user.findFirst({
    where: { id, trainerId: session.user.id, role: "STUDENT" },
    include: { trainingDays: true },
  });
  if (!student) notFound();

  const focus = Array.from(
    { length: 7 },
    (_, weekday) => student.trainingDays.find((d) => d.weekday === weekday)?.focus ?? null
  );

  return (
    <OwnerCalendar
      trainerId={session.user.id}
      owner={{ type: "student", id }}
      basePath={`/trainer/students/${id}`}
      params={(await searchParams) as CalendarSearchParams}
      focus={focus}
    />
  );
}
