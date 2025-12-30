import { EraConfig, EraId } from './types';

export const TEAM_COLORS: Record<string, string> = {
  "Bulldogs": "#dc2626", // Red
  "Tigers": "#f97316", // Orange
  "Maroons": "#7f1d1d", // Maroon
  "Cardinals": "#991b1b", // Dark Red
  "Bears": "#f59e0b", // Amber
  "Packers": "#22c55e", // Green (Bright)
  "Giants": "#2563eb", // Blue
  "Eagles": "#047857", // Emerald
  "Steelers": "#facc15", // Yellow
  "Rams": "#3b82f6", // Royal Blue
  "Browns": "#a16207", // Brown
  "49ers": "#ef4444", // Red
  "Colts": "#60a5fa", // Light Blue
  "Cowboys": "#94a3b8", // Silver
  "Vikings": "#a855f7", // Purple
  "Dolphins": "#2dd4bf", // Teal
  "Raiders": "#d4d4d4", // Light Gray
  "Patriots": "#1e40af", // Navy
  "Seahawks": "#64748b", // Slate
  "Ravens": "#7e22ce" // Purple
};

export const TEAMS = Object.keys(TEAM_COLORS);

export const ERAS: Record<EraId, EraConfig> = {
  [EraId.GENESIS]: {
    id: EraId.GENESIS,
    name: "The Genesis",
    yearRange: "1869–1919",
    description: "Kicking is King. Passing is rare or illegal. Brutal mass momentum plays.",
    scoring: { td: 5, fg: 4, safety: 2, xp: 1, twoPtAvailable: false }, // Using weighted avg for simplicity
    probs: { run: 0.75, pass: 0.05, kick: 0.20 },
    rules: {
      passLegal: false, // Toggled in logic for >1906
      hashMarks: false,
      otEnabled: false,
      kickoffLine: 40,
      fumbleRate: 0.04,
      interceptionRate: 0.15,
      incompletionPenalty: true
    }
  },
  [EraId.IRON_MAN]: {
    id: EraId.IRON_MAN,
    name: "The Iron Man",
    yearRange: "1920–1932",
    description: "Endurance & Geometry. No hash marks means 'wasted downs' to center ball. Heavy fatigue.",
    scoring: { td: 6, fg: 3, safety: 2, xp: 1, twoPtAvailable: false },
    probs: { run: 0.80, pass: 0.10, kick: 0.10, waste: 0.05 },
    rules: {
      passLegal: true,
      hashMarks: false,
      otEnabled: false,
      kickoffLine: 40,
      fumbleRate: 0.035, // High due to fatigue
      interceptionRate: 0.08,
      incompletionPenalty: false
    }
  },
  [EraId.BREAKOUT]: {
    id: EraId.BREAKOUT,
    name: "The Breakout",
    yearRange: "1933–1949",
    description: "The T-Formation. Hash marks introduced. Passing becomes a real weapon.",
    scoring: { td: 6, fg: 3, safety: 2, xp: 1, twoPtAvailable: false },
    probs: { run: 0.65, pass: 0.25, kick: 0.10 },
    rules: {
      passLegal: true,
      hashMarks: true,
      otEnabled: false,
      kickoffLine: 40,
      fumbleRate: 0.025,
      interceptionRate: 0.07,
      incompletionPenalty: false
    }
  },
  [EraId.DEAD_BALL]: {
    id: EraId.DEAD_BALL,
    name: "Dead Ball Era",
    yearRange: "1950–1977",
    description: "Defense Dominated. 'Bump and Run' stifles receivers. Kicking specialists emerge.",
    scoring: { td: 6, fg: 3, safety: 2, xp: 1, twoPtAvailable: false },
    probs: { run: 0.60, pass: 0.30, kick: 0.10 },
    rules: {
      passLegal: true,
      hashMarks: true,
      otEnabled: true, // Added 1974, assume active for era simplicity
      kickoffLine: 40,
      fumbleRate: 0.02,
      interceptionRate: 0.05,
      incompletionPenalty: false
    }
  },
  [EraId.AIR_CORYELL]: {
    id: EraId.AIR_CORYELL,
    name: "Air Coryell",
    yearRange: "1978–1992",
    description: "The Vertical Game. Rules open up passing. High scores return.",
    scoring: { td: 6, fg: 3, safety: 2, xp: 1, twoPtAvailable: false },
    probs: { run: 0.45, pass: 0.45, kick: 0.10 },
    rules: {
      passLegal: true,
      hashMarks: true,
      otEnabled: true,
      kickoffLine: 35,
      fumbleRate: 0.015,
      interceptionRate: 0.035,
      incompletionPenalty: false
    }
  },
  [EraId.STRATEGY]: {
    id: EraId.STRATEGY,
    name: "Strategy Era",
    yearRange: "1993–2010",
    description: "The Math Engine. 2-Point conversions and salary cap parity.",
    scoring: { td: 6, fg: 3, safety: 2, xp: 1, twoPtAvailable: true },
    probs: { run: 0.45, pass: 0.50, kick: 0.05 },
    rules: {
      passLegal: true,
      hashMarks: true,
      otEnabled: true,
      kickoffLine: 30,
      fumbleRate: 0.012,
      interceptionRate: 0.028,
      incompletionPenalty: false
    }
  },
  [EraId.SPREAD]: {
    id: EraId.SPREAD,
    name: "Spread Era",
    yearRange: "2011–Present",
    description: "Efficiency. RPOs, high completion %, difficult extra points.",
    scoring: { td: 6, fg: 3, safety: 2, xp: 1, twoPtAvailable: true },
    probs: { run: 0.40, pass: 0.55, kick: 0.05 },
    rules: {
      passLegal: true,
      hashMarks: true,
      otEnabled: true,
      kickoffLine: 35,
      fumbleRate: 0.01,
      interceptionRate: 0.02,
      incompletionPenalty: false
    }
  }
};