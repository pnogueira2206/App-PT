import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { NewGroupForm } from "@/components/new-group-form";

export default async function GroupsPage() {
  const session = await requireTrainer();

  const groups = await prisma.group.findMany({
    where: { trainerId: session.user.id },
    include: { members: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Grupos</h1>
        <NewGroupForm />
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-slate-500">
          Ainda não tens grupos. Cria um grupo para atribuir treinos a vários alunos de uma vez.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                href={`/trainer/groups/${g.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <span className="font-medium text-slate-900">{g.name}</span>
                <span className="text-sm text-slate-500">
                  {g.members.length} {g.members.length === 1 ? "aluno" : "alunos"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
