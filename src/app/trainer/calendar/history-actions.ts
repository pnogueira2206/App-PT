"use server";

import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { formatLongDate, parseDateKey, todayKey } from "@/lib/dates";
import { formatNumber, formatResult } from "@/lib/blocks";
import { getStudentGroupIds, studentWorkoutsWhere, type CalendarOwner } from "@/lib/workouts";
import { getI18n } from "@/i18n/server";

export type HistoryResult = { name: string | null; summary: string; done: boolean };
export type HistoryBlock = {
  id: string;
  workoutTitle: string;
  date: string;
  letter: string;
  title: string;
  description: string | null;
  notes: string | null;
  results: HistoryResult[];
};
export type HistoryWorkout = { id: string; title: string; date: string; blocks: string[] };
export type HistoryMetric = { id: string; name: string | null; exercise: string; value: string; date: string };
export type HistorySearch = { blocks: HistoryBlock[]; workouts: HistoryWorkout[]; metrics: HistoryMetric[] };

const LIMIT = 40;

/**
 * "Search workout history & metrics" (CoachRx): past blocks, workouts and records of a
 * student (or of a group's members) whose name matches the query.
 */
export async function searchHistoryAction(
  owner: CalendarOwner,
  query: string,
  exact: boolean
): Promise<HistorySearch> {
  const session = await requireTrainer();
  const trainerId = session.user.id;
  const i18n = await getI18n();
  const { t, intlLocale } = i18n;
  const q = query.trim().slice(0, 100);
  if (!q) return { blocks: [], workouts: [], metrics: [] };

  // Calendar scope + the people whose results count.
  let scope;
  let studentIds: string[];
  if (owner.type === "student") {
    const student = await prisma.user.findFirst({ where: { id: owner.id, trainerId, role: "STUDENT" } });
    if (!student) return { blocks: [], workouts: [], metrics: [] };
    scope = studentWorkoutsWhere(owner.id, await getStudentGroupIds(owner.id));
    studentIds = [owner.id];
  } else {
    const group = await prisma.group.findFirst({
      where: { id: owner.id, trainerId },
      include: { members: { select: { studentId: true } } },
    });
    if (!group) return { blocks: [], workouts: [], metrics: [] };
    scope = { groupId: owner.id };
    studentIds = group.members.map((m) => m.studentId);
  }
  const isGroup = owner.type === "group";
  const match = exact ? { equals: q, mode: "insensitive" as const } : { contains: q, mode: "insensitive" as const };
  const workoutWhere = {
    ...scope,
    trainerId,
    kind: "TRAINING" as const,
    status: "PUBLISHED" as const,
    date: { lte: parseDateKey(todayKey())! },
  };

  const [blocks, workouts, records] = await Promise.all([
    prisma.workoutBlock.findMany({
      where: { title: match, workout: workoutWhere },
      include: {
        workout: { select: { title: true, date: true, blocks: { select: { id: true }, orderBy: { order: "asc" } } } },
        results: {
          where: { studentId: { in: studentIds } },
          include: { sets: true, student: { select: { name: true } } },
          orderBy: { student: { name: "asc" } },
        },
      },
      orderBy: [{ workout: { date: "desc" } }, { order: "asc" }],
      take: LIMIT,
    }),
    prisma.workout.findMany({
      where: { ...workoutWhere, title: match },
      include: { blocks: { select: { title: true }, orderBy: { order: "asc" } } },
      orderBy: { date: "desc" },
      take: LIMIT,
    }),
    prisma.personalRecord.findMany({
      where: { studentId: { in: studentIds }, exercise: { name: match } },
      include: { exercise: { select: { name: true } }, student: { select: { name: true } } },
      orderBy: { recordDate: "desc" },
      take: LIMIT,
    }),
  ]);

  const letter = (index: number) => String.fromCharCode(65 + Math.max(index, 0));
  return {
    blocks: blocks.map((b) => ({
      id: b.id,
      workoutTitle: b.workout.title,
      date: formatLongDate(b.workout.date, intlLocale),
      letter: letter(b.workout.blocks.findIndex((x) => x.id === b.id)),
      title: b.title,
      description: b.description,
      notes: b.trainerNotes,
      results: b.results.map((r) => ({
        name: isGroup ? r.student.name : null,
        summary: formatResult(b, r, i18n),
        done: r.done,
      })),
    })),
    workouts: workouts.map((w) => ({
      id: w.id,
      title: w.title,
      date: formatLongDate(w.date, intlLocale),
      blocks: w.blocks.map((b, i) => `${letter(i)}) ${b.title}`),
    })),
    metrics: records.map((r) => ({
      id: r.id,
      name: isGroup ? r.student.name : null,
      exercise:
        r.type === "WEIGHT" && r.reps && r.reps > 1
          ? `${r.exercise.name} · ${t("benchmark.rm", { reps: r.reps })}`
          : r.exercise.name,
      value:
        r.type === "WEIGHT" && /^\d+([.,]\d+)?$/.test(r.value)
          ? `${formatNumber(Number(r.value.replace(",", ".")), intlLocale)} ${r.unit ?? "kg"}`
          : `${r.value}${r.unit ? ` ${r.unit}` : ""}`,
      date: formatLongDate(r.recordDate, intlLocale),
    })),
  };
}
