"use client";

import { useState } from "react";
import { updateBlockAction } from "@/app/trainer/workouts/actions";
import { BlockForm, type BlockFormValues } from "@/components/block-form";
import { useI18n } from "@/i18n/client";

/** Shows a block's read-only view, swapping to the edit form on demand. */
export function BlockEditor({
  workoutId,
  blockId,
  initial,
  exerciseNames,
  children,
}: {
  workoutId: string;
  blockId: string;
  initial: BlockFormValues;
  exerciseNames: string[];
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <BlockForm
        action={updateBlockAction.bind(null, workoutId, blockId)}
        exerciseNames={exerciseNames}
        initial={initial}
        submitLabel={t("blocks.saveBlock")}
        onCancel={() => setEditing(false)}
        onSuccess={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="relative">
      {children}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="absolute right-4 top-4 text-xs font-medium text-slate-500 hover:text-slate-900"
      >
        {t("common.edit")}

      </button>
    </div>
  );
}
