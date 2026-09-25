"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/login/actions";

const inputClasses =
  "w-full rounded-none border border-line bg-transparent px-3 py-2 text-sm text-neutral-100 focus:border-white focus:outline-none focus:ring-1 focus:ring-white";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <form action={formAction} className="space-y-3">
      <input name="email" type="email" required placeholder="Email" className={inputClasses} autoComplete="username" />
      <input
        name="password"
        type="password"
        required
        placeholder="Palavra-passe"
        className={inputClasses}
        autoComplete="current-password"
      />
      {state.erro && <p className="text-xs text-red-400">{state.erro}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-none bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
      >
        {pending ? "A entrar..." : "Entrar"}
      </button>
    </form>
  );
}
