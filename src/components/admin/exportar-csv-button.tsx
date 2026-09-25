"use client";

import { useTransition } from "react";
import { exportarAvaliacoesCsvAction } from "@/lib/avaliacoes-actions";
import { gerarCsvAvaliacoes, transferirCsv } from "@/lib/csv-export";

export function ExportarCsvButton({ total }: { total: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={total === 0 || pending}
      onClick={() =>
        startTransition(async () => {
          const avaliacoes = await exportarAvaliacoesCsvAction();
          const csv = gerarCsvAvaliacoes(avaliacoes);
          const hoje = new Date().toISOString().slice(0, 10);
          transferirCsv(`avaliacoes-cfa-${hoje}.csv`, csv);
        })
      }
      className="w-full rounded-none bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
    >
      {pending ? "A preparar..." : `Exportar ${total} avaliações para CSV`}
    </button>
  );
}
