"use client";

import { Criterio } from "@/data/grelha";
import { Resposta } from "@/types/avaliacao";

function opcoesPontos(pesoMaximo: number): number[] {
  const opcoes: number[] = [];
  for (let i = 0; i <= Math.round(pesoMaximo * 2); i++) {
    opcoes.push(i / 2);
  }
  return opcoes;
}

function formatarValor(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

export function CriterioField({
  criterio,
  resposta,
  onChange,
}: {
  criterio: Criterio;
  resposta: Resposta | undefined;
  onChange: (r: Resposta) => void;
}) {
  if (criterio.tipoResposta === "TEXTO_LIVRE") {
    const texto = resposta?.tipo === "TEXTO_LIVRE" ? resposta.texto : "";
    return (
      <div className="py-3 border-b border-neutral-200 last:border-b-0">
        <p className="text-sm font-medium text-neutral-900">{criterio.texto}</p>
        <textarea
          className="mt-2 w-full rounded-md border border-neutral-300 p-2 text-sm text-neutral-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          rows={2}
          placeholder="Escreve livremente..."
          value={texto}
          onChange={(e) => onChange({ tipo: "TEXTO_LIVRE", texto: e.target.value })}
        />
      </div>
    );
  }

  const semPeso = criterio.pesoMaximo == null;
  const valor = resposta?.tipo === "PONTOS" ? resposta.valor : null;
  const na = resposta?.tipo === "PONTOS" ? resposta.na : false;

  const selecionar = (novoValor: number | null, novoNa: boolean) => {
    onChange({ tipo: "PONTOS", valor: novoValor, na: novoNa });
  };

  return (
    <div className="py-3 border-b border-neutral-200 last:border-b-0">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-neutral-900">{criterio.texto}</p>
        {!semPeso && (
          <span className="shrink-0 text-xs text-neutral-500">máx. {formatarValor(criterio.pesoMaximo!)}</span>
        )}
        {semPeso && <span className="shrink-0 text-xs text-neutral-400">sem peso (por atribuir)</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {semPeso ? (
          <>
            <button
              type="button"
              onClick={() => selecionar(1, false)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                !na && valor === 1 ? "border-black bg-black text-white" : "border-neutral-300 text-neutral-700"
              }`}
            >
              Cumpriu
            </button>
            <button
              type="button"
              onClick={() => selecionar(0, false)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                !na && valor === 0 ? "border-black bg-black text-white" : "border-neutral-300 text-neutral-700"
              }`}
            >
              Não cumpriu
            </button>
            <button
              type="button"
              onClick={() => selecionar(null, true)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                na ? "border-black bg-black text-white" : "border-neutral-300 text-neutral-700"
              }`}
            >
              N/A
            </button>
          </>
        ) : (
          <>
            {opcoesPontos(criterio.pesoMaximo!).map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => selecionar(op, false)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  !na && valor === op ? "border-black bg-black text-white" : "border-neutral-300 text-neutral-700"
                }`}
              >
                {formatarValor(op)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => selecionar(null, true)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                na ? "border-black bg-black text-white" : "border-neutral-300 text-neutral-700"
              }`}
            >
              N/A
            </button>
          </>
        )}
      </div>
    </div>
  );
}
