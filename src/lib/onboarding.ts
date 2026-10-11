/**
 * PN Coaching "Athlete Onboarding" questionnaire, reproduced from the coach's
 * spreadsheet (Athlete_Onboarding.xlsx) without changes: same sheets, items,
 * texts, scales, summary and strength ratios. Answers are stored as JSON
 * (Onboarding.data) keyed by the ids below, so keep ids stable.
 */

export const HEADER = "PEDRO NOGUEIRA COACHING - ATHLETE ONBOARDING";

export type Scale = { value: number; label: string; description: string }[];

// ---------- Sheet "Athlete Profile" ----------

export const PROFILE = {
  title: "ATHLETE PROFILE",
  fields: { dateOfBirth: "Data Nascimento", height: "Altura", weight: "Peso" },
};

// ---------- Sheet "Movement Self-Assessment" ----------

const HEAVY = "Pesado | 1-RM, cargas próximas do 1RM";
const MODERATE_CYCLING = "Moderado | Cargas de WOD, cycling";
const MODERATE = "Moderado | Cargas de WOD";
const LIGHT = "Leve | Volume alto, KB/DB Snatch";

export type MovementRow = { id: string; movement: string; context: string | null };
export type MovementGroup = { id: string; title: string; rows: MovementRow[] };
export type MovementSection = { title: string; groups: MovementGroup[] };

function movement(id: string, name: string, contexts: [string, string][] | null): MovementRow[] {
  if (!contexts) return [{ id, movement: name, context: null }];
  return contexts.map(([suffix, context], i) => ({
    id: `${id}-${suffix}`,
    // The spreadsheet only names the movement on its first row.
    movement: i === 0 ? name : "",
    context,
  }));
}

export const MOVEMENT = {
  title: "01 - MOVEMENT SELF-ASSESSMENT",
  intro:
    "Avalia cada movimento de 1-5 com base no teu nível competitivo atual. Sê honesto - isto não é um teste, é uma ferramenta para podermos direcionar melhor o teu treino",
  scale: [
    { value: 1, label: "Limitador significativo", description: "Consistentemente falho neste movimento em competição" },
    { value: 2, label: "Fraqueza", description: "Abaixo da média relativamente ao meu nível competitivo atual" },
    { value: 3, label: "Na média", description: "Competente mas não me diferencio" },
    { value: 4, label: "Força", description: "Acima da média relativamente ao meu nível competitivo atual" },
    { value: 5, label: "Elite", description: "No topo relativamente ao meu nível competitivo atual" },
  ] satisfies Scale,
  columns: { movement: "MOVIMENTO", context: "CONTEXTO", rating: "CLASSIFICAÇÃO", notes: "NOTAS (OPCIONAL)" },
  sections: [
    {
      title: "FORÇA",
      groups: [
        {
          id: "weightlifting",
          title: "Halterofilismo",
          rows: [
            ...movement("snatch", "Snatch", [["heavy", HEAVY], ["moderate", MODERATE_CYCLING], ["light", LIGHT]]),
            ...movement("clean-jerk", "Clean and Jerk", [["heavy", HEAVY], ["moderate", MODERATE_CYCLING], ["light", LIGHT]]),
            ...movement("clean", "Clean", [["heavy", HEAVY], ["moderate", MODERATE_CYCLING], ["light", LIGHT]]),
            ...movement("jerk", "Jerk", [["heavy", HEAVY], ["moderate", MODERATE_CYCLING], ["light", LIGHT]]),
          ],
        },
        {
          id: "squatting",
          title: "Squatting",
          rows: [
            ...movement("back-squat", "Back Squat", [["heavy", HEAVY]]),
            ...movement("front-squat", "Front Squat", [["heavy", HEAVY], ["moderate", MODERATE]]),
            ...movement("overhead-squat", "Overhead Squat", [["heavy", HEAVY], ["moderate", MODERATE], ["light", LIGHT]]),
            ...movement("thruster", "Thruster", [["heavy", HEAVY], ["moderate", MODERATE], ["light", LIGHT]]),
            ...movement("wallball", "Wallball", [["moderate", MODERATE]]),
          ],
        },
        { id: "hinging", title: "Hinging", rows: movement("deadlift", "Deadlift", [["heavy", HEAVY], ["moderate", MODERATE]]) },
        {
          id: "pressing",
          title: "Pressing",
          rows: [
            ...movement("bench-press", "Bench Press", [["heavy", HEAVY]]),
            ...movement("strict-press", "Strict Press", [["heavy", HEAVY]]),
          ],
        },
        { id: "pulling", title: "Pulling", rows: movement("weighted-pull-up", "Weighted Pull-Up", [["heavy", HEAVY]]) },
      ],
    },
    {
      title: "GINÁSTICA",
      groups: [
        {
          id: "gym-pull",
          title: "Puxar",
          rows: [
            ...movement("rmu", "RMU", null),
            ...movement("bmu", "BMU", null),
            ...movement("c2b", "C2B", null),
            ...movement("rope-climb", "Rope Climb", null),
            ...movement("legless-rc", "Legless RC", null),
          ],
        },
        {
          id: "gym-push",
          title: "Empurrar",
          rows: [
            ...movement("hspu", "HSPU", null),
            ...movement("n2w-hspu", "N2W HSPU", null),
            ...movement("hsw", "HSW", null),
            ...movement("wall-walk", "Wall Walk", null),
          ],
        },
        {
          id: "gym-core",
          title: "Core",
          rows: [...movement("t2b", "T2B", null), ...movement("ghd-sit-up", "GHD Sit-Up", null)],
        },
      ],
    },
    {
      title: "CONDICIONAMENTO",
      groups: [
        {
          id: "bodyweight",
          title: "Peso Corporal",
          rows: [...movement("double-unders", "Double-Unders", null), ...movement("burpee", "Burpee", null)],
        },
        {
          id: "cyclical",
          title: "Cíclico",
          rows: [
            ...movement("run", "Corrida", [
              ["short", "Curto | Sprints (ex: 400m)"],
              ["medium", "Médio | Distâncias médias (ex: 3km)"],
              ["long", "Longo | Distâncias longas (ex: 10km)"],
            ]),
            ...(["row:Remo", "echo-bike:Echo Bike", "bike-erg:Bike Erg", "ski:Ski", "swim:Natação"] as const).flatMap(
              (entry) => {
                const [id, name] = entry.split(":");
                return movement(id, name, [["short", "Curto"], ["medium", "Médio"], ["long", "Longo"]]);
              }
            ),
          ],
        },
      ],
    },
  ] satisfies MovementSection[],
};

