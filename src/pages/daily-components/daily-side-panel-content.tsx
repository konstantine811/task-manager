import { useTranslation } from "react-i18next";
import TaskFutureTimeline from "../future-task-components/task-future-timeline";
import { useDailyTaskContext } from "../hooks/useDailyTask";
import DailyCalendar from "./daily-calendar";
import { useIsAdoptive } from "@/hooks/useIsAdoptive";
import DailyAnalytics from "./daily-analytics";
import { BreakPoints } from "@/config/adaptive.config";

const DailySidePanelContent = () => {
  const { plannedTasks } = useDailyTaskContext();
  const { screenWidth } = useIsAdoptive();
  const [t] = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <DailyCalendar />
      {plannedTasks && plannedTasks.length > 0 && (
        <div>
          <h3 className="text-foreground/50 text-sm mb-4 mt-2">
            {t("task_manager.planned_tasks")}
          </h3>
          <TaskFutureTimeline tasks={plannedTasks} />
        </div>
      )}
      {screenWidth < BreakPoints["2xl"] && <DailyAnalytics />}
    </div>
  );
};

export default DailySidePanelContent;
