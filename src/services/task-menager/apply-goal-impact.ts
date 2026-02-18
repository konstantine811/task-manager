import type { Goal } from "@/types/goal.model";
import type { TaskInstance } from "@/types/task-instance.model";
import type { GoalLink, TaskTemplate } from "@/types/task-template.model";

/**
 * Apply task instance completion/miss to linked goals.
 * Returns updated goals (does not mutate).
 */
export function applyGoalImpact(
  instance: TaskInstance,
  template: TaskTemplate,
  goals: Goal[]
): Goal[] {
  const goalMap = new Map<string, Goal>(
    goals.map((g) => [String(g.id), { ...g }])
  );
  const links = template.goalLinks ?? [];

  const seenGoals = new Set<string>();
  for (const link of links) {
    const goalKey = String(link.goalId);
    if (seenGoals.has(goalKey)) continue;
    seenGoals.add(goalKey);
    const goal = goalMap.get(goalKey);
    if (!goal || goal.status !== "active") continue;

    if (instance.status === "done") {
      let delta = getImpactValue(link.impact, instance, template);
      if (link.impact.type === "count") delta = Math.min(delta, 1);
      goal.progress = Math.max(0, (goal.progress ?? 0) + delta);
    } else if (instance.status === "todo") {
      /* task was unchecked — subtract impact */
      let delta = getImpactValue(link.impact, instance, template);
      if (link.impact.type === "count") delta = Math.min(delta, 1);
      goal.progress = Math.max(0, (goal.progress ?? 0) - delta);
    } else if (instance.status === "skipped" && link.onMiss) {
      if (link.onMiss.type === "decrease" && link.onMiss.value != null) {
        goal.progress = Math.max(0, goal.progress - link.onMiss.value);
      }
    }
    goalMap.set(String(goal.id), goal);
  }

  return Array.from(goalMap.values());
}

function getImpactValue(
  impact: GoalLink["impact"],
  instance: TaskInstance,
  template: TaskTemplate
): number {
  switch (impact.type) {
    case "count":
      return impact.value;
    case "minutes":
      return impact.valueMode === "done"
        ? instance.timeDone
        : (instance.overrideTimePlanned ?? template.timePlanned);
    case "score":
      return impact.value;
    case "streak":
      return 1;
    default:
      return 0;
  }
}
