"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { PanelCloseIcon, PanelOpenIcon } from "@/components/icons";

export const SIDEBAR_COOKIE = "pn_sidebar";

/**
 * Profile page with a sidebar that can be minimised to a narrow rail (large screens),
 * leaving the calendar more room. The choice is remembered in a cookie.
 */
export function SidebarLayout({
  initialCollapsed,
  sidebar,
  rail,
  children,
}: {
  initialCollapsed: boolean;
  sidebar: React.ReactNode;
  rail: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "open"}; path=/; max-age=31536000; samesite=lax`;
  };
  const button = "hidden h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:flex";

  return (
    <div
      data-wide
      className={`grid gap-6 ${collapsed ? "lg:grid-cols-[3.25rem_minmax(0,1fr)]" : "lg:grid-cols-[17rem_minmax(0,1fr)]"}`}
    >
      {collapsed ? (
        <aside className="hidden flex-col items-center gap-3 lg:sticky lg:top-20 lg:flex lg:self-start">
          <button type="button" onClick={toggle} className={button} aria-label={t("profileSidebar.expand")} title={t("profileSidebar.expand")}>
            <PanelOpenIcon className="text-base" />
          </button>
          {rail}
        </aside>
      ) : null}
      <aside className={`relative space-y-5 lg:sticky lg:top-20 lg:self-start ${collapsed ? "lg:hidden" : ""}`}>
        <button
          type="button"
          onClick={toggle}
          className={`${button} absolute right-0 top-0`}
          aria-label={t("profileSidebar.collapse")}
          title={t("profileSidebar.collapse")}
        >
          <PanelCloseIcon className="text-base" />
        </button>
        {sidebar}
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
