import crypto from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { getFunctions } from "firebase-admin/functions";
import {
  FieldValue,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { fromZonedTime } from "date-fns-tz";

initializeApp();

const db = getFirestore();
const messaging = getMessaging();
const functions = getFunctions();

const REGION = "us-central1";
const PUSH_DEVICES_COLLECTION = "push-devices";
const REMINDER_SCHEDULES_COLLECTION = "daily-task-reminders";
const REMINDER_OFFSETS_SECONDS = [3600, 300, 0] as const;
const CALLABLE_FUNCTION_OPTIONS = {
  region: REGION,
  cors: true,
} as const;

type ReminderOffset = (typeof REMINDER_OFFSETS_SECONDS)[number];

interface DailyTaskShape {
  id?: string | number;
  title?: string;
  isDone?: boolean;
  time?: number;
  isDetermined?: boolean;
}

interface DailyTaskCategoryShape {
  tasks?: DailyTaskShape[];
}

interface DailyTaskDocShape {
  items?: DailyTaskCategoryShape[];
  timeZone?: string;
  timeZoneOffsetMinutes?: number;
}

interface ReminderScheduleEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  taskClockLabel: string;
  fireAtMs: number;
  offsetSeconds: ReminderOffset;
  taskQueueId: string;
  date: string;
  sentAt?: Timestamp | null;
  lastAttemptAt?: Timestamp | null;
}

interface ReminderScheduleDoc {
  activeReminderIds?: string[];
  reminders?: Record<string, ReminderScheduleEntry>;
}

interface PushDeviceDoc {
  token: string;
  language?: string;
  permission?: string;
  displayMode?: string;
}

interface RegisterPushDevicePayload {
  installationId?: string;
  token?: string;
  language?: string;
  permission?: string;
  userAgent?: string;
  platform?: string;
  displayMode?: string;
}

interface RemovePushDevicePayload {
  installationId?: string;
}

interface DispatchReminderPayload {
  uid: string;
  date: string;
  reminderId: string;
}

const getReminderScheduleRef = (uid: string, date: string) =>
  db.doc(`${REMINDER_SCHEDULES_COLLECTION}/${uid}/days/${date}`);

const getPushDevicesCollection = (uid: string) =>
  db.collection(PUSH_DEVICES_COLLECTION).doc(uid).collection("installations");

const buildTaskQueueId = (reminderId: string, salt: string): string =>
  crypto
    .createHash("sha256")
    .update(`${reminderId}:${salt}`)
    .digest("hex")
    .slice(0, 32);

const parseDateParts = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
};

