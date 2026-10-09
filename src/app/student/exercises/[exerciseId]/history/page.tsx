import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/require-session";
import { formatDate } from "@/lib/dates";
import { formatResult } from "@/lib/blocks";
import { getI18n } from "@/i18n/server";

export default async function ExerciseHistoryPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  const session = await requireStudent();
  const i18n = await getI18n();
  const { t, intlLocale } = i18n;

  const student = await prisma.user.findUnique({ where: { id: session.user.id } });

  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, trainerId: student?.trainerId ?? undefined },
  });
  if (!exercise) notFound();

  const [results, records] = await Promise.all([
    prisma.blockResult.findMany({
      where: { studentId: session.user.id, block: { exerciseId } },
      include: { block: { include: { workout: true } }, sets: true },
      orderBy: { block: { workout: { date: "desc" } } },
    }),
    prisma.personalRecord.findMany({
      where: { studentId: session.user.id, exerciseId },
      orderBy: { recordDate: "desc" },
    }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/student/profile" className="text-sm text-slate-500 hover:text-slate-900">
          {t("common.back")}
        </Link>
        <h1 className="mt-1 text-xl font-bold text-slate-900">{exercise.name}</h1>
        {exercise.videoUrl && (
          <a
            href={exercise.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-red-600 hover:text-red-800"
          >
            {t("history.watchDemo")}
          </a>
        )}
        {exercise.notes && <p className="mt-1 text-sm text-slate-600">{exercise.notes}</p>}
      </div>

      {records.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-slate-900">{t("history.records")}</h2>
          <ul className="space-y-1.5">
            {records.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-800">
                  {r.value} {r.unit ?? ""}
                </span>
                <span className="text-xs text-slate-400">
                  {formatDate(r.recordDate, intlLocale)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-semibold text-slate-900">{t("history.results")}</h2>
        {results.length === 0 ? (
          <p className="text-sm text-slate-500">{t("history.empty")}</p>
        ) : (
          <ul className="space-y-2">
            {results.map((r) => (
              <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">
                    {r.block.workout.title}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDate(r.block.workout.date, intlLocale)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{formatResult(r.block, r, i18n)}</p>

                {r.studentNotes && (
                  <p className="mt-1 text-xs italic text-slate-400">{r.studentNotes}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
