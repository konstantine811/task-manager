import { lazy, Suspense, useEffect } from "react";
import { useNavigate } from "react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { format } from "date-fns";
import { DateTemplate } from "@/config/data-config";
import { ROUTES } from "@/config/route-paths";
import { PageLoader } from "@/components/ui/page-loader";

export { ROUTES } from "@/config/route-paths";

const Landing = lazy(() => import("@/pages/Landing"));
const TemplateTask = lazy(() => import("@/pages/TemplateTask"));
const DailyTask = lazy(() => import("@/pages/DailyTask"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const TaskManager = lazy(() => import("@/pages/TaskManager"));

function TaskManagerLayout() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<PageLoader />}>
        <TaskManager />
      </Suspense>
    </ProtectedRoute>
  );
}

/** Після логіну: завжди одразу на щоденні (сьогодні). */
function TaskManagerIndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const today = format(new Date(), DateTemplate.dayMonthYear);
    navigate(`${ROUTES.DAILY}/${today}`, { replace: true });
  }, [navigate]);

  return (
    <PageLoader />
  );
}

export const routes = [
  {
    path: "/",
    element: (
      <Suspense fallback={<PageLoader />}>
        <Landing />
      </Suspense>
    ),
  },
  {
    path: "/app",
    element: <TaskManagerLayout />,
    children: [
      { path: "", element: <TaskManagerIndexRedirect /> },
      { path: "template", element: <TemplateTask /> },
      { path: "daily/:id", element: <DailyTask /> },
      { path: "analytics", element: <Analytics /> },
    ],
  },
];
