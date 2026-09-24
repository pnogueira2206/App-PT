"use client";

import { useSyncExternalStore } from "react";
import { grelha } from "@/data/grelha";
import { PILARES } from "@/data/pilares";
import { ATRIBUICOES_VAZIAS, alternarPilar, obterAtribuicoesPilares, subscreverPilares } from "@/lib/pilares-store";

export function CriteriosPilares() {
  const atribuicoes = useSyncExternalStore(subscreverPilares, obterAtribuicoesPilares, () => ATRIBUICOES_VAZIAS);

  const criteriosPontuaveis = grelha.flatMap((s) => s.criterios.filter((c) => c.tipoResposta === "PONTOS"));
  const total = criteriosPontuaveis.length;
  const categorizados = criteriosPontuaveis.filter((c) => (atribuicoes[c.id]?.length ?? 0) > 0).length;

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <h1 className="mb-1 text-lg font-semibold text-neutral-900">Critérios &amp; Pilares</h1>
      <p className="mb-4 text-sm text-neutral-600">
        Atribui a cada critério um ou mais dos 6 pilares do ensino eficaz. Isto vai alimentar a spider web de
        desenvolvimento do treinador, mais à frente em &quot;Por Treinador&quot;.
      </p>

      <div className="mb-5">
        <p className="mb-1 text-xs text-neutral-500">
          {categorizados} de {total} critérios categorizados
        </p>
        <div className="h-1.5 w-full rounded-full bg-neutral-200">
          <div
            className="h-1.5 rounded-full bg-black transition-all"
            style={{ width: `${total > 0 ? (categorizados / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        {grelha.map((seccao) => (
          <section key={seccao.id}>
            <h2 className="mb-2 text-sm font-semibold text-neutral-900">{seccao.nome}</h2>
            <div className="space-y-2">
              {seccao.criterios
                .filter((c) => c.tipoResposta === "PONTOS")
                .map((c) => {
                  const atuais = atribuicoes[c.id] ?? [];
                  return (
                    <div key={c.id} className="rounded-md border border-neutral-200 p-3">
                      <p className="text-sm font-medium text-neutral-900">{c.texto}</p>
                      {c.dimensao && <p className="text-xs text-neutral-400">{c.dimensao}</p>}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {PILARES.map((p) => {
                          const selecionado = atuais.includes(p);
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => alternarPilar(c.id, p)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                selecionado ? "border-black bg-black text-white" : "border-neutral-300 text-neutral-700"
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
