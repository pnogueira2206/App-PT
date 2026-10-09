// Workout dates are calendar days stored as UTC midnight. All helpers here
// work on "YYYY-MM-DD" strings / UTC dates so the server timezone never
// shifts a workout to another day.

export const APP_TIMEZONE = "Europe/Lisbon";

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDateKey(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const date = new Date(`${key}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Today's date key in the app timezone. */
export function todayKey(): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(new Date());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Monday of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const weekday = (date.getUTCDay() + 6) % 7; // 0 = Monday
  return addDays(date, -weekday);
}

/** Resolves a `?week=` search param (any day of the week) to its Monday, defaulting to this week. */
export function resolveWeekStart(param: string | undefined): Date {
  const parsed = param ? parseDateKey(param) : null;
  return startOfWeek(parsed ?? parseDateKey(todayKey())!);
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function diffInDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / DAY_MS);
}

// `locale` is a BCP 47 tag (INTL_LOCALE from @/i18n/config, or intlLocale from getI18n/useI18n).

export function formatDate(date: Date, locale: string, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString(locale, { timeZone: "UTC", ...options });
}

export function formatWeekday(date: Date, locale: string): string {
  return formatDate(date, locale, { weekday: "short" }).replace(".", "");
}

export function formatDayMonth(date: Date, locale: string): string {
  return formatDate(date, locale, { day: "numeric", month: "short" }).replace(".", "");
}

export function formatWeekRange(weekStart: Date, locale: string): string {
  const end = addDays(weekStart, 6);
  return `${formatDayMonth(weekStart, locale)} – ${formatDayMonth(end, locale)}`;
}

/** Long date for headings, e.g. "Quinta-feira, 8 de outubro". */
export function formatLongDate(date: Date, locale: string): string {
  return formatDate(date, locale, { weekday: "long", day: "numeric", month: "long" });
}
