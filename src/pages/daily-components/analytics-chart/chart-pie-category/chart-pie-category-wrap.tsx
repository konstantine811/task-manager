import { CategoryAnalyticsNameEntity } from "@/types/analytics/task-analytics.model";
import ChartPieCategory from "./chart-pie-category";
import ChartTitle from "../../../chart/chart-title";
import { cn } from "@/lib/utils";

const ChartPieCateogoryWrap = ({
  data,
  className,
  showCompletedOnly = false,
}: {
  data: CategoryAnalyticsNameEntity;
  className?: string;
  showCompletedOnly?: boolean;
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
              showCompletedOnly ? "chart.pie_category_completed_subtitle" : undefined
            }
          />
          <ChartPieCategory data={data} showCompletedOnly={showCompletedOnly} />
        </div>
      )}
    </>
  );
};

export default ChartPieCateogoryWrap;
