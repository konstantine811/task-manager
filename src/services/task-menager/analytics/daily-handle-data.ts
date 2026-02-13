import {
  AnalyticsData,
  CategoryAnalyticsNameEntity,
  DailyAnalyticsData,
  DailyTaskAnalytics,
  RangeTaskAnalytics,
  RangeTaskAnalyticsNameEntity,
  TaskAnalyticsIdEntity,
} from "@/types/analytics/task-analytics.model";
import { DailyTaskRecord, Items } from "@/types/drag-and-drop.model";

export const getDailyTaskAnalyticsData = (tasks: Items): DailyTaskAnalytics => {
  const dailyEntity: TaskAnalyticsIdEntity = {};
  const categoryEntity: CategoryAnalyticsNameEntity = {};
  const dailyAnalytics: DailyAnalyticsData = {
    countDoneTime: 0,
    countTime: 0,
    countDoneTask: 0,
    countAllTask: 0,
  };

  tasks.forEach(({ title: categoryTitle, tasks: taskList }) => {
    const categoryStats = categoryEntity[categoryTitle] ?? {
      time: 0,
      countDone: 0,
      countDoneTime: 0,
      taskDone: [],
      taskNoDone: [],
    };

    taskList.forEach((task) => {
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
      const timeDoneCategory =
        (isDetermined || isPlanned) && !isDone ? 0 : timeDone;
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
        time: timeDo,
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
  rangeTasks: DailyTaskRecord[]
): AnalyticsData => {
  const categoryEntity: CategoryAnalyticsNameEntity = {};
  const taskEntity: RangeTaskAnalyticsNameEntity = {};

  const data = rangeTasks.map((item) => {
    const { date, items } = item;
    const rangeData = getRangeAnalyticsData(items, categoryEntity, taskEntity);
    return { date, data: rangeData };
  });
  return {
    rangeTasks: data,
    categoryEntity,
    rangeTaskEntity: taskEntity,
  };
};

export const getRangeAnalyticsData = (
  tasks: Items,
  categoryEntity: CategoryAnalyticsNameEntity,
  taskEntity: RangeTaskAnalyticsNameEntity
): RangeTaskAnalytics => {
  let countTimeDone = 0;
  let countNotTimeDone = 0;

  tasks.forEach(({ title: categoryTitle, tasks: taskList }) => {
    if (!categoryEntity[categoryTitle]) {
      categoryEntity[categoryTitle] = {
        time: 0,
        countDone: 0,
        countDoneTime: 0,
        taskDone: [],
        taskNoDone: [],
      };
    }

    taskList.forEach((task) => {
      const { title, isDone, isDetermined, isPlanned, time, timeDone } = task;

      if (!taskEntity[title]) {
        taskEntity[title] = {
          countIsDone: 0,
          countIsNotDone: 0,
          countTime: 0,
          countDoneTime: 0,
        };
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
