"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/nova-avaliacao", label: "Nova Avaliação" },
  { href: "/historico", label: "Histórico" },
  { href: "/por-treinador", label: "Por Treinador" },
  { href: "/admin", label: "Admin" },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-4">
      {tabs.map((tab) => {
        const ativo = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
              ativo ? "border-black text-black" : "border-transparent text-neutral-500"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
