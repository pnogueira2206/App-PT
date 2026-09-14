"use client";

import { useActionState, useState } from "react";
import { resetStudentPasswordAction } from "@/app/trainer/actions";

export function ResetPasswordForm({ studentId }: { studentId: string }) {
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
        Redefinir palavra-passe
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="studentId" value={studentId} />
      <input
        name="password"
        placeholder="Nova palavra-passe"
        required
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        Guardar
      </button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      {state?.success && (
        <span className="text-sm text-emerald-600">{state.success}</span>
      )}
    </form>
  );
}
