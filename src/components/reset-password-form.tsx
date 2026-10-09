"use client";

import { useActionState, useState } from "react";
import { resetStudentPasswordAction } from "@/app/trainer/actions";
import { useI18n } from "@/i18n/client";

export function ResetPasswordForm({ studentId }: { studentId: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    resetStudentPasswordAction,
    undefined
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        {t("students.resetPassword")}
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="studentId" value={studentId} />
      <input
        name="password"
        placeholder={t("students.newPassword")}
        required
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-ink hover:bg-brand-hover disabled:opacity-60"
      >
        {t("common.save")}

      </button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      {state?.success && (
        <span className="text-sm text-emerald-600">{state.success}</span>
      )}
    </form>
  );
}
