import { createContext, useContext } from "react";
import { Items, ItemTask, ItemTaskCategory } from "@/types/drag-and-drop.model";
import { UniqueIdentifier } from "@dnd-kit/core";
import { DailyTaskAnalytics } from "@/types/analytics/task-analytics.model";

export const DailyTaskContext = createContext<{
  plannedTasks: ItemTaskCategory[] | null;
  updatePlannedTask: (task: ItemTask) => void;
  deletePlannedTask: (taskId: UniqueIdentifier) => void; // 🆕
  addPlannedTask?: (newTask: ItemTaskCategory[]) => void; // 🆕
  dailyTasks: Items;
  setDailyTasks: (newDailyTasks: Items) => void;
  dailyAnalyticsData: DailyTaskAnalytics | null; // 🆕
  setDailyAnalyticsData?: (data: DailyTaskAnalytics | null) => void; // 🆕
}>({
  plannedTasks: null,
  updatePlannedTask: () => {},
  deletePlannedTask: () => {}, // 🆕
  addPlannedTask: () => {}, // 🆕
  dailyTasks: [],
  setDailyTasks: () => {},
  dailyAnalyticsData: null,
  setDailyAnalyticsData: () => {}, // 🆕
});

export const useDailyTaskContext = () => useContext(DailyTaskContext);
