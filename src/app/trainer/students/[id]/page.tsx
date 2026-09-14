import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireTrainer();

  const student = await prisma.user.findFirst({
    where: { id, trainerId: session.user.id, role: "STUDENT" },
    include: {
      memberships: { include: { group: true } },
    },
  });
  if (!student) notFound();

  const groupIds = student.memberships.map((m) => m.groupId);

  const [records, workouts] = await Promise.all([
    prisma.personalRecord.findMany({
      where: { studentId: id },
      include: { exercise: true },
      orderBy: { recordDate: "desc" },
      take: 10,
    }),
    prisma.workout.findMany({
      where: {
        trainerId: session.user.id,
        OR: [{ studentId: id }, { groupId: { in: groupIds } }],
      },
      include: {
        group: true,
        blocks: {
          include: {
            results: { where: { studentId: id } },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { date: "desc" },
      take: 15,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/trainer/students" className="text-sm text-slate-500 hover:text-slate-900">
          ← Alunos
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{student.name}</h1>
            <p className="text-sm text-slate-500">{student.email}</p>
          </div>
          <ResetPasswordForm studentId={student.id} />
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {student.memberships.map((m) => (
            <span
              key={m.id}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
            >
              {m.group.name}
            </span>
          ))}
        </div>
      </div>

      <section>
        <h2 className="mb-2 font-semibold text-slate-900">Recordes pessoais</h2>
        {records.length === 0 ? (
          <p className="text-sm text-slate-500">Ainda sem recordes registados.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {records.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="font-medium text-slate-800">{r.exercise.name}</span>
                <span className="text-sm text-slate-600">
                  {r.value} {r.unit ?? ""}
                  <span className="ml-2 text-xs text-slate-400">
                    {new Date(r.recordDate).toLocaleDateString("pt-PT")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-slate-900">Histórico de treinos</h2>
        {workouts.length === 0 ? (
          <p className="text-sm text-slate-500">Ainda sem treinos atribuídos.</p>
        ) : (
          <ul className="space-y-2">
            {workouts.map((w) => {
              const total = w.blocks.length;
              const done = w.blocks.filter((b) => b.results.length > 0).length;
              return (
                <li key={w.id}>
                  <Link
                    href={`/trainer/workouts/${w.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{w.title}</p>
                      <p className="text-xs text-slate-500">
                        {w.date ? new Date(w.date).toLocaleDateString("pt-PT") : "Sem data"}
                        {w.group ? ` · ${w.group.name}` : ""}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      {done}/{total} blocos
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
