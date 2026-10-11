"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ICONS, type IconName } from "@/components/icons";

/** Vertical section menu of a student's profile (sidebar). */
export function ProfileNav({
  items,
  iconsOnly = false,
}: {
  items: { href: string; label: string; icon: IconName }[];
  /** Collapsed sidebar: icons with the label as tooltip. */
  iconsOnly?: boolean;
}) {
  const pathname = usePathname();
  return (
    <nav className={iconsOnly ? "flex flex-col items-center gap-1" : "flex gap-1 overflow-x-auto lg:flex-col"}>
      {items.map((item) => {
        const active =
          pathname === item.href || (item.href.split("/").length > 4 && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            title={iconsOnly ? item.label : undefined}
            aria-label={iconsOnly ? item.label : undefined}
            className={`flex shrink-0 items-center gap-2.5 rounded-lg ${iconsOnly ? "p-2" : "px-3 py-2"} text-sm font-medium ${
              active ? "bg-brand text-brand-ink" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {(() => {
              const Icon = ICONS[item.icon];
              return <Icon className="text-base" />;
            })()}
            {!iconsOnly && item.label}
          </Link>
        );
      })}
    </nav>
  );
}
