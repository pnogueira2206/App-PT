import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { NewStudentForm } from "@/components/new-student-form";

export default async function StudentsPage() {
  const session = await requireTrainer();

  const students = await prisma.user.findMany({
    where: { trainerId: session.user.id, role: "STUDENT" },
    orderBy: { name: "asc" },
    include: {
      memberships: { include: { group: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Alunos</h1>
        <NewStudentForm />
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-slate-500">
          Ainda não tens alunos. Cria o primeiro acima.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {students.map((student) => (
            <li key={student.id}>
              <Link
                href={`/trainer/students/${student.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {student.name}
                  </p>
                  <p className="text-sm text-slate-500">{student.email}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {student.memberships.map((m) => (
                    <span
                      key={m.id}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                    >
                      {m.group.name}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
