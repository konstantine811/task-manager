import { CategoryAnalyticsNameEntity } from "@/types/analytics/task-analytics.model";
import ChartPieCategory from "./chart-pie-category";
import ChartTitle from "../../../chart/chart-title";
import { cn } from "@/lib/utils";

const ChartPieCateogoryWrap = ({
  data,
  className,
}: {
  data: CategoryAnalyticsNameEntity;
  className?: string;
}) => {
  return (
    <>
      {Object.keys(data).length > 0 && (
        <div
          className={cn(
            `flex flex-col items-center gap-4 max-w-2xl mx-auto w-full ${className}`
          )}
        >
          <ChartTitle title="chart.pie_category_daily_time" />
          <ChartPieCategory data={data} />
        </div>
      )}
    </>
  );
};

export default ChartPieCateogoryWrap;
