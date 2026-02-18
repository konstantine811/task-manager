import type { UniqueIdentifier } from "@dnd-kit/core";

/**
 * Goal metric — what we're measuring
 */
export type GoalMetric =
  | { type: "count"; target: number; unit?: string }
  | { type: "minutes"; target: number }
  | { type: "streak"; target: number; period: "day" | "week" }
  | { type: "score"; target: number };

/**
 * How progress changes on task done/missed
 */
export interface ProgressRules {
  onTaskDone?: "increase" | "keep";
  onTaskMissed?: "decrease" | "keep";
  increaseBy?: number;
  decreaseBy?: number;
  minutesMode?: "planned" | "done";
  decay?: { everyDays: number; by: number; min?: number };
}

/**
 * Sub-goal or step within a goal
 */
export interface GoalSubtask {
  id: UniqueIdentifier;
  title: string;
  timePlanned?: number; // minutes
  isDone?: boolean;
  order?: number;
}

/**
 * Goal — metric + progress + rules
 */
export interface Goal {
  id: UniqueIdentifier;
  title: string;
  description?: string;
  metric: GoalMetric;
  progress: number;
  status: "active" | "paused" | "done" | "archived";
  /** ISO date (YYYY-MM-DD) when goal was marked as achieved — for analytics by period */
  completedAt?: string;
  rules?: ProgressRules;
  subGoals?: GoalSubtask[];
}
