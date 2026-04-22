import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadTemplateTasks,
  saveDailyTasks,
  loadDailyTasksByDate,
  saveDailyTaskTimerState,
  subscribeToDailyTasksByDate,
} from "@/services/firebase/taskManagerData";
import {
  Items,
  ItemTask,
  ItemTaskCategory,
  NormalizedTask,
} from "@/types/drag-and-drop.model";
import { MultipleContainers } from "@/components/dnd/multiple-container";
import { rectSortingStrategy } from "@dnd-kit/sortable";
import DailyAddTemplateButton from "./daily-add-button";
import {
  addNewTask,
  findPlannedOrDeterminedTask,
  mergeItemsDeep,
  mergeItemsWithPlannedTasks,
} from "@/services/task-menager/merge-tasks";
import Preloader from "@/components/page-partials/preloader/preloader";
import { TaskManagerProvider } from "@/components/dnd/context/task-manager-context";
import { useParams } from "react-router";
import { parseDate } from "@/utils/date.util";
import AddFutureTask from "../future-task-components/add-future-task";
import { FirebaseCollection } from "@/config/firebase.config";
import { useDailyTaskContext } from "../hooks/useDailyTask";

import DailyAddAnotherTask from "./daily-add-another-task";
import {
  filterTaskByDayOfWeedk,
  filterTasksByAnotherTasks,
} from "@/services/task-menager/filter-tasks";
import { normalizeItems } from "@/services/task-menager/normalize";
import { resolveCategoryKey } from "@/utils/category.util";
import { DailyTaskTimerSyncState } from "@/types/task-timer-sync.model";

