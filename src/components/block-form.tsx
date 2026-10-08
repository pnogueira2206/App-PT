"use client";

import { useActionState, useId, useState } from "react";
import type { BlockType, CardioModality, MetconFormat } from "@prisma/client";
import {
  BLOCK_TYPE_LABELS,
  CARDIO_MODALITY_LABELS,
  METCON_FORMAT_LABELS,
  formatDuration,
} from "@/lib/blocks";

type ActionState = { error?: string; success?: string } | undefined;

export type BlockFormValues = {
  type: BlockType;
  title: string;
  exerciseName: string | null;
  description: string | null;
  prescribedSets: number | null;
  prescribedReps: string | null;
  prescribedWeight: string | null;
  percent1RM: number | null;
  tempo: string | null;
  restSeconds: number | null;
  metconFormat: MetconFormat | null;
  timeCapSeconds: number | null;
  cardioModality: CardioModality | null;
  targetDistanceM: number | null;
  targetTimeSeconds: number | null;
  targetCalories: number | null;
  targetPace: string | null;
  trainerNotes: string | null;
};

const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const label = "block text-xs font-medium text-slate-500 mb-1";

function duration(value: number | null | undefined) {
  return value != null ? formatDuration(value) : "";
}

export function BlockForm({
  action,
  exerciseNames,
  initial,
  submitLabel,
  onCancel,
  onSuccess,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  exerciseNames: string[];
  initial?: BlockFormValues;
  submitLabel: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await action(prev, formData);
      if (result?.success) onSuccess?.();
      return result;
    },
    undefined
  );
  const [type, setType] = useState<BlockType>(initial?.type ?? "STRENGTH");
  const [metconFormat, setMetconFormat] = useState<MetconFormat>(
    initial?.metconFormat ?? "FOR_TIME"
  );

  const listId = useId();
  const usesSets = type === "STRENGTH" || type === "ACCESSORY";

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(BLOCK_TYPE_LABELS) as BlockType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              type === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {BLOCK_TYPE_LABELS[t]}
          </button>
        ))}
        <input type="hidden" name="type" value={type} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>Nome do bloco</label>
          <input
            name="title"
            required
            defaultValue={initial?.title}
            placeholder={type === "METCON" ? "ex: Metcon" : "ex: A. Força"}
            className={input}
          />
        </div>
        <div>
          <label className={label}>
            Exercício {type === "METCON" ? "(opcional, ex: benchmark)" : ""}
          </label>
          <input
            name="exerciseName"
            list={listId}
            defaultValue={initial?.exerciseName ?? ""}
            placeholder={type === "CARDIO" ? "ex: Remo" : "ex: Back Squat"}
            className={input}
          />
          <datalist id={listId}>
            {exerciseNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
      </div>

      {type === "METCON" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Formato</label>
            <select
              name="metconFormat"
              value={metconFormat}
              onChange={(e) => setMetconFormat(e.target.value as MetconFormat)}
              className={input}
            >
              {(Object.keys(METCON_FORMAT_LABELS) as MetconFormat[]).map((f) => (
                <option key={f} value={f}>
                  {METCON_FORMAT_LABELS[f]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>
              {metconFormat === "AMRAP" || metconFormat === "EMOM" ? "Duração (mm:ss)" : "Time cap (mm:ss)"}
            </label>
            <input
              name="timeCapSeconds"
              defaultValue={duration(initial?.timeCapSeconds)}
              placeholder="ex: 12:00"
              inputMode="numeric"
              className={input}
            />
          </div>
        </div>
      )}

      {usesSets && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className={label}>Séries</label>
            <input
              name="prescribedSets"
              type="number"
              min={0}
              defaultValue={initial?.prescribedSets ?? ""}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Reps</label>
            <input
              name="prescribedReps"
              defaultValue={initial?.prescribedReps ?? ""}
              placeholder="ex: 5 ou 8-10"
              className={input}
            />
          </div>
          {type === "STRENGTH" && (
            <div>
              <label className={label}>% do 1RM</label>
              <input
                name="percent1RM"
                inputMode="decimal"
                defaultValue={initial?.percent1RM ?? ""}
                placeholder="ex: 75"
                className={input}
              />
            </div>
          )}
          <div>
            <label className={label}>Carga</label>
            <input
              name="prescribedWeight"
              defaultValue={initial?.prescribedWeight ?? ""}
              placeholder="ex: 60kg, RPE 8"
              className={input}
            />
          </div>
          {type === "STRENGTH" && (
            <div>
              <label className={label}>Tempo de execução</label>
              <input
                name="tempo"
                defaultValue={initial?.tempo ?? ""}
                placeholder="ex: 31X1"
                className={input}
              />
            </div>
          )}
          <div>
            <label className={label}>Descanso (mm:ss)</label>
            <input
              name="restSeconds"
              defaultValue={duration(initial?.restSeconds)}
              placeholder="ex: 2:00"
              className={input}
            />
          </div>
        </div>
      )}

      {type === "CARDIO" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className={label}>Modalidade</label>
            <select
              name="cardioModality"
              defaultValue={initial?.cardioModality ?? "ROW"}
              className={input}
            >
              {(Object.keys(CARDIO_MODALITY_LABELS) as CardioModality[]).map((m) => (
                <option key={m} value={m}>
                  {CARDIO_MODALITY_LABELS[m]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Distância (m)</label>
            <input
              name="targetDistanceM"
              type="number"
              min={0}
              defaultValue={initial?.targetDistanceM ?? ""}
              placeholder="ex: 2000"
              className={input}
            />
          </div>
          <div>
            <label className={label}>Tempo (mm:ss)</label>
            <input
              name="targetTimeSeconds"
              defaultValue={duration(initial?.targetTimeSeconds)}
              placeholder="ex: 20:00"
              className={input}
            />
          </div>
          <div>
            <label className={label}>Calorias</label>
            <input
              name="targetCalories"
              type="number"
              min={0}
              defaultValue={initial?.targetCalories ?? ""}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Pace alvo</label>
            <input
              name="targetPace"
              defaultValue={initial?.targetPace ?? ""}
              placeholder="ex: 2:05/500m"
              className={input}
            />
          </div>
          <div>
            <label className={label}>Descanso (mm:ss)</label>
            <input
              name="restSeconds"
              defaultValue={duration(initial?.restSeconds)}
              className={input}
            />
          </div>
        </div>
      )}

      <div>
        <label className={label}>
          {type === "METCON" ? "Treino (WOD)" : "Descrição"}
        </label>
        <textarea
          name="description"
          rows={type === "METCON" || type === "ACCESSORY" ? 4 : 2}
          defaultValue={initial?.description ?? ""}
          placeholder={
            type === "METCON"
              ? "ex:\n21-15-9\nThrusters 43/30kg\nPull-ups"
              : type === "ACCESSORY"
                ? "ex:\n3 rondas:\n10 Banded pull-aparts\n30s Couch stretch / lado"
                : "Detalhes adicionais (opcional)"
          }
          className={`${input} font-mono`}
        />
      </div>

      <div>
        <label className={label}>Notas para o aluno</label>
        <textarea
          name="trainerNotes"
          rows={2}
          defaultValue={initial?.trainerNotes ?? ""}
          placeholder="Técnica, intenção, escalas..."
          className={input}
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {isPending ? "A guardar..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-800">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
