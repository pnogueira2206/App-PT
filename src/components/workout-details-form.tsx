"use client";

import { useActionState, useState } from "react";
import { updateWorkoutDetailsAction } from "@/app/trainer/workouts/actions";
import { useI18n } from "@/i18n/client";

export function WorkoutDetailsForm({
  workoutId,
  title,
  description,
  warmup,
  cooldown,
  date,
}: {
  workoutId: string;
  title: string;
  description: string | null;
  warmup: string | null;
  cooldown: string | null;
  date: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (prev: Awaited<ReturnType<typeof updateWorkoutDetailsAction>>, formData: FormData) => {
      const result = await updateWorkoutDetailsAction(workoutId, prev, formData);
      if (result?.success) setOpen(false);
      return result;
    },
    undefined
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        {t("workouts.editDetails")}
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="w-full space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          name="title"
          required
          defaultValue={title}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="date"
          type="date"
          required
          defaultValue={date}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <textarea
        name="description"
        rows={2}
        defaultValue={description ?? ""}
        placeholder={t("workouts.descriptionPlaceholder")}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <textarea
        name="warmup"
        rows={2}
        defaultValue={warmup ?? ""}
        placeholder={t("editor.warmupPlaceholder")}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <textarea
        name="cooldown"
        rows={2}
        defaultValue={cooldown ?? ""}
        placeholder={t("editor.cooldownPlaceholder")}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-hover disabled:opacity-60"
        >
          {isPending ? t("common.saving") : t("common.save")}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-500">
          {t("common.cancel")}

        </button>
      </div>
    </form>
  );
}
