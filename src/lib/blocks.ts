import type {
  BenchmarkKind,
  BlockType,
  CardioModality,
  ExerciseCategory,
  MetconFormat,
} from "@prisma/client";
import type { Translate } from "@/i18n/translator";

export const BLOCK_TYPES: BlockType[] = ["STRENGTH", "METCON", "ACCESSORY", "CARDIO"];
export const METCON_FORMATS: MetconFormat[] = ["FOR_TIME", "AMRAP", "EMOM", "FOR_REPS", "MAX_LOAD"];
export const CARDIO_MODALITIES: CardioModality[] = ["ROW", "RUN", "BIKE", "SKI", "OTHER"];
export const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  "STRENGTH",
  "WEIGHTLIFTING",
  "GYMNASTICS",
  "CARDIO",
  "MOBILITY",
  "OTHER",
];

export const BLOCK_TYPE_STYLES: Record<BlockType, string> = {
  STRENGTH: "bg-sky-100 text-sky-800",
  METCON: "bg-orange-100 text-orange-800",
  ACCESSORY: "bg-violet-100 text-violet-800",
  CARDIO: "bg-emerald-100 text-emerald-800",
};

/** Translator + Intl locale, from getI18n() or useI18n(). */
type I18n = { t: Translate; intlLocale: string };

export function isBlockType(value: string): value is BlockType {
  return (BLOCK_TYPES as string[]).includes(value);
}
export function isMetconFormat(value: string): value is MetconFormat {
  return (METCON_FORMATS as string[]).includes(value);
}
export function isCardioModality(value: string): value is CardioModality {
  return (CARDIO_MODALITIES as string[]).includes(value);
}
export function isExerciseCategory(value: string): value is ExerciseCategory {
  return (EXERCISE_CATEGORIES as string[]).includes(value);
}

/** Parses "mm:ss", "h:mm:ss" or plain seconds. Returns null for empty input, NaN for invalid. */
export function parseDuration(raw: string): number | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^\d+$/.test(value)) return Number(value);
  if (!/^\d+(:\d{1,2}){1,2}$/.test(value)) return NaN;
  const parts = value.split(":").map(Number);
  if (parts.slice(1).some((p) => p >= 60)) return NaN;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

export function formatNumber(value: number, locale: string): string {
  return value.toLocaleString(locale, { maximumFractionDigits: 2 });
}

/** Load for a percentage of a 1RM, rounded to the nearest 0.5 kg. */
export function loadFromPercent(oneRepMaxKg: number, percent: number): number {
  return Math.round((oneRepMaxKg * percent) / 100 / 0.5) * 0.5;
}

/** Pace per 500 m for rowing/ski, per km otherwise. */
export function formatPace(
  modality: CardioModality | null,
  timeSeconds: number,
  distanceM: number
): string | null {
  if (!timeSeconds || !distanceM) return null;
  const per = modality === "ROW" || modality === "SKI" ? 500 : 1000;
  const pace = Math.round((timeSeconds / distanceM) * per);
  return `${formatDuration(pace)}/${per === 500 ? "500m" : "km"}`;
}

export function formatDistance(meters: number, locale: string): string {
  return meters >= 1000 && meters % 100 === 0
    ? `${formatNumber(meters / 1000, locale)} km`
    : `${formatNumber(meters, locale)} m`;
}

type PrescriptionBlock = {
  type: BlockType;
  prescribedSets: number | null;
  prescribedReps: string | null;
  prescribedWeight: string | null;
  percent1RM: number | null;
  tempo: string | null;
  restSeconds: number | null;
  metconFormat: MetconFormat | null;
  timeCapSeconds: number | null;
  cardioModality: CardioModality | null;
  targetDistanceM: number | null;
  targetTimeSeconds: number | null;
  targetCalories: number | null;
  targetPace: string | null;
};

/** One-line summary of what the trainer prescribed. */
export function formatPrescription(block: PrescriptionBlock, { t, intlLocale }: I18n): string {
  const num = (value: number) => formatNumber(value, intlLocale);
  const parts: (string | null)[] = [];
  switch (block.type) {
    case "STRENGTH":
    case "ACCESSORY":
      if (block.prescribedSets && block.prescribedReps) {
        parts.push(`${block.prescribedSets} × ${block.prescribedReps}`);
      } else {
        parts.push(
          block.prescribedSets ? t("blocks.prescription.sets", { count: block.prescribedSets }) : null
        );
        parts.push(
          block.prescribedReps ? t("blocks.prescription.reps", { reps: block.prescribedReps }) : null
        );
      }
      parts.push(
        block.percent1RM ? t("blocks.prescription.percent", { value: num(block.percent1RM) }) : null
      );
      parts.push(block.prescribedWeight || null);
      parts.push(block.tempo ? t("blocks.prescription.tempo", { value: block.tempo }) : null);
      parts.push(
        block.restSeconds
          ? t("blocks.prescription.rest", { value: formatDuration(block.restSeconds) })
          : null
      );
      break;
    case "METCON":
      parts.push(block.metconFormat ? t(`blocks.metconFormats.${block.metconFormat}`) : null);
      if (block.timeCapSeconds) {
        const value = formatDuration(block.timeCapSeconds);
        parts.push(
          block.metconFormat === "AMRAP" || block.metconFormat === "EMOM"
            ? value
            : t("blocks.prescription.timeCap", { value })
        );
      }
      break;
    case "CARDIO":
      parts.push(block.cardioModality ? t(`blocks.cardioModalities.${block.cardioModality}`) : null);
      parts.push(block.targetDistanceM ? formatDistance(block.targetDistanceM, intlLocale) : null);
      parts.push(block.targetTimeSeconds ? formatDuration(block.targetTimeSeconds) : null);
      parts.push(
        block.targetCalories ? t("blocks.prescription.calories", { value: block.targetCalories }) : null
      );
      parts.push(block.targetPace ? t("blocks.prescription.pace", { value: block.targetPace }) : null);
      parts.push(
        block.restSeconds
          ? t("blocks.prescription.rest", { value: formatDuration(block.restSeconds) })
          : null
      );
      break;
  }
  return parts.filter(Boolean).join(" · ");
}

