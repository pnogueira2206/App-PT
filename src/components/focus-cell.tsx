"use client";

import { useState } from "react";
import { saveTrainingDayAction } from "@/app/trainer/calendar/actions";
import { useI18n } from "@/i18n/client";
import type { CalendarOwner } from "@/lib/workouts";

/** One weekday of a student's or group's weekly structure ("Lower / Str - Squat"), editable in place. */
export function FocusCell({
  owner,
  weekday,
  focus,
}: {
  owner: CalendarOwner;
  weekday: number;
  focus: string | null;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await saveTrainingDayAction(owner, weekday, formData);
          setEditing(false);
        }}
        className="space-y-1"
      >
        <textarea
          name="focus"
          rows={4}
          autoFocus
          defaultValue={focus ?? ""}
          placeholder={t("calendar.focusPlaceholder")}
          className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs"
        />
        <div className="flex gap-2 text-[11px]">
          <button className="rounded bg-brand px-2 py-0.5 font-semibold text-brand-ink">{t("common.save")}</button>
          <button type="button" onClick={() => setEditing(false)} className="text-slate-500">
            {t("common.cancel")}
          </button>
        </div>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={t("calendar.editFocus")}
      className="flex h-full w-full items-start text-left text-xs leading-snug text-slate-800"
    >
      {focus ? (
        <span className="whitespace-pre-wrap first-line:font-semibold">{focus}</span>
      ) : (
        <span className="text-slate-400">{t("calendar.setFocus")}</span>
      )}
    </button>
  );
}
