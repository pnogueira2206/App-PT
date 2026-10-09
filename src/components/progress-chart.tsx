"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { formatDate } from "@/lib/dates";
import { formatDuration, formatNumber } from "@/lib/blocks";

export type ProgressPoint = { date: Date; value: number };

const H = 200;
const PAD = { top: 16, right: 16, bottom: 28, left: 52 };

/** Single-series progress line (best load or time per session) with hover readout and a table view. */
export function ProgressChart({
  title,
  points,
  kind,
}: {
  title: string;
  points: ProgressPoint[];
  kind: "load" | "time";
}) {
  const { t, intlLocale } = useI18n();
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();
  // Draw at the real width so text keeps its size on phones.
  const boxRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(600);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setW(Math.max(260, Math.round(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const format = (v: number) => (kind === "load" ? `${formatNumber(v, intlLocale)} kg` : formatDuration(v));
  const day = (d: Date) => formatDate(new Date(d), intlLocale, { day: "numeric", month: "short" });

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.max(1, max * 0.1);
  const lo = Math.max(0, min - span * 0.15);
  const hi = max + span * 0.15;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - ((v - lo) / (hi - lo)) * innerH;
  const ticks = [lo, lo + (hi - lo) / 2, hi];

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");

  function onPointer(event: React.PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * W;
    let nearest = 0;
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(nearest) - px)) nearest = i;
    });
    setActive(nearest);
  }

  const activePoint = active != null ? points[active] : null;

  return (
    <figure className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
      <figcaption id={titleId} className="text-sm font-medium text-slate-700">
        {title}
      </figcaption>
      <div ref={boxRef} className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          className="block max-w-full touch-none select-none"
          role="img"
          aria-labelledby={titleId}
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          onPointerLeave={() => setActive(null)}
        >
          {ticks.map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} className="stroke-slate-200" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" className="fill-slate-400 text-[11px]">
                {format(kind === "time" ? Math.round(v) : Math.round(v * 2) / 2)}
              </text>
            </g>
          ))}
          <text x={x(0)} y={H - 8} textAnchor={points.length === 1 ? "middle" : "start"} className="fill-slate-400 text-[11px]">
            {day(points[0].date)}
          </text>
          {points.length > 1 && (
            <text x={x(points.length - 1)} y={H - 8} textAnchor="end" className="fill-slate-400 text-[11px]">
              {day(points[points.length - 1].date)}
            </text>
          )}

          {activePoint && (
            <line
              x1={x(active!)}
              x2={x(active!)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              className="stroke-slate-300"
              strokeWidth={1}
            />
          )}
          <path d={path} fill="none" stroke="var(--color-chart)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={x(i)}
              cy={y(p.value)}
              r={i === active ? 6 : 4}
              fill="var(--color-chart)"
              className="stroke-white"
              strokeWidth={2}
            />
          ))}
        </svg>

        {activePoint && (
          <div
            className={`pointer-events-none absolute top-0 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm ${
              x(active!) > W * 0.75 ? "-translate-x-full" : x(active!) < W * 0.25 ? "" : "-translate-x-1/2"
            }`}
            style={{ left: x(active!) }}
          >

            <p className="font-semibold text-slate-900">{format(activePoint.value)}</p>
            <p className="text-slate-500">{day(activePoint.date)}</p>
          </div>
        )}
      </div>

      <details className="text-xs text-slate-500">
        <summary className="cursor-pointer">{t("chart.table")}</summary>
        <table className="mt-2 w-full text-left">
          <tbody>
            {[...points].reverse().map((p, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="py-1">{day(p.date)}</td>
                <td className="py-1 text-right font-medium text-slate-700">{format(p.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
