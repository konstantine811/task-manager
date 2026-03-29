import { getRangeDailyTaskAnalytics } from "@/services/task-menager/analytics/daily-handle-data";
import { AnalyticsWorkerPayload } from "@/types/analytics/task-analytics.model";

self.onmessage = (e) => {
  const { rangeTasks, from, to } = e.data as AnalyticsWorkerPayload;
  postMessage(getRangeDailyTaskAnalytics(rangeTasks, { from, to }));
};
