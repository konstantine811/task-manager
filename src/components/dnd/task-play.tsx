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
    <div className="flex items-center gap-2">
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
            className={`h-7 w-7 rounded-md border border-white/5 bg-white/[0.03] text-zinc-500 hover:bg-white/5 hover:text-zinc-300 hover:border-white/10 transition-colors ${
              task.isDone && "cursor-not-allowed opacity-40"
            }`}
            onClick={handleClick}
            disabled={task.isDone}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </Button>
        </SoundHoverElement>
      )}
      <div className="flex items-center gap-2">
        {isPlaying ? (
          <>
            <TaskLocalTime
              outerTime={task.timeDone}
              isPlay={isPlaying}
              tooltipText={t(
                "task_manager.dialog_create_task.task.time.wasted_time"
              )}
              className="!text-zinc-500 bg-zinc-900/50 px-2 py-0.5 rounded border border-white/5"
            />
            <span className="text-zinc-600 text-[10px]">/</span>
            <TaskLocalTime
              outerTime={task.time - task.timeDone}
              isPlay={isPlaying}
              revert
              tooltipText={t(
                "task_manager.dialog_create_task.task.time.remaining_time"
              )}
              className="!text-zinc-500 bg-zinc-900/50 px-2 py-0.5 rounded border border-white/5"
            />
          </>
        ) : (
          <>
            <TaskLocalTimeStatic
              timeInSeconds={task.timeDone}
              tooltipText={t(
                "task_manager.dialog_create_task.task.time.wasted_time"
              )}
              className="!text-zinc-500 bg-zinc-900/50 px-2 py-0.5 rounded border border-white/5"
            />
            <span className="text-zinc-600 text-[10px]">/</span>
            <TaskLocalTimeStatic
              timeInSeconds={task.time - task.timeDone}
              revert
              tooltipText={t(
                "task_manager.dialog_create_task.task.time.remaining_time"
              )}
              className="!text-zinc-500 bg-zinc-900/50 px-2 py-0.5 rounded border border-white/5"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default TaskPlay;
