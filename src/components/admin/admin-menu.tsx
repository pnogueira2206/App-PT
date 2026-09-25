import Link from "next/link";
import { ExportarCsvButton } from "./exportar-csv-button";

const areas = [
  { href: "/admin/treinadores", nome: "Treinadores", descricao: "Adicionar, editar, desativar e repor palavra-passe." },
  { href: "/admin/avaliadores", nome: "Avaliadores", descricao: "Adicionar, editar, desativar e repor palavra-passe." },
  { href: "/admin/tipos-aula", nome: "Tipos de Aula", descricao: "Adicionar, editar e desativar tipos de aula." },
  { href: "/admin/espacos", nome: "Espaços", descricao: "Adicionar, editar e desativar espaços (ex.: CFA Oriente, CFA Carnaxide)." },
  {
    href: "/admin/grelha",
    nome: "Secções & Critérios",
    descricao: "Editar, adicionar, reordenar e desativar a grelha de avaliação.",
  },
  {
    href: "/admin/criterios-pilares",
    nome: "Critérios & Pilares",
    descricao: "Atribuir os 6 pilares do ensino eficaz a cada critério.",
  },
  {
    href: "/admin/auditoria",
    nome: "Registo de Atividade",
    descricao: "Logins, avaliações vistas ou criadas, exportações e alterações de conta.",
  },
];

export function AdminMenu({ totalAvaliacoes }: { totalAvaliacoes: number }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-4 md:max-w-2xl lg:max-w-3xl md:px-6 md:py-6">
      <h1 className="mb-4 text-lg font-semibold text-neutral-900">Admin</h1>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {areas.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="block rounded-md border border-neutral-200 px-3 py-3 transition hover:border-black"
          >
            <p className="text-sm font-semibold text-neutral-900">{a.nome}</p>
            <p className="mt-0.5 text-xs text-neutral-500">{a.descricao}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-md border border-neutral-200 p-3">
        <p className="mb-1 text-sm font-semibold text-neutral-900">Exportar dados</p>
        <p className="mb-3 text-xs text-neutral-500">
          Descarrega todas as avaliações guardadas num ficheiro CSV (abre no Excel).
        </p>
        <ExportarCsvButton total={totalAvaliacoes} />
      </div>
    </div>
  );
}
