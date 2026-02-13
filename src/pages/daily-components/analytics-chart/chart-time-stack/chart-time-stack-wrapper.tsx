import { useState } from "react";
import ChartTimeStackTasks from "./chart-time-stack-tasks";
import ChartTimeToggle from "./chart-time-stack-toggle";
import {
  TaskAnalyticsBarOrientation,
  TaskAnalyticsIdEntity,
} from "@/types/analytics/task-analytics.model";
import ChartTitle from "../../../chart/chart-title";

const ChartTimeStackWrapper = ({ data }: { data: TaskAnalyticsIdEntity }) => {
  const [orientation, setOrientation] =
    useState<TaskAnalyticsBarOrientation>("horizontal");
  return (
    <>
      {Object.keys(data).length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-center gap-2">
            <ChartTitle title="chart.task_day_count" />
            <ChartTimeToggle
              value={orientation}
              onValueChange={(value) => {
                setOrientation(value);
              }}
            />
          </div>
          <ChartTimeStackTasks data={data} direction={orientation} />
        </div>
      )}
    </>
  );
};

export default ChartTimeStackWrapper;