const DailyTaskWrapper = () => {
  const [dailyTasks, setDailyTasks] = useState<Items>([]);
  const { id: date } = useParams(); // ← id це твоя дата у форматі "dd.MM.yyyy"
  const currentDateRef = useRef(date);
  const [isFuture, setIsFuture] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [anotherNormalizedTasks, setAnotherNormalizedTasks] = useState<
    NormalizedTask[]
  >([]); // Додано для зберігання нормалізованих завдань
  const [templatedTasks, setTemplatedTasks] = useState<Items>([]);
  const [remoteTimerState, setRemoteTimerState] =
    useState<DailyTaskTimerSyncState | null>(null);
  const templatedTasksRef = useRef<Items>([]);
  const {
    plannedTasks,
    updatePlannedTask,
    deletePlannedTask,
    addPlannedTask,
    setDailyTasks: setProviderDailyTask,
  } = useDailyTaskContext();

  useEffect(() => {
    // 💡 Очищення попередніх даних при зміні дати
    setIsLoaded(false);
    setDailyTasks([]);
    setRemoteTimerState(null);
    setAnotherNormalizedTasks([]);
    currentDateRef.current = date;
    if (!date) return;
    const parsedDate = parseDate(date);
    setIsFuture(parsedDate > new Date()); // 🔄 Перевірка на майбутню дату

    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const syncAnotherTasks = (templateItems: Items, tasks: Items) => {
      if (!templateItems.length) {
        setAnotherNormalizedTasks([]);
        return;
      }

      if (tasks.length > 0) {
        setAnotherNormalizedTasks(filterTasksByAnotherTasks(templateItems, tasks));
        return;
      }

      setAnotherNormalizedTasks(normalizeItems(templateItems));
    };

    (async () => {
      const templateItems = (await loadTemplateTasks()) || [];
      if (!isMounted) return;

      templatedTasksRef.current = templateItems;
      setTemplatedTasks(templateItems);

      if (parsedDate > new Date()) {
        setIsLoaded(true);
        return;
      }

      unsubscribe = await subscribeToDailyTasksByDate<Items>(
        date,
        FirebaseCollection.dailyTasks,
        ({ items, timerState }) => {
          if (!isMounted) return;
          const nextTasks = items && items.length ? items : [];
          setDailyTasks(nextTasks);
          setRemoteTimerState(timerState);
          syncAnotherTasks(templatedTasksRef.current, nextTasks);
          setIsLoaded(true);
        },
      );

      if (unsubscribe) return;

      const fallbackTasks =
        (await loadDailyTasksByDate<Items>(date, FirebaseCollection.dailyTasks)) ||
        [];
      if (!isMounted) return;

      setDailyTasks(fallbackTasks);
      syncAnotherTasks(templateItems, fallbackTasks);
      setIsLoaded(true);
    })();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [date]);

  useEffect(() => {
    setProviderDailyTask(dailyTasks);
  }, [dailyTasks, setProviderDailyTask]);

  const onUpdatePlannedTask = useCallback(
    (task: ItemTask) => {
      updatePlannedTask(task);
    },
    [updatePlannedTask]
  );

  const mergeNewPlannedTasks = useCallback(
    (newTasks: ItemTaskCategory[]) => {
      if (!addPlannedTask) return;
      addPlannedTask(newTasks);
    },
    [addPlannedTask]
  );

  const handleMerageTasks = useCallback(() => {
    if (!plannedTasks) return;
    setIsLoaded(false);
    currentDateRef.current = date || "";
    loadTemplateTasks().then((tasks) => {
      // date param is ISO "YYYY-MM-DD" from calendar navigation
      const isoDate = date ?? new Date().toISOString().slice(0, 10);
      const {
        filteredTasks,
        plannedTasks: templatePlannedTasks,
        filteredNormalizedTasks,
      } = filterTaskByDayOfWeedk(tasks, isoDate);
      setAnotherNormalizedTasks(filteredNormalizedTasks);
      // save to timeline preset
      mergeNewPlannedTasks(templatePlannedTasks);
      //  merge determined tasks with planned tasks
      const merged = mergeItemsWithPlannedTasks(filteredTasks, plannedTasks);
      if (merged && merged.length) {
        // merge with changed tasks
        const meregedTasks = mergeItemsDeep(dailyTasks, merged);
        setDailyTasks(meregedTasks);
        saveDailyTasks<Items>(
          meregedTasks,
          currentDateRef.current || "",
          FirebaseCollection.dailyTasks
        );
      }
      setIsLoaded(true);
    });
  }, [dailyTasks, plannedTasks, date, mergeNewPlannedTasks]);

  const handleSyncTimerState = useCallback(
    (timerState: DailyTaskTimerSyncState | null) => {
      const currentDate = currentDateRef.current;
      if (!currentDate) return;
      void saveDailyTaskTimerState(currentDate, timerState);
    },
    [],
  );

  const updatePlannedDeterminedTask = useCallback(
    (tasks: Items) => {
      if (!addPlannedTask) return;
      const plannedTasks = findPlannedOrDeterminedTask(tasks).map((task) => {
        return {
          id: task.id,
          title: task.title,
          isDone: task.isDone,
          time: task.time,
          timeDone: task.timeDone,
          priority: task.priority,
          isPlanned: true,
          whenDo: task.whenDo || [],
          isDetermined: task.isDetermined || false,
          categoryName: task.categoryName,
          schedule: task.schedule,
        } as ItemTaskCategory;
      });
      addPlannedTask(plannedTasks);
    },
    [addPlannedTask]
  );

  const handleChangeTasks = useCallback(
    (tasks: Items) => {
      if (!isLoaded) return;
      setTimeout(() => {
        setDailyTasks(tasks);
        setAnotherNormalizedTasks(
          filterTasksByAnotherTasks(templatedTasks, tasks)
        );
        updatePlannedDeterminedTask(tasks);
      }, 0);
      saveDailyTasks<Items>(
        tasks,
        currentDateRef.current || "",
        FirebaseCollection.dailyTasks
      );
    },
    [isLoaded, updatePlannedDeterminedTask, templatedTasks]
  );

  const handleAddTemplateTask = useCallback(
    (task: NormalizedTask) => {
      const newTask = addNewTask(dailyTasks, task);
      handleChangeTasks(newTask);
    },
    [dailyTasks, handleChangeTasks]
  );

  const getAnotherTasksForCategory = useCallback(
    (categoryId: string | number, categoryTitle: string) => {
      const categoryKey = resolveCategoryKey(categoryTitle);
      return anotherNormalizedTasks.filter((task) => {
        if (String(task.categoryId) === String(categoryId)) return true;
        return resolveCategoryKey(task.categoryName) === categoryKey;
      });
    },
    [anotherNormalizedTasks]
  );

  return (
    <>
      {!isFuture ? (
        <>
          {!isLoaded && <Preloader />}
          {isLoaded && (
            <TaskManagerProvider>
              <MultipleContainers
                strategy={rectSortingStrategy}
                vertical
                trashable
                templated={false}
                items={dailyTasks}
                onDeletePlannedTask={deletePlannedTask}
                onChangeTasks={handleChangeTasks}
                onEditPlannedTask={onUpdatePlannedTask}
                getAnotherTasksForCategory={getAnotherTasksForCategory}
                onAddAnotherTask={handleAddTemplateTask}
                remoteTimerState={remoteTimerState}
                onSyncTimerState={handleSyncTimerState}
              />
            </TaskManagerProvider>
          )}
          <div className="flex flex-col gap-3 w-full">
            {isLoaded && (
              <DailyAddTemplateButton
                title={"task_manager.add_template_task"}
                onClick={handleMerageTasks}
              />
            )}
            {isLoaded && anotherNormalizedTasks.length > 0 && (
              <DailyAddAnotherTask
                tasks={anotherNormalizedTasks}
                onAddTask={(task: NormalizedTask) => {
                  handleAddTemplateTask(task);
                }}
              ></DailyAddAnotherTask>
            )}
          </div>
        </>
      ) : (
        <AddFutureTask date={date} />
      )}
    </>
  );
};

export default DailyTaskWrapper;
