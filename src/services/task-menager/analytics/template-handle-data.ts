import {
  ItemTimeMap,
  FlattenedTask,
  TaskAnalytics,
  TypeAnalyticsPeriod,
  WeekTaskEntity,
  ItemTimeMapKeys,
} from "@/types/analytics/task-analytics.model";
import { DayNumber, Items, ItemTask } from "@/types/drag-and-drop.model";

export const getTaskAnalyticsData = (tasks: Items): TaskAnalytics => {
  const weekTaskEntity: WeekTaskEntity = {};
  const flattenTasks: FlattenedTask[] = [];

  tasks.forEach((category) => {
    category.tasks.forEach((task) => {
      task.whenDo.forEach((day) => {
        if (!weekTaskEntity[day]) {
          weekTaskEntity[day] = {
            totalTime: 0,
            categories: [],
            tasks: [],
          };
        }
        const timeToAdd = task.isDetermined ? task.timeDone : task.time;
        weekTaskEntity[day].totalTime += timeToAdd;
        if (!weekTaskEntity[day].categories.includes(category.title)) {
          weekTaskEntity[day].categories.push(category.title);
        }
        weekTaskEntity[day].tasks.push(task);

        flattenTasks.push({
          day,
          title: task.title,
          duration: timeToAdd,
        });
      });
    });
  });
  return { weekTaskEntity, flattenTasks };
};

export const getItemTimeMapByPeriod = (
  tasks: Items,
  analyticsPerid: TypeAnalyticsPeriod = "by_all_week",
  type: ItemTimeMapKeys = ItemTimeMapKeys.category
): ItemTimeMap => {
  const itemTimeMap: ItemTimeMap = {};

  tasks.forEach((category) => {
    category.tasks.forEach((task) => {
      const timeToAdd = task.isDetermined ? task.timeDone : task.time;
      const itemKey =
        type === ItemTimeMapKeys.category ? category.title : task.title;
      switchItemTimeMapByPeriod(
        itemTimeMap,
        itemKey,
        analyticsPerid,
        task,
        timeToAdd
      );
    });
  });
  return itemTimeMap;
};

function switchItemTimeMapByPeriod(
  itemTimeMap: ItemTimeMap,
  name: string,
  period: TypeAnalyticsPeriod,
  task: ItemTask,
  timeToAdd: number
) {
  const shouldAdd =
    period === "all" ||
    (period === "by_all_week" && task.whenDo.length > 0) ||
    task.whenDo.includes(period as DayNumber);

  if (shouldAdd) {
    const multiplier =
      period === "all" || period === "by_all_week"
        ? task.whenDo.length || 1
        : 1;

    itemTimeMap[name] ??= 0;
    itemTimeMap[name] += timeToAdd * multiplier;
  }
}
