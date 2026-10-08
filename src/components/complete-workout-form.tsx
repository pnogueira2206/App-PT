"use client";

import { useActionState } from "react";
import { completeWorkoutAction } from "@/app/student/actions";

export function CompleteWorkoutForm({
  workoutId,
  existing,
}: {
  workoutId: string;
  existing: { sessionRpe: number | null; notes: string | null } | null;
}) {
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
        {existing ? "✅ Treino concluído" : "Concluir treino"}
      </h2>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Esforço da sessão (RPE 1–10)
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
              <span className="block rounded-md border border-slate-200 bg-white py-1.5 text-center text-sm text-slate-600 peer-checked:border-slate-900 peer-checked:bg-slate-900 peer-checked:text-white">
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
        placeholder="Como correu a sessão?"
        className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-700">{state.success}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {isPending ? "A guardar..." : existing ? "Atualizar" : "Concluir treino"}
      </button>
    </form>
  );
}
