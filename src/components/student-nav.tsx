"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { Wordmark } from "@/components/brand";
import { PreferencesMenu } from "@/components/preferences-menu";
import { useI18n } from "@/i18n/client";
import type { MessageKey } from "@/i18n/translator";
import { ICONS, type IconName } from "@/components/icons";

const links: {
  href: string;
  label: MessageKey;
  icon: IconName;
  isActive: (pathname: string) => boolean;
}[] = [
  {
    href: "/student",
    label: "nav.training",
    icon: "dumbbell",
    isActive: (pathname: string) =>
      pathname === "/student" ||
      pathname.startsWith("/student/workouts") ||
      pathname.startsWith("/student/exercises"),
  },
  {
    href: "/student/profile",
    label: "nav.profile",
    icon: "user",
    isActive: (pathname: string) => pathname.startsWith("/student/profile"),
  },
];

export function StudentTopBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between">
        <Link href="/student">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-3">
          <PreferencesMenu />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

export function StudentBottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {links.map((link) => {
          const active = link.isActive(pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
                active ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {(() => {
                const Icon = ICONS[link.icon];
                return <Icon className="text-xl" />;
              })()}
              {t(link.label)}

            </Link>
          );
        })}
      </div>
    </nav>
  );
}
