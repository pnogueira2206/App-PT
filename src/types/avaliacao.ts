import { Criterio, Seccao } from "@/data/grelha";

export interface Cabecalho {
  treinador: string;
  avaliador: string;
  espaco: string;
  data: string;
  hora: string;
  tipoAula: string;
  nAlunos: string;
}

export type RespostaPontos = { tipo: "PONTOS"; valor: number | null; na: boolean };
export type RespostaTexto = { tipo: "TEXTO_LIVRE"; texto: string };
export type Resposta = RespostaPontos | RespostaTexto;

export type Respostas = Record<string, Resposta>;
export type ObservacoesSeccao = Record<string, string>;

export interface Confirmacao {
  nome: string;
  data: string;
}

export interface AvaliacaoDraft {
  cabecalho: Cabecalho;
  respostas: Respostas;
  observacoes: ObservacoesSeccao;
  classificacaoGeral: string;
  comentarioGeral: string;
  confirmacaoAvaliador: Confirmacao;
  confirmacaoTreinador: Confirmacao;
}

export interface AvaliacaoGuardada extends AvaliacaoDraft {
  id: string;
  guardadaEm: string;
  /** Cópia da grelha (secções/critérios ativos) tal como estava no momento em que a avaliação foi preenchida. */
  grelhaSnapshot: Seccao[];
}

export function cabecalhoVazio(): Cabecalho {
  return { treinador: "", avaliador: "", espaco: "", data: "", hora: "", tipoAula: "", nAlunos: "" };
}

/**
 * Começa sempre vazio — uma entrada em falta para um critério significa
 * "ainda não respondido", tanto para critérios de pontos como de texto livre.
 */
export function draftVazio(): AvaliacaoDraft {
  return {
    cabecalho: cabecalhoVazio(),
    respostas: {},
    observacoes: {},
    classificacaoGeral: "",
    comentarioGeral: "",
    confirmacaoAvaliador: { nome: "", data: "" },
    confirmacaoTreinador: { nome: "", data: "" },
  };
}

export function dimensoesDaSeccao(seccao: Seccao): string[] {
  const vistas = new Set<string>();
  const ordem: string[] = [];
  for (const c of seccao.criterios) {
    if (c.dimensao && !vistas.has(c.dimensao)) {
      vistas.add(c.dimensao);
      ordem.push(c.dimensao);
    }
  }
  return ordem;
}

export interface GrupoCriterios {
  dimensao?: string;
  criterios: Criterio[];
}

/** Agrupa critérios consecutivos com a mesma dimensão, preservando a ordem/formatação da ficha original. */
export function agruparPorDimensao(criterios: Criterio[]): GrupoCriterios[] {
  const grupos: GrupoCriterios[] = [];
  for (const c of criterios) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.dimensao === c.dimensao) {
      ultimo.criterios.push(c);
    } else {
      grupos.push({ dimensao: c.dimensao, criterios: [c] });
    }
  }
  return grupos;
}

export function subtotal(criterios: Criterio[], respostas: Respostas): { obtidos: number; max: number } {
  let obtidos = 0;
  let max = 0;
  for (const c of criterios) {
    if (c.tipoResposta !== "PONTOS" || c.pesoMaximo == null) continue;
    const r = respostas[c.id];
    // Critério ainda não respondido conta para o máximo (só N/A explícito exclui).
    if (r?.tipo === "PONTOS" && r.na) continue;
    max += c.pesoMaximo;
    obtidos += r?.tipo === "PONTOS" ? (r.valor ?? 0) : 0;
  }
  return { obtidos, max };
}

export function subtotalSeccao(seccao: Seccao, respostas: Respostas) {
  return subtotal(seccao.criterios, respostas);
}

export function subtotalDimensao(seccao: Seccao, dimensao: string, respostas: Respostas) {
  return subtotal(
    seccao.criterios.filter((c) => c.dimensao === dimensao),
    respostas
  );
}

export function criterioRespondido(c: Criterio, respostas: Respostas): boolean {
  const r = respostas[c.id];
  if (!r) return false;
  if (r.tipo === "TEXTO_LIVRE") return r.texto.trim().length > 0;
  if (c.pesoMaximo == null) return r.na || r.valor != null;
  return r.na || r.valor != null;
}

export function cabecalhoCompleto(c: Cabecalho): boolean {
  return (
    c.treinador !== "" &&
    c.espaco !== "" &&
    c.data !== "" &&
    c.hora !== "" &&
    c.tipoAula !== "" &&
    c.nAlunos !== "" &&
    Number(c.nAlunos) >= 0
  );
}

export function seccaoCompleta(seccao: Seccao, respostas: Respostas): boolean {
  return seccao.criterios.every((c) => criterioRespondido(c, respostas));
}

export function classificacaoValida(valor: string): boolean {
  if (valor === "") return false;
  const n = Number(valor);
  return Number.isInteger(n) && n >= 1 && n <= 100;
}

export function confirmacaoAvaliadorCompleta(c: Confirmacao): boolean {
  return c.nome.trim() !== "" && c.data !== "";
}

export function totalGeralObtido(seccoes: Seccao[], respostas: Respostas): { obtidos: number; max: number } {
  const todosOsCriterios = seccoes.flatMap((s) => s.criterios);
  return subtotal(todosOsCriterios, respostas);
}
