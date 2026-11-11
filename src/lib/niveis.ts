import { AvaliacaoGuardada } from "@/types/avaliacao";

// Níveis dos treinadores, pela média das últimas (até) 3 avaliações.
// Nível 1: abaixo de 70% · Nível 2: 70% a 89% · Nível 3: 90% ou mais.
export const LIMIAR_NIVEL_2 = 70;
export const LIMIAR_NIVEL_3 = 90;

export type Nivel = 1 | 2 | 3;

/** Intervalo máximo, em dias, entre avaliações de um treinador de cada nível. */
export const INTERVALO_DIAS: Record<Nivel, number> = { 1: 30, 2: 90, 3: 180 };
export const TITULO_NIVEL: Record<Nivel, string> = {
  1: `Nível 1 — Abaixo de ${LIMIAR_NIVEL_2}%`,
  2: `Nível 2 — Entre ${LIMIAR_NIVEL_2}% e ${LIMIAR_NIVEL_3 - 1}%`,
  3: `Nível 3 — ${LIMIAR_NIVEL_3}% ou mais`,
};
export const ROTULO_INTERVALO: Record<Nivel, string> = { 1: "1 vez por mês", 2: "1 vez a cada 3 meses", 3: "1 vez a cada 6 meses" };

export function nivelDaMedia(media: number): Nivel {
  if (media < LIMIAR_NIVEL_2) return 1;
  if (media < LIMIAR_NIVEL_3) return 2;
  return 3;
}

/** Avaliações do treinador, da mais antiga para a mais recente. */
export function avaliacoesDoTreinador(avaliacoes: AvaliacaoGuardada[], nomeTreinador: string) {
  return avaliacoes
    .filter((a) => a.cabecalho.treinador === nomeTreinador)
    .sort((a, b) => (a.cabecalho.data + a.cabecalho.hora < b.cabecalho.data + b.cabecalho.hora ? -1 : 1));
}

export function mediaUltimasAvaliacoes(avaliacoes: AvaliacaoGuardada[], nomeTreinador: string) {
  const ultimas = avaliacoesDoTreinador(avaliacoes, nomeTreinador).slice(-3);
  if (ultimas.length === 0) return null;
  const soma = ultimas.reduce((acc, a) => acc + Number(a.classificacaoGeral), 0);
  return { nome: nomeTreinador, media: soma / ultimas.length, quantidade: ultimas.length };
}
