/** Shown at once while a page loads (loading.tsx), so a click never looks ignored. */
export function PageSkeleton() {
  const bar = "animate-pulse rounded-lg bg-slate-200/70";
  return (
    <div className="space-y-4" aria-busy>
      <div className={`${bar} h-7 w-56`} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className={`${bar} h-24`} />
        <div className={`${bar} h-24`} />
        <div className={`${bar} h-24`} />
      </div>
      <div className={`${bar} h-64`} />
    </div>
  );
}
