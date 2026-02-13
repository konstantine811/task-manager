import { UniqueIdentifier } from "@dnd-kit/core";

export interface TaskCategory {
  id: UniqueIdentifier;
  title: string;
  tasks: ItemTask[];
}

export type Items = TaskCategory[];

export interface ItemTask {
  id: UniqueIdentifier;
  title: string;
  isDone: boolean;
  time: number;
  timeDone: number;
  priority: Priority;
  isPlanned?: boolean;
  whenDo: DayNumber[];
  isDetermined?: boolean;
}

export interface NormalizedTask extends ItemTask {
  categoryId: UniqueIdentifier;
  categoryName: string;
}

export interface ItemTaskCategory extends ItemTask {
  categoryName: string;
}

export enum Priority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export type DayNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface GetItemStylesArgs {
  value: UniqueIdentifier;
  index: number;
  overIndex: number;
  isDragging: boolean;
  containerId: UniqueIdentifier;
  isSorting: boolean;
  isDragOverlay: boolean;
}

export type GetItemStyles = (args: GetItemStylesArgs) => React.CSSProperties;

export interface DailyTaskRecord {
  date: string;
  items: Items;
}
