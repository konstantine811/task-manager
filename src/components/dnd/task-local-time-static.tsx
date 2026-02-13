import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatSeconds } from "@/utils/time.util";

const TaskLocalTimeStatic = ({
  timeInSeconds,
  revert = false,
  tooltipText,
  isPlanned = false,
  className = "",
}: {
  timeInSeconds: number;
  revert?: boolean;
  tooltipText?: string;
  isPlanned?: boolean;
  className?: string;
}) => {
  const isNegative = timeInSeconds < 0;
  const { hours, minutes } = formatSeconds(Math.abs(timeInSeconds));

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            `flex items-center gap-0.5 font-mono text-xs relative ${
              isNegative ? "text-destructive/70" : "text-accent/70"
            } ${!revert && "text-muted-foreground"} ${
              isPlanned && "text-red-400"
            } ${className}`
          )}
        >
          {revert && isNegative && <span className="absolute -left-2">-</span>}
          <span>{String(hours).padStart(2, "0")}</span>
          <span className="text-muted-foreground">:</span>
          <span>{String(minutes).padStart(2, "0")}</span>
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

export default TaskLocalTimeStatic;