// ---------- Sheet "Max Lifts / Benchmarks" ----------

export type LiftRow = { id: string; name: string };
export type LiftGroup = { title: string; rows: LiftRow[] };

const lifts = (names: [string, string][]): LiftRow[] => names.map(([id, name]) => ({ id, name }));

export const MAX_LIFTS = {
  title: "02 - MAX LIFTS / BENCHMARKS",
  levels: ["NÍVEL OPEN", "NÍVEL QF", "NÍVEL SF", "NÍVEL GAMES"] as const,
  liftColumns: { movement: "MOVIMENTO", value: "1RM", date: "DATA (OPCIONAL)" },
  testColumns: { movement: "TESTE", value: "TEMPO", date: "DATA (OPCIONAL)" },
  liftGroups: [
    {
      title: "Halterofilismo",
      rows: lifts([
        ["squat-snatch", "Squat Snatch"],
        ["power-snatch", "Power Snatch"],
        ["clean-and-jerk", "Clean and Jerk"],
        ["squat-clean", "Squat Clean"],
        ["power-clean", "Power Clean"],
        ["split-jerk", "Split Jerk"],
        ["push-jerk", "Push Jerk"],
        ["push-press", "Push Press"],
      ]),
    },
    {
      title: "Força Máxima",
      rows: lifts([
        ["deadlift", "Deadlift"],
        ["back-squat", "Back Squat"],
        ["front-squat", "Front Squat"],
        ["overhead-squat", "Overhead Squat"],
        ["thruster", "Thruster"],
        ["bench-press", "Bench Press"],
        ["strict-press", "Strict Press"],
        ["wtd-pull-up", "Wtd Pull-Up"],
      ]),
    },
    { title: "Ginástica ???", rows: [] },
  ] satisfies LiftGroup[],
  testGroups: [
    {
      title: "Condicionamento",
      rows: lifts([
        ["run-1-mile", "Corrida 1 milha"],
        ["run-5k", "Corrida 5km"],
        ["run-10k", "Corrida 10km"],
        ["row-1k", "Remo 1km"],
        ["row-2k", "Remo 2km"],
        ["row-5k", "Remo 5km"],
        ["echo-bike-10min", "Echo Bike 10min (cals)"],
        ["bike-erg-20min-ftp", "Bike Erg 20min FTP (watts)"],
        ["ski-1k", "Ski 1km"],
        ["ski-2k", "Ski 2km"],
        ["ski-5k", "Ski 5km"],
        ["swim", "Natação ???"],
      ]),
    },
  ] satisfies LiftGroup[],
};

