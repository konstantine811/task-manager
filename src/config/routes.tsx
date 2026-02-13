import { lazy, Suspense } from "react";
import { Navigate } from "react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const Landing = lazy(() => import("@/pages/Landing"));
const TemplateTask = lazy(() => import("@/pages/TemplateTask"));
const DailyTask = lazy(() => import("@/pages/DailyTask"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const TaskManager = lazy(() => import("@/pages/TaskManager"));

export const ROUTES = {
  HOME: "/",
  TEMPLATE: "/app/template",
  DAILY: "/app/daily",
  DAILY_ID: "/app/daily/:id",
  ANALYTICS: "/app/analytics",
} as const;

function TaskManagerLayout() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="p-4">Loading…</div>}>
        <TaskManager />
      </Suspense>
    </ProtectedRoute>
  );
}

export const routes = [
  {
    path: "/",
    element: (
      <Suspense fallback={<div className="p-4">Loading…</div>}>
        <Landing />
      </Suspense>
    ),
  },
  {
    path: "/app",
    element: <TaskManagerLayout />,
    children: [
      { path: "", element: <Navigate to={ROUTES.TEMPLATE} replace /> },
      { path: "template", element: <TemplateTask /> },
      { path: "daily/:id", element: <DailyTask /> },
      { path: "analytics", element: <Analytics /> },
    ],
  },
];
