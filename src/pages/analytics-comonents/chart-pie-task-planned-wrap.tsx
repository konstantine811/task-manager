import { RangeTaskAnalyticsNameEntity } from "@/types/analytics/task-analytics.model";
import { CategoryAnalyticsNameEntity } from "@/types/analytics/task-analytics.model";
import ChartPieCategory from "../daily-components/analytics-chart/chart-pie-category/chart-pie-category";
import ChartTitle from "../chart/chart-title";
import { cn } from "@/lib/utils";

/** Convert rangeTaskEntity to CategoryAnalyticsNameEntity for reuse of ChartPieCategory */
function toCategoryFormat(data: RangeTaskAnalyticsNameEntity): CategoryAnalyticsNameEntity {
  const result: CategoryAnalyticsNameEntity = {};
  for (const [taskName, v] of Object.entries(data)) {
    if (v.countTime <= 0) continue;
    result[taskName] = {
      time: v.countTime,
      countDone: v.countIsDone,
      countDoneTime: v.countDoneTime,
      taskDone: [],
      taskNoDone: [],
      categoryId: v.categoryId,
    };
  }
  return result;
}

const ChartPieTaskPlannedWrap = ({
  data,
  className,
}: {
  data: RangeTaskAnalyticsNameEntity;
  className?: string;
}) => {
  const adaptedData = toCategoryFormat(data);
  const hasData = Object.keys(adaptedData).length > 0;

  return (
    <>
      {hasData && (
        <div
          className={cn(
            "flex flex-col items-center gap-4 max-w-2xl mx-auto w-full",
            className
          )}
        >
          <ChartTitle
            title="chart.pie_task_planned_completed_title"
            subtitle="chart.pie_task_planned_completed_subtitle"
          />
          <ChartPieCategory
            data={adaptedData}
            showCompletedOnly
            useTimeCompletion
          />
        </div>
      )}
    </>
  );
};

export default ChartPieTaskPlannedWrap;
