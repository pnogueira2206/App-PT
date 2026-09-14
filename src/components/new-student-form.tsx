"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createStudentAction } from "@/app/trainer/actions";

export function NewStudentForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createStudentAction,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        + Novo aluno
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
        <h3 className="font-semibold text-slate-900">Novo aluno</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-slate-400 hover:text-slate-700"
        >
          Fechar
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          name="name"
          placeholder="Nome"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="password"
          placeholder="Palavra-passe inicial"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-600">{state.success}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {isPending ? "A criar..." : "Criar aluno"}
      </button>
      <p className="text-xs text-slate-500">
        Partilha o email e a palavra-passe com o aluno para ele entrar na
        app.
      </p>
    </form>
  );
}
