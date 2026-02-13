import { getRangeDailyTaskAnalytics } from "@/services/task-menager/analytics/daily-handle-data";
import { DailyTaskRecord } from "@/types/drag-and-drop.model";

self.onmessage = (e) => {
  const rangeTasks = e.data as DailyTaskRecord[];
  postMessage(getRangeDailyTaskAnalytics(rangeTasks));
};
