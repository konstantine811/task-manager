import { Items } from "@/types/drag-and-drop.model";
import { parseDate } from "@/utils/date.util";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const REMINDER_OFFSETS_SECONDS = [3600, 300] as const;

type ReminderOffset = (typeof REMINDER_OFFSETS_SECONDS)[number];

interface ReminderTask {
  id: string;
  title: string;
  scheduledSeconds: number;
}

interface ReminderPlan {
  key: string;
  fireAtMs: number;
  taskTitle: string;
  taskClockLabel: string;
  offset: ReminderOffset;
}

const isTodayIsoDate = (date: string): boolean => {
  const selected = parseDate(date);
  selected.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected.getTime() === today.getTime();
};

const formatClockFromSeconds = (seconds: number): string => {
  const normalized = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(normalized / 3600) % 24;
  const minutes = Math.floor((normalized % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const getNotificationBodyOffsetKey = (offset: ReminderOffset): string => {
  if (offset === 3600) return "task_manager.notifications.offset_1h";
  return "task_manager.notifications.offset_5m";
};

export const useDeterminedTaskReminders = (date?: string, dailyTasks?: Items) => {
  const [t] = useTranslation();
  const scheduledTimersRef = useRef<Map<string, number>>(new Map());
  const firedRemindersRef = useRef<Set<string>>(new Set());
  const permissionRequestedRef = useRef(false);
  const permissionHintShownRef = useRef(false);

  const reminderTasks = useMemo<ReminderTask[]>(() => {
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
  }, [dailyTasks, t]);

  const reminderSignature = useMemo(
    () =>
      reminderTasks
        .map((task) => `${task.id}:${task.scheduledSeconds}:${task.title}`)
        .join("|"),
    [reminderTasks],
  );

  useEffect(() => {
    scheduledTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    scheduledTimersRef.current.clear();

    if (!date || !isTodayIsoDate(date) || reminderTasks.length === 0) return;

    const dayStart = parseDate(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayStartMs = dayStart.getTime();
    const nowMs = Date.now();

    const plans: ReminderPlan[] = [];
    reminderTasks.forEach((task) => {
      const dueAtMs = dayStartMs + task.scheduledSeconds * 1000;
      REMINDER_OFFSETS_SECONDS.forEach((offset) => {
        const fireAtMs = dueAtMs - offset * 1000;
        if (fireAtMs <= nowMs) return;

        const key = `${date}:${task.id}:${task.scheduledSeconds}:${offset}`;
        if (firedRemindersRef.current.has(key)) return;

        plans.push({
          key,
          fireAtMs,
          taskTitle: task.title,
          taskClockLabel: formatClockFromSeconds(task.scheduledSeconds),
          offset,
        });
      });
    });

    if (plans.length === 0) return;

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default" && !permissionRequestedRef.current) {
        permissionRequestedRef.current = true;
        void Notification.requestPermission().then((permission) => {
          if (
            permission !== "granted" &&
            !permissionHintShownRef.current
          ) {
            permissionHintShownRef.current = true;
            toast(t("task_manager.notifications.permission_hint"));
          }
        });
      } else if (
        Notification.permission !== "granted" &&
        !permissionHintShownRef.current
      ) {
        permissionHintShownRef.current = true;
        toast(t("task_manager.notifications.permission_hint"));
      }
    }

    plans.forEach((plan) => {
      const delayMs = Math.max(0, plan.fireAtMs - Date.now());
      const timerId = window.setTimeout(() => {
        scheduledTimersRef.current.delete(plan.key);
        firedRemindersRef.current.add(plan.key);

        const body = t("task_manager.notifications.body", {
          task: plan.taskTitle,
          time: plan.taskClockLabel,
          offset: t(getNotificationBodyOffsetKey(plan.offset)),
        });

        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          const notification = new Notification(
            t("task_manager.notifications.title"),
            {
              body,
              tag: plan.key,
              icon: "/favicon.svg",
              badge: "/favicon.svg",
              requireInteraction: false,
            },
          );
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
          return;
        }

        toast(t("task_manager.notifications.toast_title"), {
          description: body,
        });
      }, delayMs);

      scheduledTimersRef.current.set(plan.key, timerId);
    });

    return () => {
      scheduledTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      scheduledTimersRef.current.clear();
    };
  }, [date, reminderSignature, reminderTasks, t]);
};
