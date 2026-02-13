import { Priority } from "@/types/drag-and-drop.model";

/** Task suggested by AI advisor (може включати whenDo) */
export interface AdvisorTask {
  title: string;
  priority: Priority;
  time: number; // minutes
  category: TaskCategoryKey | null;
  whenDo?: number[]; // 1-7 for days
}

export interface AdvisorResponse {
  advice: string;
  tasks?: AdvisorTask[];
}

/** Category keys from CATEGORY_OPTIONS */
export type TaskCategoryKey =
  | "health"
  | "finance"
  | "emotions"
  | "relationships"
  | "career"
  | "spirituality"
  | "personal_growth"
  | "hobbies"
  | "leisure";

/** Parsed task from AI - before mapping to ItemTask */
export interface AIParsedTask {
  title: string;
  priority: Priority;
  time: number; // minutes
  category: TaskCategoryKey | null;
}

export interface AIParseTasksResponse {
  tasks: AIParsedTask[];
}
