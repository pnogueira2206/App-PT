"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BenchmarkKind, BlockType } from "@prisma/client";
import { useI18n } from "@/i18n/client";
import type { CalendarOwner } from "@/lib/workouts";
import { deleteWorkoutAction, saveWorkoutEditorAction } from "@/app/trainer/workouts/actions";
import { HistorySearchDialog } from "@/components/history-search";

export type PanelBlock = {
  /** Present for blocks already saved. */
  id?: string;
  key: string;
  /** Only used when creating ("+ Exercício" → STRENGTH, "+ Condicionamento" → METCON). */
  type: BlockType;
  title: string;
  /** Free-text prescription ("3x5 @ 65%; rest 2'"). */
  description: string;
  /** Benchmark: the student logs one number (kg or time) and the record updates itself. */
  benchmark: BenchmarkKind | null;
  benchmarkReps: number | null;
  /** Exercise the benchmark record belongs to. */
  exerciseName: string;
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
  exercises,
}: {
  owner: CalendarOwner;
  dateKey: string;
  dateLabel: string;
  closeHref: string;
  initial: PanelWorkout;
  showResults: boolean;
  /** Library exercise names, suggested for benchmark blocks. */
  exercises: string[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [workout, setWorkout] = useState(initial);
  const [removed, setRemoved] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [historyFor, setHistoryFor] = useState<string | null>(null);
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
          title: "",
          description: "",
          benchmark: null,
          benchmarkReps: null,
          exerciseName: "",
          result: null,
        },
      ],
    }));
  const toggleBenchmark = (block: PanelBlock) =>
    setBlock(
      block.key,
      block.benchmark
        ? { benchmark: null, benchmarkReps: null }
        : {
            benchmark: block.type === "STRENGTH" || block.type === "ACCESSORY" ? "MAX_LOAD" : "TIME",
            benchmarkReps: block.type === "STRENGTH" || block.type === "ACCESSORY" ? 1 : null,
            exerciseName: block.exerciseName || block.title,
          }
    );
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
          title: b.title,
          description: b.description,
          benchmark: b.benchmark,
          benchmarkReps: b.benchmarkReps,
          exerciseName: b.exerciseName,
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
                <span className="flex shrink-0 items-center gap-1.5 text-sm text-slate-400">
                  <button
                    type="button"
                    onClick={() => setHistoryFor(block.title)}
                    aria-label={t("historySearch.open")}
                    title={t("historySearch.open")}
                    className="hover:text-slate-900"
                  >
                    🕘
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleBenchmark(block)}
                    aria-label={t("benchmark.toggle")}
                    aria-pressed={!!block.benchmark}
                    title={t("benchmark.title")}
                    className={`rounded px-0.5 ${block.benchmark ? "bg-amber-100" : "opacity-50 grayscale hover:opacity-100 hover:grayscale-0"}`}
                  >
                    🏆
                  </button>
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={t("workouts.moveUp")} className="hover:text-slate-900 disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === workout.blocks.length - 1} aria-label={t("workouts.moveDown")} className="hover:text-slate-900 disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => removeBlock(block)} aria-label={t("editor.removeBlock")} title={t("editor.removeBlock")} className="hover:text-red-600">×</button>
                </span>
              </div>
              <textarea
                value={block.description}
                onChange={(e) => setBlock(block.key, { description: e.target.value })}
                rows={rowsFor(block.description, 3)}
                placeholder={t("editor.blockText")}
                className={input}
              />
              {block.benchmark && (
                <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-amber-900">🏆 {t("benchmark.toggle")}</span>
                    <div className="flex rounded-md bg-white p-0.5 text-xs font-medium">
                      {(["MAX_LOAD", "TIME"] as const).map((kind) => (
                        <button
                          key={kind}
                          type="button"
                          onClick={() => setBlock(block.key, { benchmark: kind, benchmarkReps: kind === "MAX_LOAD" ? block.benchmarkReps ?? 1 : null })}
                          className={`rounded px-2 py-1 ${block.benchmark === kind ? "bg-brand text-brand-ink" : "text-slate-500"}`}
                        >
                          {kind === "MAX_LOAD" ? t("benchmark.kindMaxLoad") : t("benchmark.kindTime")}
                        </button>
                      ))}
                    </div>
                    {block.benchmark === "MAX_LOAD" && (
                      <label className="flex items-center gap-1 text-xs text-amber-900">
                        {t("benchmark.reps")}
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={block.benchmarkReps ?? 1}
                          onChange={(e) => setBlock(block.key, { benchmarkReps: Number(e.target.value) || 1 })}
                          className="w-14 rounded border border-amber-300 bg-white px-1.5 py-0.5 text-sm"
                        />
                        <span className="font-semibold">= {t("benchmark.rm", { reps: block.benchmarkReps ?? 1 })}</span>
                      </label>
                    )}
                  </div>
                  <label className="block text-xs text-amber-900">
                    {t("benchmark.exercise")}
                    <input
                      list="panel-exercises"
                      value={block.exerciseName}
                      onChange={(e) => setBlock(block.key, { exerciseName: e.target.value })}
                      placeholder={block.title || t("benchmark.exercisePlaceholder")}
                      className={`${input} mt-0.5 bg-white`}
                    />
                  </label>
                  <p className="text-xs text-amber-800">{t("benchmark.hint")}</p>
                </div>
              )}
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
      <datalist id="panel-exercises">
        {exercises.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      {historyFor != null && (
        <HistorySearchDialog owner={owner} initialQuery={historyFor} onClose={() => setHistoryFor(null)} />
      )}
    </>
  );
}
