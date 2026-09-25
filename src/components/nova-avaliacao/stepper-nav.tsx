export interface StepInfo {
  label: string;
  completo: boolean;
}

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
  return (
    <div className="border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-lg md:max-w-2xl lg:max-w-3xl px-4 pt-2">
        <p className="text-xs text-neutral-500">
          {concluidos} de {steps.length} secções concluídas
        </p>
        <div className="mt-1 h-1.5 w-full rounded-full bg-neutral-200">
          <div
            className="h-1.5 rounded-full bg-black transition-all"
            style={{ width: `${(concluidos / steps.length) * 100}%` }}
          />
        </div>
      </div>
      <div className="mx-auto flex max-w-lg md:max-w-2xl lg:max-w-3xl gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
        {steps.map((step, i) => (
          <button
            key={step.label}
            type="button"
            onClick={() => onSelect(i)}
            className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              i === currentStep
                ? "border-black bg-black text-white"
                : step.completo
                  ? "border-neutral-300 bg-neutral-100 text-neutral-700"
                  : "border-neutral-200 text-neutral-500"
            }`}
          >
            {step.completo && <span aria-hidden>✓</span>}
            {i + 1}. {step.label}
          </button>
        ))}
      </div>
    </div>
  );
}
