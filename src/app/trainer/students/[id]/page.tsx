import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { ProfileDataForm } from "@/components/profile-data-form";
import { NewRecordForm } from "@/components/new-record-form";
import { RecordItem } from "@/components/record-item";
import {
  updateStudentProfileAction,
  addStudentRecordAction,
  updateStudentRecordAction,
  deleteStudentRecordAction,
} from "@/app/trainer/actions";

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

  const [records, exercises, workouts] = await Promise.all([
    prisma.personalRecord.findMany({
      where: { studentId: id },
      include: { exercise: true },
      orderBy: { recordDate: "desc" },
    }),
    prisma.exercise.findMany({
      where: { trainerId: session.user.id },
      orderBy: { name: "asc" },
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

  const lifts = records.filter((r) => r.type === "WEIGHT");
  const timeWorkouts = records.filter((r) => r.type === "TIME");

  const boundUpdateProfile = updateStudentProfileAction.bind(null, student.id);
  const boundAddRecord = addStudentRecordAction.bind(null, student.id);

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

      <ProfileDataForm
        dateOfBirth={student.dateOfBirth}
        weightKg={student.weightKg}
        heightCm={student.heightCm}
        action={boundUpdateProfile}
      />

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Recordes pessoais</h2>
        <NewRecordForm exerciseNames={exercises.map((e) => e.name)} action={boundAddRecord} />

        <div>
          <h3 className="mb-1.5 text-sm font-medium text-slate-500">Levantamentos</h3>
          {lifts.length === 0 ? (
            <p className="text-sm text-slate-400">Sem recordes de levantamentos.</p>
          ) : (
            <ul className="space-y-2">
              {lifts.map((r) => (
                <RecordItem
                  key={r.id}
                  record={{
                    id: r.id,
                    exerciseId: r.exerciseId,
                    exerciseName: r.exercise.name,
                    type: r.type,
                    value: r.value,
                    unit: r.unit,
                    notes: r.notes,
                    recordDate: r.recordDate,
                  }}
                  updateAction={updateStudentRecordAction.bind(null, student.id, r.id)}
                  deleteAction={deleteStudentRecordAction.bind(null, student.id, r.id)}
                />
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-1.5 text-sm font-medium text-slate-500">Treinos para tempo</h3>
          {timeWorkouts.length === 0 ? (
            <p className="text-sm text-slate-400">Sem recordes de treinos para tempo.</p>
          ) : (
            <ul className="space-y-2">
              {timeWorkouts.map((r) => (
                <RecordItem
                  key={r.id}
                  record={{
                    id: r.id,
                    exerciseId: r.exerciseId,
                    exerciseName: r.exercise.name,
                    type: r.type,
                    value: r.value,
                    unit: r.unit,
                    notes: r.notes,
                    recordDate: r.recordDate,
                  }}
                  updateAction={updateStudentRecordAction.bind(null, student.id, r.id)}
                  deleteAction={deleteStudentRecordAction.bind(null, student.id, r.id)}
                />
              ))}
            </ul>
          )}
        </div>
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
