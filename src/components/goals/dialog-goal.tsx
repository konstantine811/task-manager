import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Dialog from "@/components/ui-abc/dialog/dialog";
import type { Goal, GoalMetric } from "@/types/goal.model";
import type { UniqueIdentifier } from "@dnd-kit/core";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MetricType = "count" | "minutes";

interface DialogGoalProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  goal?: Goal | null;
  onSave: (data: {
    title: string;
    description?: string;
    metric: GoalMetric;
  }) => void;
}

export function DialogGoal({
  isOpen,
  setOpen,
  goal,
  onSave,
}: DialogGoalProps) {
  const [t] = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [metricType, setMetricType] = useState<MetricType>("count");
  const [target, setTarget] = useState(10);
  const [unit, setUnit] = useState("кроків");

  const isEdit = !!goal;

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description ?? "");
      setMetricType(goal.metric.type === "minutes" ? "minutes" : "count");
      setTarget(
        goal.metric.type === "count"
          ? goal.metric.target
          : goal.metric.type === "minutes"
            ? goal.metric.target
            : 10
      );
      setUnit(
        goal.metric.type === "count" && goal.metric.unit
          ? goal.metric.unit
          : "кроків"
      );
    } else {
      setTitle("");
      setDescription("");
      setMetricType("count");
      setTarget(10);
      setUnit("кроків");
    }
  }, [goal, isOpen]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    const metric: GoalMetric =
      metricType === "minutes"
        ? { type: "minutes", target }
        : { type: "count", target, unit };
    onSave({ title: title.trim(), description: description.trim() || undefined, metric });
    setOpen(false);
  };

  return (
    <Dialog isOpen={isOpen} setOpen={setOpen} className="p-4 md:p-6">
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {isEdit ? t("goals.edit_goal") : t("goals.create_goal")}
        </h3>

        <div className="space-y-2">
          <Label>{t("goals.goal_title")}</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("goals.goal_title")}
            className="chrono-select-trigger"
          />
        </div>

        <div className="space-y-2">
          <Label>{t("goals.goal_description")}</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("goals.goal_description")}
            className="chrono-select-trigger"
          />
        </div>

        <div className="space-y-2">
          <Label>{t("goals.metric_type")}</Label>
          <Select
            value={metricType}
            onValueChange={(v) => setMetricType(v as MetricType)}
          >
            <SelectTrigger className="chrono-select-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="chrono-select-content">
              <SelectItem value="count">{t("goals.metric_count")}</SelectItem>
              <SelectItem value="minutes">{t("goals.metric_minutes")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("goals.target")}</Label>
          <Input
            type="number"
            min={1}
            value={target}
            onChange={(e) => setTarget(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="chrono-select-trigger w-24"
          />
        </div>

        {metricType === "count" && (
          <div className="space-y-2">
            <Label>{t("goals.unit")}</Label>
            <Input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="тренувань, етапів, ..."
              className="chrono-select-trigger"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            className="chrono-dialog-submit"
            onClick={handleSubmit}
            disabled={!title.trim()}
          >
            {isEdit ? t("task_manager.edit") : t("goals.add")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
