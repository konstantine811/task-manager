import { describe, expect, it } from "vitest";
import { Goal } from "@/types/progress.model";
import { ItemTask, Priority } from "@/types/drag-and-drop.model";
import { computeGoalProgress } from "./goal-progress.service";
import { getCompletedGoalsInRange } from "@/pages/analytics-comonents/goals-completed-list";

const taskWithLink: ItemTask = {
  id: "task-1",
  title: "Run",
  isDone: true,
  time: 3600,
  timeDone: 3600,
  priority: Priority.HIGH,
  whenDo: [1],
  goalTaskLinks: [
    {
      goalId: "goal-1",
      stageId: "stage-1",
      taskId: "task-1",
      contributionType: "count",
      contributionValue: 1,
    },
  ],
};

describe("goal integration scenarios", () => {
  it("create goal -> link task -> complete goal", () => {
    const goal: Goal = {
      id: "goal-1",
      title: "3 runs",
      unitType: "count",
      targetValue: 1,
      currentValue: 0,
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
      period: "month",
      stages: [
        {
          id: "stage-1",
          title: "Stage",
          order: 0,
          isActive: true,
          requiredCount: 1,
          linkedTemplateIds: ["task-1"],
          links: [],
        },
      ],
    };
    const result = computeGoalProgress(goal, [taskWithLink]);
    expect(result.goal.status).toBe("active");
    expect(result.reachedNow).toBe(true);
    expect(result.impactedTaskIds).toContain("task-1");
  });

  it("completed goals sorting supports oldest/newest", () => {
    const goals: Goal[] = [
      {
        id: "goal-old",
        title: "Old",
        unitType: "count",
        targetValue: 1,
        currentValue: 1,
        status: "completed",
        createdAt: "2026-01-01T00:00:00.000Z",
        completedAt: "2026-01-05T00:00:00.000Z",
        period: "month",
        stages: [],
      },
      {
        id: "goal-new",
        title: "New",
        unitType: "count",
        targetValue: 1,
        currentValue: 1,
        status: "completed",
        createdAt: "2026-01-02T00:00:00.000Z",
        completedAt: "2026-01-07T00:00:00.000Z",
        period: "month",
        stages: [],
      },
    ];

    const oldest = getCompletedGoalsInRange(
      goals,
      new Date("2026-01-01"),
      new Date("2026-01-31"),
      "oldest_first",
    );
    expect(oldest.map((goal) => goal.id)).toEqual(["goal-old", "goal-new"]);

    const newest = getCompletedGoalsInRange(
      goals,
      new Date("2026-01-01"),
      new Date("2026-01-31"),
      "newest_first",
    );
    expect(newest.map((goal) => goal.id)).toEqual(["goal-new", "goal-old"]);
  });
});
