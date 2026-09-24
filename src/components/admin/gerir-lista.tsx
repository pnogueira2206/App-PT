"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { treinadoresStore } from "@/lib/treinadores-store";
import { tiposAulaStore } from "@/lib/tipos-aula-store";

export function GerirLista({
  titulo,
  singular,
  tipo,
}: {
  titulo: string;
  singular: string;
  tipo: "treinadores" | "tipos-aula";
}) {
  const store = tipo === "treinadores" ? treinadoresStore : tiposAulaStore;
  const itens = useSyncExternalStore(store.subscrever, store.listar, store.listar);
  const [novoNome, setNovoNome] = useState("");
  const [aEditar, setAEditar] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <Link href="/admin" className="mb-3 inline-block text-sm font-medium text-neutral-500 underline">
        ← Voltar ao Admin
      </Link>
      <h1 className="mb-4 text-lg font-semibold text-neutral-900">{titulo}</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!novoNome.trim()) return;
          store.adicionar(novoNome.trim());
          setNovoNome("");
        }}
        className="mb-5 flex gap-2"
      >
        <input
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          placeholder={`Novo ${singular}`}
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
        />
        <button type="submit" className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
          Adicionar
        </button>
      </form>

      <ul className="space-y-2">
        {itens.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2">
            {aEditar === item.id ? (
              <form
                className="flex flex-1 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (nomeEdicao.trim()) store.editar(item.id, nomeEdicao.trim());
                  setAEditar(null);
                }}
              >
                <input
                  className="flex-1 rounded-md border border-neutral-300 px-2 py-1 text-sm"
                  value={nomeEdicao}
                  onChange={(e) => setNomeEdicao(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="text-xs font-medium underline">
                  Guardar
                </button>
              </form>
            ) : (
              <>
                <span className={`text-sm ${item.ativo ? "text-neutral-900" : "text-neutral-400 line-through"}`}>
                  {item.nome}
                </span>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAEditar(item.id);
                      setNomeEdicao(item.nome);
                    }}
                    className="text-xs font-medium text-neutral-500 underline"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => store.alternarAtivo(item.id, !item.ativo)}
                    className={`text-xs font-medium underline ${item.ativo ? "text-red-600" : "text-green-700"}`}
                  >
                    {item.ativo ? "Desativar" : "Reativar"}
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-neutral-500">
        Nunca se apaga — só se desativa, para manter o histórico das avaliações já feitas.
      </p>
    </div>
  );
}
