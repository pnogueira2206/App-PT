"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Papel } from "@prisma/client";
import { confirmarComoTreinadorAction } from "@/lib/avaliacoes-actions";
import { AvaliacaoGuardada } from "@/types/avaliacao";
import { ResumoAvaliacao } from "@/components/nova-avaliacao/resumo-avaliacao";

export function AvaliacaoDetalhe({ avaliacao, papel }: { avaliacao: AvaliacaoGuardada | null; papel: Papel }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (avaliacao === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center md:max-w-2xl">
        <p className="text-sm font-medium text-neutral-700">Avaliação não encontrada</p>
        <Link href="/historico" className="mt-3 inline-block text-sm font-medium underline">
          Voltar ao histórico
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-4 md:max-w-2xl lg:max-w-3xl md:px-6 md:py-6">
      <Link href="/historico" className="mb-4 inline-block text-sm font-medium text-neutral-500 underline">
        ← Voltar ao histórico
      </Link>
      <div className="rounded-md bg-neutral-100 px-3 py-2 text-xs text-neutral-500">Consulta apenas de leitura</div>

      {papel === "TREINADOR" && (
        <div className="mt-3 rounded-md border border-neutral-200 p-3">
          {avaliacao.confirmacaoTreinador.data ? (
            <p className="text-sm text-green-700">Confirmaste esta avaliação em {avaliacao.confirmacaoTreinador.data}.</p>
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
              className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Confirmar esta avaliação
            </button>
          )}
        </div>
      )}

      <div className="mt-4">
        <ResumoAvaliacao draft={avaliacao} seccoes={avaliacao.grelhaSnapshot} />
      </div>
    </div>
  );
}
