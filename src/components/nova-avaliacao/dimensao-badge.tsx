export function DimensaoBadge({ nome, obtidos, max }: { nome: string; obtidos: number; max: number }) {
  const pct = max > 0 ? Math.round((obtidos / max) * 100) : 0;
  return (
    <div className="flex items-center justify-between rounded-none bg-panel px-3 py-2 text-xs">
      <span className="font-medium text-neutral-300">{nome}</span>
      <span className="tabular-nums text-muted">
        {obtidos} / {max} ({pct}%)
      </span>
    </div>
  );
}
