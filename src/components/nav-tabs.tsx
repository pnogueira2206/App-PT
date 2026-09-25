"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Papel } from "@prisma/client";

const tabs: { href: string; label: string; papeis: Papel[] }[] = [
  { href: "/nova-avaliacao", label: "Nova Avaliação", papeis: ["ADMIN", "AVALIADOR"] },
  { href: "/historico", label: "Histórico", papeis: ["ADMIN", "AVALIADOR", "TREINADOR"] },
  { href: "/por-treinador", label: "Por Treinador", papeis: ["ADMIN", "AVALIADOR", "TREINADOR"] },
  { href: "/admin", label: "Admin", papeis: ["ADMIN"] },
];

export function NavTabs({ papel }: { papel: Papel }) {
  const pathname = usePathname();
  const visiveis = tabs.filter((t) => t.papeis.includes(papel));

  return (
    <nav className="border-b border-neutral-200 bg-white px-4 md:px-6">
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto">
        {visiveis.map((tab) => {
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
      </div>
    </nav>
  );
}
