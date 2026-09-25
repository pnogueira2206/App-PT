"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  adicionarTreinadorAction,
  alternarTreinadorAtivoAction,
  editarTreinadorAction,
} from "@/lib/treinadores-actions";
import {
  adicionarAvaliadorAction,
  alternarAvaliadorAtivoAction,
  editarAvaliadorAction,
} from "@/lib/avaliadores-actions";
import {
  adicionarAdminAction,
  alternarAdminAtivoAction,
  editarAdminAction,
} from "@/lib/administradores-actions";
import { anonimizarContaAction, reporPasswordAction } from "@/lib/contas-actions";

interface Item {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
}

const inputClasses =
  "w-full rounded-none border border-line bg-transparent px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-black dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white";

export function GerirPessoas({
  itens,
  tipo,
}: {
  itens: Item[];
  tipo: "treinadores" | "avaliadores" | "administradores";
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [aEditar, setAEditar] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");
  const [aRepor, setARepor] = useState<string | null>(null);
  const [novaPassword, setNovaPassword] = useState("");
  const [erroPassword, setErroPassword] = useState("");
  const [aAnonimizar, setAAnonimizar] = useState<string | null>(null);
  const [erroAnonimizar, setErroAnonimizar] = useState("");
  const [erroAtivo, setErroAtivo] = useState<{ id: string; msg: string } | null>(null);

  const alternarAtivoGenerico = async (
    acao: (id: string, ativo: boolean) => Promise<void>,
    id: string,
    ativo: boolean
  ): Promise<{ erro?: string }> => {
    await acao(id, ativo);
    return {};
  };

  const acoes =
    tipo === "treinadores"
      ? {
          adicionar: adicionarTreinadorAction,
          editar: editarTreinadorAction,
          alternarAtivo: (id: string, ativo: boolean) => alternarAtivoGenerico(alternarTreinadorAtivoAction, id, ativo),
        }
      : tipo === "avaliadores"
        ? {
            adicionar: adicionarAvaliadorAction,
            editar: editarAvaliadorAction,
            alternarAtivo: (id: string, ativo: boolean) => alternarAtivoGenerico(alternarAvaliadorAtivoAction, id, ativo),
          }
        : { adicionar: adicionarAdminAction, editar: editarAdminAction, alternarAtivo: alternarAdminAtivoAction };

  const titulo = tipo === "treinadores" ? "Treinadores" : tipo === "avaliadores" ? "Avaliadores" : "Administradores";
  const singular = tipo === "treinadores" ? "treinador" : tipo === "avaliadores" ? "avaliador" : "administrador";

  return (
    <div className="mx-auto max-w-lg px-4 py-4 md:max-w-2xl lg:max-w-3xl md:px-6 md:py-6">
      <Link href="/admin" className="mb-3 inline-block text-sm font-medium text-muted underline">
        ← Voltar ao Admin
      </Link>
      <h1 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{titulo}</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!nome.trim() || !email.trim() || password.length < 6) {
            setErro("Preenche nome, email e uma palavra-passe com pelo menos 6 caracteres.");
            return;
          }
          startTransition(async () => {
            const resultado = await acoes.adicionar(nome.trim(), email.trim(), password);
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
        className="mb-5 space-y-2 rounded-none border border-line p-3"
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
        {erro && <p className="text-xs text-red-600 dark:text-red-400">{erro}</p>}
        <button type="submit" className="w-full rounded-none bg-black dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-black">
          Adicionar {singular}
        </button>
      </form>

      <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
        {itens.map((item) => (
          <li key={item.id} className="rounded-none border border-line px-3 py-2">
            {aEditar === item.id ? (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (nomeEdicao.trim()) {
                    startTransition(async () => {
                      await acoes.editar(item.id, nomeEdicao.trim());
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
            ) : aRepor === item.id ? (
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (novaPassword.length < 6) {
                    setErroPassword("Pelo menos 6 caracteres.");
                    return;
                  }
                  startTransition(async () => {
                    const resultado = await reporPasswordAction(item.id, novaPassword);
                    if (resultado.erro) {
                      setErroPassword(resultado.erro);
                      return;
                    }
                    setARepor(null);
                    setNovaPassword("");
                    setErroPassword("");
                    router.refresh();
                  });
                }}
              >
                <p className="text-xs text-muted">Nova palavra-passe para {item.nome}:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-none border border-line px-2 py-1 text-sm"
                    value={novaPassword}
                    onChange={(e) => setNovaPassword(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="text-xs font-medium underline">
                    Repor
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setARepor(null);
                      setErroPassword("");
                    }}
                    className="text-xs text-muted underline"
                  >
                    Cancelar
                  </button>
                </div>
                {erroPassword && <p className="text-xs text-red-600 dark:text-red-400">{erroPassword}</p>}
              </form>
            ) : aAnonimizar === item.id ? (
              <div className="space-y-2">
                <p className="text-xs text-neutral-700 dark:text-neutral-300">
                  Tens a certeza? Isto substitui o nome e o email de <strong>{item.nome}</strong> por um valor
                  anónimo, desativa a conta e não pode ser desfeito. As avaliações já feitas mantêm-se, mas deixam
                  de identificar esta pessoa.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(async () => {
                        const resultado = await anonimizarContaAction(item.id);
                        if (resultado.erro) {
                          setErroAnonimizar(resultado.erro);
                          return;
                        }
                        setAAnonimizar(null);
                        setErroAnonimizar("");
                        router.refresh();
                      })
                    }
                    className="text-xs font-medium text-red-600 dark:text-red-400 underline"
                  >
                    Confirmar anonimização
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAAnonimizar(null);
                      setErroAnonimizar("");
                    }}
                    className="text-xs text-muted underline"
                  >
                    Cancelar
                  </button>
                </div>
                {erroAnonimizar && <p className="text-xs text-red-600 dark:text-red-400">{erroAnonimizar}</p>}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className={`text-sm ${item.ativo ? "text-neutral-900 dark:text-neutral-100" : "text-dim line-through"}`}>
                    {item.nome}
                  </p>
                  <p className="text-xs text-dim">{item.email}</p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
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
                    onClick={() => {
                      setARepor(item.id);
                      setNovaPassword("");
                      setErroPassword("");
                    }}
                    className="text-xs font-medium text-muted underline"
                  >
                    Repor palavra-passe
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(async () => {
                        setErroAtivo(null);
                        const resultado = await acoes.alternarAtivo(item.id, !item.ativo);
                        if (resultado?.erro) {
                          setErroAtivo({ id: item.id, msg: resultado.erro });
                          return;
                        }
                        router.refresh();
                      })
                    }
                    className={`text-xs font-medium underline ${item.ativo ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}
                  >
                    {item.ativo ? "Desativar" : "Reativar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAAnonimizar(item.id);
                      setErroAnonimizar("");
                    }}
                    className="text-xs font-medium text-red-600 dark:text-red-400 underline"
                  >
                    Anonimizar (RGPD)
                  </button>
                </div>
                {erroAtivo?.id === item.id && <p className="w-full text-xs text-red-600 dark:text-red-400">{erroAtivo.msg}</p>}
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted">
        Nunca se apaga — só se desativa (deixa de conseguir entrar{tipo === "treinadores" ? " e de aparecer na lista de novas avaliações" : ""}), para manter o histórico.
        A reposição de palavra-passe é a forma de recuperação de acesso — define uma nova e partilha-a com a pessoa.
        &ldquo;Anonimizar&rdquo; é a forma de cumprir um pedido de apagamento de dados (RGPD): substitui o nome e o email por um
        valor anónimo em vez de apagar a conta, para não quebrar o histórico de avaliações já feitas.
      </p>
    </div>
  );
}
