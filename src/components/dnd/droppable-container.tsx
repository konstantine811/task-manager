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
import { useEffect, useState } from "react";
import { Progress } from "../ui/progress";
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
      {items.length > 0 && !templated && (
        <div className="px-4">
          <div className="text-xs text-muted-foreground text-center mt-1">
            {donePercentage}%
          </div>
          <Progress value={donePercentage} />
        </div>
      )}
      <ul className="flex flex-col gap-1">{children}</ul>

      {/* Add task button - Aura compact */}
      {!placeholder && (onAddTask || onAddTaskWithAI) && (
        <div className="mt-4 flex items-center gap-2 px-2 py-1">
          {onAddTask && (
            <WrapperHoverElement>
              <SoundHoverElement
                animValue={0.99}
                hoverTypeElement={SoundTypeElement.LINK}
                hoverStyleElement={HoverStyleElement.quad}
              >
                <Button
                  variant="ghost"
                  onClick={() => onAddTask(id)}
                  className="h-auto py-1 px-0 text-xs font-medium text-zinc-500 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Plus className="w-3 h-3" />
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
                  className="h-6 w-6 text-indigo-400/70 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-full"
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
