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
import { useSoundEnabledStore } from "@/storage/soundEnabled";

export const useDeterminedTaskReminders = (date?: string, dailyTasks?: Items) => {
  const [t] = useTranslation();
  const isSoundEnabled = useSoundEnabledStore((s) => s.isSoundEnabled);
  const scheduledTimersRef = useRef<Map<string, number>>(new Map());
  const firedRemindersRef = useRef<Set<string>>(new Set());
  const dingAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);

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
    const audio = new Audio("/sfx/ding.wav");
    audio.preload = "auto";
    audio.setAttribute("playsinline", "true");
    dingAudioRef.current = audio;

    const unlockAudio = () => {
      if (audioUnlockedRef.current || !dingAudioRef.current) return;

      const audioEl = dingAudioRef.current;
      audioEl.muted = true;
      void audioEl.play()
        .then(() => {
          audioEl.pause();
          audioEl.currentTime = 0;
          audioEl.muted = false;
          audioUnlockedRef.current = true;
        })
        .catch(() => {
          audioEl.muted = false;
        });
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      dingAudioRef.current?.pause();
      dingAudioRef.current = null;
    };
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

        if (isSoundEnabled && dingAudioRef.current) {
          const audio = dingAudioRef.current;
          audio.currentTime = 0;
          audio.volume = 1;
          void audio.play().catch(() => undefined);
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
