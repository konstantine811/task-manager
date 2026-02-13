import { Active, Over, UniqueIdentifier } from "@dnd-kit/core";
import { TRASH_ID } from "../config/dnd.config";
import type { AdvisorTask } from "@/services/ai/gemini.types";
import { ItemTask, Items } from "@/types/drag-and-drop.model";
import { mergeOrAddTask, mergeOrInsertAt } from "../utils/merge-task-by-title";
import { arrayMove } from "@dnd-kit/sortable";
import { useState } from "react";
import { useHoverStore } from "@/storage/hoverStore";
import { HoverStyleElement } from "@/types/sound";
import { useTaskManager } from "../context/use-task-manger-context";

const useDrag = ({
  items,
  setItems,
  recentlyMovedToNewContainer,
  setActiveId,
  onDeletePlannedTask,
  onChangeTasks,
  onSuggestedTaskMovedToTemplate,
}: {
  items: Items;
  setItems: React.Dispatch<React.SetStateAction<Items>>;
  recentlyMovedToNewContainer: React.RefObject<boolean>;
  setActiveId: React.Dispatch<React.SetStateAction<UniqueIdentifier | null>>;
  activeId: UniqueIdentifier | null;
  onDeletePlannedTask?: (taskId: UniqueIdentifier) => void;
  onChangeTasks: (items: Items) => void;
  onSuggestedTaskMovedToTemplate?: (advisorTask: AdvisorTask) => void;
}) => {
  const [clonedItems, setClonedItems] = useState<Items | null>(null);
  const setHover = useHoverStore((s) => s.setHover);
  const playingTask = useTaskManager((s) => s.playingTask);
  const stopPlayingTask = useTaskManager((s) => s.stopPlayingTask);

  const onDragStart = (active: Active) => {
    setActiveId(active.id);
    setClonedItems(items);
  };

  const onDragOver = (active: Active, over: Over | null) => {
    const overId = over?.id;
    if (!overId || overId === TRASH_ID) return;
    // Suggested tasks are added only in onDragEnd, no preview during drag
    const isSuggested = (active.data?.current as { type?: string })?.type === "suggested";
    if (isSuggested) return;
    const activeTaskId = active.id;
    const overTaskId = overId;

    const activeCategory = items.find((cat) =>
      cat.tasks.some((t) => t.id === activeTaskId)
    );
    const overCategory = items.find(
      (cat) =>
        cat.id === overTaskId || cat.tasks.some((t) => t.id === overTaskId)
    );
    if (
      !activeCategory ||
      !overCategory ||
      activeCategory.id === overCategory.id
    ) {
      return;
    }

    const activeTask = activeCategory.tasks.find((t) => t.id === activeTaskId);
    if (!activeTask) return;

    const overItemIndex = overCategory.tasks.findIndex(
      (t) => t.id === overTaskId
    );

    recentlyMovedToNewContainer.current = true;

    setItems((prev) => {
      const updated = prev.map((cat) => {
        if (cat.id === activeCategory.id) {
          return {
            ...cat,
            tasks: cat.tasks.filter((t) => t.id !== activeTaskId),
          };
        }
        if (cat.id === overCategory.id) {
          const newIndex =
            overItemIndex >= 0 ? overItemIndex + 1 : cat.tasks.length;
          return {
            ...cat,
            tasks: mergeOrInsertAt(cat.tasks, activeTask, newIndex),
          };
        }
        return cat;
      });
      onChangeTasks(updated);
      return updated;
    });
  };

  const onDragEnd = (active: Active, over: Over | null) => {
    const isDraggingCategory = items.some((cat) => cat.id === active.id);
    const isOverCategory = over && items.some((cat) => cat.id === over.id);

    if (isDraggingCategory && isOverCategory && over) {
      const oldIndex = items.findIndex((cat) => cat.id === active.id);
      const newIndex = items.findIndex((cat) => cat.id === over.id);

      if (oldIndex !== newIndex) {
        setItems((prev) => {
          const updated = arrayMove(prev, oldIndex, newIndex);
          onChangeTasks(updated);
          return updated;
        });
      }

      setActiveId(null);
      return;
    }

    const activeCategory = items.find((cat) =>
      cat.tasks.some((t) => t.id === active.id)
    );
    const overCategory = over
      ? items.find((cat) => cat.tasks.some((t) => t.id === over.id))
      : null;

    // 🟥 Якщо це видалення (перетягнули в trash)
    if (over?.id === TRASH_ID && activeCategory) {
      // Зупинити таймер, якщо видаляється активна задача
      if (playingTask?.id === active.id) {
        stopPlayingTask();
      }

      // Видалити задачу
      setItems((prev) => {
        const updated = prev.map((cat) =>
          cat.id === activeCategory.id
            ? {
                ...cat,
                tasks: cat.tasks.filter((t) => {
                  if (t.id === active.id && (t.isPlanned || t.isDetermined)) {
                    onDeletePlannedTask?.(t.id);
                  }
                  return t.id !== active.id;
                }),
              }
            : cat
        );
        onChangeTasks(updated);
        return updated;
      });

      setActiveId(null);
      return;
    }

    // ✨ Drop from suggested tasks (AI panel) — add task to target category, remove from suggestions
    const suggestedData = active.data?.current as {
      type?: string;
      task?: ItemTask;
      advisorTask?: AdvisorTask;
    } | undefined;
    if (!activeCategory && over && suggestedData?.type === "suggested" && suggestedData?.task) {
      const targetCategory = items.find(
        (cat) =>
          cat.id === over.id || cat.tasks.some((t) => t.id === over.id)
      );
      if (targetCategory) {
        const task: ItemTask = {
          ...suggestedData.task,
          id: `${suggestedData.task.title}-${Date.now()}`,
        };
        setItems((prev) => {
          const updated = prev.map((cat) =>
            cat.id === targetCategory.id
              ? { ...cat, tasks: mergeOrAddTask(cat.tasks, task) }
              : cat
          );
          onChangeTasks(updated);
          return updated;
        });
        if (suggestedData.advisorTask) {
          onSuggestedTaskMovedToTemplate?.(suggestedData.advisorTask);
        }
      }
      setActiveId(null);
      return;
    }

    // 🔄 Переміщення між категоріями
    if (!over || !activeCategory || !overCategory) {
      setActiveId(null);
      return;
    }

    if (activeCategory.id === overCategory.id) {
      const activeIndex = activeCategory.tasks.findIndex(
        (t) => t.id === active.id
      );
      const overIndex = overCategory.tasks.findIndex((t) => t.id === over.id);

      if (activeIndex !== overIndex) {
        setItems((prev) => {
          const updated = prev.map((cat) =>
            cat.id === activeCategory.id
              ? {
                  ...cat,
                  tasks: arrayMove(cat.tasks, activeIndex, overIndex),
                }
              : cat
          );
          onChangeTasks(updated);
          return updated;
        });
      }
    }

    setHover(false, null, HoverStyleElement.circle);
    setActiveId(null);
  };

  const onDragCancel = () => {
    if (clonedItems) {
      setItems(clonedItems);
    }
    setActiveId(null);
    setClonedItems(null);
  };

  return {
    onDragOver,
    onDragEnd,
    onDragCancel,
    onDragStart,
  };
};

export default useDrag;
