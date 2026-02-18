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
  const goalMap = new Map(goals.map((g) => [g.id, { ...g }]));
  const links = template.goalLinks ?? [];

  for (const link of links) {
    const goal = goalMap.get(link.goalId);
    if (!goal || goal.status !== "active") continue;

    if (instance.status === "done") {
      const delta = getImpactValue(link.impact, instance, template);
      goal.progress = Math.max(0, goal.progress + delta);
    } else if (instance.status === "skipped" && link.onMiss) {
      if (link.onMiss.type === "decrease" && link.onMiss.value != null) {
        goal.progress = Math.max(0, goal.progress - link.onMiss.value);
      }
    }
    goalMap.set(goal.id, goal);
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
