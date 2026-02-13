import { getItemTimeMapByPeriod } from "@/services/task-menager/analytics/template-handle-data";
import {
  ItemTimeMap,
  ItemTimeMapKeys,
  TypeAnalyticsPeriod,
} from "@/types/analytics/task-analytics.model";
import { Items } from "@/types/drag-and-drop.model";
import { useEffect, useState } from "react";
import ChartPieItem from "./chart-pie-item";

const ChartTimeCategory = ({
  templateTasks,
  title,
  type,
  period,
}: {
  templateTasks: Items;
  title: string;
  type: ItemTimeMapKeys;
  period: TypeAnalyticsPeriod;
}) => {
  const [analyticsData, setAnalyticsData] = useState<ItemTimeMap>();
  useEffect(() => {
    const analyticsData = getItemTimeMapByPeriod(templateTasks, period, type);
    setAnalyticsData(analyticsData);
  }, [templateTasks, period, type]);

  const taskToCategoryMap =
    type === ItemTimeMapKeys.task
      ? (() => {
          const map: Record<string, string> = {};
          templateTasks.forEach((cat) => {
            cat.tasks.forEach((task) => {
              map[task.title] = String(cat.id);
            });
          });
          return map;
        })()
      : undefined;

  const categoryIdToTitle = Object.fromEntries(
    templateTasks.map((cat) => [String(cat.id), cat.title])
  );

  return (
    <>
      {analyticsData && (
        <div className="max-w-2xl mx-auto w-full">
          <ChartPieItem
            data={analyticsData}
            type={type}
            title={title}
            taskToCategoryMap={taskToCategoryMap}
            categoryIdToTitle={categoryIdToTitle}
          />
        </div>
      )}
    </>
  );
};

export default ChartTimeCategory;
