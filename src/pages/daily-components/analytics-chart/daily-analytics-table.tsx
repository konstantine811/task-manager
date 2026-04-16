import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DailyAnalyticsData } from "@/types/analytics/task-analytics.model";
import { paresSecondToTime } from "@/utils/time.util";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

const DailyAnalyticsTable = ({ data }: { data: DailyAnalyticsData }) => {
  const [t] = useTranslation();
  const parseTime = useCallback(
    (time: number) => {
      const { minutes, hours } = paresSecondToTime(time);
      let timeStr = "";
      const numHours = Number(hours);
      const numMinutes = Number(minutes);
      if (numHours !== 0) {
        timeStr = `${numHours}${t("chart.hour")}:`;
      }
      timeStr += `${numMinutes}${t("chart.minute")}`;
      return timeStr;
    },
    [t]
  );
  if (data.countDoneTask <= 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="chrono-table">
        <Table className="text-sm [&_tr]:border-0">
          <TableHeader>
            <TableRow>
              <TableHead>{t("task_manager.analytics.daily_table.indicator")}</TableHead>
              <TableHead>{t("task_manager.analytics.daily_table.count")}</TableHead>
              <TableHead>{t("task_manager.analytics.daily_table.time")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="text-zinc-800 dark:text-zinc-200">Виконано</TableCell>
              <TableCell className="font-mono text-zinc-700 dark:text-zinc-400">{data.countDoneTask}</TableCell>
              <TableCell className="font-mono text-zinc-700 dark:text-zinc-400">
                {parseTime(data.countDoneTime)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DailyAnalyticsTable;
