import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/require-session";
import { NewRecordForm } from "@/components/new-record-form";
import { deletePersonalRecordAction } from "@/app/student/actions";

export default async function RecordsPage() {
  const session = await requireStudent();

  const student = await prisma.user.findUnique({ where: { id: session.user.id } });

  const [records, exercises] = await Promise.all([
    prisma.personalRecord.findMany({
      where: { studentId: session.user.id },
      include: { exercise: true },
      orderBy: { recordDate: "desc" },
    }),
    student?.trainerId
      ? prisma.exercise.findMany({
          where: { trainerId: student.trainerId },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Recordes pessoais</h1>

      <NewRecordForm exerciseNames={exercises.map((e) => e.name)} />

      {records.length === 0 ? (
        <p className="text-sm text-slate-500">Ainda não tens recordes registados.</p>
      ) : (
        <ul className="space-y-2">
          {records.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
            >
              <div>
                <Link
                  href={`/student/exercises/${r.exerciseId}/history`}
                  className="font-medium text-slate-900 hover:underline"
                >
                  {r.exercise.name}
                </Link>
                <p className="text-sm text-slate-600">
                  {r.value} {r.unit ?? ""}
                  <span className="ml-2 text-xs text-slate-400">
                    {new Date(r.recordDate).toLocaleDateString("pt-PT")}
                  </span>
                </p>
                {r.notes && <p className="text-xs italic text-slate-400">{r.notes}</p>}
              </div>
              <form action={deletePersonalRecordAction}>
                <input type="hidden" name="id" value={r.id} />
                <button type="submit" className="text-xs text-slate-400 hover:text-red-600">
                  Remover
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
