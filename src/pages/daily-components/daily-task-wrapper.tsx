import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadTemplateTasks,
  saveDailyTasks,
  loadDailyTasksByDate,
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
import { useGoalsStore } from "@/storage/goalsStore";
import type { TaskGoalLink } from "@/types/drag-and-drop.model";
import type { UniqueIdentifier } from "@dnd-kit/core";

function normalizeTitle(s: string): string {
  return s.trim().toLowerCase();
}

function getGoalLinksFromTemplate(
  taskId: UniqueIdentifier,
  taskTitle: string,
  templateItems: Items
): TaskGoalLink[] | undefined {
  for (const cat of templateItems) {
    const byId = cat.tasks.find((x) => x.id === taskId);
    if (byId?.goalLinks?.length) return byId.goalLinks;
  }
  const titleNorm = normalizeTitle(taskTitle);
  for (const cat of templateItems) {
    const byTitle = cat.tasks.find((x) => normalizeTitle(x.title) === titleNorm);
    if (byTitle?.goalLinks?.length) return byTitle.goalLinks;
  }
  return undefined;
}

/** Fallback: find goalLinks by scanning template for any task with same title (for active goals) */
function getGoalLinksFromGoalsFallback(
  taskTitle: string,
  templateItems: Items,
  goals: { id: UniqueIdentifier; status: string; metric?: { type: string; target?: number }; title?: string }[]
): TaskGoalLink[] | undefined {
  const titleNorm = normalizeTitle(taskTitle);
  const activeGoalIds = new Set(goals.filter((g) => g.status === "active").map((g) => String(g.id)));
  for (const cat of templateItems) {
    for (const t of cat.tasks) {
      if (normalizeTitle(t.title) !== titleNorm || !t.goalLinks?.length) continue;
      const filtered = t.goalLinks.filter((l) => activeGoalIds.has(String(l.goalId)));
      if (filtered.length > 0) return filtered;
    }
  }
  return undefined;
}

