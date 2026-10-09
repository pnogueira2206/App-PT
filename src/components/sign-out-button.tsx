"use client";

import { signOutAction } from "@/lib/actions";
import { useI18n } from "@/i18n/client";

export function SignOutButton({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className={
          className ??
          "text-sm font-medium text-slate-500 hover:text-slate-900"
        }
      >
        {t("nav.signOut")}

      </button>
    </form>
  );
}
