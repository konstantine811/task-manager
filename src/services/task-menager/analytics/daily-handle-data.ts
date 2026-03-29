import {
  AnalyticsData,
  CategoryAnalyticsNameEntity,
  DailyAnalyticsData,
  DailyTaskAnalytics,
  RangeTaskAnalytics,
  RangeTaskAnalyticsNameEntity,
  TaskAnalyticsIdEntity,
} from "@/types/analytics/task-analytics.model";
import { buildAreaProgress } from "@/services/task-menager/progress/progress.service";
import {
  DailyTaskRecord,
  ItemTask,
  Items,
} from "@/types/drag-and-drop.model";
import { ISODate } from "@/types/task-instance.model";

export const getAreaProgress = (
  rangeTasks: DailyTaskRecord[],
  from?: ISODate,
  to?: ISODate
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
    countAllTask: 0,
  };

  tasks.forEach((cat) => {
    const categoryTitle =
      (cat as { title?: string }).title ??
      (cat as { name?: string }).name ??
      (cat as { categoryName?: string }).categoryName ??
      "";
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
      // "Completed" analytics should only include tasks that are currently marked done.
      // Otherwise an undone task with a preserved timeDone would still appear as completed.
      const timeDoneCategory = isDone ? timeDone || time : 0;
      dailyAnalytics.countTime += timeDo;
      dailyAnalytics.countAllTask += 1;
      dailyAnalytics.countDoneTime += timeDoneCategory;
      dailyAnalytics.countDoneTask += isDone ? 1 : 0;

      categoryStats.time += timeDo;
      categoryStats.countDoneTime += timeDoneCategory;

      if (isDone) {
        categoryStats.countDone += 1;
        categoryStats.taskDone.push(title);
      } else {
        categoryStats.taskNoDone.push(title);
      }

      dailyEntity[id] = {
        title,
        time: time,
        timeDone,
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
  range?: { from: ISODate; to: ISODate }
): AnalyticsData => {
  const categoryEntity: CategoryAnalyticsNameEntity = {};
  const taskEntity: RangeTaskAnalyticsNameEntity = {};
  const areaProgress = getAreaProgress(rangeTasks, range?.from, range?.to);

  const data = rangeTasks.map((item) => {
    const { date, items } = item;
    const rangeData = getRangeAnalyticsData(items, categoryEntity, taskEntity);
    return { date, data: rangeData };
  });
  return {
    rangeTasks: data,
    categoryEntity,
    rangeTaskEntity: taskEntity,
    areaProgress,
  };
};

export const getRangeAnalyticsData = (
  tasks: Items,
  categoryEntity: CategoryAnalyticsNameEntity,
  taskEntity: RangeTaskAnalyticsNameEntity
): RangeTaskAnalytics => {
  let countTimeDone = 0;
  let countNotTimeDone = 0;

  tasks.forEach((cat) => {
    const categoryTitle =
      (cat as { title?: string }).title ??
      (cat as { name?: string }).name ??
      (cat as { categoryName?: string }).categoryName ??
      "";
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
          taskEntity[title].countIsNotDone += 1;
          countNotTimeDone += timeDone;
          categoryEntity[categoryTitle].taskNoDone.push(title);
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
          taskEntity[title].countIsNotDone += 1;
          countNotTimeDone += time;
        }
      }
    });
  });

  return {
    countTimeDone,
    countNotTimeDone,
  };
};
