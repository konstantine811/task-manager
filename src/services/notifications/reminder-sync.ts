import type { TFunction } from "i18next";
import type { Items } from "@/types/drag-and-drop.model";
import { parseDate } from "@/utils/date.util";

export const REMINDER_OFFSETS_SECONDS = [3600, 300] as const;

export type ReminderOffset = (typeof REMINDER_OFFSETS_SECONDS)[number];

export interface ReminderTask {
  id: string;
  title: string;
  scheduledSeconds: number;
}

export interface ReminderPlan {
  key: string;
  fireAtMs: number;
  taskId: string;
  taskTitle: string;
  taskClockLabel: string;
  offset: ReminderOffset;
}

export const isTodayIsoDate = (date: string): boolean => {
  const selected = parseDate(date);
  selected.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected.getTime() === today.getTime();
};

export const formatClockFromSeconds = (seconds: number): string => {
  const normalized = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(normalized / 3600) % 24;
  const minutes = Math.floor((normalized % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export const getNotificationBodyOffsetKey = (offset: ReminderOffset): string => {
  if (offset === 3600) return "task_manager.notifications.offset_1h";
  return "task_manager.notifications.offset_5m";
};

export const extractReminderTasks = (
  dailyTasks: Items | undefined,
  t: TFunction,
): ReminderTask[] => {
  if (!dailyTasks || dailyTasks.length === 0) return [];

  const tasks: ReminderTask[] = [];
  dailyTasks.forEach((category) => {
    category.tasks.forEach((task) => {
      if (!task.isDetermined || task.isDone) return;
      if (!Number.isFinite(task.time) || task.time <= 0) return;

      tasks.push({
        id: String(task.id),
        title: task.title || t("task_manager.new_task"),
        scheduledSeconds: Math.floor(task.time),
      });
    });
  });

  tasks.sort((a, b) => a.scheduledSeconds - b.scheduledSeconds);
  return tasks;
};

export const buildReminderPlans = (
  date: string,
  reminderTasks: ReminderTask[],
  nowMs = Date.now(),
  firedKeys?: Set<string>,
): ReminderPlan[] => {
  if (!date || reminderTasks.length === 0) return [];

  const dayStart = parseDate(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayStartMs = dayStart.getTime();

  const plans: ReminderPlan[] = [];
  reminderTasks.forEach((task) => {
    const dueAtMs = dayStartMs + task.scheduledSeconds * 1000;

    REMINDER_OFFSETS_SECONDS.forEach((offset) => {
      const fireAtMs = dueAtMs - offset * 1000;
      if (fireAtMs <= nowMs) return;

      const key = `${date}:${task.id}:${task.scheduledSeconds}:${offset}`;
      if (firedKeys?.has(key)) return;

      plans.push({
        key,
        fireAtMs,
        taskId: task.id,
        taskTitle: task.title,
        taskClockLabel: formatClockFromSeconds(task.scheduledSeconds),
        offset,
      });
    });
  });

  return plans;
};
