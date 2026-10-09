"use client";

import { useActionState } from "react";
import { createWorkoutAction } from "@/app/trainer/workouts/actions";
import { useI18n } from "@/i18n/client";

type Option = { id: string; name: string };

export function NewWorkoutForm({
  groups,
  students,
  defaultTarget,
  defaultDate,
}: {
  groups: Option[];
  students: Option[];
  defaultTarget?: string;
  defaultDate: string;
}) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(
    createWorkoutAction,
    undefined
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div>
        <label className="block text-sm font-medium text-slate-700">{t("workouts.formTitle")}</label>
        <input
          name="title"
          required
          placeholder={t("workouts.formTitlePlaceholder")}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          {t("workouts.formDescription")}
        </label>
        <textarea
          name="description"
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">{t("workouts.formDay")}</label>
          <input
            name="date"
            type="date"
            required
            defaultValue={defaultDate}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            {t("workouts.formAssignTo")}
          </label>
          <select
            name="target"
            required
            defaultValue={defaultTarget ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              {t("workouts.formChooseTarget")}
            </option>
            {groups.length > 0 && (
              <optgroup label={t("nav.groups")}>
                {groups.map((g) => (
                  <option key={g.id} value={`group:${g.id}`}>
                    {g.name}
                  </option>
                ))}
              </optgroup>
            )}
            {students.length > 0 && (
              <optgroup label={t("nav.students")}>
                {students.map((s) => (
                  <option key={s.id} value={`student:${s.id}`}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      <p className="text-xs text-slate-500">{t("workouts.formDraftHint")}</p>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-ink hover:bg-brand-hover disabled:opacity-60 sm:w-auto"
      >
        {isPending ? t("common.creating") : t("workouts.formSubmit")}

      </button>
    </form>
  );
}
