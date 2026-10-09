import { prisma } from "@/lib/prisma";
import { addDays, parseDateKey, todayKey } from "@/lib/dates";
import { detectRecord, type RecordCandidate } from "@/lib/records";

// The trainer's feed: what students logged, grouped per session (student + workout).

const FEED_DAYS = 30;

function feedStart() {
  return addDays(parseDateKey(todayKey())!, -FEED_DAYS);
}

export type FeedComment = {
  id: string;
  body: string;
  createdAt: Date;
  authorName: string;
  fromTrainer: boolean;
};

export type FeedResult = {
  id: string;
  block: {
    id: string;
    order: number;
    title: string;
    type: import("@prisma/client").BlockType;
    metconFormat: import("@prisma/client").MetconFormat | null;
    cardioModality: import("@prisma/client").CardioModality | null;
    exerciseId: string | null;
    exerciseName: string | null;
  };
  result: {
    done: boolean;
    timeSeconds: number | null;
    rounds: number | null;
    reps: number | null;
    loadKg: number | null;
    distanceM: number | null;
    calories: number | null;
    rx: boolean | null;
    rpe: number | null;
    scoreText: string | null;
    studentNotes: string | null;
    sets: { setNumber: number; reps: number | null; loadKg: number | null }[];
  };
  comments: FeedComment[];
  /** A record was saved from this result. */
  recordSaved: boolean;
  /** The result beats the current records but nothing was saved yet. */
  recordCandidate: RecordCandidate | null;
};

export type FeedEntry = {
  key: string;
  student: { id: string; name: string };
  workout: { id: string; title: string; date: Date };
  completion: { sessionRpe: number | null; notes: string | null; completedAt: Date } | null;
  results: FeedResult[];
  lastActivity: Date;
  unseen: boolean;
};

export async function getFeed(
  trainerId: string,
  options: { onlyUnseen?: boolean; limit?: number } = {}
): Promise<FeedEntry[]> {
  const since = feedStart();

  const [results, completions] = await Promise.all([
    prisma.blockResult.findMany({
      where: { student: { trainerId, archivedAt: null }, updatedAt: { gte: since } },
      include: {
        sets: true,
        records: { select: { id: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { name: true, role: true } } },
        },
        student: { select: { id: true, name: true } },
        block: {
          include: {
            exercise: { select: { id: true, name: true } },
            workout: { select: { id: true, title: true, date: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 400,
    }),
    prisma.workoutCompletion.findMany({
      where: { student: { trainerId, archivedAt: null }, completedAt: { gte: since } },
      include: {
        student: { select: { id: true, name: true } },
        workout: { select: { id: true, title: true, date: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 200,
    }),
  ]);

  const studentIds = [...new Set(results.map((r) => r.studentId))];
  const exerciseIds = [...new Set(results.map((r) => r.block.exerciseId).filter(Boolean))] as string[];
  const records = await prisma.personalRecord.findMany({
    where: { studentId: { in: studentIds }, exerciseId: { in: exerciseIds } },
    select: { studentId: true, exerciseId: true, type: true, value: true, unit: true },
  });

  const entries = new Map<string, FeedEntry>();
  const entryFor = (
    student: { id: string; name: string },
    workout: { id: string; title: string; date: Date }
  ) => {
    const key = `${student.id}:${workout.id}`;
    let entry = entries.get(key);
    if (!entry) {
      entry = { key, student, workout, completion: null, results: [], lastActivity: new Date(0), unseen: false };
      entries.set(key, entry);
    }
    return entry;
  };
  const touch = (entry: FeedEntry, date: Date) => {
    if (date > entry.lastActivity) entry.lastActivity = date;
  };

  for (const r of results) {
    const entry = entryFor(r.student, r.block.workout);
    const studentComments = r.comments.filter((c) => c.author.role === "STUDENT");
    if (r.seenAt == null || studentComments.some((c) => c.readAt == null)) entry.unseen = true;
    touch(entry, r.updatedAt);
    studentComments.forEach((c) => touch(entry, c.createdAt));

    const exerciseRecords = records.filter(
      (rec) => rec.studentId === r.studentId && rec.exerciseId === r.block.exerciseId
    );
    entry.results.push({
      id: r.id,
      block: {
        id: r.block.id,
        order: r.block.order,
        title: r.block.title,
        type: r.block.type,
        metconFormat: r.block.metconFormat,
        cardioModality: r.block.cardioModality,
        exerciseId: r.block.exerciseId,
        exerciseName: r.block.exercise?.name ?? null,
      },
      result: r,
      comments: r.comments.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt,
        authorName: c.author.name,
        fromTrainer: c.author.role === "TRAINER",
      })),
      recordSaved: r.records.length > 0,
      recordCandidate: r.records.length > 0 ? null : detectRecord(r.block, r, exerciseRecords),
    });
  }

  for (const c of completions) {
    const entry = entryFor(c.student, c.workout);
    entry.completion = { sessionRpe: c.sessionRpe, notes: c.notes, completedAt: c.completedAt };
    if (c.seenAt == null) entry.unseen = true;
    touch(entry, c.completedAt);
  }

  let list = [...entries.values()];
  list.forEach((e) => e.results.sort((a, b) => a.block.order - b.block.order));
  if (options.onlyUnseen) list = list.filter((e) => e.unseen);
  list.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  return options.limit ? list.slice(0, options.limit) : list;
}

/** Number of sessions with something the trainer hasn't seen (for the nav badge). */
export async function countUnseen(trainerId: string): Promise<number> {
  const since = feedStart();
  const [results, completions, comments] = await Promise.all([
    prisma.blockResult.findMany({
      where: { student: { trainerId, archivedAt: null }, seenAt: null, updatedAt: { gte: since } },
      select: { studentId: true, block: { select: { workoutId: true } } },
    }),
    prisma.workoutCompletion.findMany({
      where: { student: { trainerId, archivedAt: null }, seenAt: null, completedAt: { gte: since } },
      select: { studentId: true, workoutId: true },
    }),
    prisma.resultComment.findMany({
      where: { readAt: null, createdAt: { gte: since }, author: { role: "STUDENT", trainerId, archivedAt: null } },

      select: { result: { select: { studentId: true, block: { select: { workoutId: true } } } } },
    }),
  ]);
  const keys = new Set([
    ...results.map((r) => `${r.studentId}:${r.block.workoutId}`),
    ...completions.map((c) => `${c.studentId}:${c.workoutId}`),
    ...comments.map((c) => `${c.result.studentId}:${c.result.block.workoutId}`),
  ]);
  return keys.size;
}
