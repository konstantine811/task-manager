import type { UniqueIdentifier } from "@dnd-kit/core";
import type { Priority } from "./drag-and-drop.model";

/** ISO date string "YYYY-MM-DD" */
export type ISODate = string;

/** Duration in minutes */
export type Minutes = number;

/** Day of week: 1=Mon .. 7=Sun */
export type DayNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Time in "HH:MM" format */
export type TimeHHMM = string;

/**
 * Schedule rules — when a task should be scheduled
 */
export type ScheduleRule =
  | { type: "weekdays"; days: DayNumber[] }
  | { type: "interval_days"; every: number; anchorDate: ISODate }
  | { type: "times_per_week"; times: number; weekStartsOn?: DayNumber }
  | { type: "once"; date: ISODate }
  | { type: "custom"; rrule: string };

/**
 * Availability — when you can do the task (time windows)
 */
export interface AvailabilityRule {
  days?: DayNumber[];
  windows: Array<{ start: TimeHHMM; end: TimeHHMM }>;
  preference?: "morning" | "day" | "evening" | "any";
}

/**
 * Link from task to goal (how task affects goal progress)
 */
export interface GoalLink {
  goalId: UniqueIdentifier;
  impact:
    | { type: "count"; value: number }
    | { type: "minutes"; valueMode: "done" | "planned" }
    | { type: "score"; value: number }
    | { type: "streak"; value: 1 };
  onMiss?: { type: "decrease" | "keep"; value?: number };
}

/**
 * Task template — describes the recurring rule, not a specific occurrence
 */
export interface TaskTemplate {
  id: UniqueIdentifier;
  title: string;
  timePlanned: Minutes;
  priority: Priority;
  schedule: ScheduleRule;
  availability?: AvailabilityRule;
  isPlanned?: boolean;
  isDetermined?: boolean;
  goalLinks?: GoalLink[];
}

/**
 * Category holding templates (not raw tasks)
 */
export interface TaskTemplateCategory {
  id: UniqueIdentifier;
  title: string;
  templates: TaskTemplate[];
}

export type TemplateItems = TaskTemplateCategory[];