type ResultLike = {
  done: boolean;
  timeSeconds: number | null;
  rounds: number | null;
  reps: number | null;
  loadKg: number | null;
  distanceM: number | null;
  calories: number | null;
  rx: boolean | null;
  rpe: number | null;
  scoreText: string | null;
  sets: { setNumber: number; reps: number | null; loadKg: number | null }[];
};

/** One-line summary of a student's score. */
export function formatResult(
  block: {
    type: BlockType;
    metconFormat: MetconFormat | null;
    cardioModality: CardioModality | null;
    benchmark?: BenchmarkKind | null;
    benchmarkReps?: number | null;
  },
  result: ResultLike,
  { t, intlLocale }: I18n
): string {
  const num = (value: number) => formatNumber(value, intlLocale);
  const parts: (string | null)[] = [];
  if (!result.done) parts.push(t("blocks.result.notDone"));

  if (block.benchmark === "MAX_LOAD") {
    if (result.loadKg != null) parts.push(`${t("benchmark.rm", { reps: block.benchmarkReps ?? 1 })}: ${num(result.loadKg)} kg`);
  } else if (block.benchmark === "TIME") {
    if (result.timeSeconds != null) parts.push(formatDuration(result.timeSeconds));
  } else if (block.benchmark === "ROUNDS_REPS") {
    if (result.rounds != null) {
      parts.push(
        t("blocks.result.rounds", { count: result.rounds }) +
          (result.reps ? t("blocks.result.plusReps", { count: result.reps }) : "")
      );
    } else if (result.reps != null) {
      parts.push(t("blocks.result.reps", { count: result.reps }));
    }
  } else switch (block.type) {
    case "STRENGTH":
    case "ACCESSORY":
      if (result.sets.length > 0) {
        parts.push(
          [...result.sets]
            .sort((a, b) => a.setNumber - b.setNumber)
            .map((s) =>
              [s.reps != null ? `${s.reps}` : "–", s.loadKg != null ? `${num(s.loadKg)}kg` : null]
                .filter(Boolean)
                .join(" @ ")
            )
            .join(", ")
        );
      }
      break;
    case "METCON":
      if (result.timeSeconds != null) parts.push(formatDuration(result.timeSeconds));
      if (result.rounds != null) {
        parts.push(
          t("blocks.result.rounds", { count: result.rounds }) +
            (result.reps ? t("blocks.result.plusReps", { count: result.reps }) : "")
        );
      } else if (result.reps != null) {
        parts.push(t("blocks.result.reps", { count: result.reps }));
      }
      if (result.loadKg != null) parts.push(`${num(result.loadKg)} kg`);
      if (result.rx != null) parts.push(result.rx ? "Rx" : t("blocks.result.scaled"));
      break;
    case "CARDIO":
      if (result.timeSeconds != null) parts.push(formatDuration(result.timeSeconds));
      if (result.distanceM != null) parts.push(formatDistance(result.distanceM, intlLocale));
      if (result.calories != null) parts.push(t("blocks.prescription.calories", { value: result.calories }));
      if (result.timeSeconds && result.distanceM) {
        parts.push(formatPace(block.cardioModality, result.timeSeconds, result.distanceM));
      }
      break;
  }

  if (result.rpe != null) parts.push(t("common.rpe", { value: result.rpe }));
  if (result.scoreText) parts.push(result.scoreText);

  const summary = parts.filter(Boolean).join(" · ");
  return summary || (result.done ? t("blocks.result.done") : t("blocks.result.notDone"));
}

/** Extracts a numeric kg value from a free-text personal record value ("100", "100kg", "100,5 kg"). */
export function parseRecordKg(value: string, unit: string | null): number | null {
  if (unit && !/^kg$/i.test(unit.trim())) return null;
  const match = value.trim().match(/^(\d+(?:[.,]\d+)?)\s*(kg)?$/i);
  return match ? Number(match[1].replace(",", ".")) : null;
}

/** Short label of a benchmark block: "1RM", "Tempo", "Rondas/reps". */
export function benchmarkLabel(t: Translate, kind: BenchmarkKind, reps: number | null): string {
  if (kind === "MAX_LOAD") return t("benchmark.rm", { reps: reps ?? 1 });
  return kind === "TIME" ? t("benchmark.kindTime") : t("benchmark.kindRounds");
}
