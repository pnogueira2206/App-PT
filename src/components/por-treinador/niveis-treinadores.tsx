"use client";

import { AvaliacaoGuardada } from "@/types/avaliacao";

const LIMIAR_BAIXO = 60;
const LIMIAR_ALTO = 85;

interface ItemLista {
  id: string;
  nome: string;
  ativo: boolean;
}

interface LinhaTreinador {
  nome: string;
  media: number;
  quantidade: number;
}

function mediaUltimasAvaliacoes(avaliacoes: AvaliacaoGuardada[], nomeTreinador: string): LinhaTreinador | null {
  const doTreinador = avaliacoes
    .filter((a) => a.cabecalho.treinador === nomeTreinador)
    .sort((a, b) => (a.cabecalho.data + a.cabecalho.hora < b.cabecalho.data + b.cabecalho.hora ? -1 : 1));
  const ultimas = doTreinador.slice(-3);
  if (ultimas.length === 0) return null;

  const soma = ultimas.reduce((acc, a) => acc + Number(a.classificacaoGeral), 0);
  return { nome: nomeTreinador, media: soma / ultimas.length, quantidade: ultimas.length };
}

const NIVEIS = [
  {
    chave: 1 as const,
    titulo: "Nível 1 — Abaixo de 60%",
    cor: "text-red-600 dark:text-red-400",
    borda: "border-red-600 dark:border-red-400",
  },
  {
    chave: 2 as const,
    titulo: "Nível 2 — Entre 60% e 85%",
    cor: "text-amber-700 dark:text-amber-400",
    borda: "border-amber-700 dark:border-amber-400",
  },
  {
    chave: 3 as const,
    titulo: "Nível 3 — Acima de 85%",
    cor: "text-green-700 dark:text-green-400",
    borda: "border-green-700 dark:border-green-400",
  },
];

function nivelDaMedia(media: number): 1 | 2 | 3 {
  if (media < LIMIAR_BAIXO) return 1;
  if (media <= LIMIAR_ALTO) return 2;
  return 3;
}

export function NiveisTreinadores({
  treinadores,
  avaliacoes,
  onSelecionar,
}: {
  treinadores: ItemLista[];
  avaliacoes: AvaliacaoGuardada[];
  onSelecionar: (nome: string) => void;
}) {
  const linhas = treinadores
    .filter((t) => t.ativo)
    .map((t) => mediaUltimasAvaliacoes(avaliacoes, t.nome));

  const semAvaliacoes = treinadores.filter((t) => t.ativo && !linhas.find((l) => l?.nome === t.nome));
  const comAvaliacoes = linhas.filter((l): l is LinhaTreinador => l !== null);

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted">
        Agrupa os treinadores pela média das últimas (até) 3 avaliações. Só treinadores ativos.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {NIVEIS.map((nivel) => {
          const doNivel = comAvaliacoes
            .filter((l) => nivelDaMedia(l.media) === nivel.chave)
            .sort((a, b) => a.media - b.media);
          return (
            <section key={nivel.chave} className={`rounded-none border-t-2 border border-line p-3 ${nivel.borda}`}>
              <h2 className={`mb-2 text-sm font-semibold ${nivel.cor}`}>{nivel.titulo}</h2>
              {doNivel.length === 0 ? (
                <p className="text-xs text-dim">Ninguém neste nível.</p>
              ) : (
                <ul className="space-y-1.5">
                  {doNivel.map((l) => (
                    <li key={l.nome}>
                      <button
                        type="button"
                        onClick={() => onSelecionar(l.nome)}
                        className="flex w-full items-center justify-between gap-2 rounded-none border border-line px-2 py-1.5 text-left text-xs transition hover:border-black dark:hover:border-white"
                      >
                        <span className="text-neutral-900 dark:text-neutral-100">{l.nome}</span>
                        <span className={`shrink-0 font-semibold ${nivel.cor}`}>
                          {Math.round(l.media)}%{l.quantidade < 3 ? ` (${l.quantidade})` : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {semAvaliacoes.length > 0 && (
        <section className="rounded-none border border-dashed border-line p-3">
          <h2 className="mb-2 text-sm font-semibold text-muted">Sem avaliações</h2>
          <ul className="flex flex-wrap gap-2">
            {semAvaliacoes.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onSelecionar(t.nome)}
                  className="rounded-none border border-line px-2 py-1 text-xs text-muted underline"
                >
                  {t.nome}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
