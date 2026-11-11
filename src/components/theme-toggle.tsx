"use client";

import { useSyncExternalStore } from "react";

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return true;
}

function subscribe(callback: () => void) {
  window.addEventListener("cfa-theme-change", callback);
  return () => window.removeEventListener("cfa-theme-change", callback);
}

function aplicarTema(escuro: boolean) {
  document.documentElement.classList.toggle("dark", escuro);
  try {
    localStorage.setItem("cfa-theme", escuro ? "dark" : "light");
  } catch {
    // localStorage indisponível (modo privado, etc.) — o toggle continua a funcionar na sessão atual.
  }
  window.dispatchEvent(new Event("cfa-theme-change"));
}

export function ThemeToggle() {
  const escuro = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <button
      type="button"
      onClick={() => aplicarTema(!escuro)}
      aria-label={escuro ? "Ativar modo claro" : "Ativar modo escuro"}
      className="font-mono shrink-0 rounded-lg border border-neutral-700 px-2 py-1 text-xs font-bold tracking-wider text-neutral-300 transition hover:border-white hover:text-white"
    >
      {escuro ? "☀ CLARO" : "☾ ESCURO"}
    </button>
  );
}
