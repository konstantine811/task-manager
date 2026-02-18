import type { UniqueIdentifier } from "@dnd-kit/core";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyGoalImpact } from "@/services/task-menager/apply-goal-impact";
import { recalculateGoalProgress as recalculateFromSource } from "@/services/task-menager/recalculate-goal-progress";
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
  addGoal: (goal: Omit<Goal, "id" | "progress"> & { id?: UniqueIdentifier }) => UniqueIdentifier;
  updateGoal: (id: UniqueIdentifier, updates: Partial<Goal>) => void;
  removeGoal: (id: UniqueIdentifier) => void;
  /** Відкрити діалог створення/редагування цілі (для виклику з task dialog) */
  goalDialogOpen: boolean;
  goalDialogEditingId: UniqueIdentifier | null;
  setGoalDialog: (open: boolean, editId?: UniqueIdentifier | null) => void;
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
  /** Скасувати вплив виконаної задачі (uncheck) */
  applyTaskUndone: (
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
  updateSubtask: (
    goalId: UniqueIdentifier,
    subtaskId: UniqueIdentifier,
    updates: { title?: string; timePlanned?: number }
  ) => void;
  removeSubtask: (goalId: UniqueIdentifier, subtaskId: UniqueIdentifier) => void;
  /** Перерахувати прогрес з Firebase (джерело правди) */
  recalculateProgress: () => Promise<void>;
  /** Ціль, що щойно досягнула 100% — показуємо діалог підтвердження */
  goalCompletionDialogGoalId: UniqueIdentifier | null;
  setGoalCompletionDialog: (id: UniqueIdentifier | null) => void;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: getDefaultGoals(),
      setGoals: (goals) => set({ goals }),

      addGoal: (goalData) => {
        const id = (goalData.id ?? `goal-${Date.now()}`) as UniqueIdentifier;
        const newGoal: Goal = {
          id,
          title: goalData.title,
          description: goalData.description,
          metric: goalData.metric,
          progress: 0,
          status: "active",
          subGoals: goalData.subGoals ?? [],
        };
        set((state) => ({ goals: [...state.goals, newGoal] }));
        return id;
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        }));
      },

      removeGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }));
      },

      goalDialogOpen: false,
      goalDialogEditingId: null,
      goalCompletionDialogGoalId: null,
      setGoalCompletionDialog: (id) =>
        set({ goalCompletionDialogGoalId: id }),
      setGoalDialog: (open, editId = null) => {
        set({
          goalDialogOpen: open,
          goalDialogEditingId: editId ?? null,
        });
      },

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
          let completedGoalId: UniqueIdentifier | null = null;
          for (const g of updated) {
            const old = state.goals.find((o) => o.id === g.id);
            const target = g.metric.type === "count" || g.metric.type === "minutes"
              ? g.metric.target
              : g.metric.type === "streak" || g.metric.type === "score"
                ? g.metric.target
                : 0;
            if (target > 0 && g.progress >= target && (old?.progress ?? 0) < target && g.status === "active") {
              completedGoalId = g.id;
              break;
            }
          }
          return {
            goals: updated,
            ...(completedGoalId ? { goalCompletionDialogGoalId: completedGoalId } : {}),
          };
        });
      },

      applyTaskUndone: (taskId, date, task) => {
        const links = task.goalLinks;
        if (!links || links.length === 0) return;

        set((state) => {
          const instance: TaskInstance = {
            id: taskId,
            templateId: taskId,
            date,
            status: "todo",
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

      updateSubtask: (goalId, subtaskId, updates) => {
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId || !g.subGoals) return g;
            return {
              ...g,
              subGoals: g.subGoals.map((s) =>
                s.id === subtaskId ? { ...s, ...updates } : s
              ),
            };
          }),
        }));
      },

      removeSubtask: (goalId, subtaskId) => {
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId || !g.subGoals) return g;
            const sub = g.subGoals.find((s) => s.id === subtaskId);
            if (!sub) return g;
            const wasDone = sub.isDone ?? false;
            const subGoals = g.subGoals
              .filter((s) => s.id !== subtaskId)
              .map((s, i) => ({ ...s, order: i }));
            const delta = wasDone ? -1 : 0;
            const progress = Math.max(
              0,
              (g.progress ?? 0) + delta
            );
            return { ...g, subGoals, progress };
          }),
        }));
      },

      recalculateProgress: async () => {
        await recalculateFromSource(
          () => get().goals,
          (goals) => set({ goals })
        );
      },
    }),
    {
      name: GOALS_STORAGE_KEY,
      partialize: (state) => ({ goals: state.goals }),
    }
  )
);
