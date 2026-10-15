"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin bar on top of the page from the click on a link until the new page is
 * shown, so a click always gets an immediate answer (also when only the query
 * changes, e.g. opening a workout in the calendar, where loading.tsx doesn't apply).
 */
export function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [shownFor, setShownFor] = useState(`${pathname}?${searchParams}`);

  // The new page is on screen: hide the bar.
  const current = `${pathname}?${searchParams}`;
  if (current !== shownFor) {
    setShownFor(current);
    setLoading(false);
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setLoading(true);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Never stay stuck (e.g. a navigation that was cancelled).
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 15000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (!loading) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-brand/20">
      <div className="h-full w-1/3 animate-[nav-progress_1s_ease-in-out_infinite] bg-brand" />
    </div>
  );
}
