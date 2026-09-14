"use client";

import { useActionState } from "react";
import { submitResultAction } from "@/app/student/actions";

type ExistingResult = {
  setsCompleted: number | null;
  repsCompleted: string | null;
  weightUsed: string | null;
  rpe: number | null;
  studentNotes: string | null;
} | null;

export function ResultForm({
  blockId,
  existing,
}: {
  blockId: string;
  existing: ExistingResult;
}) {
  const boundAction = submitResultAction.bind(null, blockId);
  const [state, formAction, isPending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="mt-3 space-y-2 border-t border-slate-100 pt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        O teu resultado
      </p>
      <div className="grid grid-cols-3 gap-2">
        <input
          name="setsCompleted"
          type="number"
          min={0}
          defaultValue={existing?.setsCompleted ?? ""}
          placeholder="Séries"
          className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
        />
        <input
          name="repsCompleted"
          defaultValue={existing?.repsCompleted ?? ""}
          placeholder="Reps"
          className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
        />
        <input
          name="weightUsed"
          defaultValue={existing?.weightUsed ?? ""}
          placeholder="Carga"
          className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
        />
      </div>
      <input
        name="rpe"
        type="number"
        min={1}
        max={10}
        defaultValue={existing?.rpe ?? ""}
        placeholder="RPE (1-10, opcional)"
        className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
      />
      <textarea
        name="studentNotes"
        rows={2}
        defaultValue={existing?.studentNotes ?? ""}
        placeholder="Notas (como te sentiste, dores, etc.)"
        className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">{state.success}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {isPending ? "A guardar..." : existing ? "Atualizar resultado" : "Guardar resultado"}
      </button>
    </form>
  );
}
