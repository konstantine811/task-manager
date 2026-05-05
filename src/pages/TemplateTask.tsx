import { MultipleContainers } from "@/components/dnd/multiple-container";
import Preloader from "@/components/page-partials/preloader/preloader";
import {
  loadTemplateTasks,
  saveTemplateTasks,
} from "@/services/firebase/taskManagerData";
import {
  createGoal,
  subscribeGoals,
  updateGoal,
  reconcileStoredGoalProgressFromDailyData,
} from "@/services/firebase/goalsData";
import { ItemTask, Items } from "@/types/drag-and-drop.model";
import {
  Goal,
  GoalContributionType,
  GoalTaskLink,
} from "@/types/progress.model";
import { rectSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatISO } from "date-fns";
import { TaskManagerProvider } from "@/components/dnd/context/task-manager-context";
import { useTranslation } from "react-i18next";
import TemplateRightPanel from "./template-components/template-right-panel";
import TemplateChartsPanel from "./template-components/template-charts-panel";
import { AiAssistantPanel } from "@/components/ai/ai-assistant-panel";
import { QuickStartOnboarding } from "@/components/ai/quick-start-onboarding";
import { useIsAdoptive } from "@/hooks/useIsAdoptive";
import CustomDrawer from "@/components/ui-abc/drawer/custom-drawer";
import { AnimatedItem } from "@/components/ui/animated-item";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { formatGoalProgressValue, formatGoalValue } from "@/utils/goal.util";

type GoalTaskRequirementDraft = {
  goalId: string;
  taskId: string;
  taskTitle: string;
};

