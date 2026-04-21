import { CATEGORY_OPTIONS } from "@/components/dnd/config/category-options";

export type AreaId = (typeof CATEGORY_OPTIONS)[number];

export type ProgressTrend = "up" | "flat" | "down";
export type ProgressGoalKind = "consistency" | "time" | "count" | "milestone";
export type ProgressGoalPeriod = "week" | "month" | "custom";
export type ProgressGoalStatus = "active" | "completed" | "paused";
export type AchievementType =
  | "streak"
  | "volume"
  | "milestone"
  | "category_consistency";

export type ProgressMetaValue = string | number | boolean | null;
export type ProgressMeta = Record<string, ProgressMetaValue>;

export interface AreaProgress {
  areaId: AreaId;
  activeDays: number;
  completedTasks: number;
  skippedTasks: number;
  /** Сума фактично витраченого часу за період, хвилини. */
  spentTime: number;
  /** Сума виконаного часу за період, хвилини (джерело: секунди в задачі / 60). */
  completedTime: number;
  /** Сума планового часу за період, хвилини. */
  plannedTime: number;
  consistencyScore: number;
  completionRate: number;
  trend: ProgressTrend;
  currentStreak: number;
  bestStreak: number;
  lastActivityAt?: string;
}

export type AreaProgressMap = Record<AreaId, AreaProgress>;

export interface ProgressGoal {
  id: string;
  title: string;
  areaId: AreaId;
  kind: ProgressGoalKind;
  targetValue: number;
  currentValue: number;
  period: ProgressGoalPeriod;
  status: ProgressGoalStatus;
  createdAt: string;
  completedAt?: string;
}

export interface AchievementSourcePeriod {
  from: string;
  to: string;
  label?: ProgressGoalPeriod | "derived";
}

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  areaId?: AreaId;
  earnedAt: string;
  sourcePeriod: AchievementSourcePeriod;
  meta?: ProgressMeta;
}

export type FirstReleaseMetricKey =
  | "activeDays"
  | "consistencyScore"
  | "completedTime"
  | "completedTasks";

export interface FirstReleaseMetricDefinition {
  key: FirstReleaseMetricKey;
  label: string;
  description: string;
}

export interface ProgressSnapshot {
  areas: AreaProgressMap;
  achievements: Achievement[];
  metrics: FirstReleaseMetricDefinition[];
  period: AchievementSourcePeriod;
}
