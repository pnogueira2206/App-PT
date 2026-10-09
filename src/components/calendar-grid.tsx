import Link from "next/link";
import {
  addDays,
  formatDate,
  formatDayMonth,
  formatWeekday,
  isoWeek,
  parseDateKey,
  toDateKey,
  todayKey,
  weekDays,
} from "@/lib/dates";
import { BLOCK_TYPE_STYLES, formatPrescription } from "@/lib/blocks";
import type { GridWorkout } from "@/lib/calendar";
import type { CalendarOwner, CompletionState } from "@/lib/workouts";
import type { Clipboard } from "@/lib/clipboard";
import { getI18n } from "@/i18n/server";
import type { MessageKey } from "@/i18n/translator";
import {
  clearClipboardAction,
  copyDayAction,
  copyWeekAction,
  createRestDayAction,
  pasteAction,
  publishWeekAction,
  removeRestDayAction,
} from "@/app/trainer/calendar/actions";
import { FocusCell } from "@/components/focus-cell";

export const GRID_WEEKS = 6;
/** The anchor week is shown second, so the previous week stays visible for comparison. */
export function gridStart(anchorWeek: Date) {
  return addDays(anchorWeek, -7);
}

const STATE_STYLES: Record<CompletionState, { label: MessageKey; className: string }> = {
  done: { label: "states.done", className: "bg-emerald-100 text-emerald-700" },
  partial: { label: "states.partial", className: "bg-sky-100 text-sky-700" },
  missed: { label: "states.missed", className: "bg-red-100 text-red-700" },
  pending: { label: "states.pending", className: "bg-slate-100 text-slate-600" },
  rest: { label: "states.rest", className: "bg-slate-100 text-slate-500" },
};

const COLUMNS = "grid-cols-[5.5rem_repeat(7,minmax(8.25rem,1fr))]";

/**
 * Spreadsheet-like calendar: one row per week, one column per weekday, and the
 * full content of each workout in its cell. Optional "structure" row on top
 * with the focus of each weekday (student calendars).
 */
