import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatLongDate, parseDateKey, resolveWeekStart, toDateKey } from "@/lib/dates";
import { loadCalendar } from "@/lib/calendar";
import { loadMaxes } from "@/lib/percent-loads";
import { readClipboard } from "@/lib/clipboard";
import { formatDuration, formatPrescription, formatResult } from "@/lib/blocks";
import { loadTvBlock } from "@/lib/tv-scores";
import type { CalendarOwner } from "@/lib/workouts";
import { getI18n } from "@/i18n/server";
import { CalendarGrid, GRID_WEEKS, gridStart } from "@/components/calendar-grid";
import { WorkoutPanel, type PanelWorkout } from "@/components/workout-panel";
import { ScoresPanel } from "@/components/scores-panel";

export type CalendarSearchParams = { week?: string; edit?: string; new?: string; scores?: string };

/**
 * Calendar of a student or group: the multi-week grid plus, when `?new=<date>` or
 * `?edit=<workoutId>` is set, the side panel to build that day's workout in place,
 * and with `?scores=<blockId>` the panel to type each athlete's score for a block.
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
  const [workouts, clipboard, maxes] = await Promise.all([
    loadCalendar(trainerId, owner, gridStart(anchorWeek), GRID_WEEKS * 7),
    readClipboard(),
    owner.type === "student" ? loadMaxes(owner.id) : Promise.resolve([]),
  ]);
  const closeHref = `${basePath}?week=${toDateKey(anchorWeek)}`;

  let panel: { dateKey: string; initial: PanelWorkout } | null = null;
  const exercises =
    params.edit || params.new
      ? await prisma.exercise.findMany({ where: { trainerId }, select: { name: true }, orderBy: { name: "asc" } })
      : [];
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
            exercise: { select: { name: true } },
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
            benchmark: b.benchmark,
            benchmarkReps: b.benchmarkReps,
            exerciseName: b.exercise?.name ?? "",
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

  const scores = params.scores ? await loadTvBlock(trainerId, owner, params.scores) : null;

  return (
    <>
      <CalendarGrid
        owner={owner}
        basePath={basePath}
        anchorWeek={anchorWeek}
        workouts={workouts}
        clipboard={clipboard}
        focus={focus}
        maxes={maxes}
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
          exercises={exercises.map((e) => e.name)}
        />
      )}
      {scores && (
        <ScoresPanel
          key={scores.block.id}
          owner={owner}
          blockId={scores.block.id}
          label={/^[A-Z]\d*[.)]\s/.test(scores.block.title) ? scores.block.title : `${String.fromCharCode(64 + scores.block.order)}) ${scores.block.title}`}
          subtitle={`${scores.workout.title} · ${formatLongDate(scores.workout.date, i18n.intlLocale)}`}
          prescription={[formatPrescription(scores.block, i18n), scores.block.description].filter(Boolean).join("\n")}
          kind={scores.kind}
          closeHref={closeHref}
          athletes={scores.athletes.map((a) => ({
            id: a.id,
            name: a.name,
            current: a.result ? formatResult(scores.block, a.result, i18n) : "",
            values: {
              kg: a.result?.loadKg != null ? String(a.result.loadKg) : "",
              time: a.result?.timeSeconds != null ? formatDuration(a.result.timeSeconds) : "",
              rounds: a.result?.rounds != null ? String(a.result.rounds) : "",
              reps: a.result?.reps != null ? String(a.result.reps) : "",
              text: a.result?.scoreText ?? "",
            },
          }))}
        />
      )}
    </>
  );
}
