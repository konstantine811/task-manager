"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchTaskReminder = exports.syncDailyTaskReminders = exports.removePushDevice = exports.registerPushDevice = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const app_1 = require("firebase-admin/app");
const functions_1 = require("firebase-admin/functions");
const firestore_1 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
const firestore_2 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const tasks_1 = require("firebase-functions/v2/tasks");
const date_fns_tz_1 = require("date-fns-tz");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const messaging = (0, messaging_1.getMessaging)();
const functions = (0, functions_1.getFunctions)();
const REGION = "us-central1";
const PUSH_DEVICES_COLLECTION = "push-devices";
const REMINDER_SCHEDULES_COLLECTION = "daily-task-reminders";
const REMINDER_OFFSETS_SECONDS = [3600, 300, 0];
const CALLABLE_FUNCTION_OPTIONS = {
    region: REGION,
    cors: true,
};
const getReminderScheduleRef = (uid, date) => db.doc(`${REMINDER_SCHEDULES_COLLECTION}/${uid}/days/${date}`);
const getPushDevicesCollection = (uid) => db.collection(PUSH_DEVICES_COLLECTION).doc(uid).collection("installations");
const buildTaskQueueId = (reminderId, salt) => node_crypto_1.default
    .createHash("sha256")
    .update(`${reminderId}:${salt}`)
    .digest("hex")
    .slice(0, 32);
