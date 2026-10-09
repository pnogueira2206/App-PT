"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { addDays, diffInDays, parseDateKey, startOfWeek } from "@/lib/dates";
import { readClipboard, writeClipboard } from "@/lib/clipboard";
import { duplicateWorkout, type CalendarOwner } from "@/lib/workouts";

function revalidateAll() {
  revalidatePath("/trainer", "layout");
  revalidatePath("/student", "layout");
}

async function requireOwner(trainerId: string, owner: CalendarOwner): Promise<string> {
  if (owner.type === "student") {
    const student = await prisma.user.findFirst({
      where: { id: owner.id, trainerId, role: "STUDENT" },
    });
    if (!student) throw new Error("Not found");
    return student.name;
  }
  const group = await prisma.group.findFirst({ where: { id: owner.id, trainerId } });
  if (!group) throw new Error("Not found");
  return group.name;
}

/** Workouts that belong directly to a calendar (not the group workouts a student inherits). */
function ownedWorkoutsWhere(
  trainerId: string,
  owner: CalendarOwner,
  from: Date,
  to: Date
): Prisma.WorkoutWhereInput {
  return {
    trainerId,
    date: { gte: from, lt: to },
    ...(owner.type === "student" ? { studentId: owner.id } : { groupId: owner.id }),
  };
}

function requireDate(key: string): Date {
  const date = parseDateKey(key);
  if (!date) throw new Error("Invalid date");
  return date;
}

export async function copyWorkoutAction(workoutId: string) {
  const session = await requireTrainer();
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, trainerId: session.user.id },
  });
  if (!workout) throw new Error("Not found");

  await writeClipboard({ kind: "workout", workoutId, title: workout.title });
  revalidatePath("/trainer", "layout");
}

export async function copyDayAction(owner: CalendarOwner, dateKey: string) {
  const session = await requireTrainer();
  const ownerName = await requireOwner(session.user.id, owner);
  requireDate(dateKey);

  await writeClipboard({ kind: "day", owner, date: dateKey, ownerName });
  revalidatePath("/trainer", "layout");
}

export async function copyWeekAction(owner: CalendarOwner, weekStartKey: string) {
  const session = await requireTrainer();
  const ownerName = await requireOwner(session.user.id, owner);
  requireDate(weekStartKey);

  await writeClipboard({ kind: "week", owner, weekStart: weekStartKey, ownerName });

  revalidatePath("/trainer", "layout");
}

export async function clearClipboardAction() {
  await requireTrainer();
  await writeClipboard(null);
  revalidatePath("/trainer", "layout");
}

/**
 * Pastes the clipboard into a calendar. A workout or a day lands on `dateKey`;
 * a week lands on the week that contains `dateKey`, keeping each weekday.
 * Pasted workouts are always drafts.
 */
export async function pasteAction(target: CalendarOwner, dateKey: string) {
  const session = await requireTrainer();
  const trainerId = session.user.id;
  await requireOwner(trainerId, target);
  const targetDate = requireDate(dateKey);

  const clipboard = await readClipboard();
  if (!clipboard) return;

  let copies: { id: string; date: Date }[] = [];

  if (clipboard.kind === "workout") {
    const source = await prisma.workout.findFirst({
      where: { id: clipboard.workoutId, trainerId },
    });
    if (!source) return;
    copies = [{ id: source.id, date: targetDate }];
  } else {
    await requireOwner(trainerId, clipboard.owner);
    const sourceStart =
      clipboard.kind === "day"
        ? requireDate(clipboard.date)
        : startOfWeek(requireDate(clipboard.weekStart));
    const span = clipboard.kind === "day" ? 1 : 7;
    const targetStart = clipboard.kind === "day" ? targetDate : startOfWeek(targetDate);

    const sources = await prisma.workout.findMany({
      where: ownedWorkoutsWhere(trainerId, clipboard.owner, sourceStart, addDays(sourceStart, span)),
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });
    copies = sources.map((w) => ({
      id: w.id,
      date: addDays(targetStart, diffInDays(w.date, sourceStart)),
    }));
  }

  await prisma.$transaction(async (tx) => {
    for (const copy of copies) {
      await duplicateWorkout(tx, copy.id, { owner: target, date: copy.date });
    }
  });

  revalidateAll();
}

export async function publishWeekAction(owner: CalendarOwner, weekStartKey: string) {
  const session = await requireTrainer();
  await requireOwner(session.user.id, owner);
  const weekStart = startOfWeek(requireDate(weekStartKey));

  await prisma.workout.updateMany({
    where: {
      ...ownedWorkoutsWhere(session.user.id, owner, weekStart, addDays(weekStart, 7)),
      status: "DRAFT",
    },
    data: { status: "PUBLISHED" },
  });

  revalidateAll();
}

/** Marks a day as a planned rest day (published right away; never counts as missed). */
export async function createRestDayAction(owner: CalendarOwner, dateKey: string) {
  const session = await requireTrainer();
  await requireOwner(session.user.id, owner);
  const date = requireDate(dateKey);

  await prisma.workout.create({
    data: {
      title: "—",
      kind: "REST",
      status: "PUBLISHED",
      date,
      trainerId: session.user.id,
      studentId: owner.type === "student" ? owner.id : null,
      groupId: owner.type === "group" ? owner.id : null,
    },
  });
  revalidateAll();
}

export async function removeRestDayAction(workoutId: string) {
  const session = await requireTrainer();
  await prisma.workout.deleteMany({
    where: { id: workoutId, trainerId: session.user.id, kind: "REST" },
  });
  revalidateAll();
}

/** Saves the focus of one weekday in a student's or group's weekly structure (empty clears it). */
export async function saveTrainingDayAction(owner: CalendarOwner, weekday: number, formData: FormData) {
  const session = await requireTrainer();
  await requireOwner(session.user.id, owner);
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) throw new Error("Invalid weekday");

  const key = owner.type === "student" ? { studentId: owner.id } : { groupId: owner.id };
  const focus = String(formData.get("focus") ?? "").trim().slice(0, 500);
  const existing = await prisma.trainingDay.findFirst({ where: { ...key, weekday } });
  if (focus) {
    if (existing) await prisma.trainingDay.update({ where: { id: existing.id }, data: { focus } });
    else await prisma.trainingDay.create({ data: { ...key, weekday, focus } });
  } else if (existing) {
    await prisma.trainingDay.delete({ where: { id: existing.id } });
  }
  revalidatePath("/trainer", "layout");
}
