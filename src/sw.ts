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
}

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/api\//],
  }),
);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (firebaseConfig.apiKey) {
  const firebaseApp = initializeApp(firebaseConfig);
  const messaging = getMessaging(firebaseApp);

  onBackgroundMessage(messaging, (payload) => {
    const title = payload.data?.title || payload.notification?.title || "Task reminder";
    const body = payload.data?.body || payload.notification?.body || "";
    const url = payload.data?.url || "/app";
    const reminderId = payload.data?.reminderId;

    void self.registration.showNotification(title, {
      body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: reminderId || `${title}:${body}`,
      data: {
        title,
        body,
        url,
        reminderId,
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
