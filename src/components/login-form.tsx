"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/login/actions";
import { useI18n } from "@/i18n/client";
import { AuthShell, authButton, authInput, authLabel } from "@/components/auth-shell";

export function LoginForm() {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(loginAction, {});

  return (
    <AuthShell title={t("auth.signIn")} subtitle={t("auth.loginSubtitle")}>
      <form action={formAction} className="space-y-5">
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
            className={authInput}
            placeholder={t("auth.emailPlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="password" className={authLabel}>
            {t("common.password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={authInput}
            placeholder="••••••••"
          />
        </div>

        {state?.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <button type="submit" disabled={isPending} className={authButton}>
          {isPending ? t("auth.signingIn") : t("auth.signIn")}
        </button>
      </form>
    </AuthShell>
  );
}
