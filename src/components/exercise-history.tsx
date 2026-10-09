import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/dates";
import { formatResult } from "@/lib/blocks";
import type { Translate } from "@/i18n/translator";
import { ProgressChart, type ProgressPoint } from "@/components/progress-chart";

/** Records, progress charts and logged results of one exercise for one student. */
export async function ExerciseHistory({
  studentId,
  exercise,
  backHref,
  i18n,
}: {
  studentId: string;
  exercise: { id: string; name: string; videoUrl: string | null; notes: string | null };
  backHref: string;
  i18n: { t: Translate; intlLocale: string };
}) {
  const { t, intlLocale } = i18n;

  const [results, records] = await Promise.all([
    prisma.blockResult.findMany({
      where: { studentId, block: { exerciseId: exercise.id } },
      include: { block: { include: { workout: true } }, sets: true },
      orderBy: { block: { workout: { date: "desc" } } },
    }),
    prisma.personalRecord.findMany({
      where: { studentId, exerciseId: exercise.id },
      orderBy: { recordDate: "desc" },
    }),
  ]);

  // One point per session: heaviest load (strength / max load) or finished time (for time).
  const loadPoints: ProgressPoint[] = [];
  const timePoints: ProgressPoint[] = [];
  for (const r of [...results].reverse()) {
    if (!r.done) continue;
    const date = r.block.workout.date;
    if (r.block.type === "STRENGTH") {
      const loads = r.sets.filter((s) => (s.reps ?? 0) >= 1 && s.loadKg).map((s) => s.loadKg!);
      if (loads.length > 0) loadPoints.push({ date, value: Math.max(...loads) });
    } else if (r.block.type === "METCON" && r.block.metconFormat === "MAX_LOAD" && r.loadKg) {
      loadPoints.push({ date, value: r.loadKg });
    } else if (
      r.block.type === "METCON" &&
      r.block.metconFormat === "FOR_TIME" &&
      r.timeSeconds &&
      r.reps == null
    ) {
      timePoints.push({ date, value: r.timeSeconds });
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href={backHref} className="text-sm text-slate-500 hover:text-slate-900">
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

      {(loadPoints.length >= 2 || timePoints.length >= 2) && (
        <section className="space-y-3">
          <h2 className="font-semibold text-slate-900">{t("chart.title")}</h2>
          {loadPoints.length >= 2 && <ProgressChart title={t("chart.bestLoad")} points={loadPoints} kind="load" />}
          {timePoints.length >= 2 && <ProgressChart title={t("chart.time")} points={timePoints} kind="time" />}
        </section>
      )}

      {records.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-slate-900">{t("history.records")}</h2>
          <ul className="space-y-1.5">
            {records.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                <span className="font-medium text-slate-800">
                  {r.sourceResultId ? "🏆 " : ""}
                  {r.value} {r.unit ?? ""}
                </span>
                <span className="text-xs text-slate-400">{formatDate(r.recordDate, intlLocale)}</span>
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
                  <span className="text-sm font-medium text-slate-800">{r.block.workout.title}</span>
                  <span className="text-xs text-slate-400">{formatDate(r.block.workout.date, intlLocale)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{formatResult(r.block, r, i18n)}</p>
                {r.studentNotes && <p className="mt-1 text-xs italic text-slate-400">{r.studentNotes}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
