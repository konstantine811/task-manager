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
    <div className="flex gap-2">
      <TaskLocalTimeStatic
        timeInSeconds={task.time}
        tooltipText={titleDeterminedTime}
        className="text-md text-accent"
      />
      /
      <TaskLocalTimeStatic
        timeInSeconds={task.timeDone}
        revert
        tooltipText={titleSpendingTime}
        className="text-foreground/50"
      />
    </div>
  );
};

export default TaskDeterminedTime;
