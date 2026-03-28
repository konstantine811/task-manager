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
import {
  CATEGORY_STYLE,
  DEFAULT_CATEGORY_STYLE,
} from "@/components/dnd/config/category-style.config";
import { CATEGORY_OPTIONS } from "@/components/dnd/config/category-options";

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
  const categoryKey =
    CATEGORY_STYLE[task.categoryName]
      ? task.categoryName
      : CATEGORY_OPTIONS.find(
          (option) => t(`task_manager.categories.${option}`) === task.categoryName
        ) ?? task.categoryName;
  const categoryStyle = CATEGORY_STYLE[categoryKey] ?? DEFAULT_CATEGORY_STYLE;
  const CategoryIcon = categoryStyle.icon;
  const categoryLabel =
    t(`task_manager.categories.${categoryKey}`) !==
    `task_manager.categories.${categoryKey}`
      ? t(`task_manager.categories.${categoryKey}`)
      : task.categoryName;
  return (
    <div
      className={cn(
        `relative group rounded-xl transition-all  mt-6 ${
          task.isDone ? "opacity-30" : ""
        }`
      )}
    >
      <h6 className="absolute -top-5 left-5 inline-flex items-center gap-2 rounded-full border border-zinc-300/80 bg-white/90 px-3 py-1 text-xs font-medium text-zinc-800 shadow-sm dark:border-white/10 dark:bg-zinc-900/90 dark:text-zinc-200">
        <CategoryIcon className={cn("h-3.5 w-3.5 shrink-0", categoryStyle.color)} />
        <span>{categoryLabel}</span>
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
