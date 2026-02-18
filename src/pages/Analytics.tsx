import { useHeaderSizeStore } from "@/storage/headerSizeStore";
import { useEffect, useState } from "react";
import { loadDailyTasksByRange } from "@/services/firebase/taskManagerData";
import { CalendarDatePicker } from "./analytics-comonents/calendar-date-picker";

import AnalyticsWorker from "@/workers/analyticsWorker?worker";
import { DailyTaskRecord } from "@/types/drag-and-drop.model";
import {
  AnalyticsData,
  ItemTimeMap,
  ItemTimeMapKeys,
} from "@/types/analytics/task-analytics.model";
import LineChartTask from "./analytics-comonents/line-chart-task";
import { useTranslation } from "react-i18next";
import ChartPieCategoryWrap from "./daily-components/analytics-chart/chart-pie-category/chart-pie-category-wrap";
import ChartTitle from "./chart/chart-title";
import ChartPieItem from "./template-components/chart-pie-item";
import RangeAnalyticsTable from "./analytics-comonents/range-analytics-table";
import TaskDateRangeHeader from "./analytics-comonents/task-data-range-header";

const Analytics = () => {
  const hS = useHeaderSizeStore((s) => s.size);
  const [t] = useTranslation();
  const [range, setRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });
  const [rangeTasks, setRangeTasks] = useState<DailyTaskRecord[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>();
  const [categoryTotalEntity, setCategoryTotalEntity] = useState<ItemTimeMap>({});
  useEffect(() => {
    loadDailyTasksByRange(range.from, range.to).then((rangeTasks) => {
      setRangeTasks(rangeTasks);
    });
  }, [range]);

  useEffect(() => {
    const worker = new AnalyticsWorker();
    worker.postMessage(rangeTasks);
    worker.onmessage = (e: MessageEvent) => {
      const analyticsData = e.data as AnalyticsData;
      if (analyticsData.categoryEntity) {
        const totalByCategory: ItemTimeMap = {};
        Object.entries(analyticsData.categoryEntity).forEach(([key, value]) => {
          if (value.time > 0) {
            totalByCategory[key] = value.time;
          }
        });
        setCategoryTotalEntity(totalByCategory);
      }
      setAnalyticsData(analyticsData);
    };
    return () => {
      worker.terminate();
    };
  }, [rangeTasks]);
  return (
    <div className="w-full" style={{ minHeight: `calc(100vh - ${hS}px)` }}>
      <header className=" border-b border-border py-2">
        <div className="container mx-auto flex items-center justify-end">
          <CalendarDatePicker
            date={range}
            onDateSelect={(newRange) => {
              setRange(newRange);
            }}
            variant="outline"
          />
        </div>
      </header>
      <main className={`w-full flex-1 px-4`}>
        {/* <h2 className="text-center text-foreground/50 text-sm mb-4 mt-2">
            {`${t("task_manager.daily_task_title")} : ${dateVal || ""}`}
          </h2> */}
        <div className="container mx-auto pt-10 pb-20">
          {analyticsData ? (
            <>
              <TaskDateRangeHeader tasks={analyticsData.rangeTasks} />
              <LineChartTask data={analyticsData.rangeTasks} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-10">
                <ChartPieCategoryWrap
                  className="w-full"
                  data={analyticsData.categoryEntity}
                  showCompletedOnly
                />
                <div className="w-full flex flex-col items-center max-w-2xl mx-auto md:max-w-none md:mr-0">
                  <ChartTitle
                    title="chart.period_count_category_title"
                    subtitle="chart.pie_category_total_subtitle"
                  />
                  <div className="w-full mt-4">
                    <ChartPieItem
                      data={categoryTotalEntity}
                      type={ItemTimeMapKeys.category}
                      height={320}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-10">
                <RangeAnalyticsTable data={analyticsData.rangeTaskEntity} />
              </div>
            </>
          ) : (
            t("not_data")
          )}
        </div>
      </main>
    </div>
  );
};

export default Analytics;
