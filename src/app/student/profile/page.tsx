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
import { getI18n } from "@/i18n/server";
import { formatDate } from "@/lib/dates";
import { DoneIcon, TargetIcon } from "@/components/icons";


export default async function ProfilePage() {
  const session = await requireStudent();
  const { t, intlLocale } = await getI18n();


  const student = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    include: {
      goals: {
        where: { status: { in: ["ACTIVE", "ACHIEVED"] } },
        orderBy: [{ status: "asc" }, { targetDate: "asc" }],
      },
    },
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
  const timeWorkouts = records.filter((r) => r.type === "TIME" || r.type === "REPS");

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

      {student.goals.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-slate-900"><TargetIcon className="mr-1.5" />{t("goals.studentTitle")}</h2>
          <ul className="space-y-1.5">
            {student.goals.map((goal) => (
              <li
                key={goal.id}
                className="flex items-baseline justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <span className={goal.status === "ACHIEVED" ? "text-slate-500 line-through" : "font-medium text-slate-900"}>
                  {goal.status === "ACHIEVED" && <DoneIcon className="mr-1 text-emerald-600" />}
                  {goal.title}
                </span>
                {goal.targetDate && (
                  <span className="shrink-0 text-xs text-slate-400">{formatDate(goal.targetDate, intlLocale)}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">{t("records.title")}</h2>
        <NewRecordForm
          exerciseNames={exercises.map((e) => e.name)}
          action={addPersonalRecordAction}
        />

        <div>
          <h3 className="mb-1.5 text-sm font-medium text-slate-500">{t("records.lifts")}</h3>
          {lifts.length === 0 ? (
            <p className="text-sm text-slate-400">{t("records.noLifts")}</p>
          ) : (
            <ul className="space-y-2">
              {lifts.map((r) => (
                <RecordItem
                  key={r.id}
                  record={{
                    id: r.id,
                    exerciseId: r.exerciseId,
                    exerciseName: r.reps && r.reps > 1 ? `${r.exercise.name} · ${t("benchmark.rm", { reps: r.reps })}` : r.exercise.name,
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
          <h3 className="mb-1.5 text-sm font-medium text-slate-500">{t("records.timed")}</h3>
          {timeWorkouts.length === 0 ? (
            <p className="text-sm text-slate-400">{t("records.noTimed")}</p>

          ) : (
            <ul className="space-y-2">
              {timeWorkouts.map((r) => (
                <RecordItem
                  key={r.id}
                  record={{
                    id: r.id,
                    exerciseId: r.exerciseId,
                    exerciseName: r.reps && r.reps > 1 ? `${r.exercise.name} · ${t("benchmark.rm", { reps: r.reps })}` : r.exercise.name,
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
