import { ItemTask } from "@/types/drag-and-drop.model";
import { getPriorityBorderClass } from "./utils/dnd.utils";
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
export function TaskItem({
  index = "",
  task,
  onToggle,
  children,
  dragging = false,
  onEditTask,
  templated,
  style, // ✅ додали
  listeners,
  handle,
}: {
  index?: number | string;
  task: ItemTask;
  onToggle?: (id: UniqueIdentifier, value: boolean) => void;
  onEditTask?: (task: ItemTask) => void;
  onDelete?: () => void;
  children?: React.ReactNode;
  dragging?: boolean;
  templated: boolean;
  style?: React.CSSProperties; // ✅ додали
  listeners?: DraggableSyntheticListeners;
  handle?: boolean;
}) {
  const [isPlay, setIsPlay] = useState(false);
  const [t] = useTranslation();
  const hasLongWord = task.title.split(" ").some((word) => word.length > 40); // можна змінити 20 на поріг
  const timeSecs =
    task.isPlanned && task.isDone && task.timeDone
      ? task.timeDone
      : task.time;
  const timeFormatted = paresSecondToTime(timeSecs);

  return (
    <div
      style={style}
      className={`relative group rounded-lg border border-transparent hover:border-white/5 transition-all ${
        isPlay ? getPriorityBorderClass(task.priority) : ""
      }`}
    >
      <div
        className={`flex items-center gap-3 p-2 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.06] transition-all ${
          task.isDone
            ? "chrono-task-card-done text-indigo-200/90 border-indigo-500/15 bg-indigo-500/5"
            : "text-zinc-300"
        }`}
      >
        <div className="w-6 text-center text-xs text-zinc-600 font-mono tabular-nums flex-shrink-0">
          {(index || index === 0) && String(Number(index) + 1).padStart(2, "0")}
        </div>
        {!templated && (
          <SoundHoverElement
            className="flex-shrink-0"
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
        <Button
          data-cypress="draggable-item"
          {...(!handle ? listeners : undefined)}
          variant="ghost"
          size="icon"
          className="cursor-move hover:bg-white/5 hover:text-white text-zinc-500 flex-shrink-0 h-6 w-6 md:hidden"
        >
          <GripVertical className="w-3 h-3" />
        </Button>
        <p
          className={`flex-1 text-left text-sm font-medium min-w-0 truncate ${
            task.isDone ? "text-indigo-200" : ""
          }`}
          style={StyleWordBreak}
          title={hasLongWord ? task.title : ""}
        >
          {task.title}
        </p>

        <div className="flex items-center gap-4 flex-shrink-0">
          {templated && task.whenDo && task.whenDo.length > 0 && (
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <span
                  key={d}
                  className={`text-[10px] ${
                    task.whenDo?.includes(d as 1 | 2 | 3 | 4 | 5 | 6 | 7)
                      ? "text-indigo-400/80"
                      : "text-zinc-600"
                  }`}
                >
                  {t(`task_manager.day_names.${d}`)}
                </span>
              ))}
            </div>
          )}
          {!dragging && (
            <>
              {task.isPlanned ? (
                <div
                  className="text-xs font-mono text-zinc-500 bg-zinc-900/50 px-2 py-0.5 rounded border border-white/5"
                  title={t("task_manager.dialog_create_task.task.time.label")}
                >
                  {timeFormatted.hours}:{timeFormatted.minutes}
                </div>
              ) : task.isDetermined ? (
                <TaskDeterminedTime
                  task={task}
                  titleDeterminedTime={t(
                    "task_manager.dialog_create_task.task.time.on_time"
                  )}
                  titleSpendingTime={t(
                    "task_manager.dialog_create_task.task.time.wasted_time"
                  )}
                />
              ) : templated ? (
                <div className="text-xs font-mono text-zinc-500 bg-zinc-900/50 px-2 py-0.5 rounded border border-white/5">
                  {timeFormatted.hours}:{timeFormatted.minutes}
                </div>
              ) : (
                <TaskPlay
                  templated={templated}
                  onPlay={setIsPlay}
                  task={task}
                />
              )}
            </>
          )}
          <div className="w-12 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEditTask && (
              <WrapperHoverElement>
                <SoundHoverElement
                  animValue={0.99}
                  hoverTypeElement={
                    task.isDone
                      ? SoundTypeElement.NONE
                      : SoundTypeElement.SELECT
                  }
                  hoverStyleElement={
                    task.isDone
                      ? HoverStyleElement.none
                      : HoverStyleElement.quad
                  }
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={task.isDone}
                    onClick={() => onEditTask(task)}
                    className={`h-6 w-6 text-zinc-500 hover:text-white hover:bg-white/5 ${
                      task.isDone && "text-zinc-600"
                    }`}
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                  </Button>
                </SoundHoverElement>
              </WrapperHoverElement>
            )}
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
                className="h-6 w-6 cursor-move hover:bg-white/5 hover:text-white text-zinc-500"
              >
                <GripVertical className="w-3 h-3" />
              </Button>
            </SoundHoverElement>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
