import { ANALYTICS_PERIODS } from "@/config/task-analytics.config";
import {
  DailyTaskRecord,
  ItemTask,
  Priority,
} from "@/types/drag-and-drop.model";
import type { AreaProgress } from "@/types/progress.model";
import type { ISODate } from "@/types/task-instance.model";
import type { DayNumber } from "@/types/task-template.model";
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
  /** Категорія задачі для іконки в аналітиці (ключ з CATEGORY_STYLE) */
  categoryId?: string;
}

export interface DailyAnalyticsData {
  countDoneTime: number;
  countTime: number;
  countDoneTask: number;
  countTrackedTask: number;
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
  /** Для задач: категорія для іконки (ключ з CATEGORY_STYLE) */
  categoryId?: string;
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
  areaProgress: AreaProgress[];
  taskStreaks: TaskStreakInsight[];
}

export interface AnalyticsWorkerPayload {
  rangeTasks: DailyTaskRecord[];
  from: ISODate;
  to: ISODate;
}

export interface RangeTaskAnalyticRecord {
  data: RangeTaskAnalytics;
  date: string;
}

export interface RangeTaskAnalytics {
  countTimeDone: number;
  countNotTimeDone: number;
}

export interface TaskStreakInsight {
  key: string;
  title: string;
  days: number;
  categoryId: string;
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
