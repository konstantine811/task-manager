/** Дані Quick Start для генерації шаблону новачком */
export interface QuickStartData {
  weeklyFocuses: string[];
  dailyTimeBudget: number;
  preferredTimeOfDay: "morning" | "afternoon" | "evening" | "mixed";
  energyLevel: number;
  fixedCommitments: string[];
  barrier: string;
}

export const QUICK_START_STORAGE_KEY = "chrono-quick-start-data";

export const FOCUS_OPTIONS = [
  "health",
  "career",
  "relationships",
  "personal_growth",
  "leisure",
  "finance",
] as const;

export const TIME_BUDGET_OPTIONS = [30, 60, 90, 120] as const;

export const TIME_OF_DAY_OPTIONS = [
  "morning",
  "afternoon",
  "evening",
  "mixed",
] as const;

export const FIXED_COMMITMENTS_OPTIONS = [
  "work_9_18",
  "kids",
  "study",
  "commute",
  "flexible_schedule",
] as const;

export const BARRIER_OPTIONS = [
  "evening_fatigue",
  "procrastination",
  "task_chaos",
  "no_time_sport",
] as const;
