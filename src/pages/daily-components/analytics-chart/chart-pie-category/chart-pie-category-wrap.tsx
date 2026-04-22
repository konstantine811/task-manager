import { CategoryAnalyticsNameEntity } from "@/types/analytics/task-analytics.model";
import ChartPieCategory from "./chart-pie-category";
import ChartTitle from "../../../chart/chart-title";
import { cn } from "@/lib/utils";

const ChartPieCateogoryWrap = ({
  data,
  className,
  showCompletedOnly = false,
  subtitleKey,
  useTimeCompletion = false,
  includeAllCategories = false,
}: {
  data: CategoryAnalyticsNameEntity;
  className?: string;
  showCompletedOnly?: boolean;
  subtitleKey?: string;
  useTimeCompletion?: boolean;
  /** When true, show all categories including those with 0 tasks (like line chart with all days) */
  includeAllCategories?: boolean;
}) => {
  return (
    <>
      {Object.keys(data).length > 0 && (
        <div
          className={cn(
            `flex flex-col items-center gap-4 max-w-2xl mx-auto w-full ${className}`
          )}
        >
          <ChartTitle
            title="chart.pie_category_daily_time"
            subtitle={
              showCompletedOnly
                ? subtitleKey ?? "chart.pie_category_completed_subtitle"
                : undefined
            }
          />
          <ChartPieCategory
            data={data}
            showCompletedOnly={showCompletedOnly}
            useTimeCompletion={useTimeCompletion}
            includeAllCategories={includeAllCategories}
          />
        </div>
      )}
    </>
  );
};

export default ChartPieCateogoryWrap;
