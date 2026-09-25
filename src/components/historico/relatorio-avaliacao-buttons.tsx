"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { gerarRelatorioPdfAction, enviarRelatorioEmailAction } from "@/lib/relatorio-actions";

function base64ParaBlob(base64: string): Blob {
  const bytes = atob(base64);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) array[i] = bytes.charCodeAt(i);
  return new Blob([array], { type: "application/pdf" });
}

export function RelatorioAvaliacaoButtons({
  avaliacaoId,
  nomeTreinador,
  relatorioEnviadoEm,
}: {
  avaliacaoId: string;
  nomeTreinador: string;
  relatorioEnviadoEm: string | null;
}) {
  const router = useRouter();
  const [pendingPdf, startPdf] = useTransition();
  const [pendingEnvio, startEnvio] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const descarregar = () => {
    setErro(null);
    startPdf(async () => {
      try {
        const base64 = await gerarRelatorioPdfAction(avaliacaoId);
        const url = URL.createObjectURL(base64ParaBlob(base64));
        const a = document.createElement("a");
        a.href = url;
        a.download = `relatorio-${nomeTreinador}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Falha ao gerar o relatório.");
      }
    });
  };

  const enviar = () => {
    setErro(null);
    startEnvio(async () => {
      try {
        await enviarRelatorioEmailAction(avaliacaoId);
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Falha ao enviar o relatório.");
      }
    });
  };

  return (
    <div className="rounded-none border border-line p-3">
      <p className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Relatório</p>
      {relatorioEnviadoEm && (
        <p className="mb-2 text-xs text-green-700 dark:text-green-400">
          Enviado ao treinador em {new Date(relatorioEnviadoEm).toLocaleDateString("pt-PT")}.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pendingPdf}
          onClick={descarregar}
          className="rounded-none border border-line px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 disabled:opacity-40"
        >
          {pendingPdf ? "A gerar..." : "Descarregar PDF"}
        </button>
        <button
          type="button"
          disabled={pendingEnvio}
          onClick={enviar}
          className="rounded-none bg-black dark:bg-white px-3 py-2 text-xs font-medium text-white dark:text-black disabled:opacity-40"
        >
          {pendingEnvio ? "A enviar..." : relatorioEnviadoEm ? "Reenviar por email" : "Enviar por email ao treinador"}
        </button>
      </div>
      {erro && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{erro}</p>}
    </div>
  );
}
