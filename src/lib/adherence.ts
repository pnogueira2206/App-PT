import { prisma } from "@/lib/prisma";
import { addDays, parseDateKey, startOfWeek, todayKey } from "@/lib/dates";

// Adherence = published workouts completed / published workouts planned, for days up to today.

export type Ratio = { done: number; planned: number };

export type StudentStats = {
  /** Monday to today. */
  week: Ratio;
  /** Last 7 days, today included. */
  last7: Ratio;
  /** Last 28 days, today included. */
  month: Ratio;
  lastCompletedDate: Date | null;
  nextWorkoutDate: Date | null;
  /** Most recent past workouts not completed, in a row. */
  missedInARow: number;
  /** Published workouts from today to 3 days ahead. */
  upcoming: number;
  /** Date of the last published workout programmed for the student (any date). */
  programmedUntil: Date | null;
};

export function percent(ratio: Ratio): number | null {
  return ratio.planned === 0 ? null : Math.round((ratio.done / ratio.planned) * 100);
}

export async function getStudentStats(
  trainerId: string,
  studentIds?: string[]
): Promise<Map<string, StudentStats>> {
  const today = parseDateKey(todayKey())!;
  const weekStart = startOfWeek(today);
  const monthStart = addDays(today, -27);
  const from = weekStart < monthStart ? weekStart : monthStart;
  const until = addDays(today, 14);

  const students = await prisma.user.findMany({
    where: {
      trainerId,
      role: "STUDENT",
      // A specific list may include archived students (e.g. their own profile header).
      ...(studentIds ? { id: { in: studentIds } } : { archivedAt: null }),
    },
    select: { id: true, memberships: { select: { groupId: true } } },
  });
  const ids = students.map((s) => s.id);
  const groupIds = [...new Set(students.flatMap((s) => s.memberships.map((m) => m.groupId)))];

  // Last programmed day, per student (own workouts) and per group.
  const [lastOwn, lastGroup] = await Promise.all([
    prisma.workout.groupBy({
      by: ["studentId"],
      where: { trainerId, status: "PUBLISHED", studentId: { in: ids } },
      _max: { date: true },
    }),
    prisma.workout.groupBy({
      by: ["groupId"],
      where: { trainerId, status: "PUBLISHED", groupId: { in: groupIds } },
      _max: { date: true },
    }),
  ]);
  const lastByStudent = new Map(lastOwn.map((r) => [r.studentId, r._max.date]));
  const lastByGroup = new Map(lastGroup.map((r) => [r.groupId, r._max.date]));

  const workouts = await prisma.workout.findMany({
    where: {
      trainerId,
      status: "PUBLISHED",
      date: { gte: from, lte: until },
      OR: [{ studentId: { in: ids } }, { groupId: { in: groupIds } }],
    },
    select: {
      id: true,
      date: true,
      studentId: true,
      groupId: true,
      sourceWorkoutId: true,
      completions: { select: { studentId: true } },
    },
    orderBy: { date: "asc" },
  });

  // A student's adjusted version replaces the group workout for them.
  const overridden = new Set(
    workouts.filter((w) => w.sourceWorkoutId && w.studentId).map((w) => `${w.studentId}:${w.sourceWorkoutId}`)
  );
  // Overrides can point at drafts or at workouts outside the window, so also check those.
  const groupWorkoutIds = workouts.filter((w) => w.groupId).map((w) => w.id);
  if (groupWorkoutIds.length > 0) {
    const extra = await prisma.workout.findMany({
      where: { sourceWorkoutId: { in: groupWorkoutIds }, studentId: { in: ids } },
      select: { studentId: true, sourceWorkoutId: true },
    });
    extra.forEach((o) => overridden.add(`${o.studentId}:${o.sourceWorkoutId}`));
  }

  const stats = new Map<string, StudentStats>();
  for (const student of students) {
    const groups = new Set(student.memberships.map((m) => m.groupId));
    const mine = workouts.filter(
      (w) =>
        w.studentId === student.id ||
        (w.groupId && groups.has(w.groupId) && !overridden.has(`${student.id}:${w.id}`))
    );
    const isDone = (w: (typeof mine)[number]) => w.completions.some((c) => c.studentId === student.id);

    const ratio = (start: Date): Ratio => {
      const planned = mine.filter((w) => w.date >= start && w.date <= today);
      return { done: planned.filter(isDone).length, planned: planned.length };
    };

    const past = mine.filter((w) => w.date < today);
    let missedInARow = 0;
    for (let i = past.length - 1; i >= 0 && !isDone(past[i]); i--) missedInARow++;

    const done = mine.filter(isDone);
    const next = mine.find((w) => w.date >= today && !isDone(w));

    const programmedDates = [
      lastByStudent.get(student.id),
      ...student.memberships.map((m) => lastByGroup.get(m.groupId)),
    ].filter((d): d is Date => d instanceof Date);

    stats.set(student.id, {
      week: ratio(weekStart),
      last7: ratio(addDays(today, -6)),
      programmedUntil:
        programmedDates.length > 0 ? new Date(Math.max(...programmedDates.map((d) => d.getTime()))) : null,

      month: ratio(monthStart),
      lastCompletedDate: done.length > 0 ? done[done.length - 1].date : null,
      nextWorkoutDate: next?.date ?? null,
      missedInARow,
      upcoming: mine.filter((w) => w.date >= today && w.date <= addDays(today, 3)).length,
    });
  }
  return stats;
}
