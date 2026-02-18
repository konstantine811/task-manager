import { Flag, Calendar, Route, Plus, Pencil, Target, Trash2, Circle } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { UniqueIdentifier } from "@dnd-kit/core";
import type { Goal } from "@/types/goal.model";
import type { Items, ItemTask } from "@/types/drag-and-drop.model";
import { useTranslation } from "react-i18next";
import { useGoalsStore } from "@/storage/goalsStore";
import { useState } from "react";
import { DialogGoal } from "./dialog-goal";
import { Button } from "@/components/ui/button";
import DialogAgree from "@/components/ui-abc/dialog/dialog-agree";

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getGoalTarget(goal: Goal): number {
  if (goal.metric.type === "count") return goal.metric.target;
  if (goal.metric.type === "minutes") return goal.metric.target;
  if (goal.metric.type === "streak") return goal.metric.target;
  if (goal.metric.type === "score") return goal.metric.target;
  return 0;
}

const PROGRESS_COLORS: Record<string, string> = {
  "goal-run": "bg-indigo-500/80 shadow-[0_10px_30px_rgba(99,102,241,0.25)]",
  "goal-site": "bg-emerald-500/80 shadow-[0_10px_30px_rgba(16,185,129,0.2)]",
};

/** Get tasks from Items that are linked to the given goalId */
function getLinkedTasks(items: Items, goalId: UniqueIdentifier): ItemTask[] {
  const result: ItemTask[] = [];
  for (const cat of items) {
    for (const task of cat.tasks) {
      if (task.goalLinks?.some((l) => l.goalId === goalId)) {
        result.push(task);
      }
    }
  }
  return result;
}

