"use client";

import { useMemo, useState } from "react";
import { PILARES } from "@/data/pilares";
import { percentagemPorPilar } from "@/lib/pilares-notas";
import type { AtribuicoesPilares } from "@/lib/pilares-actions";
import { AvaliacaoGuardada } from "@/types/avaliacao";
import { EvolucaoChart } from "./evolucao-chart";
import { PilaresRadarChart } from "./pilares-radar-chart";

const inputClasses =
  "w-full rounded-none border border-line bg-transparent px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-black dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white";

interface ItemLista {
  id: string;
  nome: string;
  ativo: boolean;
}

export function PorTreinadorView({
  avaliacoes,
  treinadores,
  atribuicoes,
  nomeTreinadorFixo,
}: {
  avaliacoes: AvaliacaoGuardada[];
  treinadores: ItemLista[];
  atribuicoes: AtribuicoesPilares;
  nomeTreinadorFixo?: string;
}) {
  const [treinador, setTreinador] = useState<string>(nomeTreinadorFixo ?? treinadores[0]?.nome ?? "");

  const doTreinador = useMemo(
    () =>
      avaliacoes
        .filter((a) => a.cabecalho.treinador === treinador)
        .sort((a, b) => (a.cabecalho.data + a.cabecalho.hora < b.cabecalho.data + b.cabecalho.hora ? -1 : 1)),
    [avaliacoes, treinador]
  );

  const ultima = doTreinador[doTreinador.length - 1];
  const anterior = doTreinador.length >= 2 ? doTreinador[doTreinador.length - 2] : null;

  const notasUltima = ultima
    ? PILARES.map((p) => percentagemPorPilar(ultima.grelhaSnapshot, ultima.respostas, p, atribuicoes))
    : [];
  const notasAnterior = anterior
    ? PILARES.map((p) => percentagemPorPilar(anterior.grelhaSnapshot, anterior.respostas, p, atribuicoes))
    : null;

  const semCriteriosCategorizados = Object.keys(atribuicoes).length === 0;

  return (
    <div className="mx-auto max-w-lg px-4 py-4 md:max-w-2xl lg:max-w-4xl md:px-6 md:py-6">
      <h1 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Por Treinador</h1>

      {nomeTreinadorFixo ? (
        <p className="mb-5 text-sm font-medium text-neutral-900 dark:text-neutral-100">{nomeTreinadorFixo}</p>
      ) : (
        <label className="mb-5 block md:max-w-xs">
          <span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Treinador</span>
          <select className={inputClasses} value={treinador} onChange={(e) => setTreinador(e.target.value)}>
            {treinadores.map((t) => (
              <option key={t.id} value={t.nome}>
                {t.nome}
                {!t.ativo ? " (inativo)" : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      {doTreinador.length === 0 ? (
        <div className="rounded-none border border-dashed border-line px-4 py-10 text-center">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Sem avaliações</p>
          <p className="mt-1 text-xs text-muted">Ainda não há avaliações guardadas para {treinador}.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-none border border-line p-3">
              <h2 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Evolução da classificação geral</h2>
              <EvolucaoChart
                pontos={doTreinador.map((a) => ({ data: a.cabecalho.data, classificacao: Number(a.classificacaoGeral) }))}
              />
            </section>

            <section className="rounded-none border border-line p-3">
              <h2 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Notas por pilar</h2>
              {semCriteriosCategorizados ? (
                <p className="py-6 text-center text-xs text-muted">
                  Ainda não há critérios categorizados por pilar.
                  {nomeTreinadorFixo ? "" : " Vai a Admin > Critérios & Pilares para os atribuir."}
                </p>
              ) : (
                <>
                  <PilaresRadarChart ultima={notasUltima} anterior={notasAnterior} />
                  {!anterior && (
                    <p className="mt-2 text-center text-xs text-muted">
                      Ainda só há uma avaliação — sem avaliação anterior para comparar.
                    </p>
                  )}
                </>
              )}
            </section>
          </div>

          <section className="rounded-none border border-line p-3">
            <h2 className="mb-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Comentários da última avaliação</h2>
            <p className="mb-2 text-xs text-muted">
              {ultima.cabecalho.data} · {ultima.cabecalho.avaliador} · {ultima.classificacaoGeral}/100
            </p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              {ultima.comentarioGeral.trim() || <span className="italic text-dim">Sem comentários gerais.</span>}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
