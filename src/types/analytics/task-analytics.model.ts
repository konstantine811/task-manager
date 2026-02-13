import { ANALYTICS_PERIODS } from "@/config/task-analytics.config";
import { DayNumber, ItemTask, Priority } from "@/types/drag-and-drop.model";
import { UniqueIdentifier } from "@dnd-kit/core";

export type WeekTaskEntity = {
  [key in DayNumber]?: WeekTaskData;
};

export interface WeekTaskData {
  totalTime: number;
  categories: string[];
  tasks: ItemTask[];
}

export interface FlattenedTask {
  day: number;
  title: string;
  duration: number;
}

export type ItemTimeMap = {
  [title: string]: number;
};

export type StackedDay = {
  day: number;
  [title: string]: string | number;
};

export type TaskAnalytics = {
  weekTaskEntity: WeekTaskEntity;
  flattenTasks: FlattenedTask[];
};

export enum ItemTimeMapKeys {
  category = "category",
  task = "task",
}

export enum TemplateTypeChart {
  timeCount = "timeCount",
  category = ItemTimeMapKeys.category,
  task = ItemTimeMapKeys.task,
}

export type TypeAnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export type TaskAnalyticsIdEntity = {
  [id: UniqueIdentifier]: TaskAnalyticsData;
};

export type CategoryAnalyticsNameEntity = {
  [id: string]: CategoryAnalyticsData;
};

export type RangeTaskAnalyticsNameEntity = {
  [key: string]: RangeTaskAnalyticsData;
};

export interface RangeTaskAnalyticsData {
  countIsDone: number;
  countIsNotDone: number;
  countTime: number;
  countDoneTime: number;
}

export interface DailyAnalyticsData {
  countDoneTime: number;
  countTime: number;
  countDoneTask: number;
  countAllTask: number;
}

export interface TaskAnalyticsData {
  title: string;
  time: number;
  timeDone: number;
  category: string;
  isDone: boolean;
  priority: Priority;
}

export interface CategoryAnalyticsData {
  time: number;
  countDone: number;
  countDoneTime: number;
  taskDone: string[];
  taskNoDone: string[];
}

export type TaskAnalyticsBarOrientation = "vertical" | "horizontal";

export interface DailyTaskAnalytics {
  dailyEntity: TaskAnalyticsIdEntity;
  categoryEntity: CategoryAnalyticsNameEntity;
  dailyAnalytics: DailyAnalyticsData;
}

export interface AnalyticsData {
  rangeTasks: RangeTaskAnalyticRecord[];
  categoryEntity: CategoryAnalyticsNameEntity;
  rangeTaskEntity: RangeTaskAnalyticsNameEntity;
}

export interface RangeTaskAnalyticRecord {
  data: RangeTaskAnalytics;
  date: string;
}

export interface RangeTaskAnalytics {
  countTimeDone: number;
  countNotTimeDone: number;
}

export interface CurveOptions {
  value: ValueCurveOption;
  label: string;
  icon: string;
}

export enum ValueCurveOption {
  curveLinear = "curveLinear",
  curveStepAfter = "curveStepAfter",
  curveBasis = "curveBasis",
  curveCardinal = "curveCardinal",
  curveMonotoneX = "curveMonotoneX",
}
