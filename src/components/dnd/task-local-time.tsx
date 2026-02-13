import { SlidingNumber } from "@/components/ui/sliding-number";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatSeconds } from "@/utils/time.util";
import { useEffect, useRef, useState } from "react";

const TaskLocalTime = ({
  outerTime,
  isPlay,
  revert = false,
  tooltipText,
}: {
  outerTime: number;
  isPlay: boolean;
  revert?: boolean;
  tooltipText?: string;
}) => {
  const [time, setTime] = useState(outerTime);
  const startRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlay) {
      startRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - (startRef.current ?? now)) / 1000);
        const updated = revert ? outerTime - elapsed : outerTime + elapsed;
        setTime(updated);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlay, outerTime, revert]);

  useEffect(() => {
    // Якщо зупинився вручну — очистити інтервал
    if (!isPlay && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isPlay]);

  const { hours, minutes } = formatSeconds(Math.abs(time));
  const isNegative = time < 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`flex items-center gap-0.5 font-mono text-xs relative ${
            isNegative ? "text-destructive/70" : "text-accent/70"
          } ${!revert && "text-muted-foreground"}`}
        >
          {revert && isNegative && <span className="absolute -left-2">-</span>}
          <SlidingNumber value={hours} padStart={true} />
          <span className="text-muted-foreground">:</span>
          <SlidingNumber value={minutes} padStart={true} />
        </div>
      </TooltipTrigger>
      {tooltipText && (
        <TooltipContent className="text-xs text-card">
          {tooltipText}
        </TooltipContent>
      )}
    </Tooltip>
  );
};

export default TaskLocalTime;