/** Semantic fallback: goals "do X once" — goal title contains task title, metric count target 1 */
function getSemanticGoalLinks(
  taskTitle: string,
  goals: { id: UniqueIdentifier; status: string; metric?: { type: string; target?: number }; title?: string }[]
): TaskGoalLink[] {
  const titleNorm = normalizeTitle(taskTitle);
  if (!titleNorm || titleNorm.length < 2) return [];
  const result: TaskGoalLink[] = [];
  for (const g of goals) {
    if (g.status !== "active") continue;
    const metric = g.metric as { type?: string; target?: number } | undefined;
    if (metric?.type !== "count" || metric?.target !== 1) continue;
    const goalTitleNorm = normalizeTitle(g.title ?? "");
    if (goalTitleNorm.includes(titleNorm) || titleNorm.includes(goalTitleNorm)) {
      result.push({ goalId: g.id, impact: { type: "count", value: 1 } });
    }
  }
  return result;
}

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
  const {
    plannedTasks,
    updatePlannedTask,
    deletePlannedTask,
    addPlannedTask,
    setDailyTasks: setProviderDailyTask,
  } = useDailyTaskContext();
  const goals = useGoalsStore((s) => s.goals);
  const applyTaskDone = useGoalsStore((s) => s.applyTaskDone);
  const applyTaskUndone = useGoalsStore((s) => s.applyTaskUndone);
  const lastDoneKeyRef = useRef<string>("");
  const lastEnrichedRef = useRef<Items | null>(null);

  useEffect(() => {
    // 💡 Очищення попередніх даних при зміні дати
    setIsLoaded(false);
    setDailyTasks([]);
    currentDateRef.current = date;
    if (!date) return;
    const parsedDate = parseDate(date);
    setIsFuture(parsedDate > new Date()); // 🔄 Перевірка на майбутню дату
    Promise.all([
      loadDailyTasksByDate<Items>(date, FirebaseCollection.dailyTasks),
      loadTemplateTasks(),
    ]).then(([tasks, templateTasks]) => {
      setTemplatedTasks(templateTasks || []);
      const templateItems = templateTasks || [];
      const enrichWithGoalLinks = (items: Items): Items =>
        items.map((cat) => ({
          ...cat,
          tasks: cat.tasks.map((t) => {
            if (t.goalLinks?.length) return t;
            const links = getGoalLinksFromTemplate(t.id, t.title, templateItems);
            return links ? { ...t, goalLinks: links } : t;
          }),
        }));
      if (templateItems.length) {
        if (tasks && tasks.length) {
          setAnotherNormalizedTasks(
            filterTasksByAnotherTasks(templateItems, tasks)
          );
        } else {
          setAnotherNormalizedTasks(normalizeItems(templateItems));
        }
      }
      if (tasks && tasks.length) {
        setDailyTasks(enrichWithGoalLinks(tasks));
      } else {
        setDailyTasks([]);
      }
      setIsLoaded(true);
    });
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
          goalLinks: task.goalLinks,
        } as ItemTaskCategory;
      });
      addPlannedTask(plannedTasks);
    },
    [addPlannedTask]
  );

  const handleChangeTasks = useCallback(
    (tasks: Items) => {
      const enriched = tasks.map((cat) => ({
        ...cat,
        tasks: cat.tasks.map((t) => {
          if (t.goalLinks?.length) return t;
          const links = getGoalLinksFromTemplate(t.id, t.title, templatedTasks);
          return links ? { ...t, goalLinks: links } : t;
        }),
      }));
      lastEnrichedRef.current = enriched;
      if (!isLoaded) return;
      setTimeout(() => {
        setDailyTasks(enriched);
        setAnotherNormalizedTasks(
          filterTasksByAnotherTasks(templatedTasks, enriched)
        );
        updatePlannedDeterminedTask(enriched);
      }, 0);
      saveDailyTasks<Items>(
        enriched,
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
                onTaskDone={
                  date
                    ? (task) => {
                        const key = `done-${task.id}-${date}`;
                        if (lastDoneKeyRef.current === key) return;
                        lastDoneKeyRef.current = key;
                        let goalLinks = task.goalLinks ?? getGoalLinksFromTemplate(task.id, task.title, templatedTasks);
                        if (!goalLinks?.length && lastEnrichedRef.current) {
                          for (const cat of lastEnrichedRef.current) {
                            let t = cat.tasks.find((x) => x.id === task.id);
                            if (!t) {
                              t = cat.tasks.find(
                                (x) => normalizeTitle(x.title) === normalizeTitle(task.title)
                              );
                            }
                            if (t?.goalLinks?.length) {
                              goalLinks = t.goalLinks;
                              break;
                            }
                          }
                        }
                        if (!goalLinks?.length && templatedTasks.length > 0) {
                          goalLinks = getGoalLinksFromGoalsFallback(task.title, templatedTasks, goals);
                        }
                        const semanticLinks = getSemanticGoalLinks(task.title, goals);
                        if (semanticLinks.length) {
                          const seen = new Set((goalLinks ?? []).map((l) => String(l.goalId)));
                          for (const l of semanticLinks) {
                            if (!seen.has(String(l.goalId))) {
                              seen.add(String(l.goalId));
                              goalLinks = [...(goalLinks ?? []), l];
                            }
                          }
                        }
                        const validLinks = goalLinks?.filter((l) => {
                          const g = goals.find((x) => String(x.id) === String(l.goalId));
                          return g && g.status === "active";
                        });
                        if (validLinks?.length)
                          applyTaskDone(task.id, date, {
                            title: task.title,
                            time: task.time,
                            timeDone: task.timeDone ?? task.time,
                            goalLinks: validLinks,
                          });
                      }
                    : undefined
                }
                onTaskUndone={
                  date
                    ? (task) => {
                        lastDoneKeyRef.current = "";
                        let goalLinks =
                          task.goalLinks ??
                          getGoalLinksFromTemplate(task.id, task.title, templatedTasks);
                        if (!goalLinks?.length && lastEnrichedRef.current) {
                          for (const cat of lastEnrichedRef.current) {
                            let t = cat.tasks.find((x) => x.id === task.id);
                            if (!t) {
                              t = cat.tasks.find(
                                (x) => normalizeTitle(x.title) === normalizeTitle(task.title)
                              );
                            }
                            if (t?.goalLinks?.length) {
                              goalLinks = t.goalLinks;
                              break;
                            }
                          }
                        }
                        if (!goalLinks?.length && templatedTasks.length > 0) {
                          goalLinks = getGoalLinksFromGoalsFallback(
                            task.title,
                            templatedTasks,
                            goals
                          );
                        }
                        const semanticLinksUndone = getSemanticGoalLinks(task.title, goals);
                        if (semanticLinksUndone.length) {
                          const seen = new Set((goalLinks ?? []).map((l) => String(l.goalId)));
                          for (const l of semanticLinksUndone) {
                            if (!seen.has(String(l.goalId))) {
                              seen.add(String(l.goalId));
                              goalLinks = [...(goalLinks ?? []), l];
                            }
                          }
                        }
                        const validLinksUndone = goalLinks?.filter((l) => {
                          const g = goals.find((x) => String(x.id) === String(l.goalId));
                          return g && g.status === "active";
                        });
                        if (validLinksUndone?.length)
                          applyTaskUndone(task.id, date, {
                            title: task.title,
                            time: task.time,
                            timeDone: task.timeDone ?? task.time,
                            goalLinks: validLinksUndone,
                          });
                      }
                    : undefined
                }
              />
            </TaskManagerProvider>
          )}
          <div className="flex flex-col gap-2 w-full">
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
