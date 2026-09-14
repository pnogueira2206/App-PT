"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addPersonalRecordAction } from "@/app/student/actions";

export function NewRecordForm({ exerciseNames }: { exerciseNames: string[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    addPersonalRecordAction,
    undefined
  );
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
        + Novo recorde
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
        <h3 className="font-semibold text-slate-900">Novo recorde pessoal</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-slate-400 hover:text-slate-700"
        >
          Fechar
        </button>
      </div>

      <input
        name="exerciseName"
        list="exercise-options"
        required
        placeholder="Exercício (ex: Supino)"
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
          placeholder="Valor (ex: 100)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="unit"
          placeholder="Unidade (ex: kg)"
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
        placeholder="Notas (opcional)"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {isPending ? "A guardar..." : "Guardar recorde"}
      </button>
    </form>
  );
}
