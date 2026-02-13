import React, { useEffect } from "react";
import type {
  DraggableSyntheticListeners,
  UniqueIdentifier,
} from "@dnd-kit/core";
import type { Transform } from "@dnd-kit/utilities";
import { ItemTask } from "@/types/drag-and-drop.model";
import { TaskItem } from "./task-item";

export type RenderItemProps = {
  dragOverlay: boolean;
  dragging: boolean;
  sorting: boolean;
  index: number | undefined;
  fadeIn: boolean;
  listeners: DraggableSyntheticListeners;
  ref: React.Ref<HTMLElement>;
  style: React.CSSProperties | undefined;
  transform: Props["transform"];
  transition: Props["transition"];
  value: Props["value"];
  task: ItemTask;
  containerId?: UniqueIdentifier;
};

export interface Props {
  dragOverlay?: boolean;
  color?: string;
  disabled?: boolean;
  dragging?: boolean;
  handle?: boolean;
  handleProps?: React.HTMLAttributes<HTMLButtonElement> & {
    ref?: React.Ref<HTMLButtonElement>;
  };
  height?: number;
  index?: number;
  fadeIn?: boolean;
  transform?: Transform | null;
  listeners?: DraggableSyntheticListeners;
  sorting?: boolean;
  style?: React.CSSProperties;
  transition?: string | null;
  value: React.ReactNode;
  task: ItemTask;
  containerId?: UniqueIdentifier;
  onRemove?(): void;
  renderItem?: (args: RenderItemProps) => React.ReactElement;
  onToggle?: (id: UniqueIdentifier, value: boolean) => void;
  onEditTask?: (task: ItemTask) => void;
  templated: boolean;
}

export const Item = React.memo(
  React.forwardRef<HTMLLIElement, Props>(
    (
      {
        dragOverlay,
        dragging,
        fadeIn,
        handle,
        index,
        listeners,
        containerId,
        onEditTask,
        renderItem,
        sorting,
        style,
        transition,
        transform,
        value,
        task,
        onToggle,
        templated,
      },
      ref
    ) => {
      useEffect(() => {
        if (!dragOverlay) {
          return;
        }
        document.body.style.cursor = "grabbing";

        return () => {
          document.body.style.cursor = "";
        };
      }, [dragOverlay]);

      return renderItem ? (
        renderItem({
          dragOverlay: Boolean(dragOverlay),
          dragging: Boolean(dragging),
          sorting: Boolean(sorting),
          index,
          fadeIn: Boolean(fadeIn),
          listeners,
          ref,
          style,
          transform,
          transition,
          value,
          task,
          containerId,
        })
      ) : (
        <li className="list-none" ref={ref} tabIndex={!handle ? 0 : undefined}>
          <TaskItem
            index={index}
            templated={templated}
            dragging={dragOverlay}
            task={task}
            onToggle={onToggle}
            onEditTask={onEditTask}
            listeners={listeners}
            handle={handle}
            categoryId={containerId}
            style={{
              transform: transform
                ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
                : undefined,
              transition: transition ?? undefined, // ← fix тут
              ...style,
            }}
          ></TaskItem>
        </li>
      );
    }
  )
);
