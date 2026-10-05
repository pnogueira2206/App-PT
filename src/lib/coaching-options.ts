export const GOALS = ["CrossFit", "Hyrox", "ATHX", "Lifestyle"] as const;

export type Goal = (typeof GOALS)[number];

// Competition levels shown under "Onde competes atualmente" for each goal.
// Goals without an entry (Lifestyle) hide the field.
export const COMPETITION_LEVELS: Partial<Record<Goal, readonly string[]>> = {
  CrossFit: ["Open", "Quarterfinals", "Semifinals", "Games"],
  Hyrox: ["Hyrox Pro", "Hyrox Open", "Hyrox Age Group"],
  ATHX: ["ATHX Lite", "ATHX Open", "ATHX Pro"],
};
