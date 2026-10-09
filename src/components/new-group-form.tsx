"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createGroupAction } from "@/app/trainer/actions";
import { useI18n } from "@/i18n/client";

export function NewGroupForm() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createGroupAction,
    undefined
  );
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
        {t("groups.newGroup")}
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <input
        name="name"
        placeholder={t("groups.namePlaceholder")}
        required
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-hover disabled:opacity-60"
      >
        {t("common.create")}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-sm text-slate-400 hover:text-slate-700"
      >
        {t("common.cancel")}

      </button>
      {state?.error && <span className="w-full text-sm text-red-600">{state.error}</span>}
    </form>
  );
}
