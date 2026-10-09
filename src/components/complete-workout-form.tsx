"use client";

import { useActionState } from "react";
import { completeWorkoutAction } from "@/app/student/actions";
import { useI18n } from "@/i18n/client";

export function CompleteWorkoutForm({
  workoutId,
  existing,
}: {
  workoutId: string;
  existing: { sessionRpe: number | null; notes: string | null } | null;
}) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(
    completeWorkoutAction.bind(null, workoutId),
    undefined
  );

  return (
    <form
      action={formAction}
      className={`space-y-3 rounded-xl border p-4 ${
        existing ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
      }`}
    >
      <h2 className="font-semibold text-slate-900">
        {existing ? t("completion.done") : t("completion.title")}
      </h2>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          {t("completion.sessionEffort")}
        </label>
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <label key={n} className="cursor-pointer">
              <input
                type="radio"
                name="sessionRpe"
                value={n}
                defaultChecked={existing?.sessionRpe === n}
                className="peer sr-only"
              />
              <span className="block rounded-md border border-slate-200 bg-white py-1.5 text-center text-sm text-slate-600 peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-ink">
                {n}
              </span>
            </label>
          ))}
        </div>
      </div>
      <textarea
        name="notes"
        rows={2}
        defaultValue={existing?.notes ?? ""}
        placeholder={t("completion.notesPlaceholder")}
        className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-700">{state.success}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-brand px-3 py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-hover disabled:opacity-60"
      >
        {isPending ? t("common.saving") : existing ? t("completion.update") : t("completion.title")}

      </button>
    </form>
  );
}
