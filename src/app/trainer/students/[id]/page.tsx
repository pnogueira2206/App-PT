import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { addDays, resolveWeekStart, todayKey } from "@/lib/dates";
import { readClipboard } from "@/lib/clipboard";
import {
  completionState,
  getStudentGroupIds,
  studentWorkoutsWhere,
  withoutOverridden,
} from "@/lib/workouts";
import { WeekCalendar } from "@/components/week-calendar";

export default async function StudentCalendarPage({
  params,
  searchParams,
}: PageProps<"/trainer/students/[id]">) {
  const { id } = await params;
  const { week } = (await searchParams) as { week?: string };
  const session = await requireTrainer();

  const student = await prisma.user.findFirst({
    where: { id, trainerId: session.user.id, role: "STUDENT" },
  });
  if (!student) notFound();

  const weekStart = resolveWeekStart(week);
  const groupIds = await getStudentGroupIds(id);

  const [workouts, clipboard] = await Promise.all([
    prisma.workout
      .findMany({
        where: {
          ...studentWorkoutsWhere(id, groupIds),
          trainerId: session.user.id,
          date: { gte: weekStart, lt: addDays(weekStart, 7) },
        },
        include: {
          group: true,
          completions: { where: { studentId: id } },
          blocks: {
            select: { _count: { select: { results: { where: { studentId: id } } } } },
          },
        },
        orderBy: { createdAt: "asc" },
      })
      .then((list) => withoutOverridden(list, id)),
    readClipboard(),
  ]);

  const today = todayKey();

  return (
    <WeekCalendar
      owner={{ type: "student", id }}
      basePath={`/trainer/students/${id}`}
      weekStart={weekStart}
      clipboard={clipboard}
      workouts={workouts.map((w) => ({
        id: w.id,
        title: w.title,
        date: w.date,
        status: w.status,
        blocksCount: w.blocks.length,
        groupName: w.group?.name ?? null,
        isOverride: !!w.sourceWorkoutId,
        state: completionState(w, today, {
          completed: w.completions.length > 0,
          resultsCount: w.blocks.reduce((n, b) => n + b._count.results, 0),
        }),
      }))}
    />
  );
}
