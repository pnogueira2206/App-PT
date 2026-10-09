import Link from "next/link";
import type { WorkoutBlock, Exercise } from "@prisma/client";
import { BLOCK_TYPE_STYLES, formatNumber, formatPrescription, loadFromPercent } from "@/lib/blocks";
import type { Translate } from "@/i18n/translator";

export function BlockView({
  block,
  index,
  oneRepMaxKg,
  exerciseHref,
  i18n,
}: {
  block: WorkoutBlock & { exercise: Exercise | null };
  index: number;
  /** When known, %1RM prescriptions are shown in kg too. */
  oneRepMaxKg?: number;
  /** Link for the exercise name (e.g. its history). */
  exerciseHref?: string;
  /** Translator from getI18n() (this is rendered by Server Components). */
  i18n: { t: Translate; intlLocale: string };
}) {
  const { t, intlLocale } = i18n;
  const num = (value: number) => formatNumber(value, intlLocale);
  const prescription = formatPrescription(block, i18n);
  const computedLoad =
    block.percent1RM && oneRepMaxKg ? loadFromPercent(oneRepMaxKg, block.percent1RM) : null;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2 pr-12">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {t("blocks.blockNumber", { number: index + 1 })}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${BLOCK_TYPE_STYLES[block.type]}`}>
          {t(`blocks.types.${block.type}`)}
        </span>
      </div>
      <h3 className="font-semibold text-slate-900">{block.title}</h3>

      {block.exercise && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {exerciseHref ? (
            <Link
              href={exerciseHref}
              className="text-slate-700 underline decoration-slate-300 underline-offset-2"
            >
              {block.exercise.name}
            </Link>
          ) : (
            <span className="text-slate-700">{block.exercise.name}</span>
          )}
          {block.exercise.videoUrl && (
            <a
              href={block.exercise.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-red-600 hover:text-red-800"
            >
              {t("common.watchVideo")}
            </a>
          )}
        </p>
      )}

      {prescription && <p className="text-sm font-medium text-slate-700">{prescription}</p>}

      {computedLoad != null && (
        <p className="inline-block rounded-md bg-sky-50 px-2 py-1 text-sm text-sky-900">
          {t("blocks.percentOfMax", { percent: num(block.percent1RM!), max: num(oneRepMaxKg!) })}{" "}
          <strong>{num(computedLoad)} kg</strong>

        </p>
      )}

      {block.description && (
        <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-2.5 font-mono text-sm text-slate-800">
          {block.description}
        </p>
      )}

      {block.trainerNotes && (
        <p className="text-sm italic text-slate-500">&ldquo;{block.trainerNotes}&rdquo;</p>
      )}
    </div>
  );
}
