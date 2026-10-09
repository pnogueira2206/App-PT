"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BlockType, MetconFormat } from "@prisma/client";
import { useI18n } from "@/i18n/client";
import { BLOCK_TYPES, METCON_FORMATS } from "@/lib/blocks";
import type { CalendarOwner } from "@/lib/workouts";
import { deleteWorkoutAction, saveWorkoutEditorAction } from "@/app/trainer/workouts/actions";

export type PanelBlock = {
  /** Present for blocks already saved. */
  id?: string;
  key: string;
  type: BlockType;
  metconFormat: MetconFormat | null;
  title: string;
  description: string;
  trainerNotes: string;
  /** Extra prescription set in the full editor (sets, %1RM...), shown read-only. */
  structured: string | null;
  /** The student's result (student calendars). */
  result: { summary: string; done: boolean } | null;
};

export type PanelWorkout = {
  id?: string;
  title: string;
  description: string;
  warmup: string;
  cooldown: string;
  published: boolean;
  blocks: PanelBlock[];
};

const input = "w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm";
const rowsFor = (value: string, min = 2) => Math.max(min, value.split("\n").length);
let counter = 0;
const newKey = () => `new-${++counter}`;

/** Side panel to build a day's workout in place: warm-up, A) B) C) blocks, cooldown. */
export function WorkoutPanel({
  owner,
  dateKey,
  dateLabel,
  closeHref,
  initial,
  showResults,
}: {
  owner: CalendarOwner;
  dateKey: string;
  dateLabel: string;
  closeHref: string;
  initial: PanelWorkout;
  showResults: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [workout, setWorkout] = useState(initial);
  const [removed, setRemoved] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof PanelWorkout>(key: K, value: PanelWorkout[K]) =>
    setWorkout((w) => ({ ...w, [key]: value }));
  const setBlock = (key: string, changes: Partial<PanelBlock>) =>
    setWorkout((w) => ({ ...w, blocks: w.blocks.map((b) => (b.key === key ? { ...b, ...changes } : b)) }));
  const addBlock = (type: BlockType) =>
    setWorkout((w) => ({
      ...w,
      blocks: [
        ...w.blocks,
        {
          key: newKey(),
          type,
          metconFormat: type === "METCON" ? "FOR_TIME" : null,
          title: "",
          description: "",
          trainerNotes: "",
          structured: null,
          result: null,
        },
      ],
    }));
  const removeBlock = (block: PanelBlock) => {
    if (block.id) setRemoved((r) => [...r, block.id!]);
    setWorkout((w) => ({ ...w, blocks: w.blocks.filter((b) => b.key !== block.key) }));
  };
  const move = (index: number, delta: number) =>
    setWorkout((w) => {
      const blocks = [...w.blocks];
      const target = index + delta;
      if (target < 0 || target >= blocks.length) return w;
      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
      return { ...w, blocks };
    });

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveWorkoutEditorAction({
        owner,
        date: dateKey,
        workoutId: workout.id,
        title: workout.title,
        description: workout.description,
        warmup: workout.warmup,
        cooldown: workout.cooldown,
        publish: workout.published,
        removedBlockIds: removed,
        blocks: workout.blocks.map((b) => ({
          id: b.id,
          type: b.type,
          metconFormat: b.metconFormat,
          title: b.title,
          description: b.description,
          trainerNotes: b.trainerNotes,
        })),
      });
      if (result.error) setError(result.error);
      else router.push(closeHref);
    });
  }

  const section = "space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3";

  return (
    <>
      <Link href={closeHref} aria-label={t("common.close")} className="fixed inset-0 z-30 bg-black/50" />
      <aside className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl sm:w-[30rem]">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-xs text-slate-500 first-letter:uppercase">{dateLabel}</p>
            <h2 className="font-semibold text-slate-900">
              {workout.id ? t("editor.editTitle") : t("editor.newTitle")}
            </h2>
          </div>
          <Link href={closeHref} className="text-xl leading-none text-slate-400 hover:text-slate-900" aria-label={t("common.close")}>
            ×
          </Link>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <input
            value={workout.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder={t("editor.titlePlaceholder")}
            className={`${input} font-semibold`}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={workout.published} onChange={(e) => set("published", e.target.checked)} />
            {t("editor.publish")}
          </label>

          <div className={section}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("editor.warmup")}</p>
            <textarea
              value={workout.warmup}
              onChange={(e) => set("warmup", e.target.value)}
              rows={rowsFor(workout.warmup)}
              placeholder={t("editor.warmupPlaceholder")}
              className={input}
            />
            <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{t("editor.coachNotes")}</p>
            <textarea
              value={workout.description}
              onChange={(e) => set("description", e.target.value)}
              rows={rowsFor(workout.description, 1)}
              placeholder={t("editor.coachNotesPlaceholder")}
              className={input}
            />
          </div>

          {workout.blocks.length === 0 && <p className="text-sm text-slate-500">{t("editor.empty")}</p>}

          {workout.blocks.map((block, index) => (
            <div key={block.key} className="space-y-1.5 rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{String.fromCharCode(65 + index)})</span>
                <input
                  value={block.title}
                  onChange={(e) => setBlock(block.key, { title: e.target.value })}
                  placeholder={t("editor.blockTitle")}
                  className={`${input} font-semibold`}
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <select
                  value={block.type}
                  onChange={(e) => {
                    const type = e.target.value as BlockType;
                    setBlock(block.key, { type, metconFormat: type === "METCON" ? block.metconFormat ?? "FOR_TIME" : null });
                  }}
                  className="rounded-md border border-slate-200 px-1.5 py-1 text-xs"
                >
                  {BLOCK_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(`blocks.types.${type}`)}
                    </option>
                  ))}
                </select>
                {block.type === "METCON" && (
                  <select
                    value={block.metconFormat ?? "FOR_TIME"}
                    onChange={(e) => setBlock(block.key, { metconFormat: e.target.value as MetconFormat })}
                    className="rounded-md border border-slate-200 px-1.5 py-1 text-xs"
                  >
                    {METCON_FORMATS.map((f) => (
                      <option key={f} value={f}>
                        {t(`blocks.metconFormats.${f}`)}
                      </option>
                    ))}
                  </select>
                )}
                <span className="ml-auto flex items-center gap-2 text-xs text-slate-400">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={t("workouts.moveUp")} className="hover:text-slate-900 disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === workout.blocks.length - 1} aria-label={t("workouts.moveDown")} className="hover:text-slate-900 disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => removeBlock(block)} className="hover:text-red-600">
                    {t("editor.removeBlock")}
                  </button>
                </span>
              </div>
              {block.structured && <p className="text-xs font-medium text-slate-600">{block.structured}</p>}
              <textarea
                value={block.description}
                onChange={(e) => setBlock(block.key, { description: e.target.value })}
                rows={rowsFor(block.description)}
                placeholder={t("editor.blockText")}
                className={input}
              />
              <textarea
                value={block.trainerNotes}
                onChange={(e) => setBlock(block.key, { trainerNotes: e.target.value })}
                rows={rowsFor(block.trainerNotes, 1)}
                placeholder={t("editor.blockNotes")}
                className={`${input} italic`}
              />
              {showResults && block.id && (
                <p
                  className={`flex items-center justify-between rounded-md border-l-4 bg-slate-50 px-2.5 py-1.5 text-sm ${
                    block.result?.done ? "border-emerald-500 text-slate-800" : "border-red-400 text-slate-400"
                  }`}
                >
                  <span>{block.result ? block.result.summary : t("editor.noResult")}</span>
                  <span aria-hidden>{block.result?.done ? "✅" : "❌"}</span>
                </p>
              )}
            </div>
          ))}

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => addBlock("STRENGTH")} className="rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {t("editor.addExercise")}
            </button>
            <button type="button" onClick={() => addBlock("METCON")} className="rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {t("editor.addConditioning")}
            </button>
          </div>

          <div className={section}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("editor.cooldown")}</p>
            <textarea
              value={workout.cooldown}
              onChange={(e) => set("cooldown", e.target.value)}
              rows={rowsFor(workout.cooldown)}
              placeholder={t("editor.cooldownPlaceholder")}
              className={input}
            />
          </div>

          {workout.id && (
            <Link href={`/trainer/workouts/${workout.id}`} className="inline-block text-xs font-medium text-slate-500 hover:text-slate-900">
              {t("editor.fullEditor")}
            </Link>
          )}
        </div>

        <footer className="flex items-center gap-2 border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-hover disabled:opacity-60"
          >
            {isPending ? t("common.saving") : t("editor.save")}
          </button>
          <Link href={closeHref} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
            {t("common.cancel")}
          </Link>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {workout.id && (
            <form action={deleteWorkoutAction.bind(null, workout.id)} className="ml-auto">
              <button className="text-sm text-slate-400 hover:text-red-600" title={t("editor.deleteWorkout")}>
                🗑
              </button>
            </form>
          )}
        </footer>
      </aside>
    </>
  );
}
