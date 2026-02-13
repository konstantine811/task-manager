import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { DateTemplate } from "@/config/data-config";
import {
  Dock,
  DockIcon,
  DockItem,
  DockLabel,
} from "@/components/ui/shadcn-io/dock";
import { useHeaderSizeStore } from "@/storage/headerSizeStore";
import { ChronoNav } from "@/components/landing";
import { LayoutDashboard, ChartSpline } from "lucide-react";
import { ROUTES } from "@/config/routes";

const NAVBAR_HEIGHT = 56;

export interface TaskManagerOutletContext {
  className: string;
}

const TASK_MANAGER_ROUTERS = [
  {
    path: ROUTES.TEMPLATE,
    id: "task-manager-template",
    icon: <LayoutDashboard />,
  },
  {
    path: ROUTES.DAILY_ID,
    id: "task-manager-daily",
    icon: <span className="text-lg">🚶</span>,
  },
  {
    path: ROUTES.ANALYTICS,
    id: "task-manager-analytics",
    icon: <ChartSpline />,
  },
];

const TaskManager = () => {
  const [t] = useTranslation();
  const { pathname } = useLocation();
  const setHeaderSize = useHeaderSizeStore((s) => s.setSize);
  const outletConext: TaskManagerOutletContext = {
    className: "pb-24",
  };

  useEffect(() => {
    setHeaderSize(NAVBAR_HEIGHT);
    return () => setHeaderSize(0);
  }, [setHeaderSize]);

  return (
    <div style={{ paddingTop: NAVBAR_HEIGHT }} className="min-h-screen chrono-page-bg text-foreground relative">
      <ChronoNav variant="app" />
      <div className="relative z-10">
        <Outlet context={outletConext} />
      </div>
      <div className="fixed bottom-2 left-1/2 max-w-full -translate-x-1/2 z-20">
        <Dock className="items-end pb-3 dropdown-glass border-white/5">
          {TASK_MANAGER_ROUTERS.map((item) => {
            let path: string = item.path;
            let title: string = item.path;
            let activePath: string = item.path;
            if (item.path === ROUTES.DAILY_ID) {
              const today = format(new Date(), DateTemplate.dayMonthYear);
              activePath = ROUTES.DAILY;
              title = "daily";
              path = `${ROUTES.DAILY}/${today}`;
            } else {
              activePath = item.path;
              title = item.path.split("/").filter(Boolean).pop() ?? item.path;
            }
            return (
              <Link to={path} key={item.id}>
                <DockItem
                  className={`${
                    pathname.startsWith(activePath)
                      ? "bg-indigo-500/20 text-indigo-200 border-indigo-500/20"
                      : "bg-white/[0.03] text-zinc-400 border-white/5 hover:bg-white/5 hover:text-white"
                  } transition duration-200 aspect-square rounded-full border cursor-pointer`}
                >
                  <DockLabel>{t(`pages.task.${title}`)}</DockLabel>
                  <DockIcon className="text-3xl ">{item.icon}</DockIcon>
                </DockItem>
              </Link>
            );
          })}
        </Dock>
      </div>
    </div>
  );
};

export default TaskManager;
