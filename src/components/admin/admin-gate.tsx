"use client";

import { useState, useSyncExternalStore } from "react";
import { autenticar, estaAutenticado, subscreverAdminAuth, terminarSessaoAdmin } from "@/lib/admin-auth-store";

const inputClasses =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const autenticado = useSyncExternalStore(subscreverAdminAuth, estaAutenticado, () => false);
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState(false);

  if (!autenticado) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="mb-1 text-lg font-semibold text-neutral-900">Área reservada</h1>
        <p className="mb-4 text-sm text-neutral-600">
          Esta área é só para administradores. Introduz o código de acesso.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (autenticar(codigo)) {
              setErro(false);
            } else {
              setErro(true);
            }
          }}
          className="space-y-3"
        >
          <input
            type="password"
            className={inputClasses}
            value={codigo}
            onChange={(e) => {
              setCodigo(e.target.value);
              setErro(false);
            }}
            placeholder="Código de acesso"
            autoFocus
          />
          {erro && <p className="text-xs text-red-600">Código incorreto.</p>}
          <button type="submit" className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-1.5">
        <span className="text-xs text-neutral-500">Sessão de administrador ativa</span>
        <button type="button" onClick={terminarSessaoAdmin} className="text-xs font-medium text-neutral-500 underline">
          Sair
        </button>
      </div>
      {children}
    </div>
  );
}
