import { ItemTask, Priority } from "@/types/drag-and-drop.model";
import { DraggableSyntheticListeners, UniqueIdentifier } from "@dnd-kit/core";
import { checkInSound, checkOutSound } from "@/config/sounds";
import SoundHoverElement from "@/components/ui-abc/sound-hover-element";
import { HoverStyleElement, SoundTypeElement } from "@/types/sound";
import TaskPlay from "./task-play";
import WrapperHoverElement from "../ui-abc/wrapper-hover-element";
import { Button } from "../ui/button";
import { GripVertical, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { useTranslation } from "react-i18next";
import { paresSecondToTime } from "@/utils/time.util";
import TaskDeterminedTime from "./task-components/task-determined-time";
import { StyleWordBreak } from "@/config/styles.config";
import { CATEGORY_CHART_COLORS } from "@/config/chart-colors.config";

export function TaskItem({
  index: _index = "",
  task,
  onToggle,
  children,
  dragging = false,
  onEditTask,
  templated,
  readOnly = false,
  style,
  listeners,
  handle,
  categoryId,
}: {
  index?: number | string;
  task: ItemTask;
  onToggle?: (id: UniqueIdentifier, value: boolean) => void;
  onEditTask?: (task: ItemTask) => void;
  onDelete?: () => void;
  children?: React.ReactNode;
  dragging?: boolean;
  templated: boolean;
  readOnly?: boolean;
  style?: React.CSSProperties;
  listeners?: DraggableSyntheticListeners;
  handle?: boolean;
  categoryId?: UniqueIdentifier;
}) {
  const [, setIsPlay] = useState(false);
  const [t] = useTranslation();
  const hasLongWord = task.title.split(" ").some((word) => word.length > 40);
  const timeSecs =
    task.isPlanned && task.isDone && task.timeDone
      ? task.timeDone
      : task.time;
  const timeFormatted = paresSecondToTime(timeSecs);
  const categoryColor =
    categoryId && templated
      ? CATEGORY_CHART_COLORS[String(categoryId)] ?? null
      : null;
  const scheduleDays =
    templated && task.whenDo && task.whenDo.length > 0 ? (
      <div className="flex flex-wrap gap-1">
        {[...task.whenDo]
          .sort((a, b) => a - b)
          .map((d) => (
            <span
              key={d}
              className="text-[10px] text-indigo-600 dark:text-indigo-400/80"
            >
              {t(`task_manager.day_names.${d}`)}
            </span>
          ))}
      </div>
    ) : null;
  const timeBlock = !dragging ? (
    <>
      {task.isPlanned ? (
        <div
          className="text-xs font-mono text-zinc-600 dark:text-zinc-500 bg-zinc-200 dark:bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-300/80 dark:border-white/5"
          title={t("task_manager.dialog_create_task.task.time.label")}
        >
          {timeFormatted.hours}:{timeFormatted.minutes}
        </div>
      ) : task.isDetermined ? (
        <TaskDeterminedTime
          task={task}
          titleDeterminedTime={t(
            "task_manager.dialog_create_task.task.time.total_time"
          )}
          titleSpendingTime={t(
            "task_manager.dialog_create_task.task.time.wasted_time"
          )}
        />
      ) : templated ? (
        <div className="text-xs font-mono text-zinc-600 dark:text-zinc-500 bg-zinc-200 dark:bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-300/80 dark:border-white/5">
          {timeFormatted.hours}:{timeFormatted.minutes}
        </div>
      ) : (
        <TaskPlay templated={templated} onPlay={setIsPlay} task={task} />
      )}
    </>
  ) : null;
  const editButton =
    onEditTask ? (
      <WrapperHoverElement>
        <SoundHoverElement
          animValue={0.99}
          hoverTypeElement={
            task.isDone ? SoundTypeElement.NONE : SoundTypeElement.SELECT
          }
          hoverStyleElement={
            task.isDone ? HoverStyleElement.none : HoverStyleElement.quad
          }
        >
          <Button
            variant="ghost"
            size="icon"
            disabled={task.isDone}
            onClick={() => onEditTask(task)}
            className={`h-6 w-6 text-zinc-700 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/5 ${
              task.isDone && "text-zinc-500 dark:text-zinc-600"
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
          </Button>
        </SoundHoverElement>
      </WrapperHoverElement>
    ) : null;

  const neonShellClass = task.isDone
    ? "task-neon-shell-done"
    : task.priority === Priority.HIGH
      ? "task-neon-shell-high"
      : task.priority === Priority.MEDIUM
        ? "task-neon-shell-medium"
        : "";
  const inactiveShadow =
    !neonShellClass && !task.isDone ? "shadow-sm" : "";
  const cardBorder = "border border-zinc-200/70 dark:border-white/[0.08]";

  return (
    <div
      style={style}
      className={`relative group rounded-lg ${neonShellClass}`.trim()}
    >
      {categoryColor && (
        <div
          className="absolute left-0 top-1 bottom-1 z-[2] w-[3px] rounded-full"
          style={{ backgroundColor: categoryColor }}
        />
      )}
      <div
        data-task-card
        className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 p-2 rounded-lg ${cardBorder} bg-white/80 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10 transition-colors w-full md:flex md:items-center md:justify-between ${neonShellClass ? "relative z-[1]" : ""} ${inactiveShadow} ${categoryColor ? "pl-3" : ""} ${
          task.isDone
            ? "chrono-task-card-done text-emerald-900 dark:text-emerald-200/95"
            : "text-zinc-800 dark:text-zinc-300"
        }`}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1 md:items-center">
          {!templated && (
            <SoundHoverElement
              className="shrink-0 pt-0.5 md:pt-0"
              animValue={1.4}
              hoverTypeElement={SoundTypeElement.SELECT}
            >
              <input
                type="checkbox"
                className="custom-checkbox"
                id={`isDone-${task.id}`}
                checked={task.isDone}
                onChange={() => {
                  if (onToggle) {
                    if (!task.isDone) {
                      checkOutSound.stop();
                      checkInSound.play();
                    } else {
                      checkInSound.stop();
                      checkOutSound.play();
                    }
                    onToggle(task.id, !task.isDone);
                  }
                }}
              />
            </SoundHoverElement>
          )}
          {!readOnly && (
          <Button
            data-cypress="draggable-item"
            {...(!handle ? listeners : undefined)}
            variant="ghost"
            size="icon"
                className="cursor-move hover:bg-zinc-200 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white text-zinc-700 dark:text-zinc-500 shrink-0 h-6 w-6 md:hidden mt-0.5"
          >
            <GripVertical className="w-3 h-3" />
          </Button>
          )}
          <div className="min-w-0 flex-1">
            <p
              className={`text-left text-sm font-medium min-w-0 max-w-none wrap-break-word leading-snug md:max-w-[200px] ${
                task.isDone ? "text-emerald-800 dark:text-emerald-200" : ""
              }`}
              style={StyleWordBreak}
              title={hasLongWord ? task.title : undefined}
            >
              {task.title}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 md:hidden">
              {scheduleDays}
              {timeBlock}
            </div>
          </div>
        </div>

        <div className="flex items-start justify-end gap-1 md:hidden">
          {!readOnly && editButton}
          {children}
        </div>

        <div className="hidden items-center gap-4 shrink-0 md:flex">
          {scheduleDays}
          {timeBlock}
          {!readOnly && (
          <div className="w-12 flex justify-end gap-1">
            {editButton}
            <SoundHoverElement
              animValue={0.9}
              hoverTypeElement={SoundTypeElement.SHIFT}
              className="hidden md:block"
            >
              <Button
                data-cypress="draggable-item"
                {...(!handle ? listeners : undefined)}
                variant="ghost"
                size="icon"
                className="h-6 w-6 cursor-move hover:bg-zinc-200 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white text-zinc-700 dark:text-zinc-500"
              >
                <GripVertical className="w-3 h-3" />
              </Button>
            </SoundHoverElement>
          </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
