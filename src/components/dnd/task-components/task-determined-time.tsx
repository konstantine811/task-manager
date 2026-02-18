import { ItemTask } from "@/types/drag-and-drop.model";
import TaskLocalTimeStatic from "../task-local-time-static";

const TaskDeterminedTime = ({
  task,
  titleDeterminedTime,
  titleSpendingTime,
}: {
  task: ItemTask;
  titleDeterminedTime: string;
  titleSpendingTime: string;
}) => {
  return (
    <div className="flex items-center gap-2">
      <TaskLocalTimeStatic
        timeInSeconds={task.timeDone}
        tooltipText={titleSpendingTime}
        className="!text-zinc-700 dark:!text-zinc-400 bg-zinc-200 dark:bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-300/80 dark:border-white/5"
      />
      <span className="text-zinc-600 dark:text-zinc-500 text-[10px]">/</span>
      <TaskLocalTimeStatic
        timeInSeconds={task.time}
        tooltipText={titleDeterminedTime}
        className="!text-zinc-700 dark:!text-zinc-400 bg-zinc-200 dark:bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-300/80 dark:border-white/5"
      />
    </div>
  );
};

export default TaskDeterminedTime;