export async function CalendarGrid({
  owner,
  basePath,
  anchorWeek,
  workouts,
  clipboard,
  focus,
}: {
  owner: CalendarOwner;
  basePath: string;
  anchorWeek: Date;
  workouts: GridWorkout[];
  clipboard: Clipboard | null;
  /** Weekday focus (Monday first), student calendars only. */
  focus?: (string | null)[];
}) {
  const i18n = await getI18n();
  const { t, intlLocale } = i18n;
  const today = todayKey();
  const start = gridStart(anchorWeek);
  const weeks = Array.from({ length: GRID_WEEKS }, (_, i) => addDays(start, i * 7));
  const targetParam = `${owner.type}:${owner.id}`;

  const dayMonth = (key: string) => formatDayMonth(parseDateKey(key) ?? start, intlLocale);
  const clipboardLabel = (c: Clipboard) =>
    c.kind === "workout"
      ? t("calendar.clipboardWorkout", { title: c.title })
      : c.kind === "day"
        ? t("calendar.clipboardDay", { date: dayMonth(c.date), name: c.ownerName })
        : t("calendar.clipboardWeek", { date: dayMonth(c.weekStart), name: c.ownerName });

  const navButton = "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm hover:bg-slate-50";
  const smallAction = "text-[11px] font-medium text-slate-400 hover:text-slate-900";

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-2 text-lg font-semibold text-slate-900 first-letter:uppercase">
          {formatDate(anchorWeek, intlLocale, { month: "long", year: "numeric" })}
        </h2>
        <Link
          href={`${basePath}?week=${toDateKey(addDays(anchorWeek, -28))}`}
          className={navButton}
          aria-label={t("calendar.earlier")}
        >
          ‹
        </Link>
        <Link href={basePath} className={navButton}>
          {t("common.today")}
        </Link>
        <Link
          href={`${basePath}?week=${toDateKey(addDays(anchorWeek, 28))}`}
          className={navButton}
          aria-label={t("calendar.later")}
        >
          ›
        </Link>
      </div>

      {clipboard && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
          <span>
            {t("calendar.copied")} <strong>{clipboardLabel(clipboard)}</strong>{" "}
            {clipboard.kind === "week" ? t("calendar.pasteWeekHint") : t("calendar.pasteDayHint")}
          </span>
          <form action={clearClipboardAction}>
            <button className="text-xs text-sky-700 underline">{t("common.clear")}</button>
          </form>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className={`grid min-w-[63rem] ${COLUMNS}`}>
          {/* Header: weekday names */}
          <div className="bg-slate-50" />
          {weekDays(start).map((day) => (
            <div
              key={day.getUTCDay()}
              className="border-l border-slate-200 bg-slate-50 px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              {formatWeekday(day, intlLocale)}
            </div>
          ))}

          {/* Weekly structure (focus of each weekday) */}
          {focus && owner.type === "student" && (
            <>
              <div className="border-t border-slate-200 bg-emerald-50 px-2 py-2 text-xs font-semibold text-slate-700">
                {t("calendar.structure")}
              </div>
              {focus.map((text, weekday) => (
                <div key={weekday} className="border-l border-t border-slate-200 bg-emerald-50 px-2 py-2">
                  <FocusCell studentId={owner.id} weekday={weekday} focus={text} />
                </div>
              ))}
            </>
          )}

          {weeks.map((weekStart) => {
            const weekKey = toDateKey(weekStart);
            const weekWorkouts = workouts.filter(
              (w) => w.date >= weekStart && w.date < addDays(weekStart, 7)
            );
            const drafts = weekWorkouts.filter((w) => w.owned && w.status === "DRAFT").length;
            const hasOwned = weekWorkouts.some((w) => w.owned);
            const isCurrent = weekKey <= today && today < toDateKey(addDays(weekStart, 7));

            return (
              <div key={weekKey} className="contents">
                {/* Week label + week actions */}
                <div
                  className={`space-y-1.5 border-t-2 px-2 py-2 ${
                    isCurrent ? "border-t-brand bg-brand/5" : "border-t-slate-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {t("calendar.weekShort", { number: isoWeek(weekStart) })}
                  </p>
                  <p className="text-[11px] text-slate-500">{formatDayMonth(weekStart, intlLocale)}</p>
                  <div className="flex flex-col items-start gap-1">
                    {hasOwned && (
                      <form action={copyWeekAction.bind(null, owner, weekKey)}>
                        <button className={smallAction}>{t("calendar.copyWeek")}</button>
                      </form>
                    )}
                    {clipboard?.kind === "week" && (
                      <form action={pasteAction.bind(null, owner, weekKey)}>
                        <button className="text-[11px] font-medium text-sky-700 hover:text-sky-900">
                          {t("calendar.pasteWeek")}
                        </button>
                      </form>
                    )}
                    {drafts > 0 && (
                      <form action={publishWeekAction.bind(null, owner, weekKey)}>
                        <button className="rounded bg-brand px-1.5 py-0.5 text-[11px] font-semibold text-brand-ink hover:bg-brand-hover">
                          {t("calendar.publishShort", { count: drafts })}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {weekDays(weekStart).map((day) => {
                  const key = toDateKey(day);
                  const isToday = key === today;
                  const dayWorkouts = weekWorkouts.filter((w) => toDateKey(w.date) === key);
                  const dayHasOwned = dayWorkouts.some((w) => w.owned);
                  const hasRest = dayWorkouts.some((w) => w.kind === "REST");

                  return (
                    <div
                      key={key}
                      className={`group/day flex min-h-32 flex-col gap-1.5 border-l border-l-slate-200 border-t-2 px-1.5 pb-1.5 pt-1 ${
                        isCurrent ? "border-t-brand" : "border-t-slate-300"
                      } ${isToday ? "bg-brand/5" : ""}`}
                    >
                      <p
                        className={`text-right text-xs font-semibold ${
                          isToday ? "text-brand-text" : "text-slate-500"
                        }`}
                      >
                        {day.getUTCDate()}
                      </p>

                      {dayWorkouts.map((w) =>
                        w.kind === "REST" ? (
                          <div
                            key={w.id}
                            className="flex items-center justify-between rounded-md border border-dashed border-slate-300 px-2 py-1 text-xs text-slate-500"
                          >
                            <span>😴 {t("states.rest")}</span>
                            {w.owned && (
                              <form action={removeRestDayAction.bind(null, w.id)}>
                                <button className="text-slate-400 hover:text-red-600" title={t("calendar.removeRest")}>
                                  ×
                                </button>
                              </form>
                            )}
                          </div>
                        ) : (
                          <Link
                            key={w.id}
                            href={`/trainer/workouts/${w.id}`}
                            className={`block space-y-1 rounded-md border px-2 py-1.5 text-xs leading-snug hover:border-brand ${
                              w.status === "DRAFT" ? "border-dashed border-amber-400" : "border-slate-200"
                            }`}
                          >
                            <p className="font-semibold text-slate-900">{w.title}</p>
                            <div className="flex flex-wrap gap-1 text-[10px]">
                              {w.status === "DRAFT" && (
                                <span className="rounded-full bg-amber-100 px-1.5 text-amber-800">{t("common.draft")}</span>
                              )}
                              {w.status === "PUBLISHED" && w.state && (
                                <span className={`rounded-full px-1.5 ${STATE_STYLES[w.state].className}`}>
                                  {t(STATE_STYLES[w.state].label)}
                                </span>
                              )}
                              {w.progress && (
                                <span className="rounded-full bg-slate-100 px-1.5 text-slate-600">
                                  {t("groups.completedProgress", { done: w.progress.done, total: w.progress.total })}
                                </span>
                              )}
                              {w.groupName && (
                                <span className="rounded-full bg-indigo-100 px-1.5 text-indigo-700">👥 {w.groupName}</span>
                              )}
                              {w.isOverride && (
                                <span className="rounded-full bg-indigo-100 px-1.5 text-indigo-700">{t("calendar.adjusted")}</span>
                              )}
                            </div>
                            {w.description && <p className="whitespace-pre-wrap text-slate-600">{w.description}</p>}
                            {w.blocks.map((block) => {
                              const prescription = formatPrescription(block, i18n);
                              return (
                                <div key={block.id} className="border-l-2 border-slate-200 pl-1.5">
                                  <p className="font-medium text-slate-800">
                                    <span
                                      className={`mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle ${BLOCK_TYPE_STYLES[block.type].split(" ")[0]}`}
                                    />
                                    {block.title}
                                    {block.exerciseName && !block.title.includes(block.exerciseName) && (
                                      <span className="font-normal text-slate-500"> · {block.exerciseName}</span>
                                    )}
                                  </p>
                                  {prescription && <p className="text-slate-600">{prescription}</p>}
                                  {block.description && (
                                    <p className="whitespace-pre-wrap text-slate-700">{block.description}</p>
                                  )}
                                </div>
                              );
                            })}
                          </Link>
                        )
                      )}

                      <div className="mt-auto flex flex-wrap gap-x-2 gap-y-0.5 pt-1 opacity-60 transition group-hover/day:opacity-100">
                        <Link href={`/trainer/workouts/new?target=${targetParam}&date=${key}`} className={smallAction}>
                          {t("calendar.addWorkout")}
                        </Link>
                        {!hasRest && (
                          <form action={createRestDayAction.bind(null, owner, key)}>
                            <button className={smallAction}>{t("calendar.addRest")}</button>
                          </form>
                        )}
                        {dayHasOwned && (
                          <form action={copyDayAction.bind(null, owner, key)}>
                            <button className={smallAction} title={t("calendar.copyDay")}>
                              {t("common.copy")}
                            </button>
                          </form>
                        )}
                        {clipboard && clipboard.kind !== "week" && (
                          <form action={pasteAction.bind(null, owner, key)}>
                            <button className="text-[11px] font-medium text-sky-700 hover:text-sky-900">
                              {t("common.paste")}
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
