"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { AVALIACOES_VAZIAS, listarAvaliacoes } from "@/lib/avaliacoes-store";
import { treinadoresStore } from "@/lib/treinadores-store";
import { tiposAulaStore } from "@/lib/tipos-aula-store";

const semSubscricao = () => () => {};

const inputClasses =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-600">{label}</span>
      {children}
    </label>
  );
}

export function HistoricoList() {
  const avaliacoes = useSyncExternalStore(semSubscricao, listarAvaliacoes, () => AVALIACOES_VAZIAS);
  const treinadores = useSyncExternalStore(treinadoresStore.subscrever, treinadoresStore.listar, treinadoresStore.listar);
  const tiposDeAula = useSyncExternalStore(tiposAulaStore.subscrever, tiposAulaStore.listar, tiposAulaStore.listar);
  const [treinador, setTreinador] = useState("");
  const [tipoAula, setTipoAula] = useState("");
  const [dataDe, setDataDe] = useState("");
  const [dataAte, setDataAte] = useState("");
  const [classMin, setClassMin] = useState("");
  const [classMax, setClassMax] = useState("");

  const filtradas = useMemo(() => {
    return avaliacoes
      .filter((a) => !treinador || a.cabecalho.treinador === treinador)
      .filter((a) => !tipoAula || a.cabecalho.tipoAula === tipoAula)
      .filter((a) => !dataDe || a.cabecalho.data >= dataDe)
      .filter((a) => !dataAte || a.cabecalho.data <= dataAte)
      .filter((a) => !classMin || Number(a.classificacaoGeral) >= Number(classMin))
      .filter((a) => !classMax || Number(a.classificacaoGeral) <= Number(classMax))
      .sort((a, b) => (a.cabecalho.data + a.cabecalho.hora < b.cabecalho.data + b.cabecalho.hora ? 1 : -1));
  }, [avaliacoes, treinador, tipoAula, dataDe, dataAte, classMin, classMax]);

  const filtrosAtivos = treinador || tipoAula || dataDe || dataAte || classMin || classMax;

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <h1 className="mb-4 text-lg font-semibold text-neutral-900">Histórico de avaliações</h1>

      <div className="mb-5 space-y-3 rounded-md border border-neutral-200 p-3">
        <Campo label="Treinador">
          <select className={inputClasses} value={treinador} onChange={(e) => setTreinador(e.target.value)}>
            <option value="">Todos</option>
            {treinadores.map((t) => (
              <option key={t.id} value={t.nome}>
                {t.nome}
                {!t.ativo ? " (inativo)" : ""}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Tipo de aula">
          <select className={inputClasses} value={tipoAula} onChange={(e) => setTipoAula(e.target.value)}>
            <option value="">Todos</option>
            {tiposDeAula.map((t) => (
              <option key={t.id} value={t.nome}>
                {t.nome}
                {!t.ativo ? " (inativo)" : ""}
              </option>
            ))}
          </select>
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Período: de">
            <input type="date" className={inputClasses} value={dataDe} onChange={(e) => setDataDe(e.target.value)} />
          </Campo>
          <Campo label="Período: até">
            <input type="date" className={inputClasses} value={dataAte} onChange={(e) => setDataAte(e.target.value)} />
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Classificação mín.">
            <input
              type="number"
              min={1}
              max={100}
              className={inputClasses}
              value={classMin}
              onChange={(e) => setClassMin(e.target.value)}
            />
          </Campo>
          <Campo label="Classificação máx.">
            <input
              type="number"
              min={1}
              max={100}
              className={inputClasses}
              value={classMax}
              onChange={(e) => setClassMax(e.target.value)}
            />
          </Campo>
        </div>

        {filtrosAtivos && (
          <button
            type="button"
            onClick={() => {
              setTreinador("");
              setTipoAula("");
              setDataDe("");
              setDataAte("");
              setClassMin("");
              setClassMax("");
            }}
            className="text-xs font-medium text-neutral-500 underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <p className="mb-2 text-xs text-neutral-500">
        {filtradas.length} avaliaç{filtradas.length === 1 ? "ão" : "ões"}
      </p>

      {filtradas.length === 0 ? (
        <div className="rounded-md border border-dashed border-neutral-300 px-4 py-10 text-center">
          <p className="text-sm font-medium text-neutral-700">Sem resultados</p>
          <p className="mt-1 text-xs text-neutral-500">
            {avaliacoes.length === 0
              ? "Ainda não há avaliações guardadas."
              : "Não há avaliações que correspondam aos filtros escolhidos."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtradas.map((a) => (
            <li key={a.id}>
              <Link
                href={`/historico/${a.id}`}
                className="block rounded-md border border-neutral-200 px-3 py-3 transition hover:border-black"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-neutral-900">{a.cabecalho.treinador}</p>
                  <span className="rounded-full bg-black px-2 py-0.5 text-xs font-semibold text-white">
                    {a.classificacaoGeral}/100
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {a.cabecalho.avaliador} · {a.cabecalho.data} · {a.cabecalho.tipoAula}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