// ---------- Sheet "Mental Performance Self-Assessment" ----------

export const MENTAL = {
  title: "03 - MENTAL PERFORMANCE SELF ASSESSMENT",
  intro:
    "Avalia cada skill mental de 1-5. Sê honesto - isto não é um teste, é uma ferramenta para podermos direcionar melhor o teu treino",
  scale: [
    { value: 1, label: "Desafio significante", description: "Isto regularmente prejudica o meu desempenho" },
    { value: 2, label: "Em desenvolvimento", description: "Tenho dificuldades com isto na maioria das vezes" },
    { value: 3, label: "Moderado", description: "Inconsistente - umas vezes efetivo, outras vezes não" },
    { value: 4, label: "Força", description: "Sou efetivo nisto na maioria das vezes" },
    { value: 5, label: "Elite", description: "Isto é uma ponto forte mental consistente" },
  ] satisfies Scale,
  columns: { category: "CATEGORIA", skill: "SKILL MENTAL", rating: "CLASSIFICAÇÃO", notes: "NOTAS (OPCIONAL)" },
  categories: [
    {
      title: "Regulação da Ativação e Gestão do Stress",
      skills: [
        "Gerir o nervosismo / a ansiedade pré-competição",
        "Controlar a intensidade durante os treinos (gestão do ritmo vs. ir ao limite)",
        "Manter a compostura quando um treino não está a correr como planeado",
        "Recuperar de erros a meio da prova",
      ],
    },
    {
      title: "Foco e Concentração",
      skills: [
        "Manter o foco durante treinos longos (12+ min)",
        "Bloquear distrações em ambiente de competição",
        "Manter-se no presente, sem olhar para a classificação / resultados a meio da prova",
        "Manter o foco em movimentos técnicos sob fadiga",
      ],
    },
    {
      title: "Confiança e Autoconfiança",
      skills: [
        "Confiança ao abordar provas com pontos fracos conhecidos",
        "Confiar na sua condição física no dia da competição",
        "Diálogo interno positivo sob pressão",
        "Acreditar na trajetória de desenvolvimento a longo prazo",
      ],
    },
    {
      title: "Motivação e Compromisso",
      skills: [
        "Consistência nos treinos quando a motivação está em baixo",
        "Disponibilidade para treinar os pontos fracos em vez de apostar só nos pontos fortes",
        "Manter o esforço ao longo de um fim de semana de competição completo",
        "Compromisso a longo prazo com o processo em vez de resultados a curto prazo",
      ],
    },
    {
      title: "Competitividade e Mentalidade de Desempenho",
      skills: [
        "Capacidade de elevar o nível de desempenho em competição vs. treino",
        "Reação a estar atrás / a perder",
        "Usar os adversários como motivação sem se tornar reativo",
        "Aceitar o desconforto / sofrimento nos treinos",
      ],
    },
    {
      title: "Comunicação e Habilidade de Ser Treinado",
      skills: [
        "Abertura ao feedback e aos ajustes do treinador",
        "Comunicar com honestidade o estado do treino / da recuperação",
        "Autoconsciência do estado físico e mental",
        "Confiança no processo de treino",
      ],
    },
  ].map((category, c) => ({
    ...category,
    skills: category.skills.map((text, s) => ({ id: `mental-${c + 1}-${s + 1}`, text })),
  })),
};

// ---------- Sheet "Goal Setting" ----------