export function GoalsPanel({ templateTasks = [] }: { templateTasks?: Items }) {
  const [t] = useTranslation();
  const goals = useGoalsStore((s) => s.goals);
  const addSubtask = useGoalsStore((s) => s.addSubtask);
  const updateSubtask = useGoalsStore((s) => s.updateSubtask);
  const removeSubtask = useGoalsStore((s) => s.removeSubtask);
  const [addingToGoalId, setAddingToGoalId] = useState<UniqueIdentifier | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskTime, setNewSubtaskTime] = useState(15);
  const [goalToDelete, setGoalToDelete] = useState<UniqueIdentifier | null>(null);
  const [editingSubtask, setEditingSubtask] = useState<{
    goalId: UniqueIdentifier;
    subtaskId: UniqueIdentifier;
    title: string;
    timePlanned: number;
  } | null>(null);
  const addGoal = useGoalsStore((s) => s.addGoal);
  const updateGoal = useGoalsStore((s) => s.updateGoal);
  const removeGoal = useGoalsStore((s) => s.removeGoal);
  const goalDialogOpen = useGoalsStore((s) => s.goalDialogOpen);
  const goalDialogEditingId = useGoalsStore((s) => s.goalDialogEditingId);
  const setGoalDialog = useGoalsStore((s) => s.setGoalDialog);
  const editingGoal = goals.find((g) => g.id === goalDialogEditingId) ?? null;

  const handleSaveGoal = (data: {
    title: string;
    description?: string;
    metric: import("@/types/goal.model").GoalMetric;
  }) => {
    if (editingGoal) {
      updateGoal(editingGoal.id, data);
      setGoalDialog(false, null);
    } else {
      addGoal(data);
      setGoalDialog(false, null);
    }
  };

  return (
    <div className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-200 dark:bg-black/20">
              <Flag className="h-5 w-5 text-zinc-700 dark:text-zinc-200" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {t("goals.title") || "Великі цілі"}
              </div>
              <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-500">
                {t("goals.description") || "Довготривала ціль → підзадачі на день → прогрес"}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 chrono-dialog-submit"
              onClick={() => setGoalDialog(true, null)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t("goals.create_goal")}
            </Button>
          </div>

          <DialogGoal
            isOpen={goalDialogOpen}
            setOpen={(open) => setGoalDialog(open, open ? goalDialogEditingId : null)}
            goal={editingGoal ?? null}
            onSave={handleSaveGoal}
          />

          <DialogAgree
            isOpen={goalToDelete !== null}
            setIsOpen={(open) => !open && setGoalToDelete(null)}
            title={t("goals.delete_goal_title") || "Видалити ціль?"}
            description={t("goals.delete_goal_description") || "Цю ціль та всі її підзадачі буде видалено. Цю дію не можна скасувати."}
            buttonYesTitle={t("task_manager.dialog_delete_task.yes") || "Так, видалити"}
            buttonNoTitle={t("task_manager.dialog_category.delete.no") || "Ні, залишити"}
            onAgree={(confirmed) => {
              if (confirmed && goalToDelete) {
                removeGoal(goalToDelete);
                setGoalToDelete(null);
              } else {
                setGoalToDelete(null);
              }
            }}
          />

          <div className="mt-4 space-y-4">
            {goals
              .filter((g) => g.status === "active")
              .map((goal) => {
                const target = getGoalTarget(goal);
                const progress = goal.progress ?? 0;
                const pct = target > 0 ? Math.round((progress / target) * 100) : 0;
                const progressColor = PROGRESS_COLORS[goal.id] ?? "bg-indigo-500/80";
                return (
                  <div
                    key={goal.id}
                    className="rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-black/20 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            {goal.title}
                          </div>
                          <button
                            type="button"
                            onClick={() => setGoalDialog(true, goal.id)}
                            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400"
                            title={t("goals.edit_goal")}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setGoalToDelete(goal.id as UniqueIdentifier)}
                            className="p-1 rounded hover:bg-red-500/10 text-zinc-500 dark:text-zinc-400 hover:text-red-500"
                            title={t("goals.delete_goal") || "Видалити ціль"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                            {goal.description}
                          </span>
                          <span className="text-zinc-700">•</span>
                          <span className="inline-flex items-center gap-1">
                            <Route className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                            {goal.metric.type === "count" && (
                              <>План: {target} {goal.metric.unit ?? "кроків"}</>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs text-zinc-500">
                          {t("goals.progress") || "Прогрес"}
                        </div>
                        <div className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-zinc-100">
                          {pct}%
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/5 ring-1 ring-zinc-300/80 dark:ring-white/10">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs font-mono text-zinc-600 dark:text-zinc-500">
                        <span>
                          {progress}/{target} {t("goals.steps") || "кроків"}
                        </span>
                        <span className="text-zinc-600 dark:text-zinc-600">
                          {t("goals.today") || "сьогодні"}
                        </span>
                      </div>
                    </div>

                    {/* Linked tasks from template */}
                    {templateTasks.length > 0 && (
                      <div className="mt-2 rounded-md border border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-white/[0.02] p-2">
                        <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                          <Target className="h-3.5 w-3.5" />
                          {t("goals.linked_tasks")}
                        </div>
                        <div className="mt-1.5 space-y-1">
                          {getLinkedTasks(templateTasks, goal.id).length === 0 ? (
                            <p className="text-xs text-zinc-500 dark:text-zinc-500 py-1">
                              {t("goals.no_linked_tasks")}
                            </p>
                          ) : (
                            getLinkedTasks(templateTasks, goal.id).map((task) => (
                              <div
                                key={task.id}
                                className="text-xs text-zinc-700 dark:text-zinc-300 py-1 px-2 rounded bg-zinc-100/80 dark:bg-white/5"
                              >
                                {task.title}
                                {task.time ? ` • ${formatDuration(task.time)}` : ""}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 rounded-md border border-zinc-200 dark:border-white/10 bg-zinc-100/80 dark:bg-white/[0.03] p-2">
                      <div className="flex items-center justify-between px-1">
                        <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          {t("goals.subtasks_plan") || "План кроків до цілі"}
                        </div>
                        {addingToGoalId !== goal.id ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAddingToGoalId(goal.id as UniqueIdentifier);
                              setNewSubtaskTitle("");
                              setNewSubtaskTime(15);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
                          >
                            <Plus className="h-4 w-4" strokeWidth={1.5} />
                            {t("goals.add") || "Додати"}
                          </button>
                        ) : null}
                      </div>
                      {addingToGoalId === goal.id && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 p-2 rounded-lg bg-zinc-200/50 dark:bg-white/5">
                          <Input
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            placeholder={t("goals.goal_title")}
                            className="h-8 flex-1 min-w-[120px] chrono-select-trigger text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                addSubtask(
                                  goal.id as UniqueIdentifier,
                                  newSubtaskTitle.trim() || t("goals.new_subtask"),
                                  newSubtaskTime
                                );
                                setAddingToGoalId(null);
                                setNewSubtaskTitle("");
                              } else if (e.key === "Escape") {
                                setAddingToGoalId(null);
                              }
                            }}
                          />
                          <Input
                            type="number"
                            min={1}
                            value={newSubtaskTime}
                            onChange={(e) =>
                              setNewSubtaskTime(Math.max(0, parseInt(e.target.value, 10) || 0))
                            }
                            className="h-8 w-16 chrono-select-trigger text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 chrono-dialog-submit"
                            onClick={() => {
                              addSubtask(
                                goal.id as UniqueIdentifier,
                                newSubtaskTitle.trim() || t("goals.new_subtask"),
                                newSubtaskTime
                              );
                              setAddingToGoalId(null);
                              setNewSubtaskTitle("");
                            }}
                          >
                            {t("goals.add")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8"
                            onClick={() => setAddingToGoalId(null)}
                          >
                            {t("common.cancel")}
                          </Button>
                        </div>
                      )}
                      <div className="mt-2 space-y-px">
                        {(goal.subGoals ?? [])
                          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                          .map((sub, idx) => {
                            const isEditing =
                              editingSubtask?.goalId === goal.id &&
                              editingSubtask?.subtaskId === sub.id;
                            return (
                              <div
                                key={sub.id}
                                className="group flex items-center gap-3 rounded-lg border border-transparent p-2 transition-all hover:border-zinc-200 dark:hover:border-white/5 hover:bg-zinc-200/50 dark:hover:bg-white/[0.03]"
                              >
                                <div className="w-6 shrink-0 flex items-center justify-center">
                                  <Circle className="h-3 w-3 text-zinc-400 dark:text-zinc-500 fill-none" strokeWidth={2} />
                                </div>
                                {isEditing ? (
                                  <div
                                    className="flex flex-1 items-center gap-2 min-w-0"
                                    data-subtask-edit
                                    onBlurCapture={(e) => {
                                      // Зберегти при кліку поза формою (фокус пішов з інпутів/кнопки)
                                      if (!editingSubtask) return;
                                      const editEl = (e.target as HTMLElement).closest("[data-subtask-edit]");
                                      setTimeout(() => {
                                        if (!editEl?.contains(document.activeElement)) {
                                          updateSubtask(
                                            goal.id as UniqueIdentifier,
                                            sub.id as UniqueIdentifier,
                                            {
                                              title: editingSubtask.title.trim() || sub.title,
                                              timePlanned: editingSubtask.timePlanned,
                                            }
                                          );
                                          setEditingSubtask(null);
                                        }
                                      }, 0);
                                    }}
                                  >
                                    <Input
                                      value={editingSubtask.title}
                                      onChange={(e) =>
                                        setEditingSubtask((p) =>
                                          p ? { ...p, title: e.target.value } : null
                                        )
                                      }
                                      className="h-7 flex-1 min-w-0 chrono-select-trigger text-sm"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          updateSubtask(
                                            goal.id as UniqueIdentifier,
                                            sub.id as UniqueIdentifier,
                                            {
                                              title: editingSubtask.title.trim() || sub.title,
                                              timePlanned: editingSubtask.timePlanned,
                                            }
                                          );
                                          setEditingSubtask(null);
                                        } else if (e.key === "Escape") {
                                          setEditingSubtask(null);
                                        }
                                      }}
                                      autoFocus
                                    />
                                    <Input
                                      type="number"
                                      min={0}
                                      value={editingSubtask.timePlanned}
                                      onChange={(e) =>
                                        setEditingSubtask((p) =>
                                          p
                                            ? {
                                                ...p,
                                                timePlanned: Math.max(
                                                  0,
                                                  parseInt(e.target.value, 10) || 0
                                                ),
                                              }
                                            : null
                                        )
                                      }
                                      className="h-7 w-14 chrono-select-trigger text-xs"
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-1"
                                      onClick={() => {
                                        if (editingSubtask) {
                                          updateSubtask(
                                            goal.id as UniqueIdentifier,
                                            sub.id as UniqueIdentifier,
                                            {
                                              title: editingSubtask.title.trim() || sub.title,
                                              timePlanned: editingSubtask.timePlanned,
                                            }
                                          );
                                          setEditingSubtask(null);
                                        }
                                      }}
                                    >
                                      ✓
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <span
                                      className="min-w-0 flex-1 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer"
                                      onClick={() =>
                                        setEditingSubtask({
                                          goalId: goal.id as UniqueIdentifier,
                                          subtaskId: sub.id as UniqueIdentifier,
                                          title: sub.title,
                                          timePlanned: sub.timePlanned ?? 0,
                                        })
                                      }
                                    >
                                      {sub.title}
                                    </span>
                                    <div className="shrink-0 rounded border border-zinc-300/80 dark:border-white/5 bg-zinc-200 dark:bg-zinc-900/50 px-2 py-1 font-mono text-xs text-zinc-600 dark:text-zinc-500">
                                      {sub.timePlanned != null
                                        ? formatDuration(sub.timePlanned)
                                        : "—"}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        removeSubtask(
                                          goal.id as UniqueIdentifier,
                                          sub.id as UniqueIdentifier
                                        );
                                      }}
                                      className="opacity-50 hover:opacity-100 p-1 rounded text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
