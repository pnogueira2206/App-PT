"use client";

import { useActionState, useState } from "react";

type ActionState = { error?: string; success?: string } | undefined;

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function ProfileDataForm({
  dateOfBirth,
  weightKg,
  heightCm,
  action,
}: {
  dateOfBirth: Date | null;
  weightKg: number | null;
  heightCm: number | null;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(action, undefined);

  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state?.success) setEditing(false);
  }

  if (!editing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Dados pessoais</h2>
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            Editar
          </button>
        </div>
        <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-xs text-slate-400">Nascimento</dt>
            <dd className="font-medium text-slate-800">
              {dateOfBirth ? new Date(dateOfBirth).toLocaleDateString("pt-PT") : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Peso</dt>
            <dd className="font-medium text-slate-800">{weightKg ? `${weightKg} kg` : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Altura</dt>
            <dd className="font-medium text-slate-800">{heightCm ? `${heightCm} cm` : "—"}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Dados pessoais</h2>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-sm text-slate-400 hover:text-slate-700"
        >
          Fechar
        </button>
      </div>

      <div>
        <label className="block text-xs text-slate-500">Data de nascimento</label>
        <input
          name="dateOfBirth"
          type="date"
          defaultValue={toDateInputValue(dateOfBirth)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-500">Peso (kg)</label>
          <input
            name="weightKg"
            type="number"
            step="0.1"
            min={0}
            defaultValue={weightKg ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500">Altura (cm)</label>
          <input
            name="heightCm"
            type="number"
            step="0.1"
            min={0}
            defaultValue={heightCm ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {isPending ? "A guardar..." : "Guardar"}
      </button>
    </form>
  );
}
