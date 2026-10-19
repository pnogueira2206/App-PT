"use client";

import { Criterio } from "@/data/grelha";
import { Resposta } from "@/types/avaliacao";

/** Sempre 5 hipóteses por critério: 0, 1/4, 1/2, 3/4 e o valor total do peso. */
function opcoesPontos(pesoMaximo: number): number[] {
  return [0, pesoMaximo * 0.25, pesoMaximo * 0.5, pesoMaximo * 0.75, pesoMaximo];
}

function formatarValor(v: number): string {
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

const LEGENDA_ESCALA = [
  { fracao: "0", texto: "não faz" },
  { fracao: "¼", texto: "faz raramente" },
  { fracao: "½", texto: "faz às vezes" },
  { fracao: "¾", texto: "faz habitualmente" },
  { fracao: "total", texto: "faz sempre" },
];

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
      <div className="py-3 border-b border-line last:border-b-0">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{criterio.texto}</p>
        <textarea
          className="mt-2 w-full rounded-none border border-line bg-transparent p-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-black dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
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
    <div className="py-3 border-b border-line last:border-b-0">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{criterio.texto}</p>
        {!semPeso && (
          <span className="shrink-0 text-xs text-muted">máx. {formatarValor(criterio.pesoMaximo!)}</span>
        )}
        {semPeso && <span className="shrink-0 text-xs text-dim">sem peso (por atribuir)</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {semPeso ? (
          <>
            <button
              type="button"
              onClick={() => selecionar(1, false)}
              className={`rounded-none border px-3 py-1.5 text-xs font-medium transition ${
                !na && valor === 1 ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black" : "border-line text-neutral-700 dark:text-neutral-300"
              }`}
            >
              Cumpriu
            </button>
            <button
              type="button"
              onClick={() => selecionar(0, false)}
              className={`rounded-none border px-3 py-1.5 text-xs font-medium transition ${
                !na && valor === 0 ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black" : "border-line text-neutral-700 dark:text-neutral-300"
              }`}
            >
              Não cumpriu
            </button>
            <button
              type="button"
              onClick={() => selecionar(null, true)}
              className={`rounded-none border px-3 py-1.5 text-xs font-medium transition ${
                na ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black" : "border-line text-neutral-700 dark:text-neutral-300"
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
                className={`rounded-none border px-3 py-1.5 text-xs font-medium transition ${
                  !na && valor === op ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black" : "border-line text-neutral-700 dark:text-neutral-300"
                }`}
              >
                {formatarValor(op)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => selecionar(null, true)}
              className={`rounded-none border px-3 py-1.5 text-xs font-medium transition ${
                na ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black" : "border-line text-neutral-700 dark:text-neutral-300"
              }`}
            >
              N/A
            </button>
          </>
        )}
      </div>
      {!semPeso && (
        <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] text-faint">
          {LEGENDA_ESCALA.map((l) => (
            <span key={l.fracao}>
              {l.fracao} = {l.texto}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
