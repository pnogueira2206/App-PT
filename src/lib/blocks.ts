import type {
  BlockType,
  CardioModality,
  ExerciseCategory,
  MetconFormat,
} from "@prisma/client";

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  STRENGTH: "Força",
  METCON: "Metcon",
  ACCESSORY: "Acessórios / mobilidade",
  CARDIO: "Cardio / endurance",
};

export const BLOCK_TYPE_STYLES: Record<BlockType, string> = {
  STRENGTH: "bg-sky-100 text-sky-800",
  METCON: "bg-orange-100 text-orange-800",
  ACCESSORY: "bg-violet-100 text-violet-800",
  CARDIO: "bg-emerald-100 text-emerald-800",
};

export const METCON_FORMAT_LABELS: Record<MetconFormat, string> = {
  FOR_TIME: "For Time",
  AMRAP: "AMRAP",
  EMOM: "EMOM",
  FOR_REPS: "For Reps",
  MAX_LOAD: "Carga máxima",
};

export const CARDIO_MODALITY_LABELS: Record<CardioModality, string> = {
  ROW: "Remo",
  RUN: "Corrida",
  BIKE: "Bike",
  SKI: "Ski",
  OTHER: "Outro",
};

export const EXERCISE_CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  STRENGTH: "Força",
  WEIGHTLIFTING: "Halterofilia",
  GYMNASTICS: "Ginástica",
  CARDIO: "Cardio",
  MOBILITY: "Mobilidade",
  OTHER: "Outro",
};

export function isBlockType(value: string): value is BlockType {
  return value in BLOCK_TYPE_LABELS;
}
export function isMetconFormat(value: string): value is MetconFormat {
  return value in METCON_FORMAT_LABELS;
}
export function isCardioModality(value: string): value is CardioModality {
  return value in CARDIO_MODALITY_LABELS;
}
export function isExerciseCategory(value: string): value is ExerciseCategory {
  return value in EXERCISE_CATEGORY_LABELS;
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

export function formatNumber(value: number): string {
  return value.toLocaleString("pt-PT", { maximumFractionDigits: 2 });
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

export function formatDistance(meters: number): string {
  return meters >= 1000 && meters % 100 === 0
    ? `${formatNumber(meters / 1000)} km`
    : `${formatNumber(meters)} m`;
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
export function formatPrescription(block: PrescriptionBlock): string {
  const parts: (string | null)[] = [];
  switch (block.type) {
    case "STRENGTH":
    case "ACCESSORY":
      if (block.prescribedSets && block.prescribedReps) {
        parts.push(`${block.prescribedSets} × ${block.prescribedReps}`);
      } else {
        parts.push(block.prescribedSets ? `${block.prescribedSets} séries` : null);
        parts.push(block.prescribedReps ? `${block.prescribedReps} reps` : null);
      }
      parts.push(block.percent1RM ? `@ ${formatNumber(block.percent1RM)}% 1RM` : null);
      parts.push(block.prescribedWeight || null);
      parts.push(block.tempo ? `tempo ${block.tempo}` : null);
      parts.push(block.restSeconds ? `${formatDuration(block.restSeconds)} descanso` : null);
      break;
    case "METCON":
      parts.push(block.metconFormat ? METCON_FORMAT_LABELS[block.metconFormat] : null);
      if (block.timeCapSeconds) {
        const label =
          block.metconFormat === "AMRAP" || block.metconFormat === "EMOM"
            ? formatDuration(block.timeCapSeconds)
            : `time cap ${formatDuration(block.timeCapSeconds)}`;
        parts.push(label);
      }
      break;
    case "CARDIO":
      parts.push(block.cardioModality ? CARDIO_MODALITY_LABELS[block.cardioModality] : null);
      parts.push(block.targetDistanceM ? formatDistance(block.targetDistanceM) : null);
      parts.push(block.targetTimeSeconds ? formatDuration(block.targetTimeSeconds) : null);
      parts.push(block.targetCalories ? `${block.targetCalories} cal` : null);
      parts.push(block.targetPace ? `pace ${block.targetPace}` : null);
      parts.push(block.restSeconds ? `${formatDuration(block.restSeconds)} descanso` : null);
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
  block: { type: BlockType; metconFormat: MetconFormat | null; cardioModality: CardioModality | null },
  result: ResultLike
): string {
  const parts: (string | null)[] = [];
  if (!result.done) parts.push("Não feito");

  switch (block.type) {
    case "STRENGTH":
    case "ACCESSORY":
      if (result.sets.length > 0) {
        parts.push(
          [...result.sets]
            .sort((a, b) => a.setNumber - b.setNumber)
            .map((s) =>
              [s.reps != null ? `${s.reps}` : "–", s.loadKg != null ? `${formatNumber(s.loadKg)}kg` : null]
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
        parts.push(`${result.rounds} rondas${result.reps ? ` + ${result.reps} reps` : ""}`);
      } else if (result.reps != null) {
        parts.push(`${result.reps} reps`);
      }
      if (result.loadKg != null) parts.push(`${formatNumber(result.loadKg)} kg`);
      if (result.rx != null) parts.push(result.rx ? "Rx" : "Scaled");
      break;
    case "CARDIO":
      if (result.timeSeconds != null) parts.push(formatDuration(result.timeSeconds));
      if (result.distanceM != null) parts.push(formatDistance(result.distanceM));
      if (result.calories != null) parts.push(`${result.calories} cal`);
      if (result.timeSeconds && result.distanceM) {
        parts.push(formatPace(block.cardioModality, result.timeSeconds, result.distanceM));
      }
      break;
  }

  if (result.rpe != null) parts.push(`RPE ${result.rpe}`);
  if (result.scoreText) parts.push(result.scoreText);

  const summary = parts.filter(Boolean).join(" · ");
  return summary || (result.done ? "Feito" : "Não feito");
}

/** Extracts a numeric kg value from a free-text personal record value ("100", "100kg", "100,5 kg"). */
export function parseRecordKg(value: string, unit: string | null): number | null {
  if (unit && !/^kg$/i.test(unit.trim())) return null;
  const match = value.trim().match(/^(\d+(?:[.,]\d+)?)\s*(kg)?$/i);
  return match ? Number(match[1].replace(",", ".")) : null;
}
