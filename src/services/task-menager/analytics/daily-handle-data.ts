import {
  AnalyticsData,
  CategoryAnalyticsNameEntity,
  DailyAnalyticsData,
  DailyTaskAnalytics,
  RangeTaskAnalytics,
  RangeTaskAnalyticsNameEntity,
  TaskStreakInsight,
  TaskAnalyticsIdEntity,
} from "@/types/analytics/task-analytics.model";
import { buildAreaProgress } from "@/services/task-menager/progress/progress.service";
import { DailyTaskRecord, ItemTask, Items } from "@/types/drag-and-drop.model";
import { ISODate } from "@/types/task-instance.model";
import { resolveCategoryKey } from "@/utils/category.util";
import { formatISO, subDays } from "date-fns";

/**
 * Фактично затреканий час по задачі (сек).
 * Для невиконаних задач враховуємо лише те, що реально натрекали (`timeDone`), а не план (`time`).
 */
function taskTrackedSeconds(task: ItemTask): number {
  if (task.isDetermined) {
    return task.isDone && task.timeDone > 0 ? task.timeDone : 0;
  }
  if (task.isPlanned) {
    return task.timeDone > 0 ? task.timeDone : 0;
  }
  if (task.isDone) {
    return task.timeDone > 0 ? task.timeDone : task.time;
  }
  return task.timeDone > 0 ? task.timeDone : 0;
}

export const getAreaProgress = (
  rangeTasks: DailyTaskRecord[],
  from?: ISODate,
  to?: ISODate,
) => {
  const sourcePeriod =
    from && to
      ? {
          from,
          to,
          label: "derived" as const,
        }
      : undefined;

  return Object.values(buildAreaProgress(rangeTasks, sourcePeriod));
};

export const getDailyTaskAnalyticsData = (tasks: Items): DailyTaskAnalytics => {
  const dailyEntity: TaskAnalyticsIdEntity = {};
  const categoryEntity: CategoryAnalyticsNameEntity = {};
  const dailyAnalytics: DailyAnalyticsData = {
    countDoneTime: 0,
    countTime: 0,
    countDoneTask: 0,
    countTrackedTask: 0,
    countAllTask: 0,
  };
  tasks.forEach((cat) => {
    const categoryTitleRaw =
      (cat as { title?: string }).title ??
      (cat as { name?: string }).name ??
      (cat as { categoryName?: string }).categoryName ??
      "";
    const categoryTitle = resolveCategoryKey(categoryTitleRaw);
    const taskList = (cat as { tasks?: unknown[] }).tasks ?? [];
    if (!categoryTitle) return;
    const categoryStats = categoryEntity[categoryTitle] ?? {
      time: 0,
      countDone: 0,
      countDoneTime: 0,
      taskDone: [],
      taskNoDone: [],
      categoryId: categoryTitle,
    };

    taskList.forEach((raw) => {
      const task = raw as ItemTask;
      const {
        id,
        title,
        isDone,
        isDetermined,
        isPlanned,
        time,
        timeDone,
        priority,
      } = task;

      const timeDo = isDetermined || isPlanned || isDone ? timeDone : time;
      const trackedTime = taskTrackedSeconds(task);
      dailyAnalytics.countTime += timeDo;
      dailyAnalytics.countAllTask += 1;
      dailyAnalytics.countDoneTime += trackedTime;
      dailyAnalytics.countDoneTask += isDone ? 1 : 0;
      dailyAnalytics.countTrackedTask += trackedTime > 0 ? 1 : 0;

      categoryStats.time += timeDo;
      categoryStats.countDoneTime += trackedTime;

      if (isDone) {
        categoryStats.countDone += 1;
        categoryStats.taskDone.push(title);
      } else {
        categoryStats.taskNoDone.push(title);
      }

      dailyEntity[id] = {
        title,
        time: trackedTime,
        timeDone: trackedTime,
        category: categoryTitle,
        isDone,
        priority,
      };
    });

    categoryEntity[categoryTitle] = categoryStats;
  });

  return { dailyEntity, categoryEntity, dailyAnalytics };
};

