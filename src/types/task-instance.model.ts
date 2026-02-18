import type { UniqueIdentifier } from "@dnd-kit/core";

/** ISO date string "YYYY-MM-DD" */
export type ISODate = string;

/** Duration in minutes */
export type Minutes = number;

/**
 * Task instance — concrete occurrence on a specific date
 */
export interface TaskInstance {
  id: UniqueIdentifier;
  templateId: UniqueIdentifier;
  date: ISODate;
  status: "todo" | "done" | "skipped" | "moved";
  timeDone: Minutes;
  movedToDate?: ISODate;
  overrideTitle?: string;
  overrideTimePlanned?: Minutes;
}

/**
 * Daily plan — instances for one date
 */
export interface DailyInstances {
  date: ISODate;
  instances: TaskInstance[];
}
