import { percent, type Ratio, type StudentStats } from "@/lib/adherence";
import type { Translate } from "@/i18n/translator";

function tone(value: number | null) {
  if (value == null) return "bg-slate-100 text-slate-500";
  if (value >= 80) return "bg-emerald-100 text-emerald-800";
  if (value >= 50) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

function Pill({ label, ratio }: { label: string; ratio: Ratio }) {
  const value = percent(ratio);
  return (
    <span className={`inline-flex items-baseline gap-1 rounded-full px-2 py-0.5 text-xs ${tone(value)}`}>
      <span className="opacity-80">{label}</span>
      <span className="font-semibold">{value == null ? "—" : `${value}%`}</span>
      {ratio.planned > 0 && (
        <span className="opacity-70">
          ({ratio.done}/{ratio.planned})
        </span>
      )}
    </span>
  );
}

/** Week and 4-week adherence pills. */
export function AdherencePills({ stats, t }: { stats: StudentStats; t: Translate }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      <Pill label={t("adherence.week")} ratio={stats.week} />
      <Pill label={t("adherence.fourWeeks")} ratio={stats.month} />
    </span>
  );
}
