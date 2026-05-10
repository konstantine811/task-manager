import { useAuth } from "@/hooks/useAuth";
import {
  captureAppError,
  setTelemetryUser,
  trackAppEvent,
  type AppEventName,
} from "@/lib/telemetry";
import { useEffect } from "react";
import { useLocation } from "react-router";

const getRouteEvent = (pathname: string): AppEventName | null => {
  if (pathname.startsWith("/app/daily/")) return "daily_opened";
  if (pathname === "/app/template") return "template_opened";
  if (pathname === "/app/analytics") return "analytics_opened";
  if (pathname === "/app/profile") return "profile_opened";
  if (pathname === "/app/docs") return "guide_opened";
  if (pathname === "/app/billing") return "billing_opened";
  return null;
};

export function AppTelemetry() {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setTelemetryUser(user?.uid ?? null);
  }, [user?.uid]);

  useEffect(() => {
    const routeEvent = getRouteEvent(location.pathname);
    trackAppEvent("route_viewed", {
      path: location.pathname,
      route: routeEvent?.replace("_opened", "") ?? "other",
    });
    if (routeEvent) {
      trackAppEvent(routeEvent, { path: location.pathname });
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      captureAppError(event.error ?? event.message, {
        source: "window_error",
      });
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      captureAppError(event.reason, {
        source: "unhandled_rejection",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