const formatRequiredTime = (seconds: number): string => {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours} год ${minutes} хв`;
  if (hours > 0) return `${hours} год`;
  return `${minutes} хв`;
};

const getGoalRequirementSummary = (goalId: string, items: Items) => {
  return items
    .flatMap((category) => category.tasks)
    .reduce(
      (acc, task) => {
        (task.goalTaskLinks ?? [])
          .filter((link) => link.goalId === goalId)
          .forEach((link) => {
            if (link.contributionType === "time") {
              acc.timeSeconds += Math.max(0, link.contributionValue);
            } else if (link.contributionType === "count") {
              acc.count += Math.max(0, link.contributionValue);
              acc.timeSeconds +=
                Math.max(0, link.contributionValue) * Math.max(0, task.time);
            }
          });
        return acc;
      },
      { count: 0, timeSeconds: 0 },
    );
};

const getTaskGoalLink = (
  task: ItemTask,
  goalId: string,
): GoalTaskLink | undefined =>
  (task.goalTaskLinks ?? []).find((link) => link.goalId === goalId);

const removeGoalLinksFromItems = (items: Items, goalId: string): Items =>
  items.map((category) => ({
    ...category,
    tasks: category.tasks.map((task) => ({
      ...task,
      goalTaskLinks: (task.goalTaskLinks ?? []).filter(
        (link) => link.goalId !== goalId,
      ),
    })),
  }));

const formatTemplateLinkLabel = (
  goal: Goal,
  task: ItemTask,
  translate: (key: string, options?: Record<string, unknown>) => string,
): string => {
  const link = getTaskGoalLink(task, goal.id);
  if (!link) return translate("goals.configure");
  const linkPart =
    link.contributionType === "time"
      ? formatRequiredTime(link.contributionValue)
      : translate("goals.repetitions_short", { count: link.contributionValue });
  if (!goal.targetValue || goal.targetValue <= 0) return linkPart;
  const targetSummary =
    goal.unitType === "time"
      ? formatGoalValue(goal.targetValue, "time")
      : goal.unitType === "distance"
        ? String(goal.targetValue)
        : translate("goals.repetitions_short", { count: goal.targetValue });
  return `${linkPart} · ${translate("goals.template_goal_target_inline", {
    target: targetSummary,
  })}`;
};

const TemplateTask = () => {
  const { isAdoptiveSize: mdSize } = useIsAdoptive("md");
  const [dailyTasks, setDailyTasks] = useState<Items>([]);
  const [templatedTask, setTemplatedTask] = useState<Items>([]); // 🔄 Додано для зберігання шаблонних завдань
  /** true поки йде перший запит шаблону — щоб не миготів контент і сітка */
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [editingRequirement, setEditingRequirement] =
    useState<GoalTaskRequirementDraft | null>(null);
  const [requirementType, setRequirementType] =
    useState<GoalContributionType>("count");
  const [requirementValue, setRequirementValue] = useState(1);
  const [t] = useTranslation();
  const removeSuggestedTaskRef = useRef<
    | ((advisorTask: import("@/services/ai/gemini.types").AdvisorTask) => void)
    | null
  >(null);
  const promptFromQuickStartRef = useRef<((prompt: string) => void) | null>(
    null,
  );
  useEffect(() => {
    loadTemplateTasks()
      .then((tasks) => {
        if (tasks) {
          setDailyTasks(tasks);
          setTemplatedTask(tasks); // 🔄 Зберігаємо шаблонні завдання
        } else {
          setDailyTasks([]); // 🔄 Явно вказати порожній масив
          setTemplatedTask([]); // 🔄 Явно вказати порожній масив для шаблонних завдань
        }
      })
      .catch((error) => {
        console.error("Error loading tasks:", error);
      })
      .finally(() => setIsInitialLoad(false));
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    subscribeGoals((items) => {
      if (isMounted) setGoals(items);
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const today = formatISO(new Date(), { representation: "date" });
    void reconcileStoredGoalProgressFromDailyData(today).catch((error) => {
      console.error("Error reconciling goal progress with daily data:", error);
    });
  }, []);

  /** На lg фіксуємо висоту під viewport + overflow:hidden, щоб скрол був лише всередині колонок, а не на body (миготіння скролбара). */
  const rootStyle = !mdSize
    ? ({
        minHeight: "100%",
        maxHeight: "100%",
        overflow: "hidden",
      } as const)
    : { minHeight: "100%" };

  const activeGoals = useMemo(
    () => goals.filter((goal) => goal.status !== "completed"),
    [goals],
  );

  const templateTasksByGoalId = useMemo(() => {
    const goalMap = new Map(
      activeGoals.map((goal) => [
        goal.id,
        templatedTask
          .flatMap((category) => category.tasks)
          .filter((task) =>
            (task.goalTaskLinks ?? []).some((link) => link.goalId === goal.id),
          ),
      ]),
    );

    return goalMap;
  }, [activeGoals, templatedTask]);

  const goalRequirementById = useMemo(() => {
    const map = new Map<string, { count: number; timeSeconds: number }>();
    activeGoals.forEach((goal) => {
      map.set(goal.id, getGoalRequirementSummary(goal.id, templatedTask));
    });
    return map;
  }, [activeGoals, templatedTask]);

  const openRequirementDialog = (goalId: string, task: ItemTask) => {
    const link = getTaskGoalLink(task, goalId);
    setRequirementType(link?.contributionType ?? "count");
    setRequirementValue(
      link?.contributionType === "time"
        ? Math.max(1, Math.round((link.contributionValue || 60) / 60))
        : Math.max(1, link?.contributionValue ?? 1),
    );
    setEditingRequirement({
      goalId,
      taskId: String(task.id),
      taskTitle: task.title,
    });
  };

  const buildGoalRequirementPatch = (
    goal: Goal,
    items: Items,
  ): Partial<Goal> => {
    const summary = getGoalRequirementSummary(goal.id, items);
    const stage = goal.stages[0] ?? {
      id: `${goal.id}-stage-default`,
      title: goal.title,
      order: 0,
      isActive: true,
      links: [],
    };
    const useTimeUnit = summary.timeSeconds > 0;
    const unitType = useTimeUnit ? "time" : "count";
    const targetValue = useTimeUnit
      ? Math.max(1, summary.timeSeconds)
      : Math.max(1, summary.count);
    return {
      unitType,
      targetValue,
      stages: [
        {
          ...stage,
          title: stage.title || goal.title,
          requiredCount: summary.count > 0 ? summary.count : undefined,
          requiredTimeSeconds:
            summary.timeSeconds > 0 ? summary.timeSeconds : undefined,
        },
        ...goal.stages.slice(1),
      ],
    };
  };

  const handleSaveRequirement = async () => {
    if (!editingRequirement) return;
    const goal = goals.find((item) => item.id === editingRequirement.goalId);
    if (!goal) return;

    const stageId = goal.stages[0]?.id ?? `${goal.id}-stage-default`;
    const contributionValue =
      requirementType === "time"
        ? Math.max(1, requirementValue) * 60
        : Math.max(1, requirementValue);

    const nextItems = templatedTask.map((category) => ({
      ...category,
      tasks: category.tasks.map((task) => {
        if (String(task.id) !== editingRequirement.taskId) return task;
        const preservedLinks = (task.goalTaskLinks ?? []).filter(
          (link) => link.goalId !== goal.id,
        );
        const nextLink: GoalTaskLink = {
          goalId: goal.id,
          stageId,
          templateTaskId: String(task.id),
          contributionType: requirementType,
          contributionValue,
        };

        return {
          ...task,
          goalTaskLinks: [...preservedLinks, nextLink],
        };
      }),
    }));
    const goalPatch = buildGoalRequirementPatch(goal, nextItems);

    setDailyTasks(nextItems);
    setTemplatedTask(nextItems);
    setGoals((prev) =>
      prev.map((item) =>
        item.id === goal.id ? { ...item, ...goalPatch } : item,
      ),
    );
    setEditingRequirement(null);
    saveTemplateTasks(nextItems);
    await updateGoal(goal.id, goalPatch);
  };

  const handleCreateGoal = async () => {
    const title = goalTitle.trim();
    if (!title || isCreatingGoal) return;

    setIsCreatingGoal(true);
    try {
      const created = await createGoal({
        title,
        unitType: "count",
        period: "month",
        targetValue: 1,
        stages: [],
      });
      if (!created) {
        toast.error(t("goals.create_goal_error"));
        return;
      }

      setGoals((prev) =>
        prev.some((goal) => goal.id === created.id) ? prev : [...prev, created],
      );
      setGoalTitle("");
      setIsGoalDialogOpen(false);
      toast.success(t("goals.goal_created"));
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error(t("goals.create_goal_error"));
    } finally {
      setIsCreatingGoal(false);
    }
  };

  const handleGoalAchieved = async (goal: Goal) => {
    const nextItems = removeGoalLinksFromItems(templatedTask, goal.id);
    const completedAt = goal.completedAt ?? new Date().toISOString();
    const completedGoal: Goal = {
      ...goal,
      status: "completed",
      currentValue: Math.max(goal.currentValue, goal.targetValue),
      completedAt,
    };
    setGoals((prev) =>
      prev.map((item) => (item.id === goal.id ? completedGoal : item)),
    );
    setDailyTasks(nextItems);
    setTemplatedTask(nextItems);

    confetti({
      particleCount: 120,
      spread: 75,
      origin: { y: 0.62 },
      colors: ["#facc15", "#34d399", "#60a5fa", "#a78bfa"],
    });

    try {
      await saveTemplateTasks(nextItems);
      await updateGoal(goal.id, {
        status: "completed",
        currentValue: completedGoal.currentValue,
        completedAt,
      });
      toast.success(t("goals.completion_title"), {
        description: goal.title,
      });
    } catch (error) {
      console.error("Error completing goal:", error);
      toast.error(t("goals.create_goal_error"));
    }
  };

  return (
    <div
      className={`w-full ${!mdSize ? "grid h-full min-h-0 lg:grid-cols-3 lg:grid-rows-[auto_minmax(0,1fr)]" : "flex min-h-0 flex-1 flex-col"}`}
      style={rootStyle}
    >
      {/* Заголовок — по центру з glass effect */}
      <AnimatedItem index={0} className={!mdSize ? "col-span-3 shrink-0" : ""}>
        <div className="mx-auto mb-4 mt-2 flex w-full max-w-5xl flex-col gap-3 px-4">
          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
            <h2 className="inline-block text-center text-sm font-medium py-3 px-6 rounded-xl bg-zinc-200/80 dark:bg-white/5 backdrop-blur-md text-zinc-800 dark:text-zinc-200 shadow-[0_0_20px_rgba(0,0,0,0.04)] dark:shadow-[0_0_20px_rgba(255,255,255,0.06)]">
              {t("task_manager.template_daily_task_title")}
            </h2>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsGoalDialogOpen(true)}
              className="h-10 rounded-xl"
            >
              <Plus className="size-4" />
              {t("goals.add_goal")}
            </Button>
          </div>
          <div className="rounded-lg border border-zinc-200/70 bg-white/85 px-3 py-2 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/85">
            {activeGoals.length > 0 ? (
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {activeGoals.map((goal) => {
                  const linkedForGoal =
                    templateTasksByGoalId.get(goal.id) ?? [];
                  const hasLinkedTemplateTasks = linkedForGoal.length > 0;
                  /** Показувати прогрес лише коли є хоча б одна задача в шаблоні з прив’язкою до цілі (інакше 0/1 від дефолтного targetValue вводить в оману). */
                  const showGoalProgress =
                    hasLinkedTemplateTasks && goal.targetValue > 0;
                  const isGoalComplete =
                    goal.status === "completed" ||
                    (showGoalProgress &&
                      goal.currentValue >= goal.targetValue);
                  const pct =
                    showGoalProgress
                      ? Math.min(
                          100,
                          Math.round((goal.currentValue / goal.targetValue) * 100),
                        )
                      : 0;
                  return (
                    <div
                      key={goal.id}
                      className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-zinc-800 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm font-semibold">{goal.title}</div>
                        <div className="text-right text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                          {(() => {
                            const summary = goalRequirementById.get(goal.id) ?? {
                              count: 0,
                              timeSeconds: 0,
                            };
                            return summary.timeSeconds > 0
                              ? t("goals.required_time_short", {
                                  time: formatRequiredTime(summary.timeSeconds),
                                })
                              : t("goals.no_requirement");
                          })()}
                        </div>
                      </div>
                      {showGoalProgress && (
                        <div className="mt-1.5">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {formatGoalProgressValue(
                                goal.currentValue,
                                goal.targetValue,
                                goal.unitType,
                              )}
                            </span>
                            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                              {pct}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/80 dark:bg-white/10">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isGoalComplete
                                  ? "bg-emerald-500"
                                  : "bg-indigo-500/80"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {isGoalComplete && (
                        <Button
                          type="button"
                          size="sm"
                          className="mt-2 h-8 w-full rounded-md bg-emerald-600 text-xs text-white hover:bg-emerald-500"
                          onClick={() => void handleGoalAchieved(goal)}
                        >
                          {t("goals.completion_achieved_button")}
                        </Button>
                      )}
                      <div className="mt-2 space-y-1">
                        {hasLinkedTemplateTasks ? (
                          linkedForGoal.map((task) => (
                            <button
                              type="button"
                              key={String(task.id)}
                              onClick={() => openRequirementDialog(goal.id, task)}
                              className="flex w-full items-center justify-between gap-2 rounded border border-zinc-200/80 bg-white px-2 py-1 text-left text-xs transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-white/10 dark:bg-zinc-950/60 dark:hover:border-indigo-400/50 dark:hover:bg-indigo-500/10"
                            >
                              <span>{task.title}</span>
                              <span className="shrink-0 text-right text-[11px] text-zinc-500 dark:text-zinc-400">
                                {formatTemplateLinkLabel(goal, task, t)}
                              </span>
                            </button>
                          ))
                        ) : (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {t("goals.no_linked_tasks")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                {t("goals.no_goals_hint")}
              </p>
            )}
          </div>
        </div>
      </AnimatedItem>

      {/* Один вертикальний скрол на весь рядок (аналітика + дошка + AI), без вкладених overflow-y-auto */}
      <div
        className={`${
          mdSize
            ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden"
            : "col-span-3 grid min-h-0 min-w-0 grid-cols-1 overflow-y-auto overflow-x-hidden lg:grid-cols-3 lg:gap-4 [scrollbar-gutter:stable]"
        }`}
      >
        <AnimatedItem
          index={1}
          className="min-w-0 min-h-0 hidden lg:block lg:min-h-0"
        >
          <TemplateChartsPanel templateTasks={templatedTask} />
        </AnimatedItem>

        <AnimatedItem
          index={2}
          className="flex min-h-0 min-w-0 flex-1 flex-col lg:col-span-2"
        >
          <main
            className="flex min-h-0 min-w-0 flex-1 flex-col"
          >
          {!isInitialLoad ? (
            <div className="flex w-full min-w-0 flex-1 flex-col items-stretch justify-start px-4">
              <TaskManagerProvider>
                <MultipleContainers
                  strategy={rectSortingStrategy}
                  vertical
                  trashable
                  templated={true}
                  items={dailyTasks}
                  goals={activeGoals}
                  isEmptyTemplate={templatedTask.length === 0}
                  emptyStateCenter={
                    templatedTask.length === 0 ? (
                      <QuickStartOnboarding
                        isEmpty
                        onPromptFromQuickStart={(p) =>
                          promptFromQuickStartRef.current?.(p)
                        }
                        onReplaceTasks={(items) => {
                          saveTemplateTasks(items);
                          setDailyTasks(items);
                          setTemplatedTask(items);
                        }}
                      />
                    ) : undefined
                  }
                  onChangeTasks={(tasks) => {
                    saveTemplateTasks(tasks);
                    setTimeout(() => {
                      setTemplatedTask(tasks);
                      setDailyTasks(tasks);
                    }, 0);
                  }}
                  sidePanel={
                    !mdSize ? (
                      <AiAssistantPanel
                        templateTasks={templatedTask}
                        onReplaceTasks={(items) => {
                          saveTemplateTasks(items);
                          setDailyTasks(items);
                          setTemplatedTask(items);
                        }}
                        hideQuickStart={templatedTask.length === 0}
                        onPromptFromQuickStartRef={promptFromQuickStartRef}
                        onRemoveSuggestedTaskRef={removeSuggestedTaskRef}
                      />
                    ) : undefined
                  }
                  onSuggestedTaskMovedToTemplate={(advisorTask) =>
                    removeSuggestedTaskRef.current?.(advisorTask)
                  }
                />
              </TaskManagerProvider>
            </div>
          ) : (
            <div className="flex min-h-[40vh] w-full flex-1 items-center justify-center">
              <Preloader />
            </div>
          )}
          </main>
        </AnimatedItem>
      </div>

      {/* Права колонка — AI у drawer на мобільному */}
      {mdSize && (
        <div className="shrink-0">
          <CustomDrawer
            title="task_manager.analytics.header.title"
            description="task_manager.analytics.header.description"
          >
            <TemplateRightPanel
              templateTasks={templatedTask}
              onReplaceTasks={(items) => {
                saveTemplateTasks(items);
                setDailyTasks(items);
                setTemplatedTask(items);
              }}
            />
          </CustomDrawer>
        </div>
      )}

      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className="border-zinc-200 bg-white text-zinc-950 shadow-2xl dark:border-white/20 dark:bg-zinc-950 dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle>{t("goals.add_goal")}</DialogTitle>
              <DialogDescription>
                {t("goals.add_goal_description")}
              </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreateGoal();
            }}
          >
            <Input
              autoFocus
              placeholder={t("goals.goal_title")}
              value={goalTitle}
              onChange={(event) => setGoalTitle(event.target.value)}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGoalDialogOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={!goalTitle.trim() || isCreatingGoal}
              >
                {isCreatingGoal
                  ? t("goals.creating_goal")
                  : t("goals.create_goal")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingRequirement)}
        onOpenChange={(open) => !open && setEditingRequirement(null)}
      >
        <DialogContent className="border-zinc-200 bg-white text-zinc-950 shadow-2xl dark:border-white/20 dark:bg-zinc-950 dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle>{t("goals.task_requirement_title")}</DialogTitle>
            <DialogDescription>
              {editingRequirement?.taskTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>{t("goals.requirement_type")}</Label>
              <Select
                value={requirementType}
                onValueChange={(value) =>
                  setRequirementType(value as GoalContributionType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100001] border-zinc-200 bg-white text-zinc-950 shadow-xl dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100">
                  <SelectItem value="count">
                    {t("goals.metric_count")}
                  </SelectItem>
                  <SelectItem value="time">
                    {t("goals.metric_minutes")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>
                {requirementType === "time"
                  ? t("goals.required_minutes")
                  : t("goals.required_repetitions")}
              </Label>
              <Input
                type="number"
                min={1}
                value={requirementValue}
                onChange={(event) =>
                  setRequirementValue(
                    Math.max(1, Number(event.target.value) || 1),
                  )
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingRequirement(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={() => void handleSaveRequirement()}>
              {t("goals.save_requirement")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateTask;
