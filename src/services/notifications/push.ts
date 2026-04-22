import { useEffect, useRef } from "react";
import type { User } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  type MessagePayload,
  getMessaging,
  getToken,
  isSupported as isMessagingSupported,
  onMessage,
} from "firebase/messaging";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { app, firebaseFunctionsRegion } from "@/config/firebase.config";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotificationsStore } from "@/storage/pushNotifications";
import { useSoundEnabledStore } from "@/storage/soundEnabled";

const INSTALLATION_ID_KEY = "task-manager.push.installation-id";

interface RegisterPushDevicePayload {
  installationId: string;
  token: string;
  language: string;
  permission: NotificationPermission;
  userAgent: string;
  platform: string;
  displayMode: string;
}

interface RemovePushDevicePayload {
  installationId: string;
}

interface ForegroundNotificationContent {
  title: string;
  body: string;
}

const getDisplayMode = (): string => {
  if (typeof window === "undefined") return "browser";
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return "standalone";
  }
  if (window.matchMedia("(display-mode: minimal-ui)").matches) {
    return "minimal-ui";
  }
  if (window.matchMedia("(display-mode: fullscreen)").matches) {
    return "fullscreen";
  }
  return "browser";
};

const isIosDevice = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
};

const isStandalonePwa = (): boolean => {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
};

const getInstallationId = (): string => {
  if (typeof localStorage === "undefined") return crypto.randomUUID();

  const existing = localStorage.getItem(INSTALLATION_ID_KEY);
  if (existing) return existing;

  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(INSTALLATION_ID_KEY, next);
  return next;
};

const getForegroundNotificationContent = (
  payload: MessagePayload,
): ForegroundNotificationContent => {
  const title =
    payload.data?.title ||
    payload.notification?.title ||
    "Task reminder";
  const body =
    payload.data?.body ||
    payload.notification?.body ||
    "";

  return { title, body };
};

const isReminderHandledOnVisibleDailyPage = (payload: MessagePayload): boolean => {
  if (typeof document === "undefined" || typeof window === "undefined") return false;
  if (document.visibilityState !== "visible") return false;

  const payloadDate = payload.data?.date;
  if (!payloadDate) return false;

  const currentPath = window.location.pathname;
  return currentPath.includes("/app/daily/") && currentPath.endsWith(payloadDate);
};

const getRegisterPushDeviceCallable = () =>
  httpsCallable<RegisterPushDevicePayload, { ok: boolean }>(
    getFunctions(app, firebaseFunctionsRegion),
    "registerPushDevice",
  );

const getRemovePushDeviceCallable = () =>
  httpsCallable<RemovePushDevicePayload, { ok: boolean }>(
    getFunctions(app, firebaseFunctionsRegion),
    "removePushDevice",
  );

const registerCurrentDevice = async (user: User, token: string, language: string) => {
  const registerPushDevice = getRegisterPushDeviceCallable();
  await registerPushDevice({
    installationId: getInstallationId(),
    token,
    language,
    permission: Notification.permission,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    displayMode: getDisplayMode(),
  });

  return {
    token,
    userId: user.uid,
  };
};

const unregisterCurrentDevice = async () => {
  if (typeof window === "undefined") return;

  const removePushDevice = getRemovePushDeviceCallable();
  await removePushDevice({
    installationId: getInstallationId(),
  });
};

const isPushRuntimeSupported = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!("PushManager" in window)) return false;
  return isMessagingSupported();
};

