import Link from "next/link";
import type { WorkoutStatus } from "@prisma/client";
import {
  addDays,
  formatDayMonth,
  formatWeekRange,
  formatWeekday,
  parseDateKey,
  toDateKey,
  todayKey,
  weekDays,
} from "@/lib/dates";
import { getI18n } from "@/i18n/server";
import type { MessageKey } from "@/i18n/translator";
import type { CalendarOwner, CompletionState } from "@/lib/workouts";
import type { Clipboard } from "@/lib/clipboard";
import {
  clearClipboardAction,
  copyDayAction,
  copyWeekAction,
  pasteAction,
  publishWeekAction,
} from "@/app/trainer/calendar/actions";

export type CalendarWorkout = {
  id: string;
  title: string;
  date: Date;
  status: WorkoutStatus;
  blocksCount: number;
  /** Set when the workout is inherited from a group (student calendar). */
  groupName?: string | null;
  isOverride?: boolean;
  state?: CompletionState;
  /** Free label, e.g. "2/3 concluíram" on group calendars. */
  progress?: string;
};

const STATE_STYLES: Record<CompletionState, { label: MessageKey; className: string }> = {
  done: { label: "states.done", className: "bg-emerald-100 text-emerald-700" },
  partial: { label: "states.partial", className: "bg-sky-100 text-sky-700" },
  missed: { label: "states.missed", className: "bg-red-100 text-red-700" },
  pending: { label: "states.pending", className: "bg-slate-100 text-slate-600" },
};

export async function WeekCalendar({
  owner,
  basePath,
  weekStart,
  workouts,
  clipboard,
}: {
  owner: CalendarOwner;
  basePath: string;
  weekStart: Date;
  workouts: CalendarWorkout[];
  clipboard: Clipboard | null;
}) {
  const { t, intlLocale } = await getI18n();
  const today = todayKey();
  const dayMonth = (key: string) => formatDayMonth(parseDateKey(key) ?? weekStart, intlLocale);
  const clipboardLabel = (c: Clipboard) =>
    c.kind === "workout"
      ? t("calendar.clipboardWorkout", { title: c.title })
      : c.kind === "day"
        ? t("calendar.clipboardDay", { date: dayMonth(c.date), name: c.ownerName })
        : t("calendar.clipboardWeek", { date: dayMonth(c.weekStart), name: c.ownerName });

  const weekKey = toDateKey(weekStart);
  const days = weekDays(weekStart);
  const ownedDrafts = workouts.filter((w) => w.status === "DRAFT" && !w.groupName).length;
  const hasOwned = workouts.some((w) => !w.groupName);
  const targetParam = `${owner.type}:${owner.id}`;

  const copyWeek = copyWeekAction.bind(null, owner, weekKey);
  const publishWeek = publishWeekAction.bind(null, owner, weekKey);
  const pasteWeek = pasteAction.bind(null, owner, weekKey);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Link
            href={`${basePath}?week=${toDateKey(addDays(weekStart, -7))}`}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm hover:bg-slate-50"
            aria-label={t("common.previousWeek")}
          >
            ←
          </Link>
          <Link
            href={basePath}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm hover:bg-slate-50"
          >
            {t("common.today")}
          </Link>
          <Link
            href={`${basePath}?week=${toDateKey(addDays(weekStart, 7))}`}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm hover:bg-slate-50"
            aria-label={t("common.nextWeek")}
          >
            →
          </Link>
          <span className="ml-2 text-sm font-semibold text-slate-900">
            {formatWeekRange(weekStart, intlLocale)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasOwned && (
            <form action={copyWeek}>
              <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                {t("calendar.copyWeek")}
              </button>
            </form>
          )}
          {clipboard?.kind === "week" && (
            <form action={pasteWeek}>
              <button className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-800 hover:bg-sky-100">
                {t("calendar.pasteWeek")}
              </button>
            </form>
          )}
          {ownedDrafts > 0 && (
            <form action={publishWeek}>
              <button className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-ink hover:bg-brand-hover">
                {t("calendar.publishWeek", { count: ownedDrafts })}
              </button>
            </form>
          )}
        </div>
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

      <div className="grid gap-2 lg:grid-cols-7">
        {days.map((day) => {
          const key = toDateKey(day);
          const isToday = key === today;
          const dayWorkouts = workouts.filter((w) => toDateKey(w.date) === key);
          const dayHasOwned = dayWorkouts.some((w) => !w.groupName);
          const copyDay = copyDayAction.bind(null, owner, key);
          const pasteDay = pasteAction.bind(null, owner, key);

          return (
            <div
              key={key}
              className={`flex min-h-28 flex-col gap-2 rounded-xl border bg-white p-2.5 ${
                isToday ? "border-brand" : "border-slate-200"
              }`}
            >
              <div className="flex items-baseline justify-between gap-1">
                <p className={`text-sm font-semibold first-letter:uppercase ${isToday ? "text-slate-900" : "text-slate-600"}`}>
                  {formatWeekday(day, intlLocale)}{" "}
                  <span className="font-normal text-slate-400">{formatDayMonth(day, intlLocale)}</span>
                </p>
              </div>

              {dayWorkouts.map((w) => (
                <Link
                  key={w.id}
                  href={`/trainer/workouts/${w.id}`}
                  className={`block rounded-lg border px-2 py-1.5 text-sm hover:bg-slate-50 ${
                    w.status === "DRAFT" ? "border-dashed border-amber-300" : "border-slate-200"
                  }`}
                >
                  <p className="font-medium leading-snug text-slate-900">{w.title}</p>
                  <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                    {w.status === "DRAFT" && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-800">
                        {t("common.draft")}
                      </span>
                    )}
                    {w.state && w.status === "PUBLISHED" && (
                      <span className={`rounded-full px-1.5 py-0.5 ${STATE_STYLES[w.state].className}`}>
                        {t(STATE_STYLES[w.state].label)}
                      </span>
                    )}
                    {w.progress && (
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-slate-600">
                        {w.progress}
                      </span>
                    )}
                    {w.groupName && (
                      <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-indigo-700">
                        👥 {w.groupName}
                      </span>
                    )}
                    {w.isOverride && (
                      <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-indigo-700">
                        {t("calendar.adjusted")}
                      </span>
                    )}
                    <span className="px-0.5 text-slate-400">{t("common.blocks", { count: w.blocksCount })}</span>
                  </div>
                </Link>
              ))}

              <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1">
                <Link
                  href={`/trainer/workouts/new?target=${targetParam}&date=${key}`}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900"
                >
                  {t("calendar.addWorkout")}
                </Link>
                {dayHasOwned && (
                  <form action={copyDay}>
                    <button className="text-xs text-slate-400 hover:text-slate-800" title={t("calendar.copyDay")}>
                      {t("common.copy")}
                    </button>
                  </form>
                )}
                {clipboard && clipboard.kind !== "week" && (
                  <form action={pasteDay}>

                    <button className="text-xs font-medium text-sky-700 hover:text-sky-900">
                      {t("common.paste")}

                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