export const VALUES = {
  title: "04 - IDENTIFICAÇÃO DOS VALORES CENTRAIS",
  intro:
    "Os teus valores guiam o porquê de treinares e competires. Escolhe 3-5 valores da lista de exemplos abaixo ou escolhe os teus",
  examplesTitle: "Exemplos de valores:",
  examples:
    "Excelência · Crescimento · Disciplina · Resiliência · Comunidade · Saúde/Longevidade · Competição · Maestria · Alegria/Entusiasmo · Autonomia · Liderança · Gratidão · Equilíbrio · Honestidade · Coragem · Consistência · Integridade · Autenticidade · Responsabilidade · Curiosidade · Contribuição · Gratidão · Humildade · Confiança · Perseverança · Fé · Respeito · Serviço · Adaptabilidade · Confiança · Foco · Paciência · Autoconsciência · Trabalho árduo · Propósito · Compromisso",
  valueColumn: "O TEU VALOR",
  whyColumn: "PORQUE É IMPORTANTE PARA TI?",
  count: 5,
  label: (n: number) => `VALOR ${n}`,
};

export const GOALS = {
  title: "05 - OBJETIVOS",
  intro: "Define 1-2 objetivos para as próximas épocas. Depois identifica os principais obstáculos entre ti e cada objetivo.",
  count: 2,
  label: (n: number) => `OBJETIVO ${n}`,
  fields: { goal: "OBJETIVO", until: "ATÉ QUANDO?", obstacles: "OBSTÁCULO(S)" },
};

// ---------- Answers ----------

export type Rated = { rating?: number; notes?: string };
export type Measured = { value?: string; date?: string };
export type OnboardingData = {
  movement: Record<string, Rated>;
  lifts: Record<string, Measured>;
  mental: Record<string, Rated>;
  values: { value?: string; why?: string }[];
  goals: { goal?: string; until?: string; obstacles?: string }[];
};
/** Reference levels per lift/test, set by the coach: [open, qf, sf, games]. */
export type Levels = Record<string, string[]>;

export const EMPTY_ONBOARDING: OnboardingData = { movement: {}, lifts: {}, mental: {}, values: [], goals: [] };

const MOVEMENT_IDS = new Set(MOVEMENT.sections.flatMap((s) => s.groups.flatMap((g) => g.rows.map((r) => r.id))));
const LIFT_IDS = new Set([...MAX_LIFTS.liftGroups, ...MAX_LIFTS.testGroups].flatMap((g) => g.rows.map((r) => r.id)));
const MENTAL_IDS = new Set(MENTAL.categories.flatMap((c) => c.skills.map((s) => s.id)));

