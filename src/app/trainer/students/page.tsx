import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { NewStudentForm } from "@/components/new-student-form";
import { getI18n } from "@/i18n/server";
import { getStudentStats } from "@/lib/adherence";
import { AdherencePills } from "@/components/adherence";


export default async function StudentsPage() {
  const session = await requireTrainer();
  const { t } = await getI18n();

  const students = await prisma.user.findMany({
    where: { trainerId: session.user.id, role: "STUDENT" },
    orderBy: { name: "asc" },
    include: {
      memberships: { include: { group: true } },
    },
  });

  const stats = await getStudentStats(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">{t("students.title")}</h1>
        <NewStudentForm />
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-slate-500">{t("students.empty")}</p>

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
                  {stats.get(student.id) && (
                    <div className="mt-1">
                      <AdherencePills stats={stats.get(student.id)!} t={t} />
                    </div>
                  )}
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
