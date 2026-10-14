"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import type { CalendarOwner } from "@/lib/workouts";
import { parseSheetPaste } from "@/lib/sheet-import";
import { importSheetAction, type ImportResult } from "@/app/trainer/calendar/import-actions";

/** "Paste from Google Sheets": paste one or more week rows, check the preview, import as drafts. */
export function SheetImport({ owner, anchorWeek }: { owner: CalendarOwner; anchorWeek: string }) {
  const { t, intlLocale } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [week, setWeek] = useState(anchorWeek);
  const [replace, setReplace] = useState(true);
  const [publish, setPublish] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsed = useMemo(() => (text.trim() ? parseSheetPaste(text, week) : null), [text, week]);
  const dayLabel = (key: string) =>
    new Date(`${key}T00:00:00Z`).toLocaleDateString(intlLocale, {
      timeZone: "UTC",
      weekday: "short",
      day: "numeric",
      month: "short",
    });

  function close() {
    setOpen(false);
    setText("");
    setResult(null);
  }
  function save() {
    startTransition(async () => {
      const res = await importSheetAction(owner, text, week, { replace, publish });
      setResult(res);
      if (!res.error) {
        router.refresh();
        setText("");
      }
    });
  }

  const button = "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm hover:bg-slate-50";
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${button} text-slate-600`}>
        {t("sheetImport.open")}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:p-8" onClick={close}>
      <div
        role="dialog"
        aria-label={t("sheetImport.title")}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl space-y-4 rounded-xl bg-page p-4 shadow-2xl sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t("sheetImport.title")}</h2>
            <p className="text-sm text-slate-500">{t("sheetImport.help")}</p>
          </div>
          <button type="button" onClick={close} className="text-xl leading-none text-slate-400 hover:text-slate-900" aria-label={t("common.close")}>
            ×
          </button>
        </div>

        <textarea
          autoFocus
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setResult(null);
          }}
          rows={6}
          placeholder={t("sheetImport.placeholder")}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs"
        />

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-700">
          <label className="flex items-center gap-2">
            {t("sheetImport.week")}
            <input type="date" value={week} onChange={(e) => e.target.value && setWeek(e.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1" />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
            {t("sheetImport.replace")}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
            {t("sheetImport.publish")}
          </label>
        </div>
        <p className="text-xs text-slate-500">{t("sheetImport.weekHint")}</p>

        {parsed && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              {t("sheetImport.preview", { count: parsed.days.length })}
            </p>
            {parsed.warnings.length > 0 && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{t("sheetImport.noDate")}</p>
            )}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {parsed.days.map((day) => (
                <div key={day.date} className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-3 text-[13px] leading-snug">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-text first-letter:uppercase">
                    {dayLabel(day.date)}
                  </p>
                  {day.workout.kind === "REST" ? (
                    <p className="text-slate-500">{t("states.rest")}</p>
                  ) : (
                    <>
                      <p className="font-semibold text-slate-900">{day.workout.title || t("sheetImport.untitled")}</p>
                      {day.workout.warmup && (
                        <p className="line-clamp-2 whitespace-pre-wrap text-slate-500">
                          <span className="font-semibold">{t("editor.warmup")}: </span>
                          {day.workout.warmup}
                        </p>
                      )}
                      {day.workout.blocks.map((b, i) => (
                        <div key={i}>
                          <p className="font-semibold text-slate-800">
                            {String.fromCharCode(65 + i)}) {b.title}
                          </p>
                          {b.description && <p className="whitespace-pre-wrap text-slate-700">{b.description}</p>}
                          {b.notes && <p className="whitespace-pre-wrap italic text-slate-500">{b.notes}</p>}
                        </div>
                      ))}
                      {day.workout.blocks.length === 0 && (
                        <p className="text-xs text-amber-700">{t("sheetImport.noBlocks")}</p>
                      )}
                      {day.workout.cooldown && (
                        <p className="line-clamp-2 whitespace-pre-wrap text-slate-500">
                          <span className="font-semibold">{t("editor.cooldown")}: </span>
                          {day.workout.cooldown}
                        </p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3">
          <button
            type="button"
            onClick={save}
            disabled={isPending || !parsed || parsed.days.length === 0}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-hover disabled:opacity-50"
          >
            {isPending ? t("common.saving") : t("sheetImport.import", { count: parsed?.days.length ?? 0 })}
          </button>
          <button type="button" onClick={close} className="text-sm text-slate-500 hover:text-slate-900">
            {t("common.close")}
          </button>
          {result?.error && <p className="text-sm text-red-600">{result.error}</p>}
          {result && !result.error && (
            <p className="text-sm text-emerald-600">
              {t("sheetImport.done", { count: result.created ?? 0 })}
              {result.replaced ? ` ${t("sheetImport.replaced", { count: result.replaced })}` : ""}
              {result.kept ? ` ${t("sheetImport.kept", { count: result.kept })}` : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
