import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatLongDate, parseDateKey, resolveWeekStart, toDateKey } from "@/lib/dates";
import { loadCalendar } from "@/lib/calendar";
import { readClipboard } from "@/lib/clipboard";
import { formatResult } from "@/lib/blocks";
import type { CalendarOwner } from "@/lib/workouts";
import { getI18n } from "@/i18n/server";
import { CalendarGrid, GRID_WEEKS, gridStart } from "@/components/calendar-grid";
import { WorkoutPanel, type PanelWorkout } from "@/components/workout-panel";

export type CalendarSearchParams = { week?: string; edit?: string; new?: string };

/**
 * Calendar of a student or group: the multi-week grid plus, when `?new=<date>` or
 * `?edit=<workoutId>` is set, the side panel to build that day's workout in place.
 */
export async function OwnerCalendar({
  trainerId,
  owner,
  basePath,
  params,
  focus,
}: {
  trainerId: string;
  owner: CalendarOwner;
  basePath: string;
  params: CalendarSearchParams;
  focus: (string | null)[];
}) {
  const i18n = await getI18n();
  const anchorWeek = resolveWeekStart(params.week);
  const [workouts, clipboard] = await Promise.all([
    loadCalendar(trainerId, owner, gridStart(anchorWeek), GRID_WEEKS * 7),
    readClipboard(),
  ]);
  const closeHref = `${basePath}?week=${toDateKey(anchorWeek)}`;

  let panel: { dateKey: string; initial: PanelWorkout } | null = null;
  if (params.edit) {
    const workout = await prisma.workout.findFirst({
      where: {
        id: params.edit,
        trainerId,
        kind: "TRAINING",
        ...(owner.type === "student" ? { studentId: owner.id } : { groupId: owner.id }),
      },
      include: {
        blocks: {
          orderBy: { order: "asc" },
          // Results only matter on a student's calendar (groups report per member).
          include: {
            results: {
              where: { studentId: owner.type === "student" ? owner.id : "-" },
              include: { sets: true },
            },
          },
        },
      },
    });
    if (!workout) notFound();
    panel = {
      dateKey: toDateKey(workout.date),
      initial: {
        id: workout.id,
        title: workout.title,
        description: workout.description ?? "",
        warmup: workout.warmup ?? "",
        cooldown: workout.cooldown ?? "",
        published: workout.status === "PUBLISHED",
        blocks: workout.blocks.map((b) => {
          const result = b.results[0];
          return {
            id: b.id,
            key: b.id,
            type: b.type,
            title: b.title,
            description: b.description ?? "",
            result: result ? { summary: formatResult(b, result, i18n), done: result.done } : null,
          };
        }),
      },
    };
  } else if (params.new && parseDateKey(params.new)) {
    panel = {
      dateKey: params.new,
      initial: { title: "", description: "", warmup: "", cooldown: "", published: true, blocks: [] },
    };
  }

  return (
    <>
      <CalendarGrid
        owner={owner}
        basePath={basePath}
        anchorWeek={anchorWeek}
        workouts={workouts}
        clipboard={clipboard}
        focus={focus}
      />
      {panel && (
        <WorkoutPanel
          key={panel.initial.id ?? `new-${panel.dateKey}`}
          owner={owner}
          dateKey={panel.dateKey}
          dateLabel={formatLongDate(parseDateKey(panel.dateKey)!, i18n.intlLocale)}
          closeHref={closeHref}
          initial={panel.initial}
          showResults={owner.type === "student"}
        />
      )}
    </>
  );
}
