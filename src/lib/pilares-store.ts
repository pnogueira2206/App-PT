import { Pilar } from "@/data/pilares";

const STORAGE_KEY = "cfa-pilares-v2";

/** Cada critério pode estar ligado a mais do que um pilar. */
export type AtribuicoesPilares = Record<string, Pilar[]>;

export const ATRIBUICOES_VAZIAS: AtribuicoesPilares = {};

let cache: AtribuicoesPilares | null = null;
const listeners = new Set<() => void>();

function emitir() {
  for (const l of listeners) l();
}

function carregar(): AtribuicoesPilares {
  if (cache) return cache;
  if (typeof window === "undefined") return ATRIBUICOES_VAZIAS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as AtribuicoesPilares) : {};
  } catch {
    cache = {};
  }
  return cache;
}

export function obterAtribuicoesPilares(): AtribuicoesPilares {
  return carregar();
}

export function subscreverPilares(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Liga/desliga um pilar num critério, mantendo os outros pilares já atribuídos. */
export function alternarPilar(criterioId: string, pilar: Pilar) {
  const atuais = carregar();
  const lista = atuais[criterioId] ?? [];
  const novaLista = lista.includes(pilar) ? lista.filter((p) => p !== pilar) : [...lista, pilar];

  const novas = { ...atuais };
  if (novaLista.length > 0) {
    novas[criterioId] = novaLista;
  } else {
    delete novas[criterioId];
  }

  cache = novas;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(novas));
  }
  emitir();
}
