import { ItemTask } from "@/types/drag-and-drop.model";
import {
  Goal,
  GoalContributionType,
  GoalStage,
  GoalTaskLink,
} from "@/types/progress.model";

export interface GoalStageProgress {
  stageId: string;
  title: string;
  isActive: boolean;
  currentCount: number;
  currentTimeSeconds: number;
  currentDistance: number;
  requiredCount?: number;
  requiredTimeSeconds?: number;
  requiredDistance?: number;
  isCompleted: boolean;
}

export interface GoalProgressComputation {
  goal: Goal;
  reachedNow: boolean;
  stageProgress: GoalStageProgress[];
  impactedTaskIds: string[];
}

const clampProgressValue = (value: number): number =>
  Number.isFinite(value) && value > 0 ? value : 0;

const getTaskContributionBase = (
  task: ItemTask,
  contributionType: GoalContributionType,
): number => {
  if (contributionType === "count") {
    return task.isDone ? 1 : 0;
  }
  if (contributionType === "time") {
    return clampProgressValue(task.timeDone);
  }
  // Distance can be stored directly in contributionValue.
  return task.isDone ? 1 : 0;
};

const getLinkContributionValue = (link: GoalTaskLink): number =>
  clampProgressValue(link.contributionValue) || 1;

const buildImplicitStageLink = (
  stage: GoalStage,
  goalId: string,
  taskId: string,
): GoalTaskLink => ({
  goalId,
  stageId: stage.id,
  taskId,
  contributionType: "count",
  contributionValue: 1,
});

const buildGoalTaskLinks = (goal: Goal, tasks: ItemTask[]): GoalTaskLink[] => {
  const linksFromGoal = goal.stages.flatMap((stage) => {
    const explicit = stage.links ?? [];
    const implicit =
      stage.linkedTaskIds?.map((taskId) =>
        buildImplicitStageLink(stage, goal.id, taskId),
      ) ?? [];
    return [...explicit, ...implicit];
  });

  const linksFromTasks = tasks.flatMap((task) =>
    (task.goalTaskLinks ?? []).filter((link) => link.goalId === goal.id),
  );

  const linkByKey = new Map<string, GoalTaskLink>();
  [...linksFromGoal, ...linksFromTasks].forEach((link) => {
    const taskKey = String(link.taskId ?? link.templateTaskId ?? "");
    const key = [
      link.goalId,
      link.stageId,
      taskKey,
      link.contributionType,
      link.contributionValue,
    ].join(":");
    if (!linkByKey.has(key)) {
      linkByKey.set(key, link);
    }
  });

  return Array.from(linkByKey.values());
};

/** Goals whose progress can change when this task changes (task links + stage / template links on goals). */
export const collectGoalIdsAffectedByTaskChange = (
  taskBefore: ItemTask | null,
  taskAfter: ItemTask | null,
  goals: Goal[],
): string[] => {
  const ids = new Set<string>();
  const addForTask = (task: ItemTask | null) => {
    if (!task) return;
    (task.goalTaskLinks ?? []).forEach((l) => {
      ids.add(l.goalId);
    });
    const key = String(task.id);
    if (!key) return;
    for (const goal of goals) {
      const links = buildGoalTaskLinks(goal, [task]);
      if (
        links.some(
          (link) => String(link.taskId ?? link.templateTaskId ?? "") === key,
        )
      ) {
        ids.add(goal.id);
      }
    }
  };
  addForTask(taskBefore);
  addForTask(taskAfter);
  return Array.from(ids);
};

const isStageRequirementMet = (
  stage: GoalStage,
  currentCount: number,
  currentTimeSeconds: number,
  currentDistance: number,
): boolean => {
  const checks: boolean[] = [];
  if (typeof stage.requiredCount === "number") {
    checks.push(currentCount >= stage.requiredCount);
  }
  if (typeof stage.requiredTimeSeconds === "number") {
    checks.push(currentTimeSeconds >= stage.requiredTimeSeconds);
  }
  if (typeof stage.requiredDistance === "number") {
    checks.push(currentDistance >= stage.requiredDistance);
  }
  if (checks.length === 0) return true;
  return checks.every(Boolean);
};

