"use client";

import { useState } from "react";
import { mudarPasswordPropriaAction } from "@/lib/contas-actions";

const inputClasses =
  "w-full rounded-none border border-line bg-transparent px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-black dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white";

export function MudarPasswordForm() {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [aEnviar, setAEnviar] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setAEnviar(true);
        setMensagem(null);
        const resultado = await mudarPasswordPropriaAction(atual, nova);
        setAEnviar(false);
        if (resultado.erro) {
          setMensagem({ tipo: "erro", texto: resultado.erro });
        } else {
          setMensagem({ tipo: "sucesso", texto: "Palavra-passe alterada." });
          setAtual("");
          setNova("");
        }
      }}
    >
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Palavra-passe atual</span>
        <input type="password" className={inputClasses} value={atual} onChange={(e) => setAtual(e.target.value)} required />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Nova palavra-passe</span>
        <input type="password" className={inputClasses} value={nova} onChange={(e) => setNova(e.target.value)} required />
      </label>
      {mensagem && (
        <p className={`text-xs ${mensagem.tipo === "erro" ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}>{mensagem.texto}</p>
      )}
      <button
        type="submit"
        disabled={aEnviar}
        className="w-full rounded-none bg-black dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-black disabled:opacity-50"
      >
        {aEnviar ? "A guardar..." : "Alterar palavra-passe"}
      </button>
    </form>
  );
}