export const getRangeDailyTaskAnalytics = (
  rangeTasks: DailyTaskRecord[],
  range?: { from: ISODate; to: ISODate },
): AnalyticsData => {
  const categoryEntity: CategoryAnalyticsNameEntity = {};
  const taskEntity: RangeTaskAnalyticsNameEntity = {};
  const areaProgress = getAreaProgress(rangeTasks, range?.from, range?.to);
  const taskStreaks = getTaskStreaksWithoutSkips(rangeTasks, range);
  const todayIso = formatISO(new Date(), { representation: "date" }) as ISODate;

  const data = rangeTasks.map((item) => {
    const { date, items } = item;
    const rangeData = getRangeAnalyticsData(
      items,
      categoryEntity,
      taskEntity,
      date,
      todayIso,
    );
    return { date, data: rangeData };
  });
  return {
    rangeTasks: data,
    categoryEntity,
    rangeTaskEntity: taskEntity,
    areaProgress,
    taskStreaks,
  };
};

export const getRangeAnalyticsData = (
  tasks: Items,
  categoryEntity: CategoryAnalyticsNameEntity,
  taskEntity: RangeTaskAnalyticsNameEntity,
  recordDate: string,
  todayIso: ISODate,
): RangeTaskAnalytics => {
  let countTimeDone = 0;
  let countNotTimeDone = 0;
  const recordDateIso = toIsoDateOnly(recordDate);
  const isCurrentDay = recordDateIso === todayIso;

  tasks.forEach((cat) => {
    const categoryTitleRaw =
      (cat as { title?: string }).title ??
      (cat as { name?: string }).name ??
      (cat as { categoryName?: string }).categoryName ??
      "";
    const categoryTitle = resolveCategoryKey(categoryTitleRaw);
    /** Ключ категорії для іконок: у випадаючому зберігається саме title (career, health, …), id може бути UUID */
    const taskList = (cat as { tasks?: unknown[] }).tasks ?? [];
    if (!categoryTitle) return;
    if (!categoryEntity[categoryTitle]) {
      categoryEntity[categoryTitle] = {
        time: 0,
        countDone: 0,
        countDoneTime: 0,
        taskDone: [],
        taskNoDone: [],
        categoryId: categoryTitle,
      };
    }

    taskList.forEach((raw) => {
      const task = raw as ItemTask;
      const { title, isDone, isDetermined, isPlanned, time, timeDone } = task;

      if (!taskEntity[title]) {
        taskEntity[title] = {
          countIsDone: 0,
          countIsNotDone: 0,
          countTime: 0,
          countDoneTime: 0,
          categoryId: categoryTitle,
        };
      } else if (!taskEntity[title].categoryId) {
        taskEntity[title].categoryId = categoryTitle;
      }
      if (isDetermined || isPlanned) {
        categoryEntity[categoryTitle].time += timeDone;
        taskEntity[title].countTime += timeDone;
        if (isDone) {
          taskEntity[title].countIsDone += 1;
          taskEntity[title].countDoneTime += timeDone;
          countTimeDone += timeDone;
          categoryEntity[categoryTitle].countDoneTime += timeDone;
        } else {
          // "Skip" is counted only for actually created-not-done tasks,
          // except current day (task can still be completed later today).
          if (!isCurrentDay) {
            taskEntity[title].countIsNotDone += 1;
            countNotTimeDone += timeDone;
            categoryEntity[categoryTitle].taskNoDone.push(title);
          }
        }
      } else {
        categoryEntity[categoryTitle].time += time;
        taskEntity[title].countTime += time;
        if (isDone) {
          taskEntity[title].countIsDone += 1;
          taskEntity[title].countDoneTime += timeDone;
          countTimeDone += timeDone;
          categoryEntity[categoryTitle].countDoneTime += timeDone;
        } else {
          if (!isCurrentDay) {
            taskEntity[title].countIsNotDone += 1;
            countNotTimeDone += time;
          }
        }
      }
    });
  });

  return {
    countTimeDone,
    countNotTimeDone,
  };
};

const MIN_STREAK_DAYS = 3;
const MAX_STREAK_GAP_DAYS = 3;

