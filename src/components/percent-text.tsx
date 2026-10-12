import { formatNumber } from "@/lib/blocks";
import { percentSegments, type Maxes } from "@/lib/percent-loads";

/**
 * Free text with each percentage followed by the load in kg from the student's
 * 1RM ("3x5 @ 65% → 91 kg"). Without maxes it renders the text unchanged.
 */
export function PercentText({
  text,
  maxes,
  fallbackNames,
  locale,
  kgClassName = "ml-1 whitespace-nowrap rounded bg-sky-100 px-1 font-semibold text-sky-900",
}: {
  text: string;
  maxes: Maxes;
  fallbackNames: (string | null | undefined)[];
  locale: string;
  kgClassName?: string;
}) {
  const num = (n: number) => formatNumber(n, locale);
  return (
    <>
      {percentSegments(text, maxes, fallbackNames).map((segment, i) => (
        <span key={i}>
          {segment.text}
          {segment.kg && (
            <span className={kgClassName}>
              → {segment.kg.min === segment.kg.max ? num(segment.kg.min) : `${num(segment.kg.min)}–${num(segment.kg.max)}`} kg
            </span>
          )}
        </span>
      ))}
    </>
  );
}
