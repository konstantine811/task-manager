import { useDraggable } from "@dnd-kit/core";
import { SUGGESTED_TASK_PREFIX } from "@/components/dnd/config/dnd.config";
import { TaskItem } from "@/components/dnd/task-item";
import type { AdvisorTask } from "@/services/ai/gemini.types";
import { ItemTask } from "@/types/drag-and-drop.model";
import { CSS } from "@dnd-kit/utilities";

type DraggableSuggestedTaskItemProps = {
  task: ItemTask & { __advisorTask?: AdvisorTask };
  index: number;
};

/** Draggable task item in AI suggested list — can be dropped into template categories */
export function DraggableSuggestedTaskItem({
  task,
  index,
}: DraggableSuggestedTaskItemProps) {
  const draggableId = `${SUGGESTED_TASK_PREFIX}${task.id}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: draggableId,
      data: {
        type: "suggested",
        task,
        advisorTask: task.__advisorTask,
      },
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? "opacity-50 z-10" : ""}`}
    >
      <TaskItem
        index={String(index)}
        task={task}
        templated
        readOnly
        style={{}}
        dragging={isDragging}
      />
    </li>
  );
}
