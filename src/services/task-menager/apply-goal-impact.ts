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
    if (!goal || (goal.status !== "active" && goal.status !== "paused")) continue;

    const oldProgress = goal.progress ?? 0;

    if (instance.status === "done") {
      const impactType = (link.impact as { type?: string })?.type;
      let delta = getImpactValue(link.impact, instance, template);
      if (impactType === "count" || !impactType) delta = Math.min(delta, 1);
      goal.progress = Math.max(0, oldProgress + delta);
    } else if (instance.status === "todo") {
      const impactType = (link.impact as { type?: string })?.type;
      let delta = getImpactValue(link.impact, instance, template);
      if (impactType === "count" || !impactType) delta = Math.min(delta, 1);
      goal.progress = Math.max(0, oldProgress - delta);
    } else if (instance.status === "skipped" && link.onMiss?.type === "decrease" && link.onMiss.value != null) {
      goal.progress = Math.max(0, goal.progress - link.onMiss.value);
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
  if (!impact || (impact as { type?: string }).type === undefined) {
    return instance.status === "done" ? 1 : 0;
  }
  switch (impact.type) {
    case "count":
      return impact.value ?? 1;
    case "minutes":
      return impact.valueMode === "done"
        ? instance.timeDone
        : (instance.overrideTimePlanned ?? template.timePlanned);
    case "score":
      return impact.value ?? 1;
    case "streak":
      return 1;
    default:
      return instance.status === "done" ? 1 : 0;
  }
}
