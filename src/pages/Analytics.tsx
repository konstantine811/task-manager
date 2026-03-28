import { useHeaderSizeStore } from "@/storage/headerSizeStore";
import { useEffect, useMemo, useState } from "react";
import { loadDailyTasksByRange } from "@/services/firebase/taskManagerData";
import { CalendarDatePicker } from "./analytics-comonents/calendar-date-picker";

import AnalyticsWorker from "@/workers/analyticsWorker?worker";
import { DailyTaskRecord } from "@/types/drag-and-drop.model";
import {
  AnalyticsData,
  CategoryAnalyticsNameEntity,
} from "@/types/analytics/task-analytics.model";
import { useTranslation } from "react-i18next";
import ChartPieCategoryWrap from "./daily-components/analytics-chart/chart-pie-category/chart-pie-category-wrap";
import ChartPieTaskPlannedWrap from "./analytics-comonents/chart-pie-task-planned-wrap";
import RangeAnalyticsTable from "./analytics-comonents/range-analytics-table";
import TaskDateRangeHeader from "./analytics-comonents/task-data-range-header";
import { AnimatedItem } from "@/components/ui/animated-item";
import { CATEGORY_OPTIONS } from "@/components/dnd/config/category-options";
import CompletedProgressBarChart from "./analytics-comonents/completed-progress-bar-chart";

const Analytics = () => {
  const hS = useHeaderSizeStore((s) => s.size);
  const [t] = useTranslation();
  const [range, setRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });
  const [rangeTasks, setRangeTasks] = useState<DailyTaskRecord[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>();
  useEffect(() => {
    loadDailyTasksByRange(range.from, range.to).then((rangeTasks) => {
      setRangeTasks(rangeTasks);
    });
  }, [range]);

  useEffect(() => {
    const worker = new AnalyticsWorker();
    worker.postMessage(rangeTasks);
    worker.onmessage = (e: MessageEvent) => {
      setAnalyticsData(e.data as AnalyticsData);
    };
    return () => {
      worker.terminate();
    };
  }, [rangeTasks]);

  const mergedCategoryEntity = useMemo(() => {
    if (!analyticsData) return undefined;
    const empty = {
      time: 0,
      countDone: 0,
      countDoneTime: 0,
      taskDone: [] as string[],
      taskNoDone: [] as string[],
    };
    const merged: CategoryAnalyticsNameEntity = {};
    for (const key of CATEGORY_OPTIONS) {
      merged[key] = analyticsData.categoryEntity[key] ?? { ...empty };
    }
    return merged;
  }, [analyticsData]);

  return (
    <div className="w-full" style={{ minHeight: `calc(100vh - ${hS}px)` }}>
      <header className="border-b border-white/10 py-2">
        <AnimatedItem index={0}>
          <div className="container mx-auto flex items-center justify-end">
            <CalendarDatePicker
              date={range}
              onDateSelect={(newRange) => {
                setRange(newRange);
              }}
              variant="outline"
            />
          </div>
        </AnimatedItem>
      </header>
      <main className={`w-full flex-1 px-4`}>
        {/* <h2 className="text-center text-foreground/50 text-sm mb-4 mt-2">
            {`${t("task_manager.daily_task_title")} : ${dateVal || ""}`}
          </h2> */}
        <div className="container mx-auto pt-10 pb-20">
          {analyticsData ? (
            <>
              <AnimatedItem index={0}>
                <TaskDateRangeHeader tasks={analyticsData.rangeTasks} />
              </AnimatedItem>
              <AnimatedItem index={1} className="w-full min-w-0">
                <CompletedProgressBarChart
                  data={analyticsData.rangeTasks}
                  rangeFrom={range.from}
                  rangeTo={range.to}
                />
              </AnimatedItem>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-10">
                <AnimatedItem index={2}>
                  <ChartPieCategoryWrap
                    className="w-full"
                    data={mergedCategoryEntity ?? analyticsData.categoryEntity}
                    showCompletedOnly
                    useTimeCompletion
                    includeAllCategories
                  />
                </AnimatedItem>
                <AnimatedItem index={3}>
                  <ChartPieTaskPlannedWrap
                    className="w-full"
                    data={analyticsData.rangeTaskEntity}
                  />
                </AnimatedItem>
              </div>
              <AnimatedItem index={4}>
                <div className="mt-10">
                  <RangeAnalyticsTable data={analyticsData.rangeTaskEntity} />
                </div>
              </AnimatedItem>
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
