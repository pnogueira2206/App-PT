"use client";

import { useState } from "react";
import { addBlockAction } from "@/app/trainer/workouts/actions";
import { BlockForm } from "@/components/block-form";
import { useI18n } from "@/i18n/client";

export function AddBlockForm({
  workoutId,
  exerciseNames,
}: {
  workoutId: string;
  exerciseNames: string[];
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-slate-300 bg-white py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        {t("blocks.addBlock")}
      </button>
    );
  }

  return (
    <BlockForm
      action={addBlockAction.bind(null, workoutId)}
      exerciseNames={exerciseNames}
      submitLabel={t("blocks.addBlockSubmit")}

      onCancel={() => setOpen(false)}
      onSuccess={() => setOpen(false)}
    />
  );
}
