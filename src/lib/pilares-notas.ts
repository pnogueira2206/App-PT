import { Seccao } from "@/data/grelha";
import { Pilar } from "@/data/pilares";
import { AtribuicoesPilares } from "@/lib/pilares-store";
import { Respostas } from "@/types/avaliacao";

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
