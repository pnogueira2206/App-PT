"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { obterAvaliacao } from "@/lib/avaliacoes-store";
import { ResumoAvaliacao } from "@/components/nova-avaliacao/resumo-avaliacao";

const semSubscricao = () => () => {};

export function AvaliacaoDetalhe({ id }: { id: string }) {
  const avaliacao = useSyncExternalStore(
    semSubscricao,
    () => obterAvaliacao(id),
    () => undefined
  );

  if (avaliacao === undefined) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <p className="text-sm font-medium text-neutral-700">Avaliação não encontrada</p>
        <Link href="/historico" className="mt-3 inline-block text-sm font-medium underline">
          Voltar ao histórico
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <Link href="/historico" className="mb-4 inline-block text-sm font-medium text-neutral-500 underline">
        ← Voltar ao histórico
      </Link>
      <div className="rounded-md bg-neutral-100 px-3 py-2 text-xs text-neutral-500">Consulta apenas de leitura</div>
      <div className="mt-4">
        <ResumoAvaliacao draft={avaliacao} seccoes={avaliacao.grelhaSnapshot} />
      </div>
    </div>
  );
}
