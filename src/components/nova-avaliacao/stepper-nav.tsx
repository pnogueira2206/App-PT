import { useState } from "react";

export interface StepInfo {
  label: string;
  completo: boolean;
}

const MARGEM_SCROLL = 4;

export function StepperNav({
  steps,
  currentStep,
  onSelect,
}: {
  steps: StepInfo[];
  currentStep: number;
  onSelect: (index: number) => void;
}) {
  const concluidos = steps.filter((s) => s.completo).length;
  const [podeEsquerda, setPodeEsquerda] = useState(false);
  const [podeDireita, setPodeDireita] = useState(false);

  const atualizarSombras = (el: HTMLDivElement) => {
    setPodeEsquerda(el.scrollLeft > MARGEM_SCROLL);
    setPodeDireita(el.scrollLeft + el.clientWidth < el.scrollWidth - MARGEM_SCROLL);
  };

  // Callback ref: mede o overflow assim que a barra é montada e sempre que a janela muda de tamanho.
  const scrollRef = (el: HTMLDivElement | null) => {
    if (!el) return;
    atualizarSombras(el);
    const handleResize = () => atualizarSombras(el);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  };

  return (
    <div className="border-b border-line bg-panel">
      <div className="mx-auto max-w-lg md:max-w-2xl lg:max-w-3xl px-4 pt-2">
        <p className="text-xs text-muted">
          {concluidos} de {steps.length} secções concluídas
        </p>
        <div className="mt-1 h-1.5 w-full rounded-none bg-line">
          <div
            className="h-1.5 rounded-none bg-white transition-all"
            style={{ width: `${(concluidos / steps.length) * 100}%` }}
          />
        </div>
      </div>
      <div className="relative mx-auto max-w-lg md:max-w-2xl lg:max-w-3xl">
        {podeEsquerda && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-panel to-transparent" />
        )}
        <div
          ref={scrollRef}
          onScroll={(e) => atualizarSombras(e.currentTarget)}
          className="flex gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none]"
        >
          {steps.map((step, i) => (
            <button
              key={step.label}
              type="button"
              onClick={() => onSelect(i)}
              className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-none border px-3 py-1.5 text-xs font-medium transition ${
                i === currentStep
                  ? "border-white bg-white text-black"
                  : step.completo
                    ? "border-line bg-panel text-neutral-300"
                    : "border-line text-muted"
              }`}
            >
              {step.completo && <span aria-hidden>✓</span>}
              {i + 1}. {step.label}
            </button>
          ))}
        </div>
        {podeDireita && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-10 items-center justify-end bg-gradient-to-l from-panel to-transparent pr-1">
            <span aria-hidden className="text-dim">
              ›
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
