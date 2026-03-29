import {
  AnimateLayoutChanges,
  defaultAnimateLayoutChanges,
  useSortable,
} from "@dnd-kit/sortable";
import { Container, Props } from "./container";
import { CSS } from "@dnd-kit/utilities";
import { UniqueIdentifier } from "@dnd-kit/core";
import { ItemTask } from "@/types/drag-and-drop.model";
import WrapperHoverElement from "../ui-abc/wrapper-hover-element";
import SoundHoverElement from "../ui-abc/sound-hover-element";
import { HoverStyleElement, SoundTypeElement } from "@/types/sound";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { Progress } from "../ui/progress";
import {
  CATEGORY_CHART_COLORS,
  getChartColorForAnalyticsCategory,
} from "@/config/chart-colors.config";
import { Plus, Sparkles } from "lucide-react";

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

function DroppableContainer({
  children,
  columns = 1,
  disabled,
  id,
  items,
  placeholder,
  onAddTask,
  onAddTaskWithAI,
  style,
  options,
  templated,
  onChangeCategory,
  ...props
}: Props & {
  disabled?: boolean;
  id: UniqueIdentifier;
  items: ItemTask[];
  options: string[];
  style?: React.CSSProperties;
  onAddTask?: (containerId: UniqueIdentifier) => void;
  onAddTaskWithAI?: (containerId: UniqueIdentifier) => void;
  templated: boolean;
  onChangeCategory?: (value: string) => void;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transition,
    transform,
  } = useSortable({
    id,
    data: {
      type: "container",
      children: items.map((task) => task.id),
    },
    animateLayoutChanges,
  });

  const [t] = useTranslation();
  const [donePercentage, setDonePercentage] = useState(0);

  const categoryColor = useMemo(() => {
    const key = String(id);
    if (CATEGORY_CHART_COLORS[key]) return CATEGORY_CHART_COLORS[key];
    return getChartColorForAnalyticsCategory(key, 0, t);
  }, [id, t]);

  useEffect(() => {
    const totalTasks = items.length;
    const doneTasks = items.filter((task) => task.isDone).length;
    const donePercentage =
      totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
    setDonePercentage(donePercentage);
  }, [items]);

  return (
    <Container
      options={options}
      ref={disabled ? undefined : setNodeRef}
      style={{
        ...style,
        transition,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : undefined,
      }}
      onValueChange={onChangeCategory}
      handleProps={{
        ...attributes,
        ...listeners,
      }}
      columns={columns}
      {...props}
    >
      {items.length > 0 && (
        <div className="px-4 mb-1">
          <div className="text-xs text-muted-foreground text-center mt-1">
            {donePercentage}%
          </div>
          <Progress
            value={donePercentage}
            className="mt-1.5 h-1.5 bg-zinc-300/35 dark:bg-white/10"
            indicatorStyle={{ backgroundColor: categoryColor }}
          />
        </div>
      )}
      <ul className="flex flex-col gap-1">{children}</ul>

      {/* Add task button - Aura compact */}
      {!placeholder && (onAddTask || onAddTaskWithAI) && (
        <div className="mt-4 flex items-center gap-2 px-2 py-1">
          {onAddTask && (
            <WrapperHoverElement className="min-w-0">
              <SoundHoverElement
                animValue={0.99}
                hoverTypeElement={SoundTypeElement.LINK}
                hoverStyleElement={HoverStyleElement.quad}
              >
                <Button
                  variant="ghost"
                  onClick={() => onAddTask(id)}
                  className="h-auto min-h-10 rounded-xl border border-indigo-500/20 bg-indigo-500/8 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors flex items-center gap-2 hover:bg-indigo-500/15 hover:text-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-200"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  {t("task_manager.add")}
                </Button>
              </SoundHoverElement>
            </WrapperHoverElement>
          )}
          {onAddTaskWithAI && (
            <WrapperHoverElement>
              <SoundHoverElement
                animValue={0.99}
                hoverTypeElement={SoundTypeElement.LINK}
                hoverStyleElement={HoverStyleElement.quad}
              >
                <Button
                  onClick={() => onAddTaskWithAI(id)}
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl border border-indigo-500/20 bg-indigo-500/8 text-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/15"
                  title={t("ai.dialog_title")}
                >
                  <Sparkles className="w-3 h-3" />
                </Button>
              </SoundHoverElement>
            </WrapperHoverElement>
          )}
        </div>
      )}
    </Container>
  );
}

export default DroppableContainer;
