export interface ItemGerivel {
  id: string;
  nome: string;
  ativo: boolean;
}

/**
 * Cria um pequeno store CRUD (adicionar/editar/desativar, nunca apagar) para uma
 * lista simples de nomes (treinadores, tipos de aula, ...), persistido em
 * localStorage e semeado a partir de uma lista inicial estática.
 */
export function criarListaGerivel(storageKey: string, seed: readonly string[]) {
  let cacheTodos: ItemGerivel[] | null = null;
  let cacheAtivos: ItemGerivel[] | null = null;
  const listeners = new Set<() => void>();

  function emitir() {
    for (const l of listeners) l();
  }

  function seedInicial(): ItemGerivel[] {
    return seed.map((nome, i) => ({ id: `${storageKey}-seed-${i}`, nome, ativo: true }));
  }

  function carregar(): ItemGerivel[] {
    if (cacheTodos) return cacheTodos;
    if (typeof window === "undefined") {
      cacheTodos = seedInicial();
    } else {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          cacheTodos = JSON.parse(raw) as ItemGerivel[];
        } else {
          cacheTodos = seedInicial();
          window.localStorage.setItem(storageKey, JSON.stringify(cacheTodos));
        }
      } catch {
        cacheTodos = seedInicial();
      }
    }
    cacheAtivos = cacheTodos.filter((i) => i.ativo);
    return cacheTodos;
  }

  function persistirEEmitir(novos: ItemGerivel[]) {
    cacheTodos = novos;
    cacheAtivos = novos.filter((i) => i.ativo);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, JSON.stringify(novos));
    }
    emitir();
  }

  return {
    listar(): ItemGerivel[] {
      return carregar();
    },
    listarAtivos(): ItemGerivel[] {
      carregar();
      return cacheAtivos!;
    },
    subscrever(callback: () => void): () => void {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    adicionar(nome: string) {
      persistirEEmitir([...carregar(), { id: `${storageKey}-${Date.now()}`, nome, ativo: true }]);
    },
    editar(id: string, nome: string) {
      persistirEEmitir(carregar().map((i) => (i.id === id ? { ...i, nome } : i)));
    },
    alternarAtivo(id: string, ativo: boolean) {
      persistirEEmitir(carregar().map((i) => (i.id === id ? { ...i, ativo } : i)));
    },
  };
}
