"use client";

import { useActionState, useState } from "react";
import type { BlockType, CardioModality, MetconFormat } from "@prisma/client";
import { submitResultAction } from "@/app/student/actions";
import { formatDuration, formatPace, parseDuration } from "@/lib/blocks";

type ExistingResult = {
  done: boolean;
  timeSeconds: number | null;
  rounds: number | null;
  reps: number | null;
  loadKg: number | null;
  distanceM: number | null;
  calories: number | null;
  rx: boolean | null;
  rpe: number | null;
  scoreText: string | null;
  studentNotes: string | null;
  sets: { setNumber: number; reps: number | null; loadKg: number | null }[];
} | null;

type BlockInfo = {
  id: string;
  type: BlockType;
  metconFormat: MetconFormat | null;
  cardioModality: CardioModality | null;
  prescribedSets: number | null;
  prescribedReps: string | null;
};

const input = "w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm";
const label = "mb-1 block text-xs font-medium text-slate-500";

function initialSets(block: BlockInfo, existing: ExistingResult, suggestedLoadKg?: number) {
  if (existing && existing.sets.length > 0) {
    return [...existing.sets]
      .sort((a, b) => a.setNumber - b.setNumber)
      .map((s) => ({ reps: s.reps?.toString() ?? "", load: s.loadKg?.toString() ?? "" }));
  }
  // Pre-fill reps when the prescription is a single number (e.g. "5", not "8-10").
  const reps = /^\d+$/.test(block.prescribedReps ?? "") ? block.prescribedReps! : "";
  const load = suggestedLoadKg ? String(suggestedLoadKg) : "";
  return Array.from({ length: Math.max(block.prescribedSets ?? 1, 1) }, () => ({ reps, load }));
}

