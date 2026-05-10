import * as Sentry from "@sentry/react";
import { track } from "@vercel/analytics";

type TelemetryValue = string | number | boolean | null;
type TelemetryProperties = Record<string, TelemetryValue | undefined>;

export type AppEventName =
  | "app_error"
  | "analytics_opened"
  | "billing_opened"
  | "daily_opened"
  | "daily_task_completed"
  | "guide_opened"
  | "map_enabled"
  | "payment_clicked"
  | "profile_opened"
  | "route_viewed"
  | "social_enabled"
  | "social_profile_updated"
  | "template_opened"
  | "timer_started"
  | "timer_stopped";

const cleanProperties = (properties: TelemetryProperties = {}) =>
  Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined),
  ) as Record<string, TelemetryValue>;

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
};

export const initErrorTracking = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        blockAllMedia: true,
        maskAllText: true,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.15 : 1,
    replaysSessionSampleRate: import.meta.env.PROD ? 0.02 : 0,
    replaysOnErrorSampleRate: 1,
  });
};

export const setTelemetryUser = (userId: string | null) => {
  Sentry.setUser(userId ? { id: userId } : null);
};

export const trackAppEvent = (
  name: AppEventName,
  properties: TelemetryProperties = {},
) => {
  try {
    track(name, cleanProperties(properties));
  } catch {
    // Analytics should never affect the product flow.
  }
};

export const captureAppError = (
  error: unknown,
  properties: TelemetryProperties = {},
) => {
  Sentry.captureException(error, {
    tags: Object.fromEntries(
      Object.entries(cleanProperties(properties)).map(([key, value]) => [
        key,
        String(value),
      ]),
    ),
  });
  trackAppEvent("app_error", {
    ...properties,
    message: getErrorMessage(error).slice(0, 120),
  });
};
