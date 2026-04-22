import { useEffect, useState } from "react";
import { useDailyTaskContext } from "../hooks/useDailyTask";
import { useParams } from "react-router";
import ChartTimeStackWrapper from "./analytics-chart/chart-time-stack/chart-time-stack-wrapper";
import {
  CategoryAnalyticsNameEntity,
  DailyAnalyticsData,
  TaskAnalyticsIdEntity,
} from "@/types/analytics/task-analytics.model";
import { getDailyTaskAnalyticsData } from "@/services/task-menager/analytics/daily-handle-data";
import ChartPieCategoryWrap from "./analytics-chart/chart-pie-category/chart-pie-category-wrap";
import DailyAnalyticsTable from "./analytics-chart/daily-analytics-table";

const DailyAnalytics = () => {
  const { dailyTasks } = useDailyTaskContext();
  const { id: date } = useParams();
  const [dailyEntity, setDailyEntity] = useState<TaskAnalyticsIdEntity>({});
  const [categoryEntity, setCategoryEntity] =
    useState<CategoryAnalyticsNameEntity>({});
  const [dailyAnaltyics, setDailyAnaltyics] = useState<DailyAnalyticsData>();
  const trackedDailyEntity = Object.fromEntries(
    Object.entries(dailyEntity).filter(([, task]) => task.time > 0),
  );
  const doneCategoryEntity = Object.fromEntries(
    Object.entries(categoryEntity).filter(
      ([, category]) => category.countDone > 0 || category.countDoneTime > 0,
    ),
  );
  const hasTrackedTime = (dailyAnaltyics?.countDoneTime ?? 0) > 0;

  useEffect(() => {
    if (!dailyTasks || dailyTasks.length === 0) {
      setDailyEntity({});
      setCategoryEntity({});
      setDailyAnaltyics(undefined);
      return;
    }
    const { dailyEntity, categoryEntity, dailyAnalytics } =
      getDailyTaskAnalyticsData(dailyTasks);
    setDailyEntity(dailyEntity);
    setCategoryEntity(categoryEntity);
    setDailyAnaltyics(dailyAnalytics);
  }, [dailyTasks]);
  return (
    <div className="flex flex-col gap-4">
      {hasTrackedTime && <ChartTimeStackWrapper data={trackedDailyEntity} />}
      {hasTrackedTime && dailyAnaltyics && <DailyAnalyticsTable data={dailyAnaltyics} />}
      {hasTrackedTime && Object.keys(doneCategoryEntity).length > 0 && (
        <ChartPieCategoryWrap
          className="pb-8 md:py-8"
          data={doneCategoryEntity}
          showCompletedOnly
          subtitleKey="chart.pie_category_tracked_subtitle"
          useTimeCompletion
          celebrationScopeKey={date ?? null}
        />
      )}
    </div>
  );
};

export default DailyAnalytics;
