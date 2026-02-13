import { ItemTaskCategory } from "@/types/drag-and-drop.model";
import SoundHoverElement from "@/components/ui-abc/sound-hover-element";
import { HoverStyleElement, SoundTypeElement } from "@/types/sound";
import { Settings2, Trash2 } from "lucide-react";
import { getPriorityClassByPrefix } from "@/components/dnd/utils/dnd.utils";
import WrapperHoverElement from "@/components/ui-abc/wrapper-hover-element";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { StyleWordBreak } from "@/config/styles.config";

export function TaskItemFuture({
  task,
  onEditTask,
  onDelete,
}: {
  index?: number | string;
  task: ItemTaskCategory;
  onEditTask?: () => void;
  onDelete?: () => void;
}) {
  const hasLongWord = task.title.split(" ").some((word) => word.length > 40); // можна змінити 20 на поріг
  const [t] = useTranslation();
  return (
    <div
      className={cn(
        `relative group rounded-xl transition-all  mt-6 ${
          task.isDone ? "opacity-30" : ""
        }`
      )}
    >
      <h6 className="absolute -top-5 left-5 bg-accent/30 backdrop-blur-sm px-3 rounded-full border border-border">
        {t(task.categoryName)}
      </h6>
      <div
        className="flex items-center justify-between gap-0 md:gap-2 py-1 bg-card 
             border border-border rounded-xl px-4 text-foreground 
             group transition-all hover:border-foreground/10 hover:bg-background duration-300 ease-in-out"
      >
        <p
          className={`flex-1 text-left text-sm ${hasLongWord && "truncate"} ${
            task.isDone
              ? "text-accent font-medium"
              : `${getPriorityClassByPrefix(task.priority)}`
          }`}
          style={StyleWordBreak}
          title={hasLongWord ? task.title : ""}
        >
          {task.title}
        </p>

        <div className="flex items-center ">
          <WrapperHoverElement className="flex items-center">
            {onEditTask && (
              <SoundHoverElement
                animValue={0.99}
                hoverTypeElement={SoundTypeElement.SELECT}
                hoverStyleElement={HoverStyleElement.quad}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onEditTask();
                  }}
                  className={`hover:bg-accent/50 hover:text-foreground text-foreground`}
                >
                  <Settings2 className="w-4 h-4" />
                </Button>
              </SoundHoverElement>
            )}
            {onDelete && (
              <SoundHoverElement
                animValue={0.99}
                hoverTypeElement={SoundTypeElement.SELECT}
                hoverStyleElement={HoverStyleElement.quad}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onDelete();
                  }}
                  className={`hover:bg-accent/50 hover:text-foreground text-foreground`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </SoundHoverElement>
            )}
          </WrapperHoverElement>
        </div>
      </div>
    </div>
  );
}
