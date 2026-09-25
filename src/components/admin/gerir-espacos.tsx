"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adicionarEspacoAction, alternarEspacoAtivoAction, editarEspacoAction } from "@/lib/espacos-actions";

interface Item {
  id: string;
  nome: string;
  ativo: boolean;
}

export function GerirEspacos({ itens }: { itens: Item[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [novoNome, setNovoNome] = useState("");
  const [aEditar, setAEditar] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");

  return (
    <div className="mx-auto max-w-lg px-4 py-4 md:max-w-2xl lg:max-w-3xl md:px-6 md:py-6">
      <Link href="/admin" className="mb-3 inline-block text-sm font-medium text-neutral-500 underline">
        ← Voltar ao Admin
      </Link>
      <h1 className="mb-4 text-lg font-semibold text-neutral-900">Espaços</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!novoNome.trim()) return;
          startTransition(async () => {
            await adicionarEspacoAction(novoNome.trim());
            setNovoNome("");
            router.refresh();
          });
        }}
        className="mb-5 flex gap-2"
      >
        <input
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          placeholder="Novo espaço"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
        />
        <button type="submit" className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
          Adicionar
        </button>
      </form>

      <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
        {itens.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2">
            {aEditar === item.id ? (
              <form
                className="flex flex-1 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (nomeEdicao.trim()) {
                    startTransition(async () => {
                      await editarEspacoAction(item.id, nomeEdicao.trim());
                      router.refresh();
                    });
                  }
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
                    onClick={() =>
                      startTransition(async () => {
                        await alternarEspacoAtivoAction(item.id, !item.ativo);
                        router.refresh();
                      })
                    }
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
