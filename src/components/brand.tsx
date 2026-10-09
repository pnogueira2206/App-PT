/** "PN COACHING" wordmark, in the style of the coaching site (gold, spaced capitals). */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`text-xs font-semibold uppercase tracking-[0.3em] text-brand-text ${className}`}>
      PN Coaching
    </span>
  );
}

/** Short gold rule used under headings on the coaching site. */
export function GoldRule() {
  return <span aria-hidden className="block h-px w-16 bg-brand" />;
}
