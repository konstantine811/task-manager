import SoundHoverElement from "@/components/ui-abc/sound-hover-element";
import { Button } from "@/components/ui/button";
import { ItemTask } from "@/types/drag-and-drop.model";
import { HoverStyleElement, SoundTypeElement } from "@/types/sound";
import { Pause, Play } from "lucide-react";
import TaskLocalTime from "./task-local-time";
import { useTranslation } from "react-i18next";
import TaskLocalTimeStatic from "./task-local-time-static";
import { useEffect } from "react";
import { useTaskManager } from "./context/use-task-manger-context";

const TaskPlay = ({
  task,
  onPlay,
  templated,
}: {
  task: ItemTask;
  onPlay: (status: boolean) => void;
  templated: boolean;
}) => {
  const playingTask = useTaskManager((s) => s.playingTask);
  const setPlayingTask = useTaskManager((s) => s.setPlayingTask);
  const stopPlayingTask = useTaskManager((s) => s.stopPlayingTask);
  const [t] = useTranslation();

  const isPlaying = playingTask?.id === task.id;

  const handleClick = () => {
    if (isPlaying) {
      stopPlayingTask();
    } else {
      setPlayingTask(task);
    }
  };

  useEffect(() => {
    onPlay(isPlaying);
  }, [isPlaying, onPlay]);
  return (
    <div className="flex items-center gap-1">
      {!templated && (
        <SoundHoverElement
          hoverTypeElement={SoundTypeElement.NONE}
          hoverStyleElement={
            task.isDone ? HoverStyleElement.none : HoverStyleElement.circle
          }
        >
          <Button
            size="icon"
            variant="ghost"
            className={`hover:bg-card/10 hover:text-foreground ${
              task.isDone && "cursor-not-allowed text-foreground/10"
            }`}
            onClick={handleClick}
            disabled={task.isDone}
          >
            {isPlaying ? <Pause /> : <Play />}
          </Button>
        </SoundHoverElement>
      )}
      <div className="flex flex-col gap-1">
        {isPlaying ? (
          <>
            <TaskLocalTime
              outerTime={task.timeDone}
              isPlay={isPlaying}
              tooltipText={t(
                "task_manager.dialog_create_task.task.time.wasted_time"
              )}
            />
            <TaskLocalTime
              outerTime={task.time - task.timeDone}
              isPlay={isPlaying}
              revert
              tooltipText={t(
                "task_manager.dialog_create_task.task.time.remaining_time"
              )}
            />
          </>
        ) : (
          <>
            <TaskLocalTimeStatic
              timeInSeconds={task.timeDone}
              tooltipText={t(
                "task_manager.dialog_create_task.task.time.wasted_time"
              )}
            />
            <TaskLocalTimeStatic
              timeInSeconds={task.time - task.timeDone}
              revert
              tooltipText={t(
                "task_manager.dialog_create_task.task.time.remaining_time"
              )}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default TaskPlay;
