import type { UniqueIdentifier } from "@dnd-kit/core";
import type { Items, ItemTask, TaskGoalLink } from "@/types/drag-and-drop.model";
import type { Goal } from "@/types/goal.model";

function normalizeTitle(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getGoalLinksFromTemplate(
  taskId: UniqueIdentifier,
  taskTitle: string,
  templateItems: Items
): TaskGoalLink[] | undefined {
  for (const cat of templateItems) {
    const byId = cat.tasks.find((x) => x.id === taskId);
    if (byId?.goalLinks?.length) return byId.goalLinks;
  }
  const titleNorm = normalizeTitle(taskTitle);
  for (const cat of templateItems) {
    const byTitle = cat.tasks.find((x) => normalizeTitle(x.title) === titleNorm);
    if (byTitle?.goalLinks?.length) return byTitle.goalLinks;
  }
  return undefined;
}

/** Fallback: find goalLinks by scanning template for any task with same title (for active goals) */
function getGoalLinksFromGoalsFallback(
  taskTitle: string,
  templateItems: Items,
  goals: Goal[]
): TaskGoalLink[] | undefined {
  const titleNorm = normalizeTitle(taskTitle);
  const activeGoalIds = new Set(
    goals.filter((g) => g.status === "active").map((g) => String(g.id))
  );
  for (const cat of templateItems) {
    for (const t of cat.tasks) {
      const tTitleNorm = normalizeTitle(t.title);
      if (tTitleNorm !== titleNorm || !t.goalLinks?.length) continue;
      const filtered = t.goalLinks.filter((l) => activeGoalIds.has(String(l.goalId)));
      if (filtered.length > 0) return filtered;
    }
  }
  return undefined;
}

/** Semantic fallback: goals "do X once" — goal title contains task title, metric count target 1 */
function getSemanticGoalLinks(taskTitle: string, goals: Goal[]): TaskGoalLink[] {
  const titleNorm = normalizeTitle(taskTitle);
  if (!titleNorm || titleNorm.length < 2) return [];
  const result: TaskGoalLink[] = [];
  for (const g of goals) {
    if (g.status !== "active") continue;
    const metric = g.metric as { type?: string; target?: number } | undefined;
    if (metric?.type !== "count" || metric?.target !== 1) continue;
    const goalTitleNorm = normalizeTitle(g.title ?? "");
    if (goalTitleNorm.includes(titleNorm) || titleNorm.includes(goalTitleNorm)) {
      result.push({ goalId: g.id, impact: { type: "count", value: 1 } });
    }
  }
  return result;
}

function filterAndEnrichGoalLinks(
  task: ItemTask,
  templateItems: Items,
  goals: Goal[],
  initialLinks: TaskGoalLink[] | undefined
): TaskGoalLink[] {
  let goalLinks = initialLinks;

  if (!goalLinks) {
    goalLinks = getGoalLinksFromTemplate(task.id, task.title, templateItems);
  }
  if (!goalLinks?.length && templateItems.length > 0) {
    goalLinks = getGoalLinksFromGoalsFallback(task.title, templateItems, goals);
  }

  const existingGoalIds = new Set(goals.map((g) => String(g.id)));
  let filteredByExisting =
    goalLinks?.filter((l) => existingGoalIds.has(String(l.goalId))) ?? [];
  if (!filteredByExisting.length) {
    const fromTemplate = getGoalLinksFromTemplate(task.id, task.title, templateItems);
    if (fromTemplate?.length) {
      filteredByExisting = fromTemplate.filter((l) =>
        existingGoalIds.has(String(l.goalId))
      );
    }
  }
  goalLinks = filteredByExisting.length ? filteredByExisting : goalLinks;

  const semanticLinks = getSemanticGoalLinks(task.title, goals);
  if (semanticLinks.length) {
    const seen = new Set((goalLinks ?? []).map((l) => String(l.goalId)));
    for (const l of semanticLinks) {
      if (!seen.has(String(l.goalId))) {
        seen.add(String(l.goalId));
        goalLinks = [...(goalLinks ?? []), l];
      }
    }
  }

  const validLinks =
    goalLinks?.filter((l) => {
      const g = goals.find((x) => String(x.id) === String(l.goalId));
      if (!g) return false;
      const target =
        g.metric?.type === "count" ||
        g.metric?.type === "minutes" ||
        g.metric?.type === "streak" ||
        g.metric?.type === "score"
          ? g.metric.target ?? 0
          : 0;
      const effectiveTarget = Math.max(1, target);
      const progress = g.progress ?? 0;
      return (
        g.status === "active" ||
        g.status === "paused" ||
        (g.status === "done" && progress < effectiveTarget)
      );
    }) ?? [];

  return validLinks;
}

export function resolveGoalLinksForTaskDone(params: {
  task: ItemTask;
  templateItems: Items;
  goals: Goal[];
  lastEnrichedItems: Items | null;
}): TaskGoalLink[] {
  const { task, templateItems, goals, lastEnrichedItems } = params;

  let goalLinks: TaskGoalLink[] | undefined;

  if (lastEnrichedItems) {
    for (const cat of lastEnrichedItems) {
      const t =
        cat.tasks.find((x) => x.id === task.id) ??
        cat.tasks.find((x) => normalizeTitle(x.title) === normalizeTitle(task.title));
      if (t?.goalLinks?.length) {
        goalLinks = t.goalLinks;
        break;
      }
    }
  }

  goalLinks = goalLinks ?? task.goalLinks;

  return filterAndEnrichGoalLinks(task, templateItems, goals, goalLinks);
}

export function resolveGoalLinksForTaskUndone(params: {
  task: ItemTask;
  templateItems: Items;
  goals: Goal[];
  lastEnrichedItems: Items | null;
}): TaskGoalLink[] {
  const { task, templateItems, goals, lastEnrichedItems } = params;

  let goalLinks: TaskGoalLink[] | undefined =
    task.goalLinks ?? getGoalLinksFromTemplate(task.id, task.title, templateItems);

  if (!goalLinks?.length && lastEnrichedItems) {
    for (const cat of lastEnrichedItems) {
      let t = cat.tasks.find((x) => x.id === task.id);
      if (!t) {
        t = cat.tasks.find(
          (x) => normalizeTitle(x.title) === normalizeTitle(task.title)
        );
      }
      if (t?.goalLinks?.length) {
        goalLinks = t.goalLinks;
        break;
      }
    }
  }

  return filterAndEnrichGoalLinks(task, templateItems, goals, goalLinks);
}