import { Items } from "@/types/drag-and-drop.model";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  buildReminderPlans,
  extractReminderTasks,
  getNotificationBodyOffsetKey,
  isTodayIsoDate,
} from "@/services/notifications/reminder-sync";
import { initializeSfx, playSfx } from "@/services/audio/sfx";
import { useSoundEnabledStore } from "@/storage/soundEnabled";

export const useDeterminedTaskReminders = (date?: string, dailyTasks?: Items) => {
  const [t] = useTranslation();
  const isSoundEnabled = useSoundEnabledStore((s) => s.isSoundEnabled);
  const scheduledTimersRef = useRef<Map<string, number>>(new Map());
  const firedRemindersRef = useRef<Set<string>>(new Set());

  const reminderTasks = useMemo(
    () => extractReminderTasks(dailyTasks, t),
    [dailyTasks, t],
  );

  const reminderSignature = useMemo(
    () =>
      reminderTasks
        .map((task) => `${task.id}:${task.scheduledSeconds}:${task.title}`)
        .join("|"),
    [reminderTasks],
  );

  useEffect(() => {
    initializeSfx(["/sfx/ding.wav"]);
  }, []);

  useEffect(() => {
    scheduledTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    scheduledTimersRef.current.clear();

    if (!date || !isTodayIsoDate(date) || reminderTasks.length === 0) return;

    const plans = buildReminderPlans(
      date,
      reminderTasks,
      Date.now(),
      firedRemindersRef.current,
    );
    if (plans.length === 0) return;

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

        toast(t("task_manager.notifications.toast_title"), {
          description: body,
        });

        if ("vibrate" in navigator) {
          navigator.vibrate([80, 40, 80]);
        }

        if (isSoundEnabled) {
          void playSfx("/sfx/ding.wav").catch(() => undefined);
        }

        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
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
        }
      }, delayMs);

      scheduledTimersRef.current.set(plan.key, timerId);
    });

    return () => {
      scheduledTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      scheduledTimersRef.current.clear();
    };
  }, [date, reminderSignature, reminderTasks, t, isSoundEnabled]);
};
