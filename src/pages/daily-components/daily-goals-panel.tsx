import { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { useParams } from "react-router";
import type { UniqueIdentifier } from "@dnd-kit/core";
import type { Goal } from "@/types/goal.model";
import type { Items } from "@/types/drag-and-drop.model";
import { useTranslation } from "react-i18next";
import { useGoalsStore } from "@/storage/goalsStore";
import { loadTemplateTasks } from "@/services/firebase/taskManagerData";
import { filterTaskByDayOfWeedk } from "@/services/task-menager/filter-tasks";

const PROGRESS_COLORS: Record<string, string> = {
  "goal-run": "bg-indigo-500/80",
  "goal-site": "bg-emerald-500/80",
};

function normalizeTitle(s: string): string {
  return s.trim().toLowerCase();
}

/** Build maps: taskId -> goalIds, taskTitle -> goalIds (for tasks with different ids) */
function buildTaskToGoalsMaps(templateTasks: Items): {
  byId: Map<UniqueIdentifier, UniqueIdentifier[]>;
  byTitle: Map<string, UniqueIdentifier[]>;
} {
  const byId = new Map<UniqueIdentifier, UniqueIdentifier[]>();
  const byTitle = new Map<string, UniqueIdentifier[]>();
  for (const cat of templateTasks) {
    for (const task of cat.tasks) {
      if (task.goalLinks?.length) {
        const goalIds = task.goalLinks.map((l) => l.goalId);
        byId.set(task.id, goalIds);
        byTitle.set(normalizeTitle(task.title), goalIds);
      }
    }
  }
  return { byId, byTitle };
}

/** Get goal IDs from tasks — uses task.goalLinks or maps by task id/title. */
function getGoalIdsFromItems(
  items: Items,
  maps: { byId: Map<UniqueIdentifier, UniqueIdentifier[]>; byTitle: Map<string, UniqueIdentifier[]> }
): Set<UniqueIdentifier> {
  const ids = new Set<UniqueIdentifier>();
  for (const cat of items) {
    for (const task of cat.tasks) {
      const fromTask = task.goalLinks;
      if (fromTask?.length) {
        fromTask.forEach((l) => ids.add(l.goalId));
      } else {
        const fromId = maps.byId.get(task.id);
        if (fromId?.length) {
          fromId.forEach((gId) => ids.add(gId));
        } else {
          maps.byTitle.get(normalizeTitle(task.title))?.forEach((gId) => ids.add(gId));
        }
      }
    }
  }
  return ids;
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
    PROGRESS_COLORS[String(goal.id)] ?? (isDone ? "bg-emerald-500/80" : "bg-indigo-500/80");
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
        </div>
      </div>
    </div>
  );
}

const DailyGoalsPanel = ({ dailyTasks }: { dailyTasks: Items }) => {
  const [t] = useTranslation();
  const { id: dateParam } = useParams();
  const [templateTasks, setTemplateTasks] = useState<Items>([]);
  const goals = useGoalsStore((s) => s.goals);

  useEffect(() => {
    loadTemplateTasks().then((data) => setTemplateTasks(data ?? []));
  }, []);

  const taskToGoalsMaps = buildTaskToGoalsMaps(templateTasks);

  const linkedGoalIds = (() => {
    const ids = getGoalIdsFromItems(dailyTasks, taskToGoalsMaps);
    if (templateTasks.length > 0 && dateParam) {
      const isoDate = dateParam.includes("-")
        ? dateParam
        : (() => {
            const [d, m, y] = dateParam.split(".");
            return y && m && d ? `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` : "";
          })();
      if (isoDate) {
        const { filteredTasks } = filterTaskByDayOfWeedk(templateTasks, isoDate);
        getGoalIdsFromItems(filteredTasks, taskToGoalsMaps).forEach((gId) => ids.add(gId));
      }
    }
    return ids;
  })();

  const relevantGoals = goals.filter(
    (g) => g.status === "active" && linkedGoalIds.has(g.id)
  );
  if (relevantGoals.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/80 dark:bg-white/3 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-200/80 dark:bg-black/20">
          <Flag
            className="h-5 w-5 text-zinc-700 dark:text-zinc-200"
            strokeWidth={1.5}
          />
        </div>
        <div>
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t("goals.title") || "Цілі на сьогодні"}
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-500">
            {t("goals.daily_linked") || "Цілі, до яких є задачі в плані"}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {relevantGoals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} isDone={false} t={t} />
        ))}
      </div>
    </div>
  );
};

export default DailyGoalsPanel;
