import { Check, Flag, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGoalsStore } from "@/storage/goalsStore";
import type { Goal } from "@/types/goal.model";

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getGoalTarget(goal: Goal): number {
  if (goal.metric.type === "count") return goal.metric.target;
  if (goal.metric.type === "minutes") return goal.metric.target;
  if (goal.metric.type === "streak") return goal.metric.target;
  if (goal.metric.type === "score") return goal.metric.target;
  return 0;
}

function formatMetricUnit(goal: Goal): string {
  if (goal.metric.type === "count") return goal.metric.unit ?? "кроків";
  if (goal.metric.type === "minutes") return "хв";
  if (goal.metric.type === "streak") return "днів";
  if (goal.metric.type === "score") return "балів";
  return "";
}

/** Format YYYY-MM-DD to DD.MM.YYYY */
function formatDateDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function GoalCard({
  goal,
  isDone,
  t,
}: {
  goal: Goal;
  isDone: boolean;
  t: (key: string) => string;
}) {
  const target = getGoalTarget(goal);
  const progress = goal.progress ?? 0;
  const pct = target > 0 ? Math.round((progress / target) * 100) : 0;
  const progressColor =
    isDone ? "bg-emerald-500/80" : "bg-indigo-500/80";
  const unit = formatMetricUnit(goal);

  return (
    <div
      className={`rounded-lg border p-3 ${
        isDone
          ? "border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/5"
          : "border-zinc-200 dark:border-white/10 bg-zinc-100/80 dark:bg-black/20"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div
            className={`text-sm font-medium truncate ${
              isDone
                ? "text-emerald-700 dark:text-emerald-400/90"
                : "text-zinc-800 dark:text-zinc-200"
            }`}
          >
            {goal.title}
          </div>
          {goal.description && (
            <div className="text-xs text-zinc-600 dark:text-zinc-500 mt-0.5">
              {goal.description}
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs text-zinc-500">
            {t("goals.progress") || "Прогрес"}
          </div>
          <div
            className={`text-sm font-medium ${
              isDone
                ? "text-emerald-700 dark:text-emerald-400/90"
                : "text-zinc-800 dark:text-zinc-100"
            }`}
          >
            {pct}%
          </div>
        </div>
      </div>
      <div className="mt-2">
        <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/5">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div className="mt-1.5 text-xs font-mono text-zinc-600 dark:text-zinc-500">
          {progress}/{target} {unit}
          {isDone && goal.completedAt ? (
            <span className="ml-2 text-zinc-500">{formatDateDisplay(goal.completedAt)}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface Props {
  rangeFrom: Date;
  rangeTo: Date;
}

export default function AnalyticsCompletedGoals({ rangeFrom, rangeTo }: Props) {
  const [t] = useTranslation();
  const goals = useGoalsStore((s) => s.goals);
  const fromStr = toYYYYMMDD(rangeFrom);
  const toStr = toYYYYMMDD(rangeTo);

  const completedInPeriod = goals.filter(
    (g) =>
      g.status === "done" &&
      g.completedAt &&
      g.completedAt >= fromStr &&
      g.completedAt <= toStr
  );
  const completedOther = goals.filter(
    (g) =>
      g.status === "done" &&
      !(g.completedAt && g.completedAt >= fromStr && g.completedAt <= toStr)
  );
  const activeGoals = goals.filter((g) => g.status === "active");

  const hasAnyGoals = goals.length > 0;
  if (!hasAnyGoals) return null;

  return (
    <div className="mt-10 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-white/3 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-200/80 dark:bg-black/20">
          <Flag className="h-5 w-5 text-zinc-700 dark:text-zinc-200" strokeWidth={1.5} />
        </div>
        <div>
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t("goals.analytics_title") || "Цілі у статистиці"}
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-500">
            {t("goals.analytics_subtitle") || "Виконані та в процесі"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completed goals (in period) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {t("goals.analytics_completed") || "Досягнуті за період"}
              </div>
              <p className="text-xs text-zinc-500">{completedInPeriod.length}</p>
            </div>
          </div>
          <div className="space-y-2">
            {completedInPeriod.length === 0 ? (
              <p className="text-xs text-zinc-500 py-2">{t("goals.analytics_none") || "Немає"}</p>
            ) : (
              completedInPeriod.map((goal) => (
                <GoalCard key={goal.id} goal={goal} isDone t={t} />
              ))
            )}
          </div>
        </div>

        {/* Active / uncompleted goals */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20">
              <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {t("goals.analytics_active") || "В процесі"}
              </div>
              <p className="text-xs text-zinc-500">{activeGoals.length}</p>
            </div>
          </div>
          <div className="space-y-2">
            {activeGoals.length === 0 ? (
              <p className="text-xs text-zinc-500 py-2">{t("goals.analytics_none") || "Немає"}</p>
            ) : (
              activeGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} isDone={false} t={t} />
              ))
            )}
          </div>
        </div>
      </div>

      {completedOther.length > 0 ? (
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-white/10">
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            {t("goals.analytics_completed_other") || "Досягнуті раніше"}
          </div>
          <div className="space-y-2">
            {completedOther.map((goal) => (
              <GoalCard key={goal.id} goal={goal} isDone t={t} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
