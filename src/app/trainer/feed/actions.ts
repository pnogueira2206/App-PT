"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";

function revalidateTrainer() {
  revalidatePath("/trainer", "layout");
}

/** Marks a session (student + workout) as seen: results, completion and the student's comments. */
export async function markEntrySeenAction(studentId: string, workoutId: string) {
  const session = await requireTrainer();
  const trainerId = session.user.id;
  const now = new Date();

  const student = await prisma.user.findFirst({ where: { id: studentId, trainerId, role: "STUDENT" } });
  if (!student) throw new Error("Not found");

  await prisma.$transaction([
    prisma.blockResult.updateMany({
      where: { studentId, block: { workoutId }, seenAt: null },
      data: { seenAt: now },
    }),
    prisma.workoutCompletion.updateMany({
      where: { studentId, workoutId, seenAt: null },
      data: { seenAt: now },
    }),
    prisma.resultComment.updateMany({
      where: { authorId: studentId, readAt: null, result: { block: { workoutId } } },
      data: { readAt: now },
    }),
  ]);
  revalidateTrainer();
}

export async function markAllSeenAction() {
  const session = await requireTrainer();
  const trainerId = session.user.id;
  const now = new Date();

  await prisma.$transaction([
    prisma.blockResult.updateMany({ where: { student: { trainerId }, seenAt: null }, data: { seenAt: now } }),
    prisma.workoutCompletion.updateMany({
      where: { student: { trainerId }, seenAt: null },
      data: { seenAt: now },
    }),
    prisma.resultComment.updateMany({
      where: { readAt: null, author: { role: "STUDENT", trainerId } },
      data: { readAt: now },
    }),
  ]);
  revalidateTrainer();
}
