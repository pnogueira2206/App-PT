"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  adicionarTipoAulaAction,
  alternarTipoAulaAtivoAction,
  editarTipoAulaAction,
} from "@/lib/tipos-aula-actions";

interface Item {
  id: string;
  nome: string;
  ativo: boolean;
}

export function GerirTiposAula({ itens }: { itens: Item[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [novoNome, setNovoNome] = useState("");
  const [aEditar, setAEditar] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");

  return (
    <div className="mx-auto max-w-lg px-4 py-4 md:max-w-2xl lg:max-w-3xl md:px-6 md:py-6">
      <Link href="/admin" className="mb-3 inline-block text-sm font-medium text-muted underline">
        ← Voltar ao Admin
      </Link>
      <h1 className="mb-4 text-lg font-semibold text-neutral-100">Tipos de Aula</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!novoNome.trim()) return;
          startTransition(async () => {
            await adicionarTipoAulaAction(novoNome.trim());
            setNovoNome("");
            router.refresh();
          });
        }}
        className="mb-5 flex gap-2"
      >
        <input
          className="flex-1 rounded-none border border-line bg-transparent px-3 py-2 text-sm text-neutral-100 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
          placeholder="Novo tipo de aula"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
        />
        <button type="submit" className="rounded-none bg-white px-4 py-2 text-sm font-medium text-black">
          Adicionar
        </button>
      </form>

      <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
        {itens.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 rounded-none border border-line px-3 py-2">
            {aEditar === item.id ? (
              <form
                className="flex flex-1 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (nomeEdicao.trim()) {
                    startTransition(async () => {
                      await editarTipoAulaAction(item.id, nomeEdicao.trim());
                      router.refresh();
                    });
                  }
                  setAEditar(null);
                }}
              >
                <input
                  className="flex-1 rounded-none border border-line px-2 py-1 text-sm"
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
                <span className={`text-sm ${item.ativo ? "text-neutral-100" : "text-dim line-through"}`}>
                  {item.nome}
                </span>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAEditar(item.id);
                      setNomeEdicao(item.nome);
                    }}
                    className="text-xs font-medium text-muted underline"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(async () => {
                        await alternarTipoAulaAtivoAction(item.id, !item.ativo);
                        router.refresh();
                      })
                    }
                    className={`text-xs font-medium underline ${item.ativo ? "text-red-400" : "text-green-400"}`}
                  >
                    {item.ativo ? "Desativar" : "Reativar"}
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted">
        Nunca se apaga — só se desativa, para manter o histórico das avaliações já feitas.
      </p>
    </div>
  );
}
