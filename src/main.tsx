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
