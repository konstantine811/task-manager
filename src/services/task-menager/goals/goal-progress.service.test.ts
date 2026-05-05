import { describe, expect, it } from "vitest";
import { computeGoalProgress, collectGoalIdsAffectedByTaskChange } from "./goal-progress.service";
import { Goal } from "@/types/progress.model";
import { ItemTask, Priority } from "@/types/drag-and-drop.model";

const makeTask = (
  id: string,
  overrides: Partial<ItemTask> = {},
): ItemTask => ({
  id,
  title: id,
  isDone: false,
  time: 3600,
  timeDone: 0,
  priority: Priority.MEDIUM,
  whenDo: [1],
  goalTaskLinks: [],
  ...overrides,
});

const baseGoal: Goal = {
  id: "goal-1",
  title: "Run consistency",
  unitType: "count",
  targetValue: 3,
  currentValue: 0,
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  period: "month",
  stages: [
    {
      id: "stage-a",
      title: "Warmup",
      order: 0,
      isActive: true,
      requiredCount: 2,
      linkedTemplateIds: [],
      links: [],
    },
    {
      id: "stage-b",
      title: "Long run",
      order: 1,
      isActive: true,
      requiredTimeSeconds: 3600,
      linkedTemplateIds: [],
      links: [],
    },
  ],
};

