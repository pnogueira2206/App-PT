"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";

type ActionState = { error?: string; success?: string } | undefined;

export function NewRecordForm({
  exerciseNames,
  action,
}: {
  exerciseNames: string[];
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"WEIGHT" | "TIME">("WEIGHT");
  const [state, formAction, isPending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-slate-300 bg-white py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        {t("records.newRecord")}
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{t("records.newRecordTitle")}</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-slate-400 hover:text-slate-700"
        >
          {t("common.close")}
        </button>
      </div>

      <select
        name="type"
        value={type}
        onChange={(e) => setType(e.target.value as "WEIGHT" | "TIME")}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="WEIGHT">{t("records.typeLiftLoad")}</option>
        <option value="TIME">{t("records.typeTimed")}</option>
      </select>

      <input
        name="exerciseName"
        list="exercise-options"
        required
        placeholder={type === "WEIGHT" ? t("records.exercisePlaceholder") : t("records.workoutPlaceholder")}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <datalist id="exercise-options">
        {exerciseNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="grid grid-cols-2 gap-3">
        <input
          name="value"
          required
          placeholder={type === "WEIGHT" ? t("records.valuePlaceholder") : t("records.timePlaceholder")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="unit"
          placeholder={type === "WEIGHT" ? t("records.unitKgPlaceholder") : t("records.unitOptional")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <input
        name="recordDate"
        type="date"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      <textarea
        name="notes"
        rows={2}
        placeholder={t("common.notesOptional")}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-hover disabled:opacity-60"
      >
        {isPending ? t("common.saving") : t("records.saveRecord")}

      </button>
    </form>
  );
}
