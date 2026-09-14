"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

type ActionState = { error?: string; success?: string } | undefined;

type Record = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  type: "WEIGHT" | "TIME";
  value: string;
  unit: string | null;
  notes: string | null;
  recordDate: Date;
};

function toDateInputValue(date: Date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function RecordItem({
  record,
  updateAction,
  deleteAction,
  historyHref,
}: {
  record: Record;
  updateAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  historyHref?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(updateAction, undefined);

  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state?.success) setEditing(false);
  }

  if (editing) {
    return (
      <li className="rounded-xl border border-slate-200 bg-white p-3">
        <form action={formAction} className="space-y-2">
          <p className="font-medium text-slate-900">{record.exerciseName}</p>
          <div className="flex gap-2">
            <select
              name="type"
              defaultValue={record.type}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
            >
              <option value="WEIGHT">Levantamento</option>
              <option value="TIME">Treino para tempo</option>
            </select>
            <input
              name="value"
              defaultValue={record.value}
              required
              placeholder="Valor"
              className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
            />
            <input
              name="unit"
              defaultValue={record.unit ?? ""}
              placeholder="Unidade"
              className="w-20 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>
          <input
            name="recordDate"
            type="date"
            defaultValue={toDateInputValue(record.recordDate)}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
          />
          <textarea
            name="notes"
            rows={2}
            defaultValue={record.notes ?? ""}
            placeholder="Notas (opcional)"
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
          />
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:text-slate-800"
            >
              Cancelar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
      <div>
        {historyHref ? (
          <Link href={historyHref} className="font-medium text-slate-900 hover:underline">
            {record.exerciseName}
          </Link>
        ) : (
          <p className="font-medium text-slate-900">{record.exerciseName}</p>
        )}
        <p className="text-sm text-slate-600">
          {record.value} {record.unit ?? ""}
          <span className="ml-2 text-xs text-slate-400">
            {new Date(record.recordDate).toLocaleDateString("pt-PT")}
          </span>
        </p>
        {record.notes && <p className="text-xs italic text-slate-400">{record.notes}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={() => setEditing(true)}
          className="text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          Editar
        </button>
        <form action={deleteAction}>
          <button type="submit" className="text-xs text-slate-400 hover:text-red-600">
            Remover
          </button>
        </form>
      </div>
    </li>
  );
}
