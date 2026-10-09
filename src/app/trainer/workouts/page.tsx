import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { formatDate } from "@/lib/dates";
import { getI18n } from "@/i18n/server";

export default async function WorkoutsPage() {
  const session = await requireTrainer();
  const { t, intlLocale } = await getI18n();

  const workouts = await prisma.workout.findMany({
    where: { trainerId: session.user.id, kind: "TRAINING" },
    include: { group: true, student: true, _count: { select: { blocks: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("workouts.title")}</h1>
          <p className="text-sm text-slate-500">{t("workouts.hint")}</p>
        </div>
        <Link
          href="/trainer/workouts/new"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-hover"
        >
          {t("workouts.newWorkout")}
        </Link>
      </div>

      {workouts.length === 0 ? (
        <p className="text-sm text-slate-500">{t("workouts.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {workouts.map((w) => (
            <li key={w.id}>
              <Link
                href={`/trainer/workouts/${w.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {w.title}
                    {w.status === "DRAFT" && (
                      <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-normal text-amber-800">
                        {t("common.draft")}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {w.group ? `👥 ${w.group.name}` : (w.student?.name ?? t("common.noTarget"))}
                    {w.sourceWorkoutId ? t("workouts.adjustedSuffix") : ""} ·{" "}
                    {t("common.blocks", { count: w._count.blocks })}
                  </p>
                </div>
                <span className="text-xs text-slate-400 first-letter:uppercase">
                  {formatDate(w.date, intlLocale, { weekday: "short", day: "numeric", month: "short" })}

                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