export const computeGoalProgress = (
  goal: Goal,
  tasks: ItemTask[],
): GoalProgressComputation => {
  const tasksById = tasks.reduce((acc, task) => {
    const key = String(task.id);
    const group = acc.get(key) ?? [];
    group.push(task);
    acc.set(key, group);
    return acc;
  }, new Map<string, ItemTask[]>());
  const stageMap = new Map(goal.stages.map((stage) => [stage.id, stage]));
  const links = buildGoalTaskLinks(goal, tasks).filter((link) => {
    const stage = stageMap.get(link.stageId);
    return stage ? stage.isActive : true;
  });

  const stageProgressMap = new Map<
    string,
    { count: number; timeSeconds: number; distance: number; taskIds: Set<string> }
  >();

  links.forEach((link) => {
    const taskId = String(link.taskId ?? link.templateTaskId ?? "");
    const linkedTasks = tasksById.get(taskId) ?? [];
    if (linkedTasks.length === 0) return;
    const stage = stageMap.get(link.stageId);
    if (!stage || !stage.isActive) return;

    const acc = stageProgressMap.get(link.stageId) ?? {
      count: 0,
      timeSeconds: 0,
      distance: 0,
      taskIds: new Set<string>(),
    };

    linkedTasks.forEach((task) => {
      const contributionValue = getLinkContributionValue(link);
      const scaled = getTaskContributionBase(task, link.contributionType);
      if (link.contributionType === "count") {
        const completedCount = scaled;
        acc.count += completedCount;
        acc.timeSeconds += completedCount * clampProgressValue(task.time);
      } else if (link.contributionType === "time") {
        acc.timeSeconds += scaled;
      } else {
        acc.distance += scaled * contributionValue;
      }
    });
    acc.taskIds.add(taskId);
    stageProgressMap.set(link.stageId, acc);
  });

  const stageProgress: GoalStageProgress[] = goal.stages
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((stage) => {
      const current = stageProgressMap.get(stage.id) ?? {
        count: 0,
        timeSeconds: 0,
        distance: 0,
      };
      return {
        stageId: stage.id,
        title: stage.title,
        isActive: stage.isActive,
        currentCount: current.count,
        currentTimeSeconds: current.timeSeconds,
        currentDistance: current.distance,
        requiredCount: stage.requiredCount,
        requiredTimeSeconds: stage.requiredTimeSeconds,
        requiredDistance: stage.requiredDistance,
        isCompleted: isStageRequirementMet(
          stage,
          current.count,
          current.timeSeconds,
          current.distance,
        ),
      };
    });

  const currentValueByUnit = stageProgress.reduce(
    (acc, stage) => {
      if (!stage.isActive) return acc;
      acc.count += stage.currentCount;
      acc.time += stage.currentTimeSeconds;
      acc.distance += stage.currentDistance;
      return acc;
    },
    { count: 0, time: 0, distance: 0 },
  );

  const nextCurrentValue =
    goal.unitType === "time"
      ? currentValueByUnit.time
      : goal.unitType === "distance"
        ? currentValueByUnit.distance
        : currentValueByUnit.count;

  const activeStages = stageProgress.filter((stage) => stage.isActive);
  const allActiveStagesCompleted = activeStages.every((stage) => stage.isCompleted);
  const wasAlreadyAtTarget =
    goal.status === "completed" ||
    (goal.currentValue >= clampProgressValue(goal.targetValue) &&
      goal.currentValue > 0);
  const isCompletedNow =
    nextCurrentValue >= clampProgressValue(goal.targetValue) &&
    allActiveStagesCompleted;

  const impactedTaskIds = new Set<string>();
  stageProgressMap.forEach((value) => {
    value.taskIds.forEach((taskId) => impactedTaskIds.add(taskId));
  });

  const updatedGoal: Goal = {
    ...goal,
    currentValue: nextCurrentValue,
  };

  return {
    goal: updatedGoal,
    reachedNow: !wasAlreadyAtTarget && isCompletedNow,
    stageProgress,
    impactedTaskIds: Array.from(impactedTaskIds),
  };
};
