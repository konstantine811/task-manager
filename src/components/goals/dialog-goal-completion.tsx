import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Dialog from "@/components/ui-abc/dialog/dialog";
import { useGoalsStore } from "@/storage/goalsStore";
import type { Goal, GoalMetric } from "@/types/goal.model";
import { Check, X } from "lucide-react";

function getGoalTarget(goal: Goal): number {
  if (goal.metric.type === "count") return goal.metric.target;
  if (goal.metric.type === "minutes") return goal.metric.target;
  if (goal.metric.type === "streak") return goal.metric.target;
  if (goal.metric.type === "score") return goal.metric.target;
  return 0;
}

function formatMetricUnit(goal: Goal): string {
  if (goal.metric.type === "count") return goal.metric.unit ?? "кроків";
  if (goal.metric.type === "minutes") return "хв";
  if (goal.metric.type === "streak") return "днів";
  if (goal.metric.type === "score") return "балів";
  return "";
}

export function DialogGoalCompletion() {
  const [t] = useTranslation();
  const goalId = useGoalsStore((s) => s.goalCompletionDialogGoalId);
  const setGoalCompletionDialog = useGoalsStore((s) => s.setGoalCompletionDialog);
  const goals = useGoalsStore((s) => s.goals);
  const updateGoal = useGoalsStore((s) => s.updateGoal);

  const [showExtendForm, setShowExtendForm] = useState(false);
  const [addValue, setAddValue] = useState(5);

  const goal = goals.find((g) => g.id === goalId);
  const isOpen = !!goalId && !!goal;
  const hasFiredConfetti = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setShowExtendForm(false);
      setAddValue(5);
      if (!hasFiredConfetti.current) {
        hasFiredConfetti.current = true;
        const fire = (opts: confetti.Options) =>
          confetti({ origin: { y: 0.4 }, ...opts });
        fire({ particleCount: 80, spread: 60 });
        setTimeout(() => fire({ particleCount: 50, spread: 100, startVelocity: 35 }), 150);
        setTimeout(() => fire({ particleCount: 50, spread: 100, startVelocity: 35, origin: { x: 0.2, y: 0.4 } }), 250);
        setTimeout(() => fire({ particleCount: 50, spread: 100, startVelocity: 35, origin: { x: 0.8, y: 0.4 } }), 350);
      }
    } else {
      hasFiredConfetti.current = false;
    }
  }, [isOpen]);

  const handleAchieved = () => {
    if (goal) {
      const today = new Date().toISOString().slice(0, 10);
      updateGoal(goal.id, { status: "done", completedAt: today });
    }
    setGoalCompletionDialog(null);
  };

  const handleNotAchieved = () => {
    setShowExtendForm(true);
  };

  const handleExtend = () => {
    if (!goal || addValue < 1) return;
    const target = getGoalTarget(goal);
    const newTarget = target + addValue;
    const newMetric: GoalMetric =
      goal.metric.type === "minutes"
        ? { type: "minutes", target: newTarget }
        : goal.metric.type === "count"
          ? { type: "count", target: newTarget, unit: goal.metric.unit }
          : goal.metric.type === "streak"
            ? { type: "streak", target: newTarget, period: goal.metric.period ?? "day" }
            : { type: "score", target: newTarget };
    updateGoal(goal.id, { metric: newMetric });
    setGoalCompletionDialog(null);
  };

  const handleClose = () => {
    setGoalCompletionDialog(null);
    setShowExtendForm(false);
  };

  if (!goal) return null;

  const unit = formatMetricUnit(goal);
  const target = getGoalTarget(goal);

  return (
    <Dialog isOpen={isOpen} setOpen={(open) => !open && handleClose()} className="p-4 md:p-6">
      <div className="flex flex-col gap-4">
        {!showExtendForm ? (
          <>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {t("goals.completion_title")}
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              {t("goals.completion_question", { goal: goal.title })}
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                className="chrono-dialog-submit flex-1 gap-2"
                onClick={handleAchieved}
              >
                <Check className="h-4 w-4" />
                {t("goals.completion_yes")}
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleNotAchieved}
              >
                <X className="h-4 w-4" />
                {t("goals.completion_no")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {t("goals.completion_extend_title")}
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              {t("goals.completion_extend_hint", {
                goal: goal.title,
                current: target,
                unit,
              })}
            </p>
            <div className="space-y-2">
              <Label>{t("goals.completion_add_more")}</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  min={1}
                  value={addValue}
                  onChange={(e) =>
                    setAddValue(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  className="chrono-select-trigger w-24"
                />
                <span className="text-sm text-zinc-500">{unit}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose}>
                {t("common.cancel")}
              </Button>
              <Button
                className="chrono-dialog-submit"
                onClick={handleExtend}
                disabled={addValue < 1}
              >
                {t("goals.completion_extend")}
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
