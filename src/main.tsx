import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router";
import "./i18n";
import { registerSW } from "virtual:pwa-register";
import { initErrorTracking } from "@/lib/telemetry";

const DYNAMIC_IMPORT_RELOAD_KEY = "life-focus-dynamic-import-reloaded";

const isDynamicImportFailure = (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("error loading dynamically imported module")
  );
};

window.addEventListener("unhandledrejection", (event) => {
  if (!isDynamicImportFailure(event.reason)) return;
  if (sessionStorage.getItem(DYNAMIC_IMPORT_RELOAD_KEY) === "1") return;

  sessionStorage.setItem(DYNAMIC_IMPORT_RELOAD_KEY, "1");
  window.location.reload();
});

window.addEventListener("load", () => {
  sessionStorage.removeItem(DYNAMIC_IMPORT_RELOAD_KEY);
});

registerSW({
  immediate: true,
});

initErrorTracking();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<div />}>
      <BrowserRouter>
        <App />
        <Analytics />
        <SpeedInsights />
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </StrictMode>
);
