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

  return (
    <div className="flex items-center gap-2">
      <SoundHoverElement
        hoverTypeElement={SoundTypeElement.NONE}
        hoverStyleElement={HoverStyleElement.circle}
      >
        <Button
          size="icon"
          variant="ghost"
          className={`hover:bg-card/10 hover:text-foreground`}
          onClick={stopPlayingTask}
        >
          <Pause />
        </Button>
      </SoundHoverElement>
      <div className="flex items-center gap-0.5 font-mono">
        <SlidingNumber value={hours} padStart={true} />
        <span className="text-muted-foreground">:</span>
        <SlidingNumber value={minutes} padStart={true} />
        <span className="text-muted-foreground">:</span>
        <SlidingNumber value={seconds} padStart={true} />
      </div>
    </div>
  );
};

export default TaskTimer;
