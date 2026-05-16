import { lazy, Suspense, useEffect } from "react";
import { useNavigate } from "react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getTodayDailyRoute } from "@/config/route-paths";
import { PageLoader } from "@/components/ui/page-loader";

export { ROUTES, getTodayDailyRoute } from "@/config/route-paths";

const Landing = lazy(() => import("@/pages/Landing"));
const TemplateTask = lazy(() => import("@/pages/TemplateTask"));
const DailyTask = lazy(() => import("@/pages/DailyTask"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Billing = lazy(() => import("@/pages/Billing"));
const Profile = lazy(() => import("@/pages/Profile"));
const Documentation = lazy(() => import("@/pages/Documentation"));
const Social = lazy(() => import("@/pages/Social"));
const TaskManager = lazy(() => import("@/pages/TaskManager"));
const LegalPage = lazy(() => import("@/pages/LegalPage"));
const PaymentResult = lazy(() => import("@/pages/PaymentResult"));

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
    navigate(getTodayDailyRoute(), { replace: true });
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
    path: "/offer",
    element: (
      <Suspense fallback={<PageLoader />}>
        <LegalPage />
      </Suspense>
    ),
  },
  {
    path: "/privacy",
    element: (
      <Suspense fallback={<PageLoader />}>
        <LegalPage />
      </Suspense>
    ),
  },
  {
    path: "/contacts",
    element: (
      <Suspense fallback={<PageLoader />}>
        <LegalPage />
      </Suspense>
    ),
  },
  {
    path: "/payment-result",
    element: (
      <Suspense fallback={<PageLoader />}>
        <PaymentResult />
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
      { path: "billing", element: <Billing /> },
      { path: "profile", element: <Profile /> },
      { path: "docs", element: <Documentation /> },
      { path: "social", element: <Social /> },
    ],
  },
];