const text = (value: unknown, max: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;
const rating = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5 ? value : undefined;
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

/** Keeps only known items and well-formed values (input comes from the client). */
export function sanitizeOnboarding(raw: unknown): OnboardingData {
  const input = record(raw);
  const rated = (source: unknown, ids: Set<string>) => {
    const out: Record<string, Rated> = {};
    for (const [id, entry] of Object.entries(record(source))) {
      if (!ids.has(id)) continue;
      const e = record(entry);
      const item = { rating: rating(e.rating), notes: text(e.notes, 500) };
      if (item.rating != null || item.notes) out[id] = item;
    }
    return out;
  };
  const lifts: Record<string, Measured> = {};
  for (const [id, entry] of Object.entries(record(input.lifts))) {
    if (!LIFT_IDS.has(id)) continue;
    const e = record(entry);
    const item = { value: text(e.value, 40), date: text(e.date, 10) };
    if (item.value || item.date) lifts[id] = item;
  }
  const list = (source: unknown, count: number) => (Array.isArray(source) ? source.slice(0, count) : []).map(record);
  return {
    movement: rated(input.movement, MOVEMENT_IDS),
    lifts,
    mental: rated(input.mental, MENTAL_IDS),
    values: list(input.values, VALUES.count).map((v) => ({ value: text(v.value, 100), why: text(v.why, 1000) })),
    goals: list(input.goals, GOALS.count).map((g) => ({
      goal: text(g.goal, 500),
      until: text(g.until, 100),
      obstacles: text(g.obstacles, 1000),
    })),
  };
}

export function sanitizeLevels(raw: unknown): Levels {
  const out: Levels = {};
  for (const [id, entry] of Object.entries(record(raw))) {
    if (!LIFT_IDS.has(id) || !Array.isArray(entry)) continue;
    const values = MAX_LIFTS.levels.map((_, i) => text(entry[i], 40) ?? "");
    if (values.some(Boolean)) out[id] = values;
  }
  return out;
}

// ---------- Sheet "Onboarding Summary" ----------

const heavyWeightlifting = ["snatch-heavy", "clean-jerk-heavy", "clean-heavy", "jerk-heavy"];
const groupRows = (groupId: string) =>
  MOVEMENT.sections.flatMap((s) => s.groups).find((g) => g.id === groupId)!.rows.map((r) => r.id);

export const SUMMARY = {
  title: "PEDRO NOGUEIRA COACHING - ATHLETE ONBOARDING SUMMARY",
  section: "01 - MOVEMENT ASSESSMENT",
  columns: { category: "CATEGORIA", average: "MÉDIA (1-5)" },
  strongest: "Áreas mais desenvolvidas",
  weakest: "Áreas a desenvolver",
  categories: [
    { label: "Halterofilismo (pesado)", ids: heavyWeightlifting },
    { label: "Halterofilismo (mod/leve)", ids: groupRows("weightlifting").filter((id) => !heavyWeightlifting.includes(id)) },
    { label: "Squatting", ids: groupRows("squatting") },
    { label: "Hinge", ids: groupRows("hinging") },
    { label: "Pressing", ids: groupRows("pressing") },
    { label: "Pulling", ids: groupRows("pulling") },
    { label: "Gin - Puxar", ids: groupRows("gym-pull") },
    { label: "Gin - Empurrar", ids: groupRows("gym-push") },
    { label: "Gin - Core", ids: groupRows("gym-core") },
    { label: "Condicionamento", ids: groupRows("bodyweight") },
    { label: "Cíclico", ids: groupRows("cyclical") },
  ],
};

/** Average rating per category (like AVERAGE over the rated cells), null when nothing is rated. */
export function movementSummary(data: OnboardingData) {
  const rows = SUMMARY.categories.map((category) => {
    const ratings = category.ids.map((id) => data.movement[id]?.rating).filter((r): r is number => r != null);
    return {
      label: category.label,
      average: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    };
  });
  const rated = rows.filter((r): r is { label: string; average: number } => r.average != null);
  return {
    rows,
    // SORTN(..., 3, 0, 2, FALSE/TRUE): top and bottom three averages.
    strongest: [...rated].sort((a, b) => b.average - a.average).slice(0, 3),
    weakest: [...rated].sort((a, b) => a.average - b.average).slice(0, 3),
  };
}

// ---------- Sheet "Strength Ratios" ----------

export const RATIOS = {
  title: "Rácios",
  columns: { lift: "Levantamento", of: "De", target: "Objetivo", actual: "Real" },
  groups: [
    {
      title: "Halterofilismo",
      rows: [
        { lift: "Snatch", of: "Back Squat", target: 0.65, num: "squat-snatch", den: "back-squat" },
        { lift: "Clean and Jerk", of: "Front Squat", target: 0.85, num: "clean-and-jerk", den: "front-squat" },
        { lift: "Power Snatch", of: "Snatch", target: 0.8, num: "power-snatch", den: "squat-snatch" },
        { lift: "Power Clean", of: "Clean", target: 0.8, num: "power-clean", den: "squat-clean" },
      ],
    },
    {
      title: "Lower Body",
      rows: [
        { lift: "Deadlift", of: "Back Squat", target: 1.25, num: "deadlift", den: "back-squat" },
        { lift: "Front Squat", of: "Back Squat", target: 0.85, num: "front-squat", den: "back-squat" },
      ],
    },
    {
      title: "Upper Body",
      rows: [
        { lift: "Bench Press", of: "Power Clean", target: 0.9, num: "bench-press", den: "power-clean" },
        { lift: "Bench Press", of: "Wtd Pull-Up", target: 0.9, num: "bench-press", den: "wtd-pull-up" },
        { lift: "Strict Press", of: "Split Jerk", target: 0.6, num: "strict-press", den: "split-jerk" },
      ],
    },
  ],
};

/** A 1RM typed as "100", "100 kg" or "100,5". */
export function parseKg(value: string | undefined): number | null {
  const match = value?.trim().match(/^(\d+(?:[.,]\d+)?)/);
  const kg = match ? Number(match[1].replace(",", ".")) : NaN;
  return Number.isFinite(kg) && kg > 0 ? kg : null;
}

/** Actual ratio (e.g. 0.68) from the athlete's 1RMs, null when one is missing. */
export function actualRatio(data: OnboardingData, num: string, den: string): number | null {
  const a = parseKg(data.lifts[num]?.value);
  const b = parseKg(data.lifts[den]?.value);
  return a != null && b != null ? a / b : null;
}
