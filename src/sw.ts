/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core";
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{
    revision: string | null;
    url: string;
  }>;
};

interface ReminderNotificationData {
  title?: string;
  body?: string;
  url?: string;
  reminderId?: string;
  taskTitle?: string;
  taskClockLabel?: string;
  offsetSeconds?: number | null;
  language?: string;
}

const NOTIFICATION_ICON = "/pwa-192x192.png";
const NOTIFICATION_BADGE = "/pwa-192x192.png";

const envOrFallback = (value: string | undefined, fallback = ""): string => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
};

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
const precacheManifest = self.__WB_MANIFEST;
precacheAndRoute(precacheManifest);

const precachedUrls = new Set(
  precacheManifest.map((entry) =>
    typeof entry === "string" ? entry : entry.url,
  ),
);
const appShellUrl = precachedUrls.has("index.html")
  ? "index.html"
  : precachedUrls.has("/index.html")
    ? "/index.html"
    : null;

if (appShellUrl) {
  registerRoute(
    new NavigationRoute(createHandlerBoundToURL(appShellUrl), {
      denylist: [/^\/api\//],
    }),
  );
}

const firebaseConfig = {
  apiKey: envOrFallback(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: envOrFallback(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: envOrFallback(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: envOrFallback(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: envOrFallback(
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  ),
  appId: envOrFallback(import.meta.env.VITE_FIREBASE_APP_ID),
};

const hasMessagingConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId,
);

if (hasMessagingConfig) {
  const firebaseApp = initializeApp(firebaseConfig);
  const messaging = getMessaging(firebaseApp);

  onBackgroundMessage(messaging, (payload) => {
    const title = payload.data?.title || payload.notification?.title || "Task reminder";
    const body = payload.data?.body || payload.notification?.body || "";
    const url = payload.data?.url || "/app";
    const reminderId = payload.data?.reminderId;
    const taskTitle = payload.data?.taskTitle || title;
    const taskClockLabel = payload.data?.taskClockLabel;
    const language = payload.data?.language;
    const offsetValue = Number(payload.data?.offsetSeconds ?? NaN);
    const offsetSeconds = Number.isFinite(offsetValue) ? offsetValue : null;

    void self.registration.showNotification(title, {
      body,
      icon: NOTIFICATION_ICON,
      badge: NOTIFICATION_BADGE,
      tag: reminderId ? `task-reminder:${reminderId}` : `task-reminder:${title}:${body}`,
      requireInteraction: offsetSeconds === 0,
      data: {
        title,
        body,
        url,
        reminderId,
        taskTitle,
        taskClockLabel,
        offsetSeconds,
        language,
      } satisfies ReminderNotificationData,
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = (event.notification.data || {}) as ReminderNotificationData;
  const targetUrl = data.url || "/app";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        const windowClient = client as WindowClient;
        if ("focus" in windowClient) {
          void windowClient.navigate(targetUrl);
          return windowClient.focus();
        }
      }

      return self.clients.openWindow(targetUrl);
    }),
  );
});
