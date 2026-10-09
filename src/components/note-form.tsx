"use client";

import { useActionState } from "react";
import { useI18n } from "@/i18n/client";

type ActionState = { error?: string; success?: string } | undefined;

export function NoteForm({ action }: { action: (prev: ActionState, formData: FormData) => Promise<ActionState> }) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
      <textarea
        name="body"
        rows={3}
        required
        placeholder={t("notes.placeholder")}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        disabled={isPending}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-hover disabled:opacity-60"
      >
        {isPending ? t("common.saving") : t("notes.add")}
      </button>
    </form>
  );
}

export function GoalForm({ action }: { action: (prev: ActionState, formData: FormData) => Promise<ActionState> }) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid gap-2 sm:grid-cols-[1fr_11rem]">
        <input
          name="title"
          required
          placeholder={t("goals.titlePlaceholder")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="targetDate"
          type="date"
          aria-label={t("goals.targetDate")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <textarea
        name="notes"
        rows={2}
        placeholder={t("goals.notesPlaceholder")}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        disabled={isPending}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-hover disabled:opacity-60"
      >
        {isPending ? t("common.saving") : t("goals.add")}
      </button>
    </form>
  );
}
