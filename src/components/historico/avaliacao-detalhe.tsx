"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Papel } from "@prisma/client";
import { apagarAvaliacaoAction, confirmarComoTreinadorAction } from "@/lib/avaliacoes-actions";
import { AvaliacaoGuardada } from "@/types/avaliacao";
import { ResumoAvaliacao } from "@/components/nova-avaliacao/resumo-avaliacao";
import { RelatorioAvaliacaoButtons } from "@/components/historico/relatorio-avaliacao-buttons";

export function AvaliacaoDetalhe({ avaliacao, papel }: { avaliacao: AvaliacaoGuardada | null; papel: Papel }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [aConfirmarApagar, setAConfirmarApagar] = useState(false);
  const [erroApagar, setErroApagar] = useState("");

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

      {avaliacao.editadoPor && (
        <p className="mt-2 text-xs text-dim">
          Editado por {avaliacao.editadoPor} em {avaliacao.editadoEm ? new Date(avaliacao.editadoEm).toLocaleDateString("pt-PT") : ""}.
        </p>
      )}

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

      {papel === "ADMIN" && (
        <div className="mt-4 rounded-none border border-line p-3">
          <Link
            href={`/historico/${avaliacao.id}/editar`}
            className="mb-3 block text-xs font-medium text-muted underline"
          >
            Editar esta avaliação
          </Link>
          {aConfirmarApagar ? (
            <div className="space-y-2">
              <p className="text-xs text-neutral-700 dark:text-neutral-300">
                Tens a certeza? Esta avaliação é apagada em definitivo e não pode ser recuperada.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const resultado = await apagarAvaliacaoAction(avaliacao.id);
                      if (resultado.erro) {
                        setErroApagar(resultado.erro);
                        return;
                      }
                      router.push("/historico");
                    })
                  }
                  className="text-xs font-medium text-red-600 dark:text-red-400 underline"
                >
                  Confirmar, apagar definitivamente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAConfirmarApagar(false);
                    setErroApagar("");
                  }}
                  className="text-xs text-muted underline"
                >
                  Cancelar
                </button>
              </div>
              {erroApagar && <p className="text-xs text-red-600 dark:text-red-400">{erroApagar}</p>}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAConfirmarApagar(true)}
              className="text-xs font-medium text-red-600 dark:text-red-400 underline"
            >
              Apagar esta avaliação
            </button>
          )}
        </div>
      )}
    </div>
  );
}
