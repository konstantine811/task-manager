import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { ChronoNav } from "@/components/landing";
import { markEnteredAppThisSession } from "@/config/app-session";
import TaskNavMenu from "./TaskNavMenu";
import { ROUTES } from "@/config/route-paths";
import { getTaskManagerEntryPath } from "@/utils/task-manager-entry-path";

export interface TaskManagerOutletContext {
  className: string;
}

const TaskManager = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const didInitialEntryRedirectRef = useRef(false);
  const outletConext: TaskManagerOutletContext = {
    className: "",
  };

  useEffect(() => {
    markEnteredAppThisSession();
  }, []);

  useEffect(() => {
    if (didInitialEntryRedirectRef.current) return;
    didInitialEntryRedirectRef.current = true;

    if (!pathname.startsWith(ROUTES.TEMPLATE)) return;

    let cancelled = false;
    void (async () => {
      const entryPath = await getTaskManagerEntryPath();
      if (cancelled) return;
      if (entryPath.startsWith(ROUTES.DAILY)) {
        navigate(entryPath, { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, navigate]);

  useEffect(() => {
    // iOS Safari can keep horizontal viewport offset after route change
    // if previous screen had focused input/textarea and auto-zoom.
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
    window.scrollTo({ left: 0, top: window.scrollY, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="box-border min-h-dvh flex flex-col chrono-page-bg text-foreground relative h-full">
      <ChronoNav variant="app" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col grow pb-20">
        <Outlet context={outletConext} />
      </div>
      <TaskNavMenu />
    </div>
  );
};

export default TaskManager;
