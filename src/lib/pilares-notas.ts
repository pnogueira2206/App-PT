import { Seccao } from "@/data/grelha";
import { Pilar, PILARES } from "@/data/pilares";
import type { AtribuicoesPilares } from "@/lib/pilares-actions";
import { Respostas, subtotalSeccao } from "@/types/avaliacao";

export function subtotalPorPilar(
  seccoes: Seccao[],
  respostas: Respostas,
  pilar: Pilar,
  atribuicoes: AtribuicoesPilares
): { obtidos: number; max: number } {
  let obtidos = 0;
  let max = 0;
  for (const seccao of seccoes) {
    for (const c of seccao.criterios) {
      if (c.tipoResposta !== "PONTOS" || c.pesoMaximo == null) continue;
      if (!atribuicoes[c.id]?.includes(pilar)) continue;
      const r = respostas[c.id];
      if (!r || r.tipo !== "PONTOS" || r.na) continue;
      max += c.pesoMaximo;
      obtidos += r.valor ?? 0;
    }
  }
  return { obtidos, max };
}

export function percentagemPorPilar(
  seccoes: Seccao[],
  respostas: Respostas,
  pilar: Pilar,
  atribuicoes: AtribuicoesPilares
): number {
  const { obtidos, max } = subtotalPorPilar(seccoes, respostas, pilar, atribuicoes);
  return max > 0 ? (obtidos / max) * 100 : 0;
}

export interface PontoFraco {
  origem: string;
  percentagem: number;
}

/**
 * Sugere os pontos mais fracos desta avaliação, por pilar (se já houver critérios
 * categorizados) ou, em alternativa, por secção — para arrancar o plano de ação.
 */
export function sugerirPontosFracos(
  seccoes: Seccao[],
  respostas: Respostas,
  atribuicoes: AtribuicoesPilares,
  quantos = 2
): PontoFraco[] {
  const porPilar = PILARES.map((pilar) => ({
    origem: pilar as string,
    ...subtotalPorPilar(seccoes, respostas, pilar, atribuicoes),
  })).filter((p) => p.max > 0);

  const base =
    porPilar.length > 0
      ? porPilar
      : seccoes.map((s) => ({ origem: s.nome, ...subtotalSeccao(s, respostas) })).filter((s) => s.max > 0);

  return base
    .map((p) => ({ origem: p.origem, percentagem: (p.obtidos / p.max) * 100 }))
    .sort((a, b) => a.percentagem - b.percentagem)
    .slice(0, quantos);
}

/** Se há pelo menos um pilar com critérios categorizados (e por isso com nota calculável). */
export function temPilaresCategorizados(seccoes: Seccao[], respostas: Respostas, atribuicoes: AtribuicoesPilares): boolean {
  return PILARES.some((p) => subtotalPorPilar(seccoes, respostas, p, atribuicoes).max > 0);
}

/** Todas as origens possíveis para o plano de ação (pilares se houver dados, senão secções). */
export function origensDisponiveis(seccoes: Seccao[], respostas: Respostas, atribuicoes: AtribuicoesPilares): string[] {
  if (temPilaresCategorizados(seccoes, respostas, atribuicoes)) return [...PILARES];
  return seccoes.map((s) => s.nome);
}
