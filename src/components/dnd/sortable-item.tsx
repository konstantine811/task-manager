import { useSortable } from "@dnd-kit/sortable";

import { Item, RenderItemProps } from "./item";
import { UniqueIdentifier } from "@dnd-kit/core";
import { Items, ItemTask } from "@/types/drag-and-drop.model";

interface SortableItemProps {
  containerId: UniqueIdentifier;
  id: UniqueIdentifier;
  index: number;
  handle: boolean;
  disabled?: boolean;
  style(args: {
    index: number;
    value: UniqueIdentifier;
    isDragging: boolean;
    isSorting: boolean;
    overIndex: number;
    containerId: UniqueIdentifier;
  }): React.CSSProperties;
  getIndex(id: UniqueIdentifier, items: Items): number;
  renderItem?: (args: RenderItemProps) => React.ReactElement;
  wrapperStyle({ index }: { index: number }): React.CSSProperties;
  items: Items;
  task: ItemTask;
  onToggle?: (id: UniqueIdentifier, value: boolean) => void;
  onEditTask: (task: ItemTask) => void;
  templated: boolean;
}

function SortableItem({
  disabled,
  id,
  index,
  handle,
  renderItem,
  style,
  containerId,
  getIndex,
  items,
  onToggle,
  task,
  onEditTask,
  templated,
}: SortableItemProps) {
  const {
    setNodeRef,
    listeners,
    isDragging,
    isSorting,
    over,
    overIndex,
    transform,
    transition,
  } = useSortable({
    id,
  });

  return (
    <Item
      ref={disabled ? undefined : setNodeRef}
      value={task.title}
      dragging={isDragging}
      sorting={isSorting}
      handle={handle}
      index={index}
      templated={templated}
      onToggle={onToggle}
      style={style({
        index,
        value: id,
        isDragging,
        isSorting,
        overIndex: over ? getIndex(over.id, items) : overIndex,
        containerId,
      })}
      transition={transition}
      transform={transform}
      listeners={listeners}
      renderItem={renderItem}
      task={task}
      onEditTask={onEditTask}
      containerId={containerId}
    />
  );
}

export default SortableItem;
