import { Priority } from "@/types/drag-and-drop.model";

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
