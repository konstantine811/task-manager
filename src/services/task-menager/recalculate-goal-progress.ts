import type { UniqueIdentifier } from "@dnd-kit/core";
import type { Goal } from "@/types/goal.model";
import type { Items } from "@/types/drag-and-drop.model";
import type { GoalLink } from "@/types/task-template.model";
import { fetchAllDailyTasks } from "@/services/firebase/taskManagerData";

function getImpactValue(
  impact: GoalLink["impact"],
  timeDone: number,
  timePlanned: number
): number {
  switch (impact.type) {
    case "count":
      return impact.value;
    case "minutes":
      return impact.valueMode === "done" ? timeDone : timePlanned;
    case "score":
      return impact.value;
    case "streak":
      return 1;
    default:
      return 0;
  }
}

/**
 * Compute correct progress for each goal from done tasks in daily records.
 * Only uses goalLinks saved in the daily record — not template fallback.
 * Otherwise historical completions would wrongly count toward newly linked goals.
 */
function computeProgressFromRecords(
  goals: Goal[],
  dailyRecords: Array<{ date: string; items: Items }>
): Map<UniqueIdentifier, number> {
  const progressByGoal = new Map<UniqueIdentifier, number>();

  for (const goal of goals) {
    if (goal.status !== "active") continue;
    progressByGoal.set(goal.id, 0);
  }

  const countedTaskDates = new Set<string>();

  for (const { date, items } of dailyRecords) {
    for (const cat of items) {
      for (const task of cat.tasks) {
        if (!task.isDone) continue;
        if (!task.goalLinks?.length) continue;

        const key = `${date}-${task.id}`;
        if (countedTaskDates.has(key)) continue;
        countedTaskDates.add(key);

        const timeDone = task.timeDone ?? task.time ?? 0;
        const timePlanned = task.time ?? 0;

        const seenGoals = new Set<UniqueIdentifier>();
        for (const link of task.goalLinks) {
          const goalId = link.goalId;
          if (!progressByGoal.has(goalId) || seenGoals.has(goalId)) continue;
          seenGoals.add(goalId);

          const delta = getImpactValue(link.impact, timeDone, timePlanned);
          progressByGoal.set(goalId, (progressByGoal.get(goalId) ?? 0) + delta);
        }
      }
    }
  }

  return progressByGoal;
}

/**
 * Recalculate goal progress from Firebase daily task data (source of truth).
 * Updates the goals store with correct progress values.
 */
export async function recalculateGoalProgress(
  getGoals: () => Goal[],
  setGoals: (goals: Goal[]) => void
): Promise<void> {
  const dailyRecords = await fetchAllDailyTasks();
  const goals = getGoals();
  if (!goals.length) return;

  const progressByGoal = computeProgressFromRecords(goals, dailyRecords);

  const updated = goals.map((g) => ({
    ...g,
    progress: Math.max(0, progressByGoal.get(g.id) ?? 0),
  }));

  setGoals(updated);
}
