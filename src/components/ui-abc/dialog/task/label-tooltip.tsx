import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MessageCircleQuestion } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface LabelTooltipProps {
  label: string;
  tooltip: string;
  children: React.ReactNode;
}

const LabelTimePicker = ({ label, tooltip, children }: LabelTooltipProps) => {
  const [open, setOpen] = useState(false);

  const toggleTooltip = () => {
    setOpen((prev) => !prev);
  };

  return (
    <>
      <div className="relative inline-flex items-center gap-2">
        <Label htmlFor="time" className="text-right">
          {label}:
        </Label>
        <Tooltip open={open} onOpenChange={setOpen}>
          <TooltipTrigger asChild>
            <div>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full"
                onClick={toggleTooltip}
              >
                <MessageCircleQuestion />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={8}
            className="max-w-[280px] whitespace-normal wrap-break-word border border-zinc-300/80 bg-white/95 text-zinc-900 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-zinc-950/95 dark:text-zinc-100"
          >
            <p className="leading-5">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      {children}
    </>
  );
};

export default LabelTimePicker;
