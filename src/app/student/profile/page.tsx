import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/require-session";
import { ProfileDataForm } from "@/components/profile-data-form";
import { NewRecordForm } from "@/components/new-record-form";
import { RecordItem } from "@/components/record-item";
import {
  updateProfileAction,
  addPersonalRecordAction,
  updatePersonalRecordAction,
  deletePersonalRecordAction,
} from "@/app/student/actions";

export default async function ProfilePage() {
  const session = await requireStudent();

  const student = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });

  const [records, exercises] = await Promise.all([
    prisma.personalRecord.findMany({
      where: { studentId: session.user.id },
      include: { exercise: true },
      orderBy: { recordDate: "desc" },
    }),
    student.trainerId
      ? prisma.exercise.findMany({
          where: { trainerId: student.trainerId },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const lifts = records.filter((r) => r.type === "WEIGHT");
  const timeWorkouts = records.filter((r) => r.type === "TIME");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{student.name}</h1>
        <p className="text-sm text-slate-500">{student.email}</p>
      </div>

      <ProfileDataForm
        dateOfBirth={student.dateOfBirth}
        weightKg={student.weightKg}
        heightCm={student.heightCm}
        action={updateProfileAction}
      />

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Recordes pessoais</h2>
        <NewRecordForm
          exerciseNames={exercises.map((e) => e.name)}
          action={addPersonalRecordAction}
        />

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
                  updateAction={updatePersonalRecordAction.bind(null, r.id)}
                  deleteAction={deletePersonalRecordAction.bind(null, r.id)}
                  historyHref={`/student/exercises/${r.exerciseId}/history`}
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
                  updateAction={updatePersonalRecordAction.bind(null, r.id)}
                  deleteAction={deletePersonalRecordAction.bind(null, r.id)}
                  historyHref={`/student/exercises/${r.exerciseId}/history`}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
