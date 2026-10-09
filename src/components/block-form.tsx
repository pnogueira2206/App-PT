"use client";

import { useActionState, useId, useState } from "react";
import type { BlockType, CardioModality, MetconFormat } from "@prisma/client";
import { BLOCK_TYPES, CARDIO_MODALITIES, METCON_FORMATS, formatDuration } from "@/lib/blocks";
import { useI18n } from "@/i18n/client";

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
  const { t } = useI18n();
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
        {BLOCK_TYPES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setType(option)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              type === option ? "bg-brand text-brand-ink" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t(`blocks.types.${option}`)}
          </button>
        ))}
        <input type="hidden" name="type" value={type} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>{t("blocks.form.title")}</label>
          <input
            name="title"
            required
            defaultValue={initial?.title}
            placeholder={
              type === "METCON" ? t("blocks.form.titlePlaceholderMetcon") : t("blocks.form.titlePlaceholder")
            }
            className={input}
          />
        </div>
        <div>
          <label className={label}>
            {type === "METCON" ? t("blocks.form.exerciseOptionalMetcon") : t("blocks.form.exercise")}
          </label>
          <input
            name="exerciseName"
            list={listId}
            defaultValue={initial?.exerciseName ?? ""}
            placeholder={
              type === "CARDIO" ? t("blocks.form.exercisePlaceholderCardio") : t("blocks.form.exercisePlaceholder")
            }
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
            <label className={label}>{t("blocks.form.format")}</label>
            <select
              name="metconFormat"
              value={metconFormat}
              onChange={(e) => setMetconFormat(e.target.value as MetconFormat)}
              className={input}
            >
              {METCON_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {t(`blocks.metconFormats.${f}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>
              {metconFormat === "AMRAP" || metconFormat === "EMOM"
                ? t("blocks.form.duration")
                : t("blocks.form.timeCap")}
            </label>
            <input
              name="timeCapSeconds"
              defaultValue={duration(initial?.timeCapSeconds)}
              placeholder={t("blocks.form.timeCapPlaceholder")}
              inputMode="numeric"
              className={input}
            />
          </div>
        </div>
      )}

      {usesSets && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className={label}>{t("blocks.form.sets")}</label>
            <input
              name="prescribedSets"
              type="number"
              min={0}
              defaultValue={initial?.prescribedSets ?? ""}
              className={input}
            />
          </div>
          <div>
            <label className={label}>{t("blocks.form.reps")}</label>
            <input
              name="prescribedReps"
              defaultValue={initial?.prescribedReps ?? ""}
              placeholder={t("blocks.form.repsPlaceholder")}
              className={input}
            />
          </div>
          {type === "STRENGTH" && (
            <div>
              <label className={label}>{t("blocks.form.percent1RM")}</label>
              <input
                name="percent1RM"
                inputMode="decimal"
                defaultValue={initial?.percent1RM ?? ""}
                placeholder={t("blocks.form.percentPlaceholder")}
                className={input}
              />
            </div>
          )}
          <div>
            <label className={label}>{t("blocks.form.load")}</label>
            <input
              name="prescribedWeight"
              defaultValue={initial?.prescribedWeight ?? ""}
              placeholder={t("blocks.form.loadPlaceholder")}
              className={input}
            />
          </div>
          {type === "STRENGTH" && (
            <div>
              <label className={label}>{t("blocks.form.tempo")}</label>
              <input
                name="tempo"
                defaultValue={initial?.tempo ?? ""}
                placeholder={t("blocks.form.tempoPlaceholder")}
                className={input}
              />
            </div>
          )}
          <div>
            <label className={label}>{t("blocks.form.rest")}</label>
            <input
              name="restSeconds"
              defaultValue={duration(initial?.restSeconds)}
              placeholder={t("blocks.form.restPlaceholder")}
              className={input}
            />
          </div>
        </div>
      )}

      {type === "CARDIO" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className={label}>{t("blocks.form.modality")}</label>
            <select
              name="cardioModality"
              defaultValue={initial?.cardioModality ?? "ROW"}
              className={input}
            >
              {CARDIO_MODALITIES.map((m) => (
                <option key={m} value={m}>
                  {t(`blocks.cardioModalities.${m}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>{t("blocks.form.distance")}</label>
            <input
              name="targetDistanceM"
              type="number"
              min={0}
              defaultValue={initial?.targetDistanceM ?? ""}
              placeholder={t("blocks.form.distancePlaceholder")}
              className={input}
            />
          </div>
          <div>
            <label className={label}>{t("blocks.form.time")}</label>
            <input
              name="targetTimeSeconds"
              defaultValue={duration(initial?.targetTimeSeconds)}
              placeholder={t("blocks.form.timePlaceholder")}
              className={input}
            />
          </div>
          <div>
            <label className={label}>{t("blocks.form.calories")}</label>
            <input
              name="targetCalories"
              type="number"
              min={0}
              defaultValue={initial?.targetCalories ?? ""}
              className={input}
            />
          </div>
          <div>
            <label className={label}>{t("blocks.form.targetPace")}</label>
            <input
              name="targetPace"
              defaultValue={initial?.targetPace ?? ""}
              placeholder={t("blocks.form.targetPacePlaceholder")}
              className={input}
            />
          </div>
          <div>
            <label className={label}>{t("blocks.form.rest")}</label>
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
          {type === "METCON" ? t("blocks.form.wod") : t("blocks.form.description")}
        </label>
        <textarea
          name="description"
          rows={type === "METCON" || type === "ACCESSORY" ? 4 : 2}
          defaultValue={initial?.description ?? ""}
          placeholder={
            type === "METCON"
              ? t("blocks.form.wodPlaceholder")
              : type === "ACCESSORY"
                ? t("blocks.form.accessoryPlaceholder")
                : t("blocks.form.descriptionPlaceholder")
          }
          className={`${input} font-mono`}
        />
      </div>

      <div>
        <label className={label}>{t("blocks.form.notes")}</label>
        <textarea
          name="trainerNotes"
          rows={2}
          defaultValue={initial?.trainerNotes ?? ""}
          placeholder={t("blocks.form.notesPlaceholder")}
          className={input}
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-hover disabled:opacity-60"
        >
          {isPending ? t("common.saving") : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-800">
            {t("common.cancel")}

          </button>
        )}
      </div>
    </form>
  );
}
