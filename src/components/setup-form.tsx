"use client";

import { useActionState } from "react";
import { createFirstTrainerAction } from "@/app/setup/actions";
import { useI18n } from "@/i18n/client";
import { AuthShell, authButton, authInput, authLabel } from "@/components/auth-shell";

export function SetupForm() {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(createFirstTrainerAction, undefined);

  return (
    <AuthShell title={t("auth.setupTitle")} subtitle={t("auth.setupSubtitle")}>
      <form action={formAction} className="space-y-5">
        <div>
          <label htmlFor="name" className={authLabel}>
            {t("common.name")}
          </label>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            defaultValue={state?.name}
            className={authInput}
          />
        </div>
        <div>
          <label htmlFor="email" className={authLabel}>
            {t("common.email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={state?.email}
            className={authInput}
          />
        </div>
        <div>
          <label htmlFor="password" className={authLabel}>
            {t("auth.passwordMin8")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={authInput}
          />
        </div>
        <div>
          <label htmlFor="confirm" className={authLabel}>
            {t("auth.confirmPassword")}
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={authInput}
          />
        </div>

        {state?.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <button type="submit" disabled={isPending} className={authButton}>
          {isPending ? t("common.creating") : t("auth.createAndEnter")}
        </button>
      </form>
    </AuthShell>
  );
}