export function ResultForm({
  block,
  existing,
  suggestedLoadKg,
}: {
  block: BlockInfo;
  existing: ExistingResult;
  suggestedLoadKg?: number;
}) {
  const [state, formAction, isPending] = useActionState(
    submitResultAction.bind(null, block.id),
    undefined
  );
  const [done, setDone] = useState(existing?.done ?? true);
  const [rx, setRx] = useState<"rx" | "scaled" | "">(
    existing?.rx == null ? "" : existing.rx ? "rx" : "scaled"
  );
  const [sets, setSets] = useState(() => initialSets(block, existing, suggestedLoadKg));
  const [time, setTime] = useState(existing?.timeSeconds != null ? formatDuration(existing.timeSeconds) : "");
  const [distance, setDistance] = useState(existing?.distanceM?.toString() ?? "");
  const [showText, setShowText] = useState(!!existing?.scoreText);

  const usesSets = block.type === "STRENGTH" || block.type === "ACCESSORY";
  const format = block.metconFormat ?? "FOR_TIME";

  const timeSeconds = parseDuration(time);
  const pace =
    block.type === "CARDIO" && timeSeconds && !Number.isNaN(timeSeconds) && Number(distance) > 0
      ? formatPace(block.cardioModality, timeSeconds, Number(distance))
      : null;

  function updateSet(index: number, field: "reps" | "load", value: string) {
    setSets((current) => current.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  return (
    <form action={formAction} className="mt-3 space-y-3 border-t border-slate-100 pt-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">O teu resultado</p>
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
          {[
            { value: true, text: "Feito" },
            { value: false, text: "Não feito" },
          ].map((option) => (
            <button
              key={option.text}
              type="button"
              onClick={() => setDone(option.value)}
              className={`rounded-md px-2.5 py-1 ${
                done === option.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              {option.text}
            </button>
          ))}
        </div>
        <input type="hidden" name="done" value={String(done)} />
      </div>

      {done && usesSets && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-[2rem_1fr_1fr] gap-2 text-xs font-medium text-slate-500">
            <span>Série</span>
            <span>Reps</span>
            <span>Carga (kg)</span>
          </div>
          {sets.map((set, i) => (
            <div key={i} className="grid grid-cols-[2rem_1fr_1fr] items-center gap-2">
              <span className="text-center text-sm text-slate-500">{i + 1}</span>
              <input
                name="setReps"
                inputMode="numeric"
                value={set.reps}
                onChange={(e) => updateSet(i, "reps", e.target.value)}
                className={input}
              />
              <input
                name="setLoad"
                inputMode="decimal"
                value={set.load}
                onChange={(e) => updateSet(i, "load", e.target.value)}
                className={input}
              />
            </div>
          ))}
          <div className="flex gap-3 text-xs">
            <button
              type="button"
              onClick={() => setSets((current) => [...current, { ...(current.at(-1) ?? { reps: "", load: "" }) }])}
              className="font-medium text-slate-600 hover:text-slate-900"
            >
              + Série
            </button>
            {sets.length > 1 && (
              <button
                type="button"
                onClick={() => setSets((current) => current.slice(0, -1))}
                className="text-slate-400 hover:text-red-600"
              >
                − Remover última
              </button>
            )}
          </div>
        </div>
      )}

      {done && block.type === "METCON" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {format === "FOR_TIME" && (
              <>
                <div>
                  <label className={label}>Tempo (mm:ss)</label>
                  <input
                    name="timeSeconds"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="ex: 7:32"
                    inputMode="numeric"
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>Reps (se não acabaste no time cap)</label>
                  <input name="reps" inputMode="numeric" defaultValue={existing?.reps ?? ""} className={input} />
                </div>
              </>
            )}
            {(format === "AMRAP" || format === "EMOM") && (
              <>
                <div>
                  <label className={label}>{format === "AMRAP" ? "Rondas" : "Rondas completas"}</label>
                  <input name="rounds" inputMode="numeric" defaultValue={existing?.rounds ?? ""} className={input} />
                </div>
                <div>
                  <label className={label}>{format === "AMRAP" ? "+ Reps" : "Reps totais (opcional)"}</label>
                  <input name="reps" inputMode="numeric" defaultValue={existing?.reps ?? ""} className={input} />
                </div>
              </>
            )}
            {format === "FOR_REPS" && (
              <div>
                <label className={label}>Reps totais</label>
                <input name="reps" inputMode="numeric" defaultValue={existing?.reps ?? ""} className={input} />
              </div>
            )}
            {format === "MAX_LOAD" && (
              <div>
                <label className={label}>Carga (kg)</label>
                <input name="loadKg" inputMode="decimal" defaultValue={existing?.loadKg ?? ""} className={input} />
              </div>
            )}
          </div>

          <div className="flex rounded-lg bg-slate-100 p-0.5 text-sm font-medium">
            {[
              { value: "rx", text: "Rx" },
              { value: "scaled", text: "Scaled" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRx(rx === option.value ? "" : (option.value as "rx" | "scaled"))}
                className={`flex-1 rounded-md py-1.5 ${
                  rx === option.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                {option.text}
              </button>
            ))}
            <input type="hidden" name="rx" value={rx} />
          </div>
        </div>
      )}

      {done && block.type === "CARDIO" && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={label}>Tempo (mm:ss)</label>
            <input
              name="timeSeconds"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              inputMode="numeric"
              className={input}
            />
          </div>
          <div>
            <label className={label}>Distância (m)</label>
            <input
              name="distanceM"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              inputMode="decimal"
              className={input}
            />
          </div>
          <div>
            <label className={label}>Calorias</label>
            <input name="calories" inputMode="numeric" defaultValue={existing?.calories ?? ""} className={input} />
          </div>
          {pace && <p className="col-span-3 text-xs text-slate-500">Pace: {pace}</p>}
        </div>
      )}

      {done && block.type !== "ACCESSORY" && (
        <div>
          <label className={label}>Esforço (RPE 1–10)</label>
          <select name="rpe" defaultValue={existing?.rpe ?? ""} className={input}>
            <option value="">—</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      )}

      {showText ? (
        <div>
          <label className={label}>Resultado em texto (opcional)</label>
          <input
            name="scoreText"
            defaultValue={existing?.scoreText ?? ""}
            placeholder="ex: 21-15-9 com banda verde"
            className={input}
          />
        </div>
      ) : (
        <button type="button" onClick={() => setShowText(true)} className="text-xs text-slate-500 underline">
          Escrever resultado em texto livre
        </button>
      )}

      <textarea
        name="studentNotes"
        rows={2}
        defaultValue={existing?.studentNotes ?? ""}
        placeholder="Notas para o treinador (como te sentiste, dores, escalas...)"
        className={input}
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