const parseDateParts = (date) => {
    const [year, month, day] = date.split("-").map(Number);
    return { year, month, day };
};
const formatClockFromSeconds = (seconds) => {
    const normalized = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(normalized / 3600) % 24;
    const minutes = Math.floor((normalized % 3600) / 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};
const offsetLabelByLanguage = (offsetSeconds, language) => {
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
const reminderFallbackTaskTitleByLanguage = (language) => {
    const normalized = language.toLowerCase();
    return normalized.startsWith("uk") || normalized.startsWith("ua")
        ? "Задача"
        : "Task";
};
const reminderTitleByLanguage = (language, taskTitle) => {
    const normalizedTitle = taskTitle.trim();
    return normalizedTitle || reminderFallbackTaskTitleByLanguage(language);
};
const reminderBodyByLanguage = (language, taskClockLabel, offsetSeconds) => {
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
const resolveReminderDate = (date, scheduledSeconds, timeZone, timeZoneOffsetMinutes) => {
    const { year, month, day } = parseDateParts(date);
    const hours = Math.floor(scheduledSeconds / 3600) % 24;
    const minutes = Math.floor((scheduledSeconds % 3600) / 60);
    const seconds = scheduledSeconds % 60;
    if (timeZone) {
        return (0, date_fns_tz_1.fromZonedTime)(new Date(year, month - 1, day, hours, minutes, seconds), timeZone);
    }
    const offsetMinutes = Number.isFinite(timeZoneOffsetMinutes)
        ? Number(timeZoneOffsetMinutes)
        : 0;
    const utcMs = Date.UTC(year, month - 1, day, hours, minutes, seconds) -
        offsetMinutes * 60 * 1000;
    return new Date(utcMs);
};
const buildReminderEntries = (uid, date, dailyTaskDoc) => {
    if (!dailyTaskDoc?.items?.length)
        return [];
    const entries = [];
    for (const category of dailyTaskDoc.items) {
        for (const task of category.tasks ?? []) {
            if (!task.isDetermined || task.isDone)
                continue;
            if (!Number.isFinite(task.time) || Number(task.time) <= 0)
                continue;
            const taskId = String(task.id ?? "");
            if (!taskId)
                continue;
            const scheduledSeconds = Math.floor(Number(task.time));
            const dueAt = resolveReminderDate(date, scheduledSeconds, dailyTaskDoc.timeZone, dailyTaskDoc.timeZoneOffsetMinutes);
            for (const offsetSeconds of REMINDER_OFFSETS_SECONDS) {
                const fireAtMs = dueAt.getTime() - offsetSeconds * 1000;
                if (fireAtMs <= Date.now())
                    continue;
                const reminderId = `${date}:${taskId}:${scheduledSeconds}:${offsetSeconds}`;
                entries.push({
                    id: reminderId,
                    taskId,
                    taskTitle: task.title?.trim() || "Task",
                    taskClockLabel: formatClockFromSeconds(scheduledSeconds),
                    fireAtMs,
                    offsetSeconds,
                    taskQueueId: buildTaskQueueId(reminderId, `${uid}:${date}:${fireAtMs}:${Date.now()}`),
                    date,
                    sentAt: null,
                    lastAttemptAt: null,
                });
            }
        }
    }
    return entries.sort((a, b) => a.fireAtMs - b.fireAtMs);
};
const reminderSourceSignature = (dailyTaskDoc) => JSON.stringify({
    items: dailyTaskDoc?.items ?? null,
    timeZone: dailyTaskDoc?.timeZone ?? null,
    timeZoneOffsetMinutes: dailyTaskDoc?.timeZoneOffsetMinutes ?? null,
});
const isTaskQueueMissingError = (error) => {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    return (message.includes("not found") ||
        message.includes("no task") ||
        message.includes("does not exist"));
};
exports.registerPushDevice = (0, https_1.onCall)(CALLABLE_FUNCTION_OPTIONS, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication is required.");
    }
    const { installationId, token, language, permission, userAgent, platform, displayMode } = request.data ?? {};
    if (!installationId || typeof installationId !== "string") {
        throw new https_1.HttpsError("invalid-argument", "installationId is required.");
    }
    if (!token || typeof token !== "string") {
        throw new https_1.HttpsError("invalid-argument", "token is required.");
    }
    const ref = getPushDevicesCollection(request.auth.uid).doc(installationId);
    await ref.set({
        installationId,
        token,
        language: typeof language === "string" ? language : "uk",
        permission: typeof permission === "string" ? permission : "default",
        userAgent: typeof userAgent === "string" ? userAgent : "",
        platform: typeof platform === "string" ? platform : "",
        displayMode: typeof displayMode === "string" ? displayMode : "browser",
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { ok: true };
});
exports.removePushDevice = (0, https_1.onCall)(CALLABLE_FUNCTION_OPTIONS, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication is required.");
    }
    const installationId = request.data?.installationId;
    if (!installationId || typeof installationId !== "string") {
        throw new https_1.HttpsError("invalid-argument", "installationId is required.");
    }
    await getPushDevicesCollection(request.auth.uid).doc(installationId).delete();
    return { ok: true };
});
exports.syncDailyTaskReminders = (0, firestore_2.onDocumentWritten)({
    region: REGION,
    document: "daily-tasks/{uid}/days/{date}",
}, async (event) => {
    const uid = event.params.uid;
    const date = event.params.date;
    const previousDoc = event.data?.before.data() ?? null;
    const nextDoc = event.data?.after.data() ?? null;
    if (reminderSourceSignature(previousDoc) === reminderSourceSignature(nextDoc)) {
        return;
    }
    const scheduleRef = getReminderScheduleRef(uid, date);
    const existingSnap = await scheduleRef.get();
    const existing = existingSnap.data() ?? {};
    const existingReminders = existing.reminders ?? {};
    const nextEntries = buildReminderEntries(uid, date, nextDoc);
    const nextById = new Map(nextEntries.map((entry) => [entry.id, entry]));
    const reminderQueue = functions.taskQueue(`locations/${REGION}/functions/dispatchTaskReminder`);
    for (const [reminderId, existingReminder] of Object.entries(existingReminders)) {
        if (nextById.has(reminderId))
            continue;
        if (existingReminder.taskQueueId) {
            try {
                await reminderQueue.delete(existingReminder.taskQueueId);
            }
            catch (error) {
                if (!isTaskQueueMissingError(error)) {
                    console.warn("Failed to delete stale reminder task:", error);
                }
            }
        }
    }
    const remindersToPersist = {};
    for (const nextEntry of nextEntries) {
        const existingReminder = existingReminders[nextEntry.id];
        const isSameSchedule = existingReminder &&
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
            }
            catch (error) {
                if (!isTaskQueueMissingError(error)) {
                    console.warn("Failed to delete outdated reminder task:", error);
                }
            }
        }
        await reminderQueue.enqueue({
            uid,
            date,
            reminderId: nextEntry.id,
        }, {
            id: nextEntry.taskQueueId,
            scheduleTime: new Date(nextEntry.fireAtMs),
            dispatchDeadlineSeconds: 300,
        });
        remindersToPersist[nextEntry.id] = nextEntry;
    }
    await scheduleRef.set({
        activeReminderIds: Object.keys(remindersToPersist),
        reminders: remindersToPersist,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
});
exports.dispatchTaskReminder = (0, tasks_1.onTaskDispatched)({
    region: REGION,
    retryConfig: {
        maxAttempts: 3,
        minBackoffSeconds: 30,
    },
    rateLimits: {
        maxConcurrentDispatches: 20,
    },
}, async (request) => {
    const { uid, date, reminderId } = request.data;
    const scheduleRef = getReminderScheduleRef(uid, date);
    const scheduleSnap = await scheduleRef.get();
    const schedule = scheduleSnap.data() ?? {};
    const reminder = schedule.reminders?.[reminderId];
    if (!reminder)
        return;
    if (reminder.sentAt)
        return;
    const devicesSnap = await getPushDevicesCollection(uid).get();
    const activeDevices = devicesSnap.docs.filter((docSnap) => {
        const device = docSnap.data();
        return typeof device.token === "string" && device.token.length > 0;
    });
    const invalidInstallations = [];
    let delivered = 0;
    await Promise.all(activeDevices.map(async (docSnap) => {
        const device = docSnap.data();
        const language = device.language || "uk";
        const title = reminderTitleByLanguage(language, reminder.taskTitle);
        const body = reminderBodyByLanguage(language, reminder.taskClockLabel, reminder.offsetSeconds);
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
        }
        catch (error) {
            const code = error instanceof Error && "code" in error
                ? String(error.code)
                : "";
            if (code === "messaging/registration-token-not-registered") {
                invalidInstallations.push(docSnap.id);
                return;
            }
            console.warn("Failed to send reminder push:", error);
        }
    }));
    if (invalidInstallations.length > 0) {
        await Promise.allSettled(invalidInstallations.map((installationId) => getPushDevicesCollection(uid).doc(installationId).delete()));
    }
    await scheduleRef.set({
        [`reminders.${reminderId}.lastAttemptAt`]: firestore_1.FieldValue.serverTimestamp(),
        [`reminders.${reminderId}.sentAt`]: delivered > 0 ? firestore_1.FieldValue.serverTimestamp() : reminder.sentAt ?? null,
        lastDeliveryCount: delivered,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
});
