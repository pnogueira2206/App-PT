"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addBlockAction } from "@/app/trainer/workouts/actions";

export function AddBlockForm({ workoutId }: { workoutId: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = addBlockAction.bind(null, workoutId);
  const [state, formAction, isPending] = useActionState(boundAction, undefined);
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
        + Adicionar bloco
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
        <h3 className="font-semibold text-slate-900">Novo bloco</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-slate-400 hover:text-slate-700"
        >
          Fechar
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="title"
          placeholder="Nome do bloco (ex: Bloco A)"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="exerciseName"
          placeholder="Exercício (ex: Agachamento)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <input
          name="prescribedSets"
          type="number"
          min={0}
          placeholder="Séries"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="prescribedReps"
          placeholder="Reps (ex: 8-10)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="prescribedWeight"
          placeholder="Carga (ex: 60kg)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <input
        name="restSeconds"
        type="number"
        min={0}
        placeholder="Descanso (segundos)"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      <textarea
        name="trainerNotes"
        rows={2}
        placeholder="Notas para o aluno (técnica, indicações, etc.)"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {isPending ? "A adicionar..." : "Adicionar bloco"}
      </button>
    </form>
  );
}
