import { Criterio, Seccao, grelha } from "@/data/grelha";

export interface Cabecalho {
  treinador: string;
  avaliador: string;
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

export function cabecalhoVazio(): Cabecalho {
  return { treinador: "", avaliador: "", data: "", hora: "", tipoAula: "", nAlunos: "" };
}

export function respostasVazias(): Respostas {
  const respostas: Respostas = {};
  for (const seccao of grelha) {
    for (const c of seccao.criterios) {
      respostas[c.id] =
        c.tipoResposta === "TEXTO_LIVRE"
          ? { tipo: "TEXTO_LIVRE", texto: "" }
          : { tipo: "PONTOS", valor: null, na: false };
    }
  }
  return respostas;
}

export function draftVazio(): AvaliacaoDraft {
  const observacoes: ObservacoesSeccao = {};
  for (const seccao of grelha) observacoes[seccao.id] = "";
  return {
    cabecalho: cabecalhoVazio(),
    respostas: respostasVazias(),
    observacoes,
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

export function subtotal(criterios: Criterio[], respostas: Respostas): { obtidos: number; max: number } {
  let obtidos = 0;
  let max = 0;
  for (const c of criterios) {
    if (c.tipoResposta !== "PONTOS" || c.pesoMaximo == null) continue;
    const r = respostas[c.id];
    if (!r || r.tipo !== "PONTOS") continue;
    if (r.na) continue;
    max += c.pesoMaximo;
    obtidos += r.valor ?? 0;
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
    c.avaliador !== "" &&
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

export function totalGeralObtido(respostas: Respostas): { obtidos: number; max: number } {
  const todosOsCriterios = grelha.flatMap((s) => s.criterios);
  return subtotal(todosOsCriterios, respostas);
}