const formatClockFromSeconds = (seconds: number): string => {
  const normalized = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(normalized / 3600) % 24;
  const minutes = Math.floor((normalized % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const offsetLabelByLanguage = (offsetSeconds: number, language: string): string => {
  const normalized = language.toLowerCase();
  const isUkrainian = normalized.startsWith("uk") || normalized.startsWith("ua");

  if (offsetSeconds === 3600) {
    return isUkrainian ? "за 1 годину" : "in 1 hour";
  }
  if (offsetSeconds === 300) {
    return isUkrainian ? "за 5 хвилин" : "in 5 minutes";
  }

  return isUkrainian ? "зараз" : "now";
};

const reminderFallbackTaskTitleByLanguage = (language: string): string => {
  const normalized = language.toLowerCase();
  return normalized.startsWith("uk") || normalized.startsWith("ua")
    ? "Задача"
    : "Task";
};

const reminderTitleByLanguage = (language: string, taskTitle: string): string => {
  const normalizedTitle = taskTitle.trim();
  return normalizedTitle || reminderFallbackTaskTitleByLanguage(language);
};

const reminderBodyByLanguage = (
  language: string,
  taskClockLabel: string,
  offsetSeconds: number,
): string => {
  const normalized = language.toLowerCase();
  const isUkrainian = normalized.startsWith("uk") || normalized.startsWith("ua");
  const offsetLabel = offsetLabelByLanguage(offsetSeconds, language);

  if (isUkrainian) {
    return offsetSeconds === 0
      ? `Час виконувати • заплановано на ${taskClockLabel}`
      : `${offsetLabel} • заплановано на ${taskClockLabel}`;
  }

  return offsetSeconds == 0
    ? `Time to do it • scheduled for ${taskClockLabel}`
    : `${offsetLabel} • scheduled for ${taskClockLabel}`;
};

const resolveReminderDate = (
  date: string,
  scheduledSeconds: number,
  timeZone?: string,
  timeZoneOffsetMinutes?: number,
): Date => {
  const { year, month, day } = parseDateParts(date);
  const hours = Math.floor(scheduledSeconds / 3600) % 24;
  const minutes = Math.floor((scheduledSeconds % 3600) / 60);
  const seconds = scheduledSeconds % 60;

  if (timeZone) {
    return fromZonedTime(
      new Date(year, month - 1, day, hours, minutes, seconds),
      timeZone,
    );
  }

  const offsetMinutes = Number.isFinite(timeZoneOffsetMinutes)
    ? Number(timeZoneOffsetMinutes)
    : 0;
  const utcMs =
    Date.UTC(year, month - 1, day, hours, minutes, seconds) -
    offsetMinutes * 60 * 1000;

  return new Date(utcMs);
};

const buildReminderEntries = (
  uid: string,
  date: string,
  dailyTaskDoc: DailyTaskDocShape | null,
): ReminderScheduleEntry[] => {
  if (!dailyTaskDoc?.items?.length) return [];

  const entries: ReminderScheduleEntry[] = [];
  for (const category of dailyTaskDoc.items) {
    for (const task of category.tasks ?? []) {
      if (!task.isDetermined || task.isDone) continue;
      if (!Number.isFinite(task.time) || Number(task.time) <= 0) continue;

      const taskId = String(task.id ?? "");
      if (!taskId) continue;

      const scheduledSeconds = Math.floor(Number(task.time));
      const dueAt = resolveReminderDate(
        date,
        scheduledSeconds,
        dailyTaskDoc.timeZone,
        dailyTaskDoc.timeZoneOffsetMinutes,
      );

      for (const offsetSeconds of REMINDER_OFFSETS_SECONDS) {
        const fireAtMs = dueAt.getTime() - offsetSeconds * 1000;
        if (fireAtMs <= Date.now()) continue;

        const reminderId = `${date}:${taskId}:${scheduledSeconds}:${offsetSeconds}`;
        entries.push({
          id: reminderId,
          taskId,
          taskTitle: task.title?.trim() || "Task",
          taskClockLabel: formatClockFromSeconds(scheduledSeconds),
          fireAtMs,
          offsetSeconds,
          taskQueueId: buildTaskQueueId(
            reminderId,
            `${uid}:${date}:${fireAtMs}:${Date.now()}`,
          ),
          date,
          sentAt: null,
          lastAttemptAt: null,
        });
      }
    }
  }

  return entries.sort((a, b) => a.fireAtMs - b.fireAtMs);
};

const reminderSourceSignature = (dailyTaskDoc: DailyTaskDocShape | null): string =>
  JSON.stringify({
    items: dailyTaskDoc?.items ?? null,
    timeZone: dailyTaskDoc?.timeZone ?? null,
    timeZoneOffsetMinutes: dailyTaskDoc?.timeZoneOffsetMinutes ?? null,
  });

const isTaskQueueMissingError = (error: unknown): boolean => {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    message.includes("not found") ||
    message.includes("no task") ||
    message.includes("does not exist")
  );
};

export const registerPushDevice = onCall<RegisterPushDevicePayload>(
  CALLABLE_FUNCTION_OPTIONS,
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const { installationId, token, language, permission, userAgent, platform, displayMode } =
      request.data ?? {};

    if (!installationId || typeof installationId !== "string") {
      throw new HttpsError("invalid-argument", "installationId is required.");
    }
    if (!token || typeof token !== "string") {
      throw new HttpsError("invalid-argument", "token is required.");
    }

    const ref = getPushDevicesCollection(request.auth.uid).doc(installationId);
    await ref.set(
      {
        installationId,
        token,
        language: typeof language === "string" ? language : "uk",
        permission: typeof permission === "string" ? permission : "default",
        userAgent: typeof userAgent === "string" ? userAgent : "",
        platform: typeof platform === "string" ? platform : "",
        displayMode: typeof displayMode === "string" ? displayMode : "browser",
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { ok: true };
  },
);

export const removePushDevice = onCall<RemovePushDevicePayload>(
  CALLABLE_FUNCTION_OPTIONS,
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const installationId = request.data?.installationId;
    if (!installationId || typeof installationId !== "string") {
      throw new HttpsError("invalid-argument", "installationId is required.");
    }

    await getPushDevicesCollection(request.auth.uid).doc(installationId).delete();
    return { ok: true };
  },
);

export const syncDailyTaskReminders = onDocumentWritten(
  {
    region: REGION,
    document: "daily-tasks/{uid}/days/{date}",
  },
  async (event) => {
    const uid = event.params.uid;
    const date = event.params.date;
    const previousDoc =
      (event.data?.before.data() as DailyTaskDocShape | undefined) ?? null;
    const nextDoc = (event.data?.after.data() as DailyTaskDocShape | undefined) ?? null;

    if (reminderSourceSignature(previousDoc) === reminderSourceSignature(nextDoc)) {
      return;
    }

    const scheduleRef = getReminderScheduleRef(uid, date);
    const existingSnap = await scheduleRef.get();
    const existing = (existingSnap.data() as ReminderScheduleDoc | undefined) ?? {};
    const existingReminders = existing.reminders ?? {};

    const nextEntries = buildReminderEntries(uid, date, nextDoc);
    const nextById = new Map(nextEntries.map((entry) => [entry.id, entry]));
    const reminderQueue = functions.taskQueue<DispatchReminderPayload>(
      `locations/${REGION}/functions/dispatchTaskReminder`,
    );

    for (const [reminderId, existingReminder] of Object.entries(existingReminders)) {
      if (nextById.has(reminderId)) continue;

      if (existingReminder.taskQueueId) {
        try {
          await reminderQueue.delete(existingReminder.taskQueueId);
        } catch (error) {
          if (!isTaskQueueMissingError(error)) {
            console.warn("Failed to delete stale reminder task:", error);
          }
        }
      }
    }

    const remindersToPersist: Record<string, ReminderScheduleEntry> = {};

    for (const nextEntry of nextEntries) {
      const existingReminder = existingReminders[nextEntry.id];
      const isSameSchedule =
        existingReminder &&
        existingReminder.fireAtMs === nextEntry.fireAtMs &&
        existingReminder.taskTitle === nextEntry.taskTitle &&
        existingReminder.taskClockLabel === nextEntry.taskClockLabel &&
        existingReminder.offsetSeconds === nextEntry.offsetSeconds;

      if (isSameSchedule) {
        remindersToPersist[nextEntry.id] = existingReminder;
        continue;
      }

      if (existingReminder?.taskQueueId) {
        try {
          await reminderQueue.delete(existingReminder.taskQueueId);
        } catch (error) {
          if (!isTaskQueueMissingError(error)) {
            console.warn("Failed to delete outdated reminder task:", error);
          }
        }
      }

      await reminderQueue.enqueue(
        {
          uid,
          date,
          reminderId: nextEntry.id,
        },
        {
          id: nextEntry.taskQueueId,
          scheduleTime: new Date(nextEntry.fireAtMs),
          dispatchDeadlineSeconds: 300,
        },
      );

      remindersToPersist[nextEntry.id] = nextEntry;
    }

    await scheduleRef.set(
      {
        activeReminderIds: Object.keys(remindersToPersist),
        reminders: remindersToPersist,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  },
);

export const dispatchTaskReminder = onTaskDispatched<DispatchReminderPayload>(
  {
    region: REGION,
    retryConfig: {
      maxAttempts: 3,
      minBackoffSeconds: 30,
    },
    rateLimits: {
      maxConcurrentDispatches: 20,
    },
  },
  async (request) => {
    const { uid, date, reminderId } = request.data;
    const scheduleRef = getReminderScheduleRef(uid, date);
    const scheduleSnap = await scheduleRef.get();
    const schedule = (scheduleSnap.data() as ReminderScheduleDoc | undefined) ?? {};
    const reminder = schedule.reminders?.[reminderId];

    if (!reminder) return;
    if (reminder.sentAt) return;

    const devicesSnap = await getPushDevicesCollection(uid).get();
    const activeDevices = devicesSnap.docs.filter((docSnap) => {
      const device = docSnap.data() as PushDeviceDoc;
      return typeof device.token === "string" && device.token.length > 0;
    });

    const invalidInstallations: string[] = [];
    let delivered = 0;

    await Promise.all(
      activeDevices.map(async (docSnap) => {
        const device = docSnap.data() as PushDeviceDoc;
        const language = device.language || "uk";
        const title = reminderTitleByLanguage(language, reminder.taskTitle);
        const body = reminderBodyByLanguage(
          language,
          reminder.taskClockLabel,
          reminder.offsetSeconds,
        );

        try {
          await messaging.send({
            token: device.token,
            data: {
              title,
              body,
              url: `/app/daily/${date}`,
              reminderId,
              date,
              language,
              notificationType: "task_reminder",
              taskTitle: reminder.taskTitle,
              taskClockLabel: reminder.taskClockLabel,
              offsetSeconds: String(reminder.offsetSeconds),
            },
            webpush: {
              headers: {
                Urgency: "high",
              },
              fcmOptions: {
                link: `/app/daily/${date}`,
              },
            },
          });
          delivered += 1;
        } catch (error) {
          const code =
            error instanceof Error && "code" in error
              ? String((error as { code: unknown }).code)
              : "";

          if (code === "messaging/registration-token-not-registered") {
            invalidInstallations.push(docSnap.id);
            return;
          }

          console.warn("Failed to send reminder push:", error);
        }
      }),
    );

    if (invalidInstallations.length > 0) {
      await Promise.allSettled(
        invalidInstallations.map((installationId) =>
          getPushDevicesCollection(uid).doc(installationId).delete(),
        ),
      );
    }

    await scheduleRef.set(
      {
        [`reminders.${reminderId}.lastAttemptAt`]: FieldValue.serverTimestamp(),
        [`reminders.${reminderId}.sentAt`]:
          delivered > 0 ? FieldValue.serverTimestamp() : reminder.sentAt ?? null,
        lastDeliveryCount: delivered,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  },
);
