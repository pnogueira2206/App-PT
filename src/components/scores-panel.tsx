"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import type { CalendarOwner } from "@/lib/workouts";
import type { TvScoreKind } from "@/lib/tv-scores";
import { saveScoresAction } from "@/app/trainer/calendar/actions";

export type ScoreRow = {
  id: string;
  name: string;
  /** Current values, as the fields show them. */
  values: { kg: string; time: string; rounds: string; reps: string; text: string };
  /** The saved result in words ("120 kg"), if any. */
  current: string;
};

const input = "rounded-md border border-slate-200 px-2.5 py-1.5 text-sm";

/**
 * "+ scores" under a block of the calendar: every athlete of the group (or the
 * student) with a field for the score, like on the TV, without leaving the calendar.
 */
export function ScoresPanel({
  owner,
  blockId,
  label,
  subtitle,
  prescription,
  kind,
  athletes,
  closeHref,
}: {
  owner: CalendarOwner;
  blockId: string;
  label: string;
  subtitle: string;
  prescription: string;
  kind: TvScoreKind;
  athletes: ScoreRow[];
  closeHref: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const kindHint =
    kind === "MAX_LOAD"
      ? t("tvScores.kg")
      : kind === "TIME"
        ? t("tvScores.time")
        : kind === "ROUNDS_REPS"
          ? t("tvScores.roundsReps")
          : t("tvScores.text");

  function submit(formData: FormData) {
    startTransition(async () => {
      const outcome = await saveScoresAction(owner, blockId, formData);
      if ("error" in outcome) {
        setMessage(t("errors.tryAgain"));
      } else if (outcome.invalid > 0) {
        // Stay open so the coach can fix what wasn't understood.
        setMessage(`${t("tvScores.saved", { count: outcome.saved })} ${t("tvScores.invalid", { count: outcome.invalid })}`);
        router.refresh();
      } else {
        router.push(closeHref);
      }
    });
  }

  return (
    <>
      <Link href={closeHref} aria-label={t("common.close")} className="fixed inset-0 z-30 bg-black/50" />
      <aside className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl sm:w-[30rem]">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{label}</h2>
            <p className="text-sm text-slate-500 first-letter:uppercase">{subtitle}</p>
          </div>
          <Link href={closeHref} className="text-xl leading-none text-slate-400 hover:text-slate-900" aria-label={t("common.close")}>
            ×
          </Link>
        </div>

        <form action={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {prescription && (
              <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-2.5 text-sm text-slate-700">{prescription}</p>
            )}
            {athletes.length === 0 ? (
              <p className="text-sm text-slate-500">{t("tvScores.noAthletes")}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{kindHint}</p>
                {athletes.map((a) => (
                  <div key={a.id} className="space-y-1 rounded-lg border border-slate-200 px-3 py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">{a.name}</span>
                      {a.current && <span className="text-xs text-slate-500">{a.current}</span>}
                    </div>
                    {kind === "MAX_LOAD" && (
                      <input name={`kg_${a.id}`} defaultValue={a.values.kg} inputMode="decimal" placeholder="kg" aria-label={`${a.name} kg`} className={`${input} w-32`} />
                    )}
                    {kind === "TIME" && (
                      <input name={`time_${a.id}`} defaultValue={a.values.time} placeholder="mm:ss" aria-label={`${a.name} mm:ss`} className={`${input} w-32`} />
                    )}
                    {kind === "ROUNDS_REPS" && (
                      <div className="flex items-center gap-2">
                        <input name={`rounds_${a.id}`} defaultValue={a.values.rounds} inputMode="numeric" placeholder={t("tvScores.rounds")} aria-label={`${a.name} ${t("tvScores.rounds")}`} className={`${input} w-24`} />
                        <span className="text-slate-400">+</span>
                        <input name={`reps_${a.id}`} defaultValue={a.values.reps} inputMode="numeric" placeholder={t("tvScores.reps")} aria-label={`${a.name} ${t("tvScores.reps")}`} className={`${input} w-24`} />
                      </div>
                    )}
                    {kind === "TEXT" && (
                      <input name={`text_${a.id}`} defaultValue={a.values.text} placeholder={t("tvScores.textPlaceholder")} aria-label={a.name} className={`${input} w-full`} />
                    )}
                  </div>
                ))}
              </div>
            )}
            {message && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{message}</p>}
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
            <Link href={closeHref} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              {t("common.cancel")}
            </Link>
            {athletes.length > 0 && (
              <button
                disabled={isPending}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-hover disabled:opacity-60"
              >
                {t("tvScores.save")}
              </button>
            )}
          </div>
        </form>
      </aside>
    </>
  );
}
