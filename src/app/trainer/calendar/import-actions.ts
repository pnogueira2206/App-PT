"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { parseDateKey } from "@/lib/dates";
import { parseSheetPaste } from "@/lib/sheet-import";
import type { CalendarOwner } from "@/lib/workouts";
import { getI18n } from "@/i18n/server";

export type ImportResult = { error?: string; created?: number; replaced?: number; kept?: number };

/**
 * "Paste from Sheets": creates the pasted week(s) in a student's or group's calendar.
 * The text is parsed again here (the preview is only a preview). With `replace`,
 * the calendar's own workouts on those days are removed first, except the ones
 * that already have results.
 */
export async function importSheetAction(
  owner: CalendarOwner,
  text: string,
  fallbackWeek: string,
  options: { replace: boolean; publish: boolean }
): Promise<ImportResult> {
  const { t } = await getI18n();
  const session = await requireTrainer();
  const trainerId = session.user.id;
  const ok =
    owner.type === "student"
      ? await prisma.user.count({ where: { id: owner.id, trainerId, role: "STUDENT" } })
      : await prisma.group.count({ where: { id: owner.id, trainerId } });
  if (!ok || !parseDateKey(fallbackWeek)) return { error: t("errors.studentNotFound") };

  const { days } = parseSheetPaste(text.slice(0, 200_000), fallbackWeek);
  if (days.length === 0) return { error: t("sheetImport.nothing") };

  const ownerWhere = owner.type === "student" ? { studentId: owner.id } : { groupId: owner.id };
  const focus = await prisma.trainingDay.findMany({ where: ownerWhere });
  let created = 0;
  let replaced = 0;
  let kept = 0;

  await prisma.$transaction(async (tx) => {
    for (const day of days) {
      const date = parseDateKey(day.date)!;
      if (options.replace) {
        const existing = await tx.workout.findMany({
          where: { trainerId, ...ownerWhere, date },
          select: {
            id: true,
            _count: { select: { completions: true } },
            blocks: { select: { _count: { select: { results: true } } } },
          },
        });
        for (const w of existing) {
          const hasResults = w._count.completions > 0 || w.blocks.some((b) => b._count.results > 0);
          if (hasResults) {
            kept++;
          } else {
            await tx.workout.delete({ where: { id: w.id } });
            replaced++;
          }
        }
      }

      const base = {
        date,
        trainerId,
        status: options.publish ? ("PUBLISHED" as const) : ("DRAFT" as const),
        studentId: owner.type === "student" ? owner.id : null,
        groupId: owner.type === "group" ? owner.id : null,
      };
      if (day.workout.kind === "REST") {
        await tx.workout.create({ data: { ...base, kind: "REST", title: "—" } });
      } else {
        const w = day.workout;
        const weekday = (date.getUTCDay() + 6) % 7;
        const title =
          w.title || focus.find((f) => f.weekday === weekday)?.focus.split("\n")[0]?.trim() || t("calendar.defaultTitle");
        await tx.workout.create({
          data: {
            ...base,
            kind: "TRAINING",
            title,
            description: w.description || null,
            warmup: w.warmup || null,
            cooldown: w.cooldown || null,
            blocks: {
              create: w.blocks.map((b, i) => ({
                order: i + 1,
                type: "STRENGTH" as const,
                title: b.title,
                description: b.description || null,
                trainerNotes: b.notes || null,
              })),
            },
          },
        });
      }
      created++;
    }
  });

  revalidatePath("/trainer", "layout");
  revalidatePath("/student", "layout");
  return { created, replaced, kept };
}
