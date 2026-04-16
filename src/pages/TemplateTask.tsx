import { MultipleContainers } from "@/components/dnd/multiple-container";
import Preloader from "@/components/page-partials/preloader/preloader";
import {
  loadTemplateTasks,
  saveTemplateTasks,
} from "@/services/firebase/taskManagerData";
import { Items } from "@/types/drag-and-drop.model";
import { rectSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useRef, useState } from "react";
import { TaskManagerProvider } from "@/components/dnd/context/task-manager-context";
import { useTranslation } from "react-i18next";
import TemplateRightPanel from "./template-components/template-right-panel";
import TemplateChartsPanel from "./template-components/template-charts-panel";
import { AiAssistantPanel } from "@/components/ai/ai-assistant-panel";
import { QuickStartOnboarding } from "@/components/ai/quick-start-onboarding";
import { useIsAdoptive } from "@/hooks/useIsAdoptive";
import CustomDrawer from "@/components/ui-abc/drawer/custom-drawer";
import { AnimatedItem } from "@/components/ui/animated-item";

const TemplateTask = () => {
  const { isAdoptiveSize: mdSize } = useIsAdoptive("md");
  const [dailyTasks, setDailyTasks] = useState<Items>([]);
  const [templatedTask, setTemplatedTask] = useState<Items>([]); // 🔄 Додано для зберігання шаблонних завдань
  /** true поки йде перший запит шаблону — щоб не миготів контент і сітка */
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [t] = useTranslation();
  const removeSuggestedTaskRef = useRef<
    | ((advisorTask: import("@/services/ai/gemini.types").AdvisorTask) => void)
    | null
  >(null);
  const promptFromQuickStartRef = useRef<((prompt: string) => void) | null>(
    null,
  );
  useEffect(() => {
    loadTemplateTasks()
      .then((tasks) => {
        if (tasks) {
          setDailyTasks(tasks);
          setTemplatedTask(tasks); // 🔄 Зберігаємо шаблонні завдання
        } else {
          setDailyTasks([]); // 🔄 Явно вказати порожній масив
          setTemplatedTask([]); // 🔄 Явно вказати порожній масив для шаблонних завдань
        }
      })
      .catch((error) => {
        console.error("Error loading tasks:", error);
      })
      .finally(() => setIsInitialLoad(false));
  }, []);

  /** На lg фіксуємо висоту під viewport + overflow:hidden, щоб скрол був лише всередині колонок, а не на body (миготіння скролбара). */
  const rootStyle = !mdSize
    ? ({
        minHeight: "100%",
        maxHeight: "100%",
        overflow: "hidden",
      } as const)
    : { minHeight: "100%" };

  return (
    <div
      className={`w-full ${!mdSize ? "grid h-full min-h-0 lg:grid-cols-3 lg:grid-rows-[auto_minmax(0,1fr)]" : "flex min-h-0 flex-1 flex-col"}`}
      style={rootStyle}
    >
      {/* Заголовок — по центру з glass effect */}
      <AnimatedItem index={0} className={!mdSize ? "col-span-3 shrink-0" : ""}>
        <h2 className="flex justify-center mb-4 mt-2">
          <span className="inline-block text-center text-sm font-medium py-3 px-6 rounded-xl bg-zinc-200/80 dark:bg-white/5 backdrop-blur-md text-zinc-800 dark:text-zinc-200 shadow-[0_0_20px_rgba(0,0,0,0.04)] dark:shadow-[0_0_20px_rgba(255,255,255,0.06)]">
            {t("task_manager.template_daily_task_title")}
          </span>
        </h2>
      </AnimatedItem>

      {/* Один вертикальний скрол на весь рядок (аналітика + дошка + AI), без вкладених overflow-y-auto */}
      <div
        className={`${
          mdSize
            ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden"
            : "col-span-3 grid min-h-0 min-w-0 grid-cols-1 overflow-y-auto overflow-x-hidden lg:grid-cols-3 lg:gap-4 [scrollbar-gutter:stable]"
        }`}
      >
        <AnimatedItem
          index={1}
          className="min-w-0 min-h-0 hidden lg:block lg:min-h-0"
        >
          <TemplateChartsPanel templateTasks={templatedTask} />
        </AnimatedItem>

        <AnimatedItem
          index={2}
          className="flex min-h-0 min-w-0 flex-1 flex-col lg:col-span-2"
        >
          <main
            className="flex min-h-0 min-w-0 flex-1 flex-col"
          >
          {!isInitialLoad ? (
            <div className="flex w-full min-w-0 flex-1 flex-col items-stretch justify-start px-4">
              <TaskManagerProvider>
                <MultipleContainers
                  strategy={rectSortingStrategy}
                  vertical
                  trashable
                  templated={true}
                  items={dailyTasks}
                  isEmptyTemplate={templatedTask.length === 0}
                  emptyStateCenter={
                    templatedTask.length === 0 ? (
                      <QuickStartOnboarding
                        isEmpty
                        onPromptFromQuickStart={(p) =>
                          promptFromQuickStartRef.current?.(p)
                        }
                        onReplaceTasks={(items) => {
                          saveTemplateTasks(items);
                          setDailyTasks(items);
                          setTemplatedTask(items);
                        }}
                      />
                    ) : undefined
                  }
                  onChangeTasks={(tasks) => {
                    saveTemplateTasks(tasks);
                    setTimeout(() => {
                      setTemplatedTask(tasks);
                      setDailyTasks(tasks);
                    }, 0);
                  }}
                  sidePanel={
                    !mdSize ? (
                      <AiAssistantPanel
                        templateTasks={templatedTask}
                        onReplaceTasks={(items) => {
                          saveTemplateTasks(items);
                          setDailyTasks(items);
                          setTemplatedTask(items);
                        }}
                        hideQuickStart={templatedTask.length === 0}
                        onPromptFromQuickStartRef={promptFromQuickStartRef}
                        onRemoveSuggestedTaskRef={removeSuggestedTaskRef}
                      />
                    ) : undefined
                  }
                  onSuggestedTaskMovedToTemplate={(advisorTask) =>
                    removeSuggestedTaskRef.current?.(advisorTask)
                  }
                />
              </TaskManagerProvider>
            </div>
          ) : (
            <div className="flex min-h-[40vh] w-full flex-1 items-center justify-center">
              <Preloader />
            </div>
          )}
          </main>
        </AnimatedItem>
      </div>

      {/* Права колонка — AI у drawer на мобільному */}
      {mdSize && (
        <div className="shrink-0">
          <CustomDrawer
            title="task_manager.analytics.header.title"
            description="task_manager.analytics.header.description"
          >
            <TemplateRightPanel
              templateTasks={templatedTask}
              onReplaceTasks={(items) => {
                saveTemplateTasks(items);
                setDailyTasks(items);
                setTemplatedTask(items);
              }}
            />
          </CustomDrawer>
        </div>
      )}
    </div>
  );
};

export default TemplateTask;
