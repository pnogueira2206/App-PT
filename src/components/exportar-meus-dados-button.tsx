"use client";

import { useState, useTransition } from "react";
import { obterMeusDadosAction } from "@/lib/meus-dados-actions";

export function ExportarMeusDadosButton() {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState("");

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setErro("");
            try {
              const dados = await obterMeusDadosAction();
              const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `os-meus-dados-cfa-${new Date().toISOString().slice(0, 10)}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            } catch (e) {
              setErro(e instanceof Error ? e.message : "Não foi possível preparar os dados.");
            }
          })
        }
        className="w-full rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 disabled:opacity-40"
      >
        {pending ? "A preparar..." : "Descarregar os meus dados (JSON)"}
      </button>
      {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}
    </div>
  );
}
