import { SlidingNumber } from "@/components/ui/sliding-number";
import { formatSeconds } from "@/utils/time.util";
import { useEffect, useState } from "react";
import { useTaskManager } from "./context/use-task-manger-context";
import { Button } from "../ui/button";
import SoundHoverElement from "../ui-abc/sound-hover-element";
import { HoverStyleElement, SoundTypeElement } from "@/types/sound";
import { Pause } from "lucide-react";

const TaskTimer = () => {
  const playingTask = useTaskManager((s) => s.playingTask);
  const startedAt = useTaskManager((s) => s.startedAt);
  const stopPlayingTask = useTaskManager((s) => s.stopPlayingTask);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (playingTask && startedAt) {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setTime(playingTask.timeDone + elapsed);
      }

      // if you want to reset the timer when the task is completed   } else {
      //     setTime(0);
      //   }
    }, 1000);

    return () => clearInterval(interval);
  }, [playingTask, startedAt]);

  const { hours, minutes, seconds } = formatSeconds(time);

  if (!playingTask) return null;

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-zinc-300/70 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
      <SoundHoverElement
        hoverTypeElement={SoundTypeElement.NONE}
        hoverStyleElement={HoverStyleElement.circle}
      >
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 rounded-full text-zinc-700 hover:bg-zinc-200/80 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          onClick={stopPlayingTask}
        >
          <Pause />
        </Button>
      </SoundHoverElement>
      <div className="flex min-w-0 flex-col">
        <div className="truncate text-sm font-medium text-zinc-900 dark:text-white">
          {playingTask.title || "Активна задача"}
        </div>
        <div className="flex items-center gap-0.5 font-mono text-sm text-zinc-600 dark:text-zinc-300">
          <SlidingNumber value={hours} padStart={true} />
          <span className="text-zinc-400 dark:text-zinc-500">:</span>
          <SlidingNumber value={minutes} padStart={true} />
          <span className="text-zinc-400 dark:text-zinc-500">:</span>
          <SlidingNumber value={seconds} padStart={true} />
        </div>
      </div>
    </div>
  );
};

export default TaskTimer;
