import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { ProfileDataForm } from "@/components/profile-data-form";
import { NewRecordForm } from "@/components/new-record-form";
import { RecordItem } from "@/components/record-item";
import { formatDate, parseDateKey, todayKey } from "@/lib/dates";
import { getI18n } from "@/i18n/server";
import { getStudentGroupIds, studentWorkoutsWhere, withoutOverridden } from "@/lib/workouts";
import {
  updateStudentProfileAction,
  addStudentRecordAction,
  updateStudentRecordAction,
  deleteStudentRecordAction,
} from "@/app/trainer/actions";

export default async function StudentProfileTabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireTrainer();
  const { t, intlLocale } = await getI18n();

  const student = await prisma.user.findFirst({
    where: { id, trainerId: session.user.id, role: "STUDENT" },
  });
  if (!student) notFound();

  const groupIds = await getStudentGroupIds(id);

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
    prisma.workout
      .findMany({
        where: {
          ...studentWorkoutsWhere(id, groupIds, { publishedOnly: true }),
          trainerId: session.user.id,
          date: { lte: parseDateKey(todayKey())! },
        },
        include: {
          group: true,
          completions: { where: { studentId: id } },
          blocks: {
            select: { _count: { select: { results: { where: { studentId: id } } } } },
          },
        },
        orderBy: { date: "desc" },
        take: 20,
      })
      .then((list) => withoutOverridden(list, id)),
  ]);

  const lifts = records.filter((r) => r.type === "WEIGHT");
  const timeWorkouts = records.filter((r) => r.type === "TIME");

  const boundUpdateProfile = updateStudentProfileAction.bind(null, student.id);
  const boundAddRecord = addStudentRecordAction.bind(null, student.id);

  return (
    <div className="space-y-6">
      <ProfileDataForm
        dateOfBirth={student.dateOfBirth}
        weightKg={student.weightKg}
        heightCm={student.heightCm}
        action={boundUpdateProfile}
      />

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">{t("records.title")}</h2>
        <NewRecordForm exerciseNames={exercises.map((e) => e.name)} action={boundAddRecord} />

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
        <h2 className="mb-2 font-semibold text-slate-900">{t("students.pastWorkouts")}</h2>
        {workouts.length === 0 ? (
          <p className="text-sm text-slate-500">{t("students.noPublishedWorkouts")}</p>
        ) : (
          <ul className="space-y-2">
            {workouts.map((w) => {
              const total = w.blocks.length;
              const done = w.blocks.filter((b) => b._count.results > 0).length;
              const completion = w.completions[0];
              return (
                <li key={w.id}>
                  <Link
                    href={`/trainer/workouts/${w.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{w.title}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(w.date, intlLocale)}
                        {w.group ? ` · ${w.group.name}` : ""}
                        {completion?.sessionRpe
                          ? ` · ${t("common.rpe", { value: completion.sessionRpe })}`
                          : ""}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        completion
                          ? "bg-emerald-100 text-emerald-700"
                          : done > 0
                            ? "bg-sky-100 text-sky-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {completion ? t("states.done") : t("students.blocksDone", { done, total })}

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