describe("computeGoalProgress", () => {
  it("combines metric and stages, reaches completion exactly once", () => {
    const goal = {
      ...baseGoal,
      targetValue: 2,
      stages: [
        {
          ...baseGoal.stages[0],
          links: [
            {
              goalId: "goal-1",
              stageId: "stage-a",
              taskId: "task-1",
              contributionType: "count",
              contributionValue: 1,
            },
            {
              goalId: "goal-1",
              stageId: "stage-a",
              taskId: "task-2",
              contributionType: "count",
              contributionValue: 1,
            },
          ],
        },
        {
          ...baseGoal.stages[1],
          links: [
            {
              goalId: "goal-1",
              stageId: "stage-b",
              taskId: "task-3",
              contributionType: "time",
              contributionValue: 1,
            },
          ],
        },
      ],
    } satisfies Goal;

    const tasks = [
      makeTask("task-1", { isDone: true }),
      makeTask("task-2", { isDone: true }),
      makeTask("task-3", { isDone: true, timeDone: 3600 }),
    ];
    const result = computeGoalProgress(goal, tasks);

    expect(result.goal.currentValue).toBe(2);
    expect(result.stageProgress.every((stage) => stage.isCompleted)).toBe(true);
    expect(result.goal.status).toBe("active");
    expect(result.reachedNow).toBe(true);
  });

  it("ignores inactive stages in progress computation", () => {
    const goal = {
      ...baseGoal,
      targetValue: 1,
      stages: [
        {
          id: "stage-inactive",
          title: "Inactive",
          order: 0,
          isActive: false,
          requiredCount: 1,
          linkedTemplateIds: [],
          links: [
            {
              goalId: "goal-1",
              stageId: "stage-inactive",
              taskId: "task-1",
              contributionType: "count",
              contributionValue: 1,
            },
          ],
        },
      ],
    } satisfies Goal;

    const result = computeGoalProgress(goal, [makeTask("task-1", { isDone: true })]);
    expect(result.goal.currentValue).toBe(0);
    expect(result.goal.status).toBe("active");
    expect(result.reachedNow).toBe(false);
  });

  it("handles over-completion and rollback after time edit", () => {
    const goal: Goal = {
      ...baseGoal,
      unitType: "time",
      targetValue: 7200,
      currentValue: 0,
      stages: [
        {
          id: "stage-time",
          title: "Time stage",
          order: 0,
          isActive: true,
          requiredTimeSeconds: 7200,
          linkedTemplateIds: [],
          links: [
            {
              goalId: "goal-1",
              stageId: "stage-time",
              taskId: "task-1",
              contributionType: "time",
              contributionValue: 1,
            },
          ],
        },
      ],
    };

    const completed = computeGoalProgress(goal, [
      makeTask("task-1", { isDone: true, timeDone: 10800 }),
    ]);
    expect(completed.goal.currentValue).toBe(10800);
    expect(completed.goal.status).toBe("active");

    const rollback = computeGoalProgress(
      { ...completed.goal, status: "active", completedAt: undefined },
      [makeTask("task-1", { isDone: true, timeDone: 1800 })],
    );
    expect(rollback.goal.currentValue).toBe(1800);
    expect(rollback.goal.status).toBe("active");
    expect(rollback.goal.completedAt).toBeUndefined();
    expect(rollback.reachedNow).toBe(false);
  });

  it("counts one completed repetition link as one done instance", () => {
    const goal: Goal = {
      ...baseGoal,
      unitType: "time",
      targetValue: 7200,
      stages: [
        {
          id: "stage-count-time",
          title: "Two runs",
          order: 0,
          isActive: true,
          requiredCount: 2,
          requiredTimeSeconds: 7200,
          linkedTemplateIds: [],
          links: [
            {
              goalId: "goal-1",
              stageId: "stage-count-time",
              taskId: "task-1",
              contributionType: "count",
              contributionValue: 2,
            },
          ],
        },
      ],
    };

    const result = computeGoalProgress(goal, [
      makeTask("task-1", { isDone: true, time: 3600 }),
    ]);

    expect(result.stageProgress[0].currentCount).toBe(1);
    expect(result.stageProgress[0].currentTimeSeconds).toBe(3600);
    expect(result.goal.currentValue).toBe(3600);
    expect(result.goal.status).toBe("active");
  });

  it("does not complete a count goal from a single task when six repetitions are required", () => {
    const goal: Goal = {
      ...baseGoal,
      targetValue: 6,
      stages: [
        {
          id: "stage-cleaning",
          title: "Six cleanups",
          order: 0,
          isActive: true,
          requiredCount: 6,
          linkedTemplateIds: [],
          links: [
            {
              goalId: "goal-1",
              stageId: "stage-cleaning",
              taskId: "task-1",
              contributionType: "count",
              contributionValue: 6,
            },
          ],
        },
      ],
    };

    const result = computeGoalProgress(goal, [
      makeTask("task-1", { isDone: true }),
    ]);

    expect(result.stageProgress[0].currentCount).toBe(1);
    expect(result.goal.currentValue).toBe(1);
    expect(result.goal.status).toBe("active");
    expect(result.goal.completedAt).toBeUndefined();
  });

  it("counts repeated daily instances with the same template task id", () => {
    const goal: Goal = {
      ...baseGoal,
      targetValue: 6,
      stages: [
        {
          id: "stage-cleaning",
          title: "Six cleanups",
          order: 0,
          isActive: true,
          requiredCount: 6,
          linkedTemplateIds: [],
          links: [
            {
              goalId: "goal-1",
              stageId: "stage-cleaning",
              templateTaskId: "task-1",
              contributionType: "count",
              contributionValue: 6,
            },
          ],
        },
      ],
    };

    const result = computeGoalProgress(goal, [
      makeTask("task-1", { isDone: true }),
      makeTask("task-1", { isDone: true }),
    ]);

    expect(result.stageProgress[0].currentCount).toBe(2);
    expect(result.goal.currentValue).toBe(2);
    expect(result.goal.status).toBe("active");
  });

  it("does not multiply repeated task links across daily instances", () => {
    const link = {
      goalId: "goal-1",
      stageId: "stage-cleaning",
      templateTaskId: "task-1",
      contributionType: "count" as const,
      contributionValue: 6,
    };
    const goal: Goal = {
      ...baseGoal,
      targetValue: 6,
      stages: [
        {
          id: "stage-cleaning",
          title: "Six cleanups",
          order: 0,
          isActive: true,
          requiredCount: 6,
          linkedTemplateIds: [],
          links: [],
        },
      ],
    };

    const beforeTodayDone = computeGoalProgress(goal, [
      makeTask("task-1", { isDone: true, goalTaskLinks: [link] }),
      makeTask("task-1", { isDone: false, goalTaskLinks: [link] }),
    ]);

    expect(beforeTodayDone.stageProgress[0].currentCount).toBe(1);
    expect(beforeTodayDone.goal.currentValue).toBe(1);

    const afterTodayDone = computeGoalProgress(goal, [
      makeTask("task-1", { isDone: true, goalTaskLinks: [link] }),
      makeTask("task-1", { isDone: true, goalTaskLinks: [link] }),
    ]);

    expect(afterTodayDone.stageProgress[0].currentCount).toBe(2);
    expect(afterTodayDone.goal.currentValue).toBe(2);
  });

  it("collectGoalIdsAffectedByTaskChange includes goals linked only on the goal stage, not on task.goalTaskLinks", () => {
    const goal: Goal = {
      ...baseGoal,
      id: "goal-stage-only",
      stages: [
        {
          id: "stage-1",
          title: "Run",
          order: 0,
          isActive: true,
          requiredCount: 2,
          linkedTemplateIds: [],
          links: [],
          linkedTaskIds: ["run-task"],
        },
      ],
    };
    const task = makeTask("run-task", { goalTaskLinks: [] });
    const ids = collectGoalIdsAffectedByTaskChange(null, task, [goal]);
    expect(ids).toContain("goal-stage-only");
  });
});
