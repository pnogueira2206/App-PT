"use client";

import { useSyncExternalStore } from "react";
import { AVALIACOES_VAZIAS, listarAvaliacoes } from "@/lib/avaliacoes-store";
import { gerarCsvAvaliacoes, transferirCsv } from "@/lib/csv-export";

const semSubscricao = () => () => {};

export function ExportarCsvButton() {
  const avaliacoes = useSyncExternalStore(semSubscricao, listarAvaliacoes, () => AVALIACOES_VAZIAS);

  return (
    <button
      type="button"
      disabled={avaliacoes.length === 0}
      onClick={() => {
        const csv = gerarCsvAvaliacoes(avaliacoes);
        const hoje = new Date().toISOString().slice(0, 10);
        transferirCsv(`avaliacoes-cfa-${hoje}.csv`, csv);
      }}
      className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
    >
      Exportar {avaliacoes.length} avaliações para CSV
    </button>
  );
}
