import ChartTitle from "@/pages/chart/chart-title";
import { loadDailyTasksByRange } from "@/services/firebase/taskManagerData";
import { computeGoalProgress } from "@/services/task-menager/goals/goal-progress.service";
import { normalizeItems } from "@/services/task-menager/normalize";
import { DailyTaskRecord, ItemTask } from "@/types/drag-and-drop.model";
import { Goal } from "@/types/progress.model";
import { parseDate } from "@/utils/date.util";
import { formatGoalProgressValue } from "@/utils/goal.util";
import {
  formatISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

const laterDate = (left: Date, right: Date): Date =>
  left.getTime() >= right.getTime() ? left : right;

const getGoalProgressRange = (goal: Goal, date: string): { from: Date; to: Date } => {
  const anchor = parseDate(date);
  const goalStart = parseDate(goal.createdAt.slice(0, 10));
  if (goal.period === "week") {
    return {
      from: laterDate(startOfWeek(anchor, { weekStartsOn: 1 }), goalStart),
      to: anchor,
    };
  }
  if (goal.period === "custom") {
    return {
      from: goalStart,
      to: anchor,
    };
  }
  return {
    from: laterDate(startOfMonth(anchor), goalStart),
    to: anchor,
  };
};

const getDateId = (date: Date): string =>
  formatISO(date, { representation: "date" });

const isGoalVisibleOnDate = (goal: Goal, selectedDateId: string | null): boolean => {
  if (!selectedDateId) return goal.status !== "completed";
  if (selectedDateId < goal.createdAt.slice(0, 10)) return false;
  if (goal.completedAt) {
    return selectedDateId <= goal.completedAt.slice(0, 10);
  }
  return goal.status !== "completed";
};

const DailyGoalsProgress = ({
  goals,
  tasks,
}: {
  goals: Goal[];
  tasks: ItemTask[];
}) => {
  const [t] = useTranslation();
  const { id: date } = useParams();
  const [periodRecords, setPeriodRecords] = useState<DailyTaskRecord[]>([]);

  useEffect(() => {
    if (!date || goals.length === 0) {
      setPeriodRecords([]);
      return;
    }

    let isMounted = true;
    const currentDateId = getDateId(parseDate(date));
    const visibleGoals = goals.filter((goal) =>
      isGoalVisibleOnDate(goal, currentDateId),
    );
    if (visibleGoals.length === 0) {
      setPeriodRecords([]);
      return;
    }

    const ranges = visibleGoals.map((goal) => getGoalProgressRange(goal, date));
    const from = new Date(Math.min(...ranges.map((range) => range.from.getTime())));
    const to = new Date(Math.max(...ranges.map((range) => range.to.getTime())));

    loadDailyTasksByRange(from, to)
      .then((records) => {
        if (!isMounted) return;
        const nextRecords = records.map((record) =>
          record.date === currentDateId
            ? { ...record, items: [{ id: "current-day", title: "current-day", tasks }] }
            : record,
        );
        if (!records.some((record) => record.date === currentDateId)) {
          nextRecords.push({
            date: currentDateId,
            items: [{ id: "current-day", title: "current-day", tasks }],
          });
        }
        setPeriodRecords(nextRecords);
      })
      .catch((error) => {
        console.error("Error loading goal period tasks:", error);
        if (isMounted) setPeriodRecords([]);
      });

    return () => {
      isMounted = false;
    };
  }, [date, goals, tasks]);

  const allPeriodTasks = useMemo(
    () =>
      periodRecords.length > 0
        ? periodRecords.flatMap((record) => normalizeItems(record.items))
        : tasks,
    [periodRecords, tasks],
  );

  const taskTitleById = useMemo(
    () => new Map(allPeriodTasks.map((task) => [String(task.id), task.title])),
    [allPeriodTasks],
  );

  const goalItems = useMemo(
    () =>
      goals
        .filter((goal) =>
          isGoalVisibleOnDate(
            goal,
            date ? getDateId(parseDate(date)) : null,
          ),
        )
        .map((goal) => {
          const range = date ? getGoalProgressRange(goal, date) : null;
          const sourceTasks = range && periodRecords.length > 0
            ? periodRecords
                .filter((record) => {
                  const fromId = getDateId(range.from);
                  const toId = getDateId(range.to);
                  return record.date >= fromId && record.date <= toId;
                })
                .flatMap((record) => normalizeItems(record.items))
            : allPeriodTasks;
          const progress = computeGoalProgress(goal, sourceTasks);
          const impactedTasks = progress.impactedTaskIds
            .map((taskId) => taskTitleById.get(taskId))
            .filter((title): title is string => Boolean(title));
          return {
            goal,
            progress,
            impactedTasks,
          };
        })
        .filter((item) => item.impactedTasks.length > 0),
    [allPeriodTasks, date, goals, periodRecords, taskTitleById],
  );

  if (goalItems.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-linear-to-b from-white to-zinc-50 p-3 shadow-[0_25px_70px_rgba(0,0,0,0.35)] dark:from-zinc-900/80 dark:to-zinc-950">
      <ChartTitle
        title="goals.analytics_title"
        subtitle="goals.analytics_subtitle"
      />
      <div className="mt-2 space-y-2">
        {goalItems.map(({ goal, progress, impactedTasks }) => {
          const currentValue = progress.goal.currentValue;
          const pct = goal.targetValue > 0
            ? Math.min(100, Math.round((currentValue / goal.targetValue) * 100))
            : 0;
          return (
            <div
              key={goal.id}
              className="rounded-lg border border-white/10 bg-white/60 p-2 dark:bg-white/5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {goal.title}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatGoalProgressValue(
                    currentValue,
                    goal.targetValue,
                    goal.unitType,
                  )} · {pct}%
                </div>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-200/70 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-indigo-500/80"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {impactedTasks.join(", ")}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
        {t("goals.analytics_completed_subtitle")}
      </div>
    </div>
  );
};

export default DailyGoalsProgress;
