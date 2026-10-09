import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { resolveWeekStart } from "@/lib/dates";
import { readClipboard } from "@/lib/clipboard";
import { loadCalendar } from "@/lib/calendar";
import { CalendarGrid, GRID_WEEKS, gridStart } from "@/components/calendar-grid";

export default async function StudentCalendarPage({
  params,
  searchParams,
}: PageProps<"/trainer/students/[id]">) {
  const { id } = await params;
  const { week } = (await searchParams) as { week?: string };
  const session = await requireTrainer();

  const student = await prisma.user.findFirst({
    where: { id, trainerId: session.user.id, role: "STUDENT" },
    include: { trainingDays: true },
  });
  if (!student) notFound();

  const anchorWeek = resolveWeekStart(week);
  const owner = { type: "student" as const, id };
  const [workouts, clipboard] = await Promise.all([
    loadCalendar(session.user.id, owner, gridStart(anchorWeek), GRID_WEEKS * 7),
    readClipboard(),
  ]);

  const focus = Array.from(
    { length: 7 },
    (_, weekday) => student.trainingDays.find((d) => d.weekday === weekday)?.focus ?? null
  );

  return (
    <CalendarGrid
      owner={owner}
      basePath={`/trainer/students/${id}`}
      anchorWeek={anchorWeek}
      workouts={workouts}
      clipboard={clipboard}
      focus={focus}
    />
  );
}
