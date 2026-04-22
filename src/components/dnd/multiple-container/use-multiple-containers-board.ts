import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type KeyboardCoordinateGetter,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import type { Items, ItemTask } from "@/types/drag-and-drop.model";
import { useTaskManager } from "../context/use-task-manger-context";
import useCollisionDectionStrategy from "../hooks/useCollisionDectionStrategy";
import useDrag from "../hooks/useDrag";
import useCategoryHandle from "../hooks/useCategoryHandle";
import { coordinateGetter as multipleContainersCoordinateGetter } from "../utils/multipleContainersKeyboardCoordinates";
import { mergeOrAddTask } from "../utils/merge-task-by-title";
import type { MultipleContainersProps } from "./multiple-containers.types";
import type { DailyTaskTimerSyncState } from "@/types/task-timer-sync.model";

type UseMultipleContainersBoardParams = Pick<
  MultipleContainersProps,
  | "items"
  | "onChangeTasks"
  | "onDeletePlannedTask"
  | "onSuggestedTaskMovedToTemplate"
  | "onEditPlannedTask"
  | "onTaskDone"
  | "onTaskUndone"
  | "remoteTimerState"
  | "onSyncTimerState"
> & {
  coordinateGetter?: KeyboardCoordinateGetter;
};

export function useMultipleContainersBoard({
  items: initialItems,
  onChangeTasks,
  onDeletePlannedTask,
  onSuggestedTaskMovedToTemplate,
  onEditPlannedTask,
  onTaskDone,
  onTaskUndone,
  remoteTimerState,
  onSyncTimerState,
  coordinateGetter = multipleContainersCoordinateGetter,
}: UseMultipleContainersBoardParams) {
  const [items, setItems] = useState<Items>(initialItems);
  const [containers, setContainers] = useState<UniqueIdentifier[]>(() =>
    initialItems.map((cat) => cat.id),
  );

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const playingTask = useTaskManager((s) => s.playingTask);
  const startedAt = useTaskManager((s) => s.startedAt);
  const timerSyncSource = useTaskManager((s) => s.timerSyncSource);
  const syncTimerFromRemote = useTaskManager((s) => s.syncTimerFromRemote);
  const taskTimeDone = useTaskManager((s) => s.updatedTask);
  const setPlayingTimeDoneResolver = useTaskManager(
    (s) => s.setPlayingTimeDoneResolver,
  );

  const [addTaskContainerId, setAddTaskContainerId] =
    useState<UniqueIdentifier | null>(null);
  const [editTask, setEditTask] = useState<ItemTask | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);
  const isSortingContainer = activeId !== null && containers.includes(activeId);

  const [isOpenAgreeDialog, setIsOpenAgreeDialog] = useState(false);
  const [removeContainerId, setRemoveContainerId] =
    useState<UniqueIdentifier | null>(null);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiDialogContainerId, setAiDialogContainerId] =
    useState<UniqueIdentifier | null>(null);
  const [activeSuggestedTask, setActiveSuggestedTask] =
    useState<ItemTask | null>(null);
  const lastAppliedUpdatedSigRef = useRef<string | null>(null);
  const lastSyncedTimerSigRef = useRef<string | null>(null);
  const lastAppliedRemoteTimerSigRef = useRef<string | null>(null);

  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 180,
      tolerance: 8,
    },
  });
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter,
  });

  const sensorsWithTouch = useSensors(
    mouseSensor,
    touchSensor,
    keyboardSensor,
  );
  const sensorsDisabled = useSensors();
  const sensors = isDialogOpen ? sensorsDisabled : sensorsWithTouch;

  const collisionDetectionStrategy: CollisionDetection =
    useCollisionDectionStrategy({
      activeId,
      items,
      lastOverId,
      recentlyMovedToNewContainer,
    });

  const { onDragOver, onDragEnd, onDragCancel, onDragStart } = useDrag({
    items,
    setItems,
    recentlyMovedToNewContainer,
    setActiveId,
    activeId,
    onDeletePlannedTask,
    onChangeTasks,
    onSuggestedTaskMovedToTemplate,
  });

  const { handleAddColumn, handleRemove } = useCategoryHandle({
    items,
    setItems,
    setContainers,
    activeId,
    onDeletePlannedTask,
    onChangeTasks,
  });

  const updateTaskTime = useCallback(
    (taskId: UniqueIdentifier, newTimeDone: number) => {
      setItems((prev) => {
        const updated = prev.map((container) => ({
          ...container,
          tasks: container.tasks.map((task) =>
            task.id === taskId ? { ...task, timeDone: newTimeDone } : task,
          ),
        }));
        onChangeTasks(updated);
        return updated;
      });
    },
    [onChangeTasks],
  );

  useEffect(() => {
    setPlayingTimeDoneResolver((id) => {
      for (const c of items) {
        const t = c.tasks.find((x) => x.id === id);
        if (t) return t.timeDone;
      }
      return undefined;
    });
    return () => setPlayingTimeDoneResolver(null);
  }, [items, setPlayingTimeDoneResolver]);

  useEffect(() => {
    if (!taskTimeDone) return;
    const sig = `${String(taskTimeDone.id)}:${taskTimeDone.timeDone}`;
    if (sig === lastAppliedUpdatedSigRef.current) return;
    lastAppliedUpdatedSigRef.current = sig;
    updateTaskTime(taskTimeDone.id, taskTimeDone.timeDone);
  }, [taskTimeDone, updateTaskTime]);

  useEffect(() => {
    if (!onSyncTimerState) return;
    if (timerSyncSource !== "local") return;

    const nextState: DailyTaskTimerSyncState | null =
      playingTask && startedAt
        ? {
            taskId: String(playingTask.id),
            startedAt,
            baseTimeDone: playingTask.timeDone,
            updatedAt: Date.now(),
          }
        : null;

    const sig = nextState
      ? `${nextState.taskId}:${nextState.startedAt}:${nextState.baseTimeDone}`
      : "stopped";

    if (sig === lastSyncedTimerSigRef.current) return;
    lastSyncedTimerSigRef.current = sig;
    onSyncTimerState(nextState);
  }, [onSyncTimerState, timerSyncSource, playingTask, startedAt]);

  useEffect(() => {
    if (!remoteTimerState) {
      if (lastAppliedRemoteTimerSigRef.current === "stopped") return;
      lastAppliedRemoteTimerSigRef.current = "stopped";
      syncTimerFromRemote(null, null);
      return;
    }

    let remoteTask: ItemTask | null = null;
    for (const container of items) {
      const found = container.tasks.find(
        (task) => String(task.id) === remoteTimerState.taskId,
      );
      if (found) {
        remoteTask = found;
        break;
      }
    }

    if (!remoteTask) return;

    const sig = `${remoteTimerState.taskId}:${remoteTimerState.startedAt}:${remoteTimerState.baseTimeDone}`;
    if (sig === lastAppliedRemoteTimerSigRef.current) return;

    lastAppliedRemoteTimerSigRef.current = sig;
    syncTimerFromRemote(
      { ...remoteTask, timeDone: remoteTimerState.baseTimeDone },
      remoteTimerState.startedAt,
    );
  }, [items, remoteTimerState, syncTimerFromRemote]);

  const handleToggleTask = useCallback(
    (taskId: UniqueIdentifier, newIsDone: boolean) => {
      setItems((prevItems) => {
        let doneTask: ItemTask | null = null;
        let undoneTask: ItemTask | null = null;
        const updated = prevItems.map((container) => ({
          ...container,
          tasks: container.tasks.map((t) => {
            if (t.id === taskId) {
              let updatedTask: ItemTask = { ...t, isDone: newIsDone };
              if (newIsDone && !(t.timeDone && t.timeDone > 0)) {
                // For determined/planned tasks `time` can mean clock time (e.g. 23:00),
                // not duration. Never copy it into spent time automatically.
                updatedTask = {
                  ...updatedTask,
                  timeDone: t.isDetermined || t.isPlanned ? t.timeDone : t.time,
                };
              }
              if (newIsDone) doneTask = updatedTask;
              else if (t.isDone) undoneTask = t;
              if (updatedTask.isPlanned || updatedTask.isDetermined) {
                onEditPlannedTask?.(updatedTask);
              }
              return updatedTask;
            }
            return t;
          }),
        }));
        queueMicrotask(() => {
          onChangeTasks(updated);
          if (doneTask) onTaskDone?.(doneTask);
          if (undoneTask) onTaskUndone?.(undoneTask);
        });
        return updated;
      });
    },
    [onChangeTasks, onEditPlannedTask, onTaskDone, onTaskUndone],
  );

  const handleAddTask = useCallback(
    (newTask: ItemTask, id: UniqueIdentifier) => {
      setItems((prev) => {
        const updated = prev.map((category) =>
          category.id === id
            ? { ...category, tasks: mergeOrAddTask(category.tasks, newTask) }
            : category,
        );
        onChangeTasks(updated);
        return updated;
      });
    },
    [onChangeTasks],
  );

  const handleAddTasks = useCallback(
    (newTasks: ItemTask[], id: UniqueIdentifier) => {
      if (newTasks.length === 0) return;
      setItems((prev) => {
        const updated = prev.map((category) => {
          if (category.id !== id) return category;
          let tasks = category.tasks;
          for (const t of newTasks) {
            tasks = mergeOrAddTask(tasks, t);
          }
          return { ...category, tasks };
        });
        onChangeTasks(updated);
        return updated;
      });
    },
    [onChangeTasks],
  );

  const handleEditTask = useCallback(
    (taskToSave: ItemTask, containerId: UniqueIdentifier) => {
      if (onEditPlannedTask && taskToSave.isPlanned) {
        onEditPlannedTask(taskToSave);
      }
      setItems((prevItems) => {
        const updated = prevItems.map((container) => {
          if (container.id === containerId) {
            return {
              ...container,
              tasks: container.tasks.map((task) =>
                task.id === taskToSave.id ? { ...taskToSave } : task,
              ),
            };
          }
          return container;
        });
        onChangeTasks(updated);
        return updated;
      });
    },
    [onEditPlannedTask, onChangeTasks],
  );

  const handleChangeCategory = useCallback(
    (value: string, id: UniqueIdentifier) => {
      setItems((prev) => {
        const updated = prev.map((cat) =>
          cat.id === id ? { ...cat, title: value } : cat,
        );
        onChangeTasks(updated);
        return updated;
      });
    },
    [onChangeTasks],
  );

  // Після переміщення задачі в іншу колонку `onDragOver` ставить recentlyMovedToNewContainer.
  // Collision detection тимчасово підставляє lastOverId, поки pointer ще не «ловить» нові rect’и.
  // Скидаємо прапорець після commit + layout, коли DOM уже відповідає новому `items` (без rAF).
  useLayoutEffect(() => {
    recentlyMovedToNewContainer.current = false;
  }, [items]);

  return {
    items,
    containers,
    playingTask,
    addTaskContainerId,
    setAddTaskContainerId,
    editTask,
    setEditTask,
    isDialogOpen,
    setIsDialogOpen,
    activeId,
    isSortingContainer,
    isOpenAgreeDialog,
    setIsOpenAgreeDialog,
    removeContainerId,
    setRemoveContainerId,
    isAiDialogOpen,
    setIsAiDialogOpen,
    aiDialogContainerId,
    setAiDialogContainerId,
    activeSuggestedTask,
    setActiveSuggestedTask,
    collisionDetectionStrategy,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
    handleAddColumn,
    handleRemove,
    sensors,
    handleToggleTask,
    handleAddTask,
    handleAddTasks,
    handleEditTask,
    handleChangeCategory,
  };
}