type TaskDayStatus = {
  present: boolean;
  done: boolean;
};

const toIsoDateOnly = (date: string): ISODate => date.slice(0, 10) as ISODate;

const prevIsoDate = (date: ISODate): ISODate =>
  formatISO(subDays(new Date(`${date}T12:00:00`), 1), {
    representation: "date",
  }) as ISODate;

const normalizeTaskTitle = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const hasAnyTasks = (record: DailyTaskRecord): boolean =>
  record.items.some((category) => category.tasks.length > 0);

function getTaskStreaksWithoutSkips(
  rangeTasks: DailyTaskRecord[],
  range?: { from: ISODate; to: ISODate },
): TaskStreakInsight[] {
  if (!rangeTasks.length) return [];

  const sortedDates = Array.from(
    new Set(rangeTasks.map((record) => toIsoDateOnly(record.date))),
  ).sort();

  const rangeFrom = range?.from ?? sortedDates[0];
  const rangeTo = range?.to ?? sortedDates[sortedDates.length - 1];
  const datesWithAnyTasks = new Set(
    rangeTasks
      .filter((record) => {
        const dateKey = toIsoDateOnly(record.date);
        return (
          dateKey >= rangeFrom && dateKey <= rangeTo && hasAnyTasks(record)
        );
      })
      .map((record) => toIsoDateOnly(record.date)),
  );

  const anchorDate = rangeTo;
  const todayIso = formatISO(new Date(), { representation: "date" }) as ISODate;

  type AccTask = {
    key: string;
    title: string;
    categoryId: string;
    byDate: Map<ISODate, TaskDayStatus>;
  };

  const taskMap = new Map<string, AccTask>();

  rangeTasks.forEach((record) => {
    const dateKey = toIsoDateOnly(record.date);
    if (dateKey < rangeFrom || dateKey > rangeTo) return;

    record.items.forEach((category) => {
      const categoryId = resolveCategoryKey(category.title || "");
      if (!categoryId) return;

      category.tasks.forEach((task) => {
        const normalizedTitle = normalizeTaskTitle(task.title || "");
        if (!normalizedTitle) return;

        const taskKey = `${categoryId}::${normalizedTitle}`;
        if (!taskMap.has(taskKey)) {
          taskMap.set(taskKey, {
            key: taskKey,
            title: task.title,
            categoryId,
            byDate: new Map<ISODate, TaskDayStatus>(),
          });
        }

        const acc = taskMap.get(taskKey)!;
        const prev = acc.byDate.get(dateKey) ?? { present: false, done: false };
        acc.byDate.set(dateKey, {
          present: true,
          done: prev.done || Boolean(task.isDone),
        });
      });
    });
  });

  const streaks: TaskStreakInsight[] = [];

  taskMap.forEach((task) => {
    let streak = 0;
    let gapDays = 0;
    let current = anchorDate;

    while (current >= rangeFrom) {
      const status = task.byDate.get(current);
      const isToday = current === todayIso;
      if (status?.present && status.done) {
        streak += 1;
        gapDays = 0;
        current = prevIsoDate(current);
        continue;
      }
      // A skip counts only when the task exists on that date and is not done.
      // Current day is ignored as a skip (can still be done later today).
      if (status?.present && !status.done) {
        if (isToday) {
          current = prevIsoDate(current);
          continue;
        }
        break;
      }
      // Days with other tasks do not reset this task's streak.
      // Only calendar days with no tasks at all count toward the gap limit.
      if (!datesWithAnyTasks.has(current)) {
        if (isToday) {
          current = prevIsoDate(current);
          continue;
        }
        gapDays += 1;
        if (gapDays > MAX_STREAK_GAP_DAYS) break;
      }
      current = prevIsoDate(current);
    }

    if (streak >= MIN_STREAK_DAYS) {
      streaks.push({
        key: task.key,
        title: task.title,
        days: streak,
        categoryId: task.categoryId,
      });
    }
  });

  return streaks.sort((a, b) => {
    if (b.days !== a.days) return b.days - a.days;
    return a.title.localeCompare(b.title);
  });
}
