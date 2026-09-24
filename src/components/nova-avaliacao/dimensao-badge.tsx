export function DimensaoBadge({ nome, obtidos, max }: { nome: string; obtidos: number; max: number }) {
  const pct = max > 0 ? Math.round((obtidos / max) * 100) : 0;
  return (
    <div className="flex items-center justify-between rounded-md bg-neutral-100 px-3 py-2 text-xs">
      <span className="font-medium text-neutral-700">{nome}</span>
      <span className="tabular-nums text-neutral-600">
        {obtidos} / {max} ({pct}%)
      </span>
    </div>
  );
}
