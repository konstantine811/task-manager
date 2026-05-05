import { Goal } from "@/types/progress.model";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { formatGoalProgressValue } from "@/utils/goal.util";

type SortMode = "oldest_first" | "newest_first";

export const getCompletedGoals = (
  goals: Goal[],
  sortMode: SortMode,
): Goal[] => {
  return goals
    .filter((goal) => goal.status === "completed" && goal.completedAt)
    .sort((a, b) => {
      const aTs = new Date(a.completedAt ?? a.createdAt).getTime();
      const bTs = new Date(b.completedAt ?? b.createdAt).getTime();
      return sortMode === "oldest_first" ? aTs - bTs : bTs - aTs;
    });
};

export const getCompletedGoalsInRange = (
  goals: Goal[],
  from: Date,
  to: Date,
  sortMode: SortMode,
): Goal[] => {
  const fromTs = from.getTime();
  const toTs = to.getTime();
  const filtered = goals.filter((goal) => {
    if (goal.status !== "completed" || !goal.completedAt) return false;
    const ts = new Date(goal.completedAt).getTime();
    return ts >= fromTs && ts <= toTs;
  });
  return filtered.sort((a, b) => {
    const aTs = new Date(a.completedAt ?? a.createdAt).getTime();
    const bTs = new Date(b.completedAt ?? b.createdAt).getTime();
    return sortMode === "oldest_first" ? aTs - bTs : bTs - aTs;
  });
};

const GoalsCompletedList = ({
  goals,
  from,
  to,
}: {
  goals: Goal[];
  from: Date;
  to: Date;
}) => {
  const [t] = useTranslation();
  const [sortMode, setSortMode] = useState<SortMode>("oldest_first");
  void from;
  void to;

  const completedGoals = useMemo(() => {
    return getCompletedGoals(goals, sortMode);
  }, [goals, sortMode]);

  return (
    <div className="rounded-xl border border-white/10 bg-linear-to-b from-white to-zinc-50 p-4 shadow-[0_25px_70px_rgba(0,0,0,0.35)] dark:from-zinc-900/80 dark:to-zinc-950">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {t("goals.analytics_completed")}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("goals.analytics_completed_subtitle")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setSortMode((prev) =>
              prev === "oldest_first" ? "newest_first" : "oldest_first",
            )
          }
        >
          {sortMode === "oldest_first"
            ? t("goals.sort_oldest_first")
            : t("goals.sort_newest_first")}
        </Button>
      </div>

      {completedGoals.length === 0 ? (
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("goals.analytics_none")}
        </div>
      ) : (
        <div className="space-y-2">
          {completedGoals.map((goal) => (
            <div
              key={goal.id}
              className="rounded-md border border-white/10 bg-white/70 px-3 py-2 dark:bg-white/5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {goal.title}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {goal.completedAt
                    ? format(new Date(goal.completedAt), "dd.MM.yyyy")
                    : "-"}
                </div>
              </div>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {formatGoalProgressValue(
                  goal.currentValue,
                  goal.targetValue,
                  goal.unitType,
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalsCompletedList;
