import { Pilar } from "@/data/pilares";

const STORAGE_KEY = "cfa-pilares-v1";

export type AtribuicoesPilares = Record<string, Pilar>;

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

export function definirPilar(criterioId: string, pilar: Pilar | null) {
  const atuais = carregar();
  const novas = { ...atuais };
  if (pilar) {
    novas[criterioId] = pilar;
  } else {
    delete novas[criterioId];
  }
  cache = novas;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(novas));
  }
  emitir();
}
