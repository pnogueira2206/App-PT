"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ExerciseCategory } from "@prisma/client";
import { EXERCISE_CATEGORIES } from "@/lib/blocks";
import { useI18n } from "@/i18n/client";
import {
  createExerciseAction,
  deleteExerciseAction,
  updateExerciseAction,
} from "@/app/trainer/exercises/actions";

type Exercise = {
  id: string;
  name: string;
  category: ExerciseCategory;
  videoUrl: string | null;
  notes: string | null;
};

const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

function Fields({ exercise }: { exercise?: Exercise }) {
  const { t } = useI18n();
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
        <input
          name="name"
          required
          defaultValue={exercise?.name}
          placeholder={t("exercises.namePlaceholder")}
          className={input}
        />
        <select name="category" defaultValue={exercise?.category ?? "STRENGTH"} className={input}>
          {EXERCISE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`exercises.categories.${c}`)}
            </option>
          ))}
        </select>
      </div>
      <input
        name="videoUrl"
        type="url"
        defaultValue={exercise?.videoUrl ?? ""}
        placeholder={t("exercises.videoPlaceholder")}
        className={input}
      />
      <textarea
        name="notes"
        rows={2}
        defaultValue={exercise?.notes ?? ""}
        placeholder={t("exercises.notesPlaceholder")}
        className={input}
      />
    </>
  );
}

export function NewExerciseForm() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createExerciseAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-hover"
      >
        {t("exercises.newExercise")}
      </button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="w-full space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <Fields />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">{state.success}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-hover disabled:opacity-60"
        >
          {isPending ? t("common.saving") : t("exercises.createExercise")}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-500">
          {t("common.close")}
        </button>
      </div>
    </form>
  );
}

export function ExerciseItem({ exercise }: { exercise: Exercise }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (prev: Awaited<ReturnType<typeof updateExerciseAction>>, formData: FormData) => {
      const result = await updateExerciseAction(exercise.id, prev, formData);
      if (result?.success) setEditing(false);
      return result;
    },
    undefined
  );
  const [deleteState, deleteAction] = useActionState(
    deleteExerciseAction.bind(null, exercise.id),
    undefined
  );

  if (editing) {
    return (
      <li className="space-y-3 px-4 py-3">
        <form action={formAction} className="space-y-3">
          <Fields exercise={exercise} />
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-hover disabled:opacity-60"
            >
              {isPending ? t("common.saving") : t("common.save")}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-sm text-slate-500">
              {t("common.cancel")}
            </button>
          </div>
        </form>
        <form action={deleteAction}>
          <button className="text-xs text-red-500 hover:text-red-700">{t("exercises.deleteExercise")}</button>
          {deleteState?.error && <p className="mt-1 text-sm text-red-600">{deleteState.error}</p>}
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
      <div>
        <p className="font-medium text-slate-900">{exercise.name}</p>
        {exercise.notes && <p className="text-xs text-slate-500">{exercise.notes}</p>}
      </div>
      <div className="flex items-center gap-3">
        {exercise.videoUrl ? (
          <a
            href={exercise.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-red-600 hover:text-red-800"
          >
            {t("exercises.video")}
          </a>
        ) : (
          <span className="text-xs text-slate-300">{t("exercises.noVideo")}</span>
        )}
        <button onClick={() => setEditing(true)} className="text-xs font-medium text-slate-500 hover:text-slate-900">
          {t("common.edit")}
        </button>

      </div>
    </li>
  );
}
