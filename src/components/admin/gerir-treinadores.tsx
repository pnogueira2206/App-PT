"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  adicionarTreinadorAction,
  alternarTreinadorAtivoAction,
  editarTreinadorAction,
} from "@/lib/treinadores-actions";

interface Item {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
}

const inputClasses =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

export function GerirTreinadores({ itens }: { itens: Item[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [aEditar, setAEditar] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <Link href="/admin" className="mb-3 inline-block text-sm font-medium text-neutral-500 underline">
        ← Voltar ao Admin
      </Link>
      <h1 className="mb-4 text-lg font-semibold text-neutral-900">Treinadores</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!nome.trim() || !email.trim() || password.length < 6) {
            setErro("Preenche nome, email e uma palavra-passe com pelo menos 6 caracteres.");
            return;
          }
          startTransition(async () => {
            const resultado = await adicionarTreinadorAction(nome.trim(), email.trim(), password);
            if (resultado.erro) {
              setErro(resultado.erro);
              return;
            }
            setNome("");
            setEmail("");
            setPassword("");
            setErro("");
            router.refresh();
          });
        }}
        className="mb-5 space-y-2 rounded-md border border-neutral-200 p-3"
      >
        <input className={inputClasses} placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input
          className={inputClasses}
          type="email"
          placeholder="Email de acesso"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={inputClasses}
          type="password"
          placeholder="Palavra-passe inicial"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {erro && <p className="text-xs text-red-600">{erro}</p>}
        <button type="submit" className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
          Adicionar treinador
        </button>
      </form>

      <ul className="space-y-2">
        {itens.map((item) => (
          <li key={item.id} className="rounded-md border border-neutral-200 px-3 py-2">
            {aEditar === item.id ? (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (nomeEdicao.trim()) {
                    startTransition(async () => {
                      await editarTreinadorAction(item.id, nomeEdicao.trim());
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
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className={`text-sm ${item.ativo ? "text-neutral-900" : "text-neutral-400 line-through"}`}>
                    {item.nome}
                  </p>
                  <p className="text-xs text-neutral-400">{item.email}</p>
                </div>
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
                        await alternarTreinadorAtivoAction(item.id, !item.ativo);
                        router.refresh();
                      })
                    }
                    className={`text-xs font-medium underline ${item.ativo ? "text-red-600" : "text-green-700"}`}
                  >
                    {item.ativo ? "Desativar" : "Reativar"}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-neutral-500">
        Nunca se apaga — só se desativa (deixa de conseguir entrar e de aparecer na lista de novas avaliações), para
        manter o histórico.
      </p>
    </div>
  );
}
