"use client";

import { useActionState } from "react";
import { createFirstTrainerAction } from "@/app/setup/actions";

const input =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export function SetupForm() {
  const [state, formAction, isPending] = useActionState(createFirstTrainerAction, undefined);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bem-vindo à App PT</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cria a tua conta de treinador. Este ecrã só está disponível enquanto não existir
            nenhum treinador.
          </p>
        </div>

        <form
          action={formAction}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Nome
            </label>
            <input id="name" name="name" required autoComplete="name" defaultValue={state?.name} className={input} />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={state?.email}
              className={input}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Palavra-passe (mínimo 8 caracteres)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={input}
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-slate-700">
              Confirmar palavra-passe
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={input}
            />
          </div>

          {state?.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-base font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {isPending ? "A criar..." : "Criar conta e entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
