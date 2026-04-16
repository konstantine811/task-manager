import { ROUTES } from "@/config/route-paths";
import { DateTemplate } from "@/config/data-config";
import { format } from "date-fns";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ChartSpline, LayoutDashboard } from "lucide-react";

const TASK_MANAGER_ROUTERS = [
  {
    path: ROUTES.TEMPLATE,
    id: "task-manager-template",
    icon: <LayoutDashboard />,
    labelKey: "template",
  },
  {
    path: ROUTES.DAILY_ID,
    id: "task-manager-daily",
    icon: <span className="text-base leading-none">🚶</span>,
    labelKey: "daily",
  },
  {
    path: ROUTES.ANALYTICS,
    id: "task-manager-analytics",
    icon: <ChartSpline />,
    labelKey: "analytics",
  },
];

function TaskNavMenu() {
  const [t] = useTranslation();
  const { pathname } = useLocation();

  const releaseFocusBeforeNavigate = () => {
    const active = document.activeElement as HTMLElement | null;
    if (!active) return;
    const tag = active.tagName;
    if (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      active.getAttribute("contenteditable") === "true"
    ) {
      active.blur();
    }
  };

  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-20 bottom-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-1 p-1.5 rounded-full border border-zinc-300/80 dark:border-white/10 bg-white/80 dark:bg-[rgba(10,10,12,0.6)] backdrop-blur-xl shadow-lg">
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
          const isActive = pathname.startsWith(activePath);
          return (
            <Link
              to={path}
              key={item.id}
              title={t(`pages.task.${title}`)}
              onPointerDown={releaseFocusBeforeNavigate}
              className={cn(
                "min-w-18 px-2 py-1.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-colors text-[10px] font-medium leading-none",
                isActive
                  ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-200"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/80 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white",
              )}
            >
              <span className="w-4 h-4 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4 [&>span]:text-sm">
                {item.icon}
              </span>
              <span className="truncate max-w-full">
                {t(`pages.task.${item.labelKey}`)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default TaskNavMenu;
