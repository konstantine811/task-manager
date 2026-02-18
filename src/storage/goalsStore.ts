import type { UniqueIdentifier } from "@dnd-kit/core";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyGoalImpact } from "@/services/task-menager/apply-goal-impact";
import type { Goal } from "@/types/goal.model";
import type { TaskInstance } from "@/types/task-instance.model";
import type { TaskGoalLink } from "@/types/drag-and-drop.model";
import type { TaskTemplate } from "@/types/task-template.model";

const GOALS_STORAGE_KEY = "chrono-goals";

function getDefaultGoals(): Goal[] {
  return [
    {
      id: "goal-run",
      title: "Підготуватися до напівмарафону",
      description: "6 тижнів тренувань",
      metric: { type: "count", target: 18, unit: "тренувань" },
      progress: 0,
      status: "active",
      subGoals: [
        { id: "sg-run-1", title: "Легкий біг 20 хв", timePlanned: 20, isDone: false, order: 0 },
        { id: "sg-run-2", title: "Розтяжка 10 хв", timePlanned: 10, isDone: false, order: 1 },
        { id: "sg-run-3", title: "Вода + відновлення", timePlanned: 5, isDone: false, order: 2 },
      ],
    },
    {
      id: "goal-site",
      title: "Запустити портфоліо-сайт",
      description: "2 тижні, 10 етапів",
      metric: { type: "count", target: 10, unit: "етапів" },
      progress: 0,
      status: "active",
      subGoals: [
        { id: "sg-site-1", title: "Скелет сторінок (Home/Projects)", timePlanned: 40, isDone: false, order: 0 },
        { id: "sg-site-2", title: "Опис 1 проєкту", timePlanned: 20, isDone: false, order: 1 },
      ],
    },
  ];
}

function taskGoalLinkToGoalLink(
  link: TaskGoalLink
): import("@/types/task-template.model").GoalLink {
  return {
    goalId: link.goalId,
    impact: link.impact,
    onMiss: link.onMiss,
  };
}

interface GoalsState {
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  /** Застосувати виконання задачі до звʼязаних цілей */
  applyTaskDone: (
    taskId: UniqueIdentifier,
    date: string,
    task: {
      title: string;
      time: number;
      timeDone: number;
      goalLinks?: TaskGoalLink[];
    }
  ) => void;
  toggleSubtask: (goalId: UniqueIdentifier, subtaskId: UniqueIdentifier) => void;
  addSubtask: (goalId: UniqueIdentifier, title?: string, timePlanned?: number) => void;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      goals: getDefaultGoals(),
      setGoals: (goals) => set({ goals }),

      applyTaskDone: (taskId, date, task) => {
        const links = task.goalLinks;
        if (!links || links.length === 0) return;

        set((state) => {
          const instance: TaskInstance = {
            id: taskId,
            templateId: taskId,
            date,
            status: "done",
            timeDone: task.timeDone ?? 0,
          };
          const template: TaskTemplate = {
            id: taskId,
            title: task.title,
            timePlanned: task.time,
            priority: "medium" as import("@/types/drag-and-drop.model").Priority,
            schedule: { type: "weekdays", days: [1, 2, 3, 4, 5, 6, 7] },
            goalLinks: links.map(taskGoalLinkToGoalLink),
          };
          const updated = applyGoalImpact(instance, template, state.goals);
          return { goals: updated };
        });
      },

      toggleSubtask: (goalId, subtaskId) => {
        set((state) => {
          const next = state.goals.map((g) => {
            if (g.id !== goalId || !g.subGoals) return g;
            const sub = g.subGoals.find((s) => s.id === subtaskId);
            if (!sub) return g;
            const wasDone = sub.isDone ?? false;
            const subGoals = g.subGoals.map((s) =>
              s.id === subtaskId ? { ...s, isDone: !wasDone } : s
            );
            const delta = wasDone ? -1 : 1;
            const progress = Math.max(0, Math.min((g.progress ?? 0) + delta, g.metric.type === "count" ? g.metric.target : Infinity));
            return { ...g, subGoals, progress };
          });
          return { goals: next };
        });
      },

      addSubtask: (goalId, title = "Нова підзадача", timePlanned = 15) => {
        set((state) => {
          const next = state.goals.map((g) => {
            if (g.id !== goalId) return g;
            const subGoals = g.subGoals ?? [];
            const newSub = {
              id: `sg-${String(goalId)}-${Date.now()}` as UniqueIdentifier,
              title,
              timePlanned,
              isDone: false,
              order: subGoals.length,
            };
            return { ...g, subGoals: [...subGoals, newSub] };
          });
          return { goals: next };
        });
      },
    }),
    { name: GOALS_STORAGE_KEY }
  )
);
