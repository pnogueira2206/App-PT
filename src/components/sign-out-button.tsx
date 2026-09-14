"use client";

import { signOutAction } from "@/lib/actions";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className={
          className ??
          "text-sm font-medium text-slate-500 hover:text-slate-900"
        }
      >
        Sair
      </button>
    </form>
  );
}
