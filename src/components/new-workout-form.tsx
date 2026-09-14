"use client";

import { useActionState } from "react";
import { createWorkoutAction } from "@/app/trainer/workouts/actions";

type Option = { id: string; name: string };

export function NewWorkoutForm({
  groups,
  students,
  defaultTarget,
}: {
  groups: Option[];
  students: Option[];
  defaultTarget?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    createWorkoutAction,
    undefined
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div>
        <label className="block text-sm font-medium text-slate-700">Título</label>
        <input
          name="title"
          required
          placeholder="ex: Treino de pernas - Semana 1"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Descrição (opcional)
        </label>
        <textarea
          name="description"
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Data</label>
          <input
            name="date"
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Atribuir a
          </label>
          <select
            name="target"
            required
            defaultValue={defaultTarget ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Escolhe um grupo ou aluno
            </option>
            {groups.length > 0 && (
              <optgroup label="Grupos">
                {groups.map((g) => (
                  <option key={g.id} value={`group:${g.id}`}>
                    {g.name}
                  </option>
                ))}
              </optgroup>
            )}
            {students.length > 0 && (
              <optgroup label="Alunos">
                {students.map((s) => (
                  <option key={s.id} value={`student:${s.id}`}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "A criar..." : "Criar treino e adicionar blocos"}
      </button>
    </form>
  );
}
