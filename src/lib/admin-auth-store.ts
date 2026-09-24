const CHAVE_SESSAO = "cfa-admin-autenticado";

/**
 * Código de acesso ao Admin. Isto NÃO é segurança real — ver explicação
 * dada ao utilizador. É só uma barreira para não se entrar por engano.
 */
export const CODIGO_ADMIN = "cfa-admin-2026";

const listeners = new Set<() => void>();

function emitir() {
  for (const l of listeners) l();
}

export function estaAutenticado(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(CHAVE_SESSAO) === "1";
}

export function subscreverAdminAuth(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function autenticar(codigo: string): boolean {
  if (codigo !== CODIGO_ADMIN) return false;
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(CHAVE_SESSAO, "1");
  }
  emitir();
  return true;
}

export function terminarSessaoAdmin() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(CHAVE_SESSAO);
  }
  emitir();
}
