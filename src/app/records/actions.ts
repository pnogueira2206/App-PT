"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectRecord } from "@/lib/records";

/**
 * Saves the record a result beats as a PersonalRecord. The candidate is
 * recomputed here, so the client can't choose the value.
 */
export async function saveRecordFromResultAction(resultId: string) {
  const session = await auth();
  if (!session) throw new Error("Not authorized");
  const { id: userId, role } = session.user;

  const result = await prisma.blockResult.findFirst({
    where:
      role === "TRAINER"
        ? { id: resultId, student: { trainerId: userId } }
        : { id: resultId, studentId: userId },
    include: { sets: true, records: { select: { id: true } }, block: { include: { workout: true } } },
  });
  if (!result || !result.block.exerciseId || result.records.length > 0) return;

  const records = await prisma.personalRecord.findMany({
    where: { studentId: result.studentId, exerciseId: result.block.exerciseId },
    select: { type: true, value: true, unit: true },
  });
  const candidate = detectRecord(result.block, result, records);
  if (!candidate) return;

  await prisma.personalRecord.create({
    data: {
      studentId: result.studentId,
      exerciseId: result.block.exerciseId,
      type: candidate.type,
      value: candidate.value,
      unit: candidate.unit,
      notes: result.block.workout.title,
      recordDate: result.block.workout.date,
      sourceResultId: result.id,
    },
  });

  revalidatePath("/trainer", "layout");
  revalidatePath("/student", "layout");
}
