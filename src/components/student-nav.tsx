"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

const links = [
  { href: "/student", label: "Treinos", icon: "🏋️" },
  { href: "/student/records", label: "Recordes", icon: "🏆" },
];

export function StudentTopBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between">
        <span className="text-lg font-bold text-slate-900">App PT</span>
        <SignOutButton />
      </div>
    </header>
  );
}

export function StudentBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {links.map((link) => {
          const active =
            link.href === "/student"
              ? pathname === "/student"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
                active ? "text-slate-900" : "text-slate-400"
              }`}
            >
              <span className="text-xl leading-none">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
