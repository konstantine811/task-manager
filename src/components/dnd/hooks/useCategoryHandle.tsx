import { Items } from "@/types/drag-and-drop.model";
import { UniqueIdentifier } from "@dnd-kit/core";
import { unstable_batchedUpdates } from "react-dom";
import { useTranslation } from "react-i18next";
import { useTaskManager } from "../context/use-task-manger-context";

const useCategoryHandle = ({
  items,
  setItems,
  setContainers,
  onDeletePlannedTask,
  onChangeTasks,
}: {
  items: Items;
  setItems: React.Dispatch<React.SetStateAction<Items>>;
  setContainers: React.Dispatch<React.SetStateAction<UniqueIdentifier[]>>;
  activeId: UniqueIdentifier | null;
  onDeletePlannedTask?: (taskId: UniqueIdentifier) => void;
  onChangeTasks: (items: Items) => void;
}) => {
  const playingTask = useTaskManager((s) => s.playingTask);
  const stopPlayingTask = useTaskManager((s) => s.stopPlayingTask);
  const [t] = useTranslation();
  function handleAddColumn() {
    const prefix = t("task_manager.category"); // наприклад "Категорія"

    const maxNumber = Math.max(
      0,
      ...items.map((item) => {
        const regex = new RegExp(`^${prefix} (\\d+)$`);
        const match = item.title.match(regex);
        return match ? parseInt(match[1], 10) : 0;
      })
    );

    const newNumber = maxNumber + 1;
    const newContainerId = `${prefix} ${newNumber}`;
    const newId = `cat-${Date.now()}`; // або: crypto.randomUUID()
    unstable_batchedUpdates(() => {
      setContainers((containers) => [...containers, newContainerId]);
      setItems((items) => {
        const updates = [
          ...items,
          {
            id: newId,
            title: newContainerId,
            tasks: [],
          },
        ];
        onChangeTasks(updates);
        return updates;
      });
    });
  }
  function getNextContainerId() {
    const containerIds = items.map((cat) => cat.id);
    const lastContainerId = containerIds[containerIds.length - 1];
    return String.fromCharCode((lastContainerId as string).charCodeAt(0) + 1);
  }

  function handleRemove(containerID: UniqueIdentifier) {
    // Отримуємо задачі, які будуть видалені
    const toDeleteTasks =
      items.find((cat) => cat.id === containerID)?.tasks ?? [];

    setContainers((containers) =>
      containers.filter((id) => id !== containerID)
    );

    setItems((items) => {
      const updated = items.filter((cat) => cat.id !== containerID);
      onChangeTasks(updated);
      return updated;
    });

    toDeleteTasks.forEach((task) => {
      if (onDeletePlannedTask && (task.isPlanned || task.isDetermined)) {
        onDeletePlannedTask(task.id);
      }
      if (playingTask && playingTask.id === task.id) {
        stopPlayingTask();
      }
    });
  }

  return {
    handleAddColumn,
    getNextContainerId,
    handleRemove,
  };
};

export default useCategoryHandle;
