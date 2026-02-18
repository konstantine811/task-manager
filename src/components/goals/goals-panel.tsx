import { Flag, Calendar, Route, Plus, TrendingUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { UniqueIdentifier } from "@dnd-kit/core";
import type { Goal } from "@/types/goal.model";
import { useTranslation } from "react-i18next";
import { useGoalsStore } from "@/storage/goalsStore";

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getGoalTarget(goal: Goal): number {
  if (goal.metric.type === "count") return goal.metric.target;
  if (goal.metric.type === "minutes") return goal.metric.target;
  if (goal.metric.type === "streak") return goal.metric.target;
  if (goal.metric.type === "score") return goal.metric.target;
  return 0;
}

const PROGRESS_COLORS: Record<string, string> = {
  "goal-run": "bg-indigo-500/80 shadow-[0_10px_30px_rgba(99,102,241,0.25)]",
  "goal-site": "bg-emerald-500/80 shadow-[0_10px_30px_rgba(16,185,129,0.2)]",
};

export function GoalsPanel() {
  const [t] = useTranslation();
  const goals = useGoalsStore((s) => s.goals);
  const toggleSubtask = useGoalsStore((s) => s.toggleSubtask);
  const addSubtask = useGoalsStore((s) => s.addSubtask);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-200 dark:bg-black/20">
              <Flag className="h-5 w-5 text-zinc-700 dark:text-zinc-200" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {t("goals.title") || "Великі цілі"}
              </div>
              <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-500">
                {t("goals.description") || "Довготривала ціль → підзадачі на день → прогрес"}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {goals
              .filter((g) => g.status === "active")
              .map((goal) => {
                const target = getGoalTarget(goal);
                const progress = goal.progress ?? 0;
                const pct = target > 0 ? Math.round((progress / target) * 100) : 0;
                const progressColor = PROGRESS_COLORS[goal.id] ?? "bg-indigo-500/80";

                return (
                  <div
                    key={goal.id}
                    className="rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-black/20 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          {goal.title}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                            {goal.description}
                          </span>
                          <span className="text-zinc-700">•</span>
                          <span className="inline-flex items-center gap-1">
                            <Route className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                            {goal.metric.type === "count" && (
                              <>План: {target} {goal.metric.unit ?? "кроків"}</>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs text-zinc-500">
                          {t("goals.progress") || "Прогрес"}
                        </div>
                        <div className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-zinc-100">
                          {pct}%
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/5 ring-1 ring-zinc-300/80 dark:ring-white/10">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs font-mono text-zinc-600 dark:text-zinc-500">
                        <span>
                          {progress}/{target} {t("goals.steps") || "кроків"}
                        </span>
                        <span className="text-zinc-600 dark:text-zinc-600">
                          {t("goals.today") || "сьогодні"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 rounded-md border border-zinc-200 dark:border-white/10 bg-zinc-100/80 dark:bg-white/[0.03] p-2">
                      <div className="flex items-center justify-between px-1">
                        <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          {t("goals.subtasks_today") || "Підзадачі на сьогодні"}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            addSubtask(
                              goal.id as UniqueIdentifier,
                              t("goals.new_subtask") || "Нова підзадача",
                              15
                            )
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
                        >
                          <Plus className="h-4 w-4" strokeWidth={1.5} />
                          {t("goals.add") || "Додати"}
                        </button>
                      </div>
                      <div className="mt-2 space-y-px">
                        {(goal.subGoals ?? [])
                          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                          .map((sub, idx) => (
                            <label
                              key={sub.id}
                              className="group flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-2 transition-all hover:border-zinc-200 dark:hover:border-white/5 hover:bg-zinc-200/50 dark:hover:bg-white/[0.03]"
                            >
                              <div className="w-6 shrink-0 text-center text-xs font-mono text-zinc-600 dark:text-zinc-600">
                                {String.fromCharCode(65 + Math.floor(idx / 10))}
                                {idx % 10}
                              </div>
                              <Checkbox
                                checked={sub.isDone ?? false}
                                onCheckedChange={() =>
                                  toggleSubtask(goal.id as UniqueIdentifier, sub.id as UniqueIdentifier)
                                }
                                className="border-zinc-300 dark:border-white/20 bg-zinc-200 dark:bg-white/5 data-[state=checked]:border-indigo-500 data-[state=checked]:bg-indigo-500"
                              />
                              <span className="min-w-0 flex-1 text-sm text-zinc-700 dark:text-zinc-300">
                                {sub.title}
                              </span>
                              <div className="shrink-0 rounded border border-zinc-300/80 dark:border-white/5 bg-zinc-200 dark:bg-zinc-900/50 px-2 py-1 font-mono text-xs text-zinc-600 dark:text-zinc-500">
                                {sub.timePlanned != null
                                  ? formatDuration(sub.timePlanned)
                                  : "—"}
                              </div>
                            </label>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        <div className="hidden shrink-0 sm:flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-200 dark:bg-black/20">
          <TrendingUp className="h-5 w-5 text-zinc-700 dark:text-zinc-200" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
