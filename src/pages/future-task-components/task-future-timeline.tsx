import { ItemTaskCategory } from "@/types/drag-and-drop.model";
import { TaskItemFuture } from "./task-item-future";
import { paresSecondToTime } from "@/utils/time.util";
import {
  getPriorityClassBg,
  getPriorityClassForegroundText,
} from "@/components/dnd/utils/dnd.utils";
import { cn } from "@/lib/utils";
import { UniqueIdentifier } from "@dnd-kit/core";

const TaskFutureTimeline = ({
  tasks,
  onEditTask,
  onDeleteTask,
}: {
  tasks: ItemTaskCategory[];
  onEditTask?: (task: ItemTaskCategory) => void;
  onDeleteTask?: (id: UniqueIdentifier) => void;
}) => {
  const sortedTasks = [...tasks].sort((a, b) => a.time - b.time);
  return (
    <>
      <ul className="flex flex-col items-center space-y-6 relative">
        {sortedTasks.map((task) => {
          const { hours, minutes } = paresSecondToTime(task.time);
          return (
            <li
              key={task.id}
              className="relative flex items-center w-full gap-3"
            >
              {task.isDone && (
                <div className="z-20 absolute left-0 top-[calc(50%+10px)] w-full h-0.5 bg-destructive/30" />
              )}
              {/* Кружечок */}
              <div className="flex flex-col items-center mt-5 relative z-10">
                <div
                  className={cn(
                    `py-0 px-2 rounded-full transition-all ${getPriorityClassBg(
                      task.priority
                    )} ${task.isDone ? "opacity-20" : ""}`
                  )}
                >
                  <span
                    className={`text-sm ${getPriorityClassForegroundText(
                      task.priority
                    )}`}
                  >
                    {hours}:{minutes.padStart(2, "0")}
                  </span>
                </div>
                {/* Лінія вниз якщо не останній */}
              </div>
              {/* Контент задачі */}
              <div className="flex-1 relative z-10">
                <TaskItemFuture
                  task={task}
                  onEditTask={onEditTask ? () => onEditTask(task) : undefined}
                  onDelete={
                    onDeleteTask ? () => onDeleteTask(task.id) : undefined
                  }
                />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
};

export default TaskFutureTimeline;
