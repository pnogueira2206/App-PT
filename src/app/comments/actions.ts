"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { assertNotArchived } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/i18n/server";

type ActionState = { error?: string; success?: string } | undefined;

const MAX_LENGTH = 1000;

/** Adds a comment to a result. Trainers comment on their students' results; students on their own. */
export async function addCommentAction(
  resultId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getI18n();
  const session = await auth();
  if (!session) throw new Error("Not authorized");
  const { id: userId, role } = session.user;
  if (role === "STUDENT") await assertNotArchived(userId);

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: t("errors.commentEmpty") };
  if (body.length > MAX_LENGTH) return { error: t("errors.commentTooLong", { max: MAX_LENGTH }) };

  const result = await prisma.blockResult.findFirst({
    where:
      role === "TRAINER"
        ? { id: resultId, student: { trainerId: userId } }
        : { id: resultId, studentId: userId },
    select: { id: true, studentId: true, block: { select: { workoutId: true } } },
  });
  if (!result) return { error: t("errors.resultNotFound") };

  const now = new Date();
  await prisma.$transaction([
    prisma.resultComment.create({ data: { resultId, authorId: userId, body } }),
    // Replying means the author has read the other side of the conversation.
    prisma.resultComment.updateMany({
      where: { resultId, readAt: null, authorId: { not: userId } },
      data: { readAt: now },
    }),
    ...(role === "TRAINER"
      ? [prisma.blockResult.update({ where: { id: resultId }, data: { seenAt: now } })]
      : []),
  ]);

  revalidatePath("/trainer", "layout");
  revalidatePath("/student", "layout");
  return { success: "ok" };
}
