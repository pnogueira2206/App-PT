import { Criterio, Seccao, TipoResposta, grelhaInicial } from "@/data/grelha";

const STORAGE_KEY = "cfa-grelha-v1";

function clonar(seccoes: Seccao[]): Seccao[] {
  return seccoes.map((s) => ({ ...s, criterios: s.criterios.map((c) => ({ ...c })) }));
}

function calcularAtiva(completa: Seccao[]): Seccao[] {
  return completa
    .filter((s) => s.ativa !== false)
    .map((s) => ({ ...s, criterios: s.criterios.filter((c) => c.ativo !== false) }));
}

let cacheCompleta: Seccao[] | null = null;
let cacheAtiva: Seccao[] | null = null;
const listeners = new Set<() => void>();

function emitir() {
  for (const l of listeners) l();
}

function carregar(): Seccao[] {
  if (cacheCompleta) return cacheCompleta;
  if (typeof window === "undefined") {
    cacheCompleta = grelhaInicial;
  } else {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        cacheCompleta = JSON.parse(raw) as Seccao[];
      } else {
        cacheCompleta = clonar(grelhaInicial);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheCompleta));
      }
    } catch {
      cacheCompleta = clonar(grelhaInicial);
    }
  }
  cacheAtiva = calcularAtiva(cacheCompleta);
  return cacheCompleta;
}

/** Todas as secções/critérios, incluindo os desativados — para o Admin gerir. */
export function listarGrelha(): Seccao[] {
  return carregar();
}

/** Só secções/critérios ativos — usado para preencher uma Nova Avaliação. */
export function listarGrelhaAtiva(): Seccao[] {
  carregar();
  return cacheAtiva!;
}

export function subscreverGrelha(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function atualizar(fn: (atual: Seccao[]) => Seccao[]) {
  const nova = fn(clonar(carregar()));
  cacheCompleta = nova;
  cacheAtiva = calcularAtiva(nova);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nova));
  }
  emitir();
}

export function editarSeccao(id: string, patch: Partial<Pick<Seccao, "nome" | "percentagem">>) {
  atualizar((atual) => atual.map((s) => (s.id === id ? { ...s, ...patch } : s)));
}

export function alternarSeccaoAtiva(id: string, ativa: boolean) {
  atualizar((atual) => atual.map((s) => (s.id === id ? { ...s, ativa } : s)));
}

export function adicionarSeccao(nome: string, percentagem: number) {
  atualizar((atual) => [...atual, { id: `s-${Date.now()}`, nome, percentagem, ativa: true, criterios: [] }]);
}

export function moverSeccao(id: string, direcao: -1 | 1) {
  atualizar((atual) => {
    const i = atual.findIndex((s) => s.id === id);
    const j = i + direcao;
    if (i < 0 || j < 0 || j >= atual.length) return atual;
    const copia = [...atual];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    return copia;
  });
}

export function editarCriterio(id: string, patch: Partial<Pick<Criterio, "texto" | "pesoMaximo" | "dimensao">>) {
  atualizar((atual) =>
    atual.map((s) => ({ ...s, criterios: s.criterios.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
  );
}

export function alternarCriterioAtivo(id: string, ativo: boolean) {
  atualizar((atual) =>
    atual.map((s) => ({ ...s, criterios: s.criterios.map((c) => (c.id === id ? { ...c, ativo } : c)) }))
  );
}

export function adicionarCriterio(
  seccaoId: string,
  novo: { texto: string; pesoMaximo: number | null; tipoResposta: TipoResposta; dimensao?: string }
) {
  atualizar((atual) =>
    atual.map((s) =>
      s.id === seccaoId
        ? { ...s, criterios: [...s.criterios, { id: `c-${Date.now()}`, ativo: true, ...novo }] }
        : s
    )
  );
}

export function moverCriterio(seccaoId: string, criterioId: string, direcao: -1 | 1) {
  atualizar((atual) =>
    atual.map((s) => {
      if (s.id !== seccaoId) return s;
      const i = s.criterios.findIndex((c) => c.id === criterioId);
      const j = i + direcao;
      if (i < 0 || j < 0 || j >= s.criterios.length) return s;
      const copia = [...s.criterios];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return { ...s, criterios: copia };
    })
  );
}
