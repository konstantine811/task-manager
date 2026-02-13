import { useEffect, useState } from "react";
import { useDailyTaskContext } from "../hooks/useDailyTask";
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
  const [dailyEntity, setDailyEntity] = useState<TaskAnalyticsIdEntity>({});
  const [categoryEntity, setCategoryEntity] =
    useState<CategoryAnalyticsNameEntity>({});
  const [dailyAnaltyics, setDailyAnaltyics] = useState<DailyAnalyticsData>();

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
      <ChartTimeStackWrapper data={dailyEntity} />
      {dailyAnaltyics && <DailyAnalyticsTable data={dailyAnaltyics} />}
      <ChartPieCategoryWrap className="pb-8 md:py-8" data={categoryEntity} />
    </div>
  );
};

export default DailyAnalytics;
