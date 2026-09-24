import { gerarAvaliacoesFicticias } from "@/data/seed-avaliacoes";
import { AvaliacaoDraft, AvaliacaoGuardada } from "@/types/avaliacao";

const STORAGE_KEY = "cfa-avaliacoes-v1";

export const AVALIACOES_VAZIAS: AvaliacaoGuardada[] = [];

let cache: AvaliacaoGuardada[] | null = null;

function carregar(): AvaliacaoGuardada[] {
  if (cache) return cache;
  if (typeof window === "undefined") return AVALIACOES_VAZIAS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cache = gerarAvaliacoesFicticias();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } else {
      cache = JSON.parse(raw) as AvaliacaoGuardada[];
    }
  } catch {
    cache = AVALIACOES_VAZIAS;
  }
  return cache;
}

export function listarAvaliacoes(): AvaliacaoGuardada[] {
  return carregar();
}

export function obterAvaliacao(id: string): AvaliacaoGuardada | undefined {
  return carregar().find((a) => a.id === id);
}

export function guardarAvaliacao(draft: AvaliacaoDraft): AvaliacaoGuardada {
  const anteriores = carregar();
  const nova: AvaliacaoGuardada = {
    ...draft,
    id: `av-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    guardadaEm: new Date().toISOString(),
  };
  cache = [...anteriores, nova];
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  }
  return nova;
}
