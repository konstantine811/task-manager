import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RangeTaskAnalyticsNameEntity } from "@/types/analytics/task-analytics.model";
import { paresSecondToTime } from "@/utils/time.util";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type SortField =
  | "key"
  | "countIsDone"
  | "countIsNotDone"
  | "countTime"
  | "countDoneTime";
type SortDirection = "asc" | "desc";

type Props = {
  data: RangeTaskAnalyticsNameEntity;
};

const RangeAnalyticsTable = ({ data }: Props) => {
  const [t] = useTranslation();
  const [sortField, setSortField] = useState<SortField>("countDoneTime");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const toggleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const parseTime = (time: number) => {
    const { minutes, hours } = paresSecondToTime(time);
    const numHours = Number(hours);
    const numMinutes = Number(minutes);
    return `${numHours ? `${numHours}${t("chart.hour")}:` : ""}${numMinutes}${t(
      "chart.minute"
    )}`;
  };

  const sortedData = useMemo(() => {
    const entries = Object.entries(data).map(([key, value]) => ({
      key,
      ...value,
    }));
    return entries.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return 0;
    });
  }, [data, sortField, sortDirection]);

  const renderSortIcon = (field: SortField) => (
    <span
      className={cn(
        "inline-block transition-transform duration-300",
        sortField === field ? "opacity-100" : "opacity-30",
        sortField === field && sortDirection === "asc"
          ? "rotate-180"
          : "rotate-0"
      )}
    >
      ▲
    </span>
  );

  const headers: { label: string; field: SortField; className?: string }[] = [
    {
      label: t("task_manager.analytics.range_table.task"),
      field: "key",
      className: "w-1/3",
    },
    {
      label: t("task_manager.analytics.range_table.done"),
      field: "countIsDone",
    },
    {
      label: t("task_manager.analytics.range_table.not_done"),
      field: "countIsNotDone",
    },
    {
      label: t("task_manager.analytics.range_table.total_time"),
      field: "countTime",
    },
    {
      label: t("task_manager.analytics.range_table.done_time"),
      field: "countDoneTime",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="chrono-table overflow-auto">
        <Table className="text-sm min-w-[700px] [&_tr]:border-0">
          <TableHeader>
            <TableRow>
              {headers.map(({ label, field, className }) => (
                <TableHead
                  key={field}
                  onClick={() => toggleSort(field)}
                  className={cn(
                    "text-center cursor-pointer select-none hover:text-zinc-300 transition-colors",
                    className
                  )}
                >
                  <div className="flex items-center justify-center gap-1">
                    {label}
                    {renderSortIcon(field)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((task) => (
              <TableRow key={task.key}>
                <TableCell className="font-medium text-zinc-200 whitespace-pre-wrap break-words max-w-[200px]">
                  {(() => {
                    const key = `task_manager.categories.${task.key}`;
                    const tr = t(key);
                    return tr !== key ? tr : task.key;
                  })()}
                </TableCell>
                <TableCell className="text-center font-mono text-zinc-400">
                  {task.countIsDone}
                </TableCell>
                <TableCell className="text-center font-mono text-zinc-400">
                  {task.countIsNotDone}
                </TableCell>
                <TableCell className="text-center font-mono text-zinc-400">
                  {parseTime(task.countTime)}
                </TableCell>
                <TableCell className="text-center font-mono text-zinc-400">
                  {parseTime(task.countDoneTime)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RangeAnalyticsTable;
