"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Papel } from "@prisma/client";
import { confirmarComoTreinadorAction } from "@/lib/avaliacoes-actions";
import { AvaliacaoGuardada } from "@/types/avaliacao";
import { ResumoAvaliacao } from "@/components/nova-avaliacao/resumo-avaliacao";
import { RelatorioAvaliacaoButtons } from "@/components/historico/relatorio-avaliacao-buttons";

export function AvaliacaoDetalhe({ avaliacao, papel }: { avaliacao: AvaliacaoGuardada | null; papel: Papel }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (avaliacao === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center md:max-w-2xl">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Avaliação não encontrada</p>
        <Link href="/historico" className="mt-3 inline-block text-sm font-medium underline">
          Voltar ao histórico
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-4 md:max-w-2xl lg:max-w-3xl md:px-6 md:py-6">
      <Link href="/historico" className="mb-4 inline-block text-sm font-medium text-muted underline">
        ← Voltar ao histórico
      </Link>
      <div className="rounded-none bg-panel px-3 py-2 text-xs text-muted">Consulta apenas de leitura</div>

      {papel === "TREINADOR" && (
        <div className="mt-3 rounded-none border border-line p-3">
          {avaliacao.confirmacaoTreinador.data ? (
            <p className="text-sm text-green-700 dark:text-green-400">Confirmaste esta avaliação em {avaliacao.confirmacaoTreinador.data}.</p>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await confirmarComoTreinadorAction(avaliacao.id);
                  router.refresh();
                })
              }
              className="w-full rounded-none bg-black dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-black"
            >
              Confirmar esta avaliação
            </button>
          )}
        </div>
      )}

      {papel !== "TREINADOR" && (
        <div className="mt-3">
          <RelatorioAvaliacaoButtons
            avaliacaoId={avaliacao.id}
            nomeTreinador={avaliacao.cabecalho.treinador}
            relatorioEnviadoEm={avaliacao.relatorioEnviadoEm}
          />
        </div>
      )}

      <div className="mt-4">
        <ResumoAvaliacao draft={avaliacao} seccoes={avaliacao.grelhaSnapshot} />
      </div>
    </div>
  );
}
