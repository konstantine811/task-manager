import type { CSSProperties, ReactElement, ReactNode } from "react";
import type {
  CancelDrop,
  KeyboardCoordinateGetter,
  Modifiers,
  UniqueIdentifier,
} from "@dnd-kit/core";
import type { SortingStrategy } from "@dnd-kit/sortable";
import type { RenderItemProps } from "../item";
import type {
  GetItemStyles,
  Items,
  ItemTask,
} from "@/types/drag-and-drop.model";
import type { AdvisorTask } from "@/services/ai/gemini.types";

export interface MultipleContainersProps {
  adjustScale?: boolean;
  cancelDrop?: CancelDrop;
  columns?: number;
  containerStyle?: CSSProperties;
  coordinateGetter?: KeyboardCoordinateGetter;
  getItemStyles?: GetItemStyles;
  wrapperStyle?(args: { index: number }): CSSProperties;
  itemCount?: number;
  items: Items;
  handle?: boolean;
  renderItem?: (args: RenderItemProps) => ReactElement;
  strategy?: SortingStrategy;
  modifiers?: Modifiers;
  minimal?: boolean;
  trashable?: boolean;
  scrollable?: boolean;
  vertical?: boolean;
  templated?: boolean;
  testedCount?: number;
  onChangeTasks: (items: Items) => void;
  onEditPlannedTask?: (task: ItemTask) => void;
  onDeletePlannedTask?: (taskId: UniqueIdentifier) => void;
  /** Rendered inside DndContext so suggested tasks can be dragged to template */
  sidePanel?: ReactNode;
  /** When template empty, shown centered in the tasks area. AI chat stays on the right. */
  emptyStateCenter?: ReactNode;
  /** When true, template has no tasks */
  isEmptyTemplate?: boolean;
  /** Rendered above categories */
  beforeCategories?: ReactNode;
  /** Called when a suggested task is dropped into template — remove it from AI list */
  onSuggestedTaskMovedToTemplate?: (advisorTask: AdvisorTask) => void;
  /** Called when task is toggled to done (для оновлення прогресу цілей) */
  onTaskDone?: (task: ItemTask) => void;
  /** Called when task is unchecked (відміна прогресу цілей) */
  onTaskUndone?: (task: ItemTask) => void;
}
