import SoundButton from "@/components/ui-abc/buttons/sound-button";
import SoundHoverElement from "@/components/ui-abc/sound-hover-element";
import WrapperHoverElement from "@/components/ui-abc/wrapper-hover-element";
import { Button } from "@/components/ui/button";
import {
  MorphingPopover,
  MorphingPopoverContent,
  MorphingPopoverTrigger,
} from "@/components/ui/morphing-popover";
import { HoverStyleElement } from "@/types/sound";
import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const DailyAddTask = ({
  onCreateTask,
}: {
  onCreateTask: (isTemplate: boolean) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [t] = useTranslation();
  return (
    <MorphingPopover open={isOpen} onOpenChange={setIsOpen}>
      <MorphingPopoverTrigger>
        <SoundButton>
          <motion.span
            layoutId="morphing-popover-basic-label"
            layout="position"
          >
            {t("task_manager.add")}
          </motion.span>
        </SoundButton>
      </MorphingPopoverTrigger>
      <MorphingPopoverContent className="w-80 p-4 shadow-sm z-50 bg-card/10 backdrop-blur-sm border border-border">
        <WrapperHoverElement className="flex flex-col gap-2 items-center">
          <SoundHoverElement
            hoverStyleElement={HoverStyleElement.quad}
            onClick={() => {
              onCreateTask(true);
              setIsOpen(false);
            }}
            animValue={1}
            className="w-full"
          >
            <Button
              variant="ghost"
              className="w-full text-foreground border border-border hover:bg-transparent hover:text-accent"
            >
              {t("task_manager.template_task")}
            </Button>
          </SoundHoverElement>
          <SoundHoverElement
            hoverStyleElement={HoverStyleElement.quad}
            onClick={() => {
              onCreateTask(false);
              setIsOpen(false);
            }}
            animValue={1}
          >
            <Button
              variant="ghost"
              className="text-foreground border border-foreground/10 hover:bg-transparent hover:text-accent"
            >
              {t("task_manager.new_task")}
            </Button>
          </SoundHoverElement>
        </WrapperHoverElement>
      </MorphingPopoverContent>
    </MorphingPopover>
  );
};

export default DailyAddTask;