export const PushNotificationsBootstrap = () => {
  const { user } = useAuth();
  const [t, i18n] = useTranslation();
  const isSoundEnabled = useSoundEnabledStore((s) => s.isSoundEnabled);
  const setPushStatus = usePushNotificationsStore((s) => s.setStatus);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const registrationInFlightRef = useRef(false);
  const hintShownRef = useRef(false);
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const audio = new Audio("/sfx/ding.wav");
    audio.preload = "auto";
    audio.setAttribute("playsinline", "true");
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      if (!user) return;
      if (!(await isPushRuntimeSupported())) return;

      const messaging = getMessaging(app);
      unsubscribe = onMessage(messaging, (payload) => {
        if (cancelled) return;
        if (isReminderHandledOnVisibleDailyPage(payload)) return;

        const { title, body } = getForegroundNotificationContent(payload);
        toast(title, { description: body });

        if ("vibrate" in navigator) {
          navigator.vibrate([80, 40, 80]);
        }

        if (isSoundEnabled && audioRef.current) {
          const audio = audioRef.current;
          audio.currentTime = 0;
          audio.volume = 1;
          void audio.play().catch(() => undefined);
        }
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [isSoundEnabled, user]);

  useEffect(() => {
    if (!user) {
      setPushStatus("idle", null, null);
      if (previousUserIdRef.current) {
        void unregisterCurrentDevice().catch(() => undefined);
      }
      previousUserIdRef.current = null;
      return;
    }

    previousUserIdRef.current = user.uid;
  }, [setPushStatus, user]);

  useEffect(() => {
    const unlockAudio = () => {
      if (audioUnlockedRef.current || !audioRef.current) return;

      const audio = audioRef.current;
      audio.muted = true;
      void audio.play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
          audioUnlockedRef.current = true;
        })
        .catch(() => {
          audio.muted = false;
        });
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const ensurePushRegistration = async (triggeredByGesture: boolean) => {
      if (!user || registrationInFlightRef.current || cancelled) return;

      registrationInFlightRef.current = true;
      try {
        const pushSupported = await isPushRuntimeSupported();
        if (!pushSupported) {
          setPushStatus("unsupported", null, "unsupported_runtime");
          if (
            triggeredByGesture &&
            isIosDevice() &&
            !isStandalonePwa() &&
            !hintShownRef.current
          ) {
            hintShownRef.current = true;
            toast(t("task_manager.notifications.ios_pwa_hint"));
          }
          return;
        }

        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          setPushStatus("error", null, "missing_vapid_key");
          if (!hintShownRef.current) {
            hintShownRef.current = true;
            toast(t("task_manager.notifications.vapid_missing"));
          }
          return;
        }

        if (Notification.permission === "default") {
          if (!triggeredByGesture) return;

          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            setPushStatus("permission_denied", null, permission);
            if (!hintShownRef.current) {
              hintShownRef.current = true;
              toast(
                isIosDevice() && !isStandalonePwa()
                  ? t("task_manager.notifications.ios_pwa_hint")
                  : t("task_manager.notifications.permission_hint"),
              );
            }
            return;
          }
        }

        if (Notification.permission !== "granted") {
          setPushStatus("permission_denied", null, Notification.permission);
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const messaging = getMessaging(app);
        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration,
        });

        if (!token) {
          setPushStatus("error", null, "token_unavailable");
          return;
        }

        await registerCurrentDevice(user, token, i18n.language);

        if (!cancelled) {
          setPushStatus("registered", token, null);
        }
      } catch (error) {
        console.error("Failed to register push notifications:", error);
        if (!cancelled) {
          setPushStatus(
            "error",
            null,
            error instanceof Error ? error.message : "unknown_error",
          );
        }
      } finally {
        registrationInFlightRef.current = false;
      }
    };

    const maybeRegisterWithoutGesture = () => {
      void ensurePushRegistration(false);
    };

    const maybeRegisterWithGesture = () => {
      void ensurePushRegistration(true);
    };

    void ensurePushRegistration(false);
    window.addEventListener("focus", maybeRegisterWithoutGesture);
    window.addEventListener("pointerdown", maybeRegisterWithGesture, {
      passive: true,
    });
    window.addEventListener("keydown", maybeRegisterWithGesture, {
      passive: true,
    });

    return () => {
      cancelled = true;
      window.removeEventListener("focus", maybeRegisterWithoutGesture);
      window.removeEventListener("pointerdown", maybeRegisterWithGesture);
      window.removeEventListener("keydown", maybeRegisterWithGesture);
    };
  }, [i18n.language, setPushStatus, t, user]);

  return null;
};
