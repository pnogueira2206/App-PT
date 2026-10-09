"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useI18n } from "@/i18n/client";
import type { CalendarOwner } from "@/lib/workouts";
import { searchHistoryAction, type HistorySearch } from "@/app/trainer/calendar/history-actions";

type Tab = "blocks" | "workouts" | "metrics";
const EMPTY: HistorySearch = { blocks: [], workouts: [], metrics: [] };

/** CoachRx-style "Search workout history & metrics" dialog, opened from a block. */
export function HistorySearchDialog({
  owner,
  initialQuery,
  onClose,
}: {
  owner: CalendarOwner;
  initialQuery: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState(initialQuery);
  const [exact, setExact] = useState(false);
  const [tab, setTab] = useState<Tab>("blocks");
  const [data, setData] = useState<HistorySearch>(EMPTY);
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function search(q: string, isExact: boolean) {
    startTransition(async () => setData(await searchHistoryAction(owner, q, isExact)));
  }

  // First search with the block's name as soon as the dialog opens.
  const first = useRef(true);
  useEffect(() => {
    if (!first.current) return;
    first.current = false;
    if (initialQuery.trim()) search(initialQuery, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onQuery(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => search(value, exact), 300);
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "blocks", label: t("historySearch.tabBlocks"), count: data.blocks.length },
    { key: "workouts", label: t("historySearch.tabWorkouts"), count: data.workouts.length },
    { key: "metrics", label: t("historySearch.tabMetrics"), count: data.metrics.length },
  ];
  const card = "rounded-lg border border-slate-200 bg-white p-3";
  const header = (title: string, date: string) => (
    <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 pb-1.5">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="shrink-0 text-xs text-slate-500 first-letter:uppercase">{date}</p>
    </div>
  );
  const resultBar = (summary: string | null, done: boolean, key?: string) => (
    <p
      key={key}
      className={`flex items-center justify-between gap-2 rounded-md border-l-4 bg-slate-50 px-2.5 py-1.5 text-sm ${
        done ? "border-emerald-500 text-slate-800" : "border-red-400 text-slate-400"
      }`}
    >
      <span>{summary ?? t("historySearch.noResult")}</span>
      <span aria-hidden>{done ? "✅" : "❌"}</span>
    </p>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-3 sm:p-8" onClick={onClose}>
      <div
        role="dialog"
        aria-label={t("historySearch.title")}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-2xl flex-col rounded-xl bg-page shadow-2xl"
      >
        <div className="space-y-3 border-b border-slate-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">{t("historySearch.title")}</h2>
            <button type="button" onClick={onClose} className="text-xl leading-none text-slate-400 hover:text-slate-900" aria-label={t("common.close")}>
              ×
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              autoFocus
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder={t("historySearch.placeholder")}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={exact}
                onChange={(e) => {
                  setExact(e.target.checked);
                  search(query, e.target.checked);
                }}
              />
              {t("historySearch.exact")}
            </label>
          </div>
          <nav className="flex gap-1 text-sm">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`-mb-px flex items-center gap-1.5 border-b-2 px-2 py-1.5 font-medium ${
                  tab === item.key ? "border-brand text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {item.label}
                <span className="rounded-full bg-slate-100 px-1.5 text-xs">{item.count}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {isPending && <p className="text-sm text-slate-500">{t("historySearch.searching")}</p>}
          {!isPending && tabs.find((x) => x.key === tab)!.count === 0 && (
            <p className="text-sm text-slate-500">{t("historySearch.empty")}</p>
          )}

          {tab === "blocks" &&
            data.blocks.map((b) => (
              <div key={b.id} className={`${card} space-y-2`}>
                {header(b.workoutTitle, b.date)}
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-900 text-sm font-bold text-white">
                    {b.letter}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="font-semibold text-slate-900">{b.title}</p>
                    {b.description && <p className="whitespace-pre-wrap text-sm text-slate-700">{b.description}</p>}
                    {b.notes && <p className="whitespace-pre-wrap text-sm italic text-slate-500">{b.notes}</p>}
                    {b.results.length === 0
                      ? resultBar(null, false)
                      : b.results.map((r, i) =>
                          resultBar(r.name ? `${r.name}: ${r.summary}` : r.summary, r.done, String(i))
                        )}
                  </div>
                </div>
              </div>
            ))}

          {tab === "workouts" &&
            data.workouts.map((w) => (
              <div key={w.id} className={`${card} space-y-1.5`}>
                {header(w.title, w.date)}
                <ul className="text-sm text-slate-700">
                  {w.blocks.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}

          {tab === "metrics" &&
            data.metrics.map((m) => (
              <div key={m.id} className={`${card} flex items-center justify-between gap-3`}>
                <div>
                  <p className="font-semibold text-slate-900">🏆 {m.exercise}</p>
                  <p className="text-xs text-slate-500 first-letter:uppercase">
                    {m.name ? `${m.name} · ` : ""}
                    {m.date}
                  </p>
                </div>
                <p className="text-lg font-semibold text-brand-text">{m.value}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
