import { MultipleContainers } from "@/components/dnd/multiple-container";
import Preloader from "@/components/page-partials/preloader/preloader";
import {
  loadTemplateTasks,
  saveTemplateTasks,
} from "@/services/firebase/taskManagerData";
import { useHeaderSizeStore } from "@/storage/headerSizeStore";
import { Items } from "@/types/drag-and-drop.model";
import { rectSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router";
import { TaskManagerOutletContext } from "./TaskManager";
import { TaskManagerProvider } from "@/components/dnd/context/task-manager-context";
import { useTranslation } from "react-i18next";
import TemplateRightPanel from "./template-components/template-right-panel";
import TemplateChartsPanel from "./template-components/template-charts-panel";
import { AiAssistantPanel } from "@/components/ai/ai-assistant-panel";
import { QuickStartOnboarding } from "@/components/ai/quick-start-onboarding";
import { useIsAdoptive } from "@/hooks/useIsAdoptive";
import CustomDrawer from "@/components/ui-abc/drawer/custom-drawer";

const TemplateTask = () => {
  const outletContext = useOutletContext<TaskManagerOutletContext>();
  const { isAdoptiveSize: mdSize } = useIsAdoptive("md");
  const [dailyTasks, setDailyTasks] = useState<Items>([]);
  const [templatedTask, setTemplatedTask] = useState<Items>([]); // 🔄 Додано для зберігання шаблонних завдань
  const [isLoaded, setIsLoaded] = useState(false);
  const hS = useHeaderSizeStore((s) => s.size);
  const [t] = useTranslation();
  const removeSuggestedTaskRef = useRef<
    ((advisorTask: import("@/services/ai/gemini.types").AdvisorTask) => void) | null
  >(null);
  const promptFromQuickStartRef = useRef<((prompt: string) => void) | null>(null);

  useEffect(() => {
    setIsLoaded(true);
    loadTemplateTasks()
      .then((tasks) => {
        if (tasks) {
          setDailyTasks(tasks);
          setTemplatedTask(tasks); // 🔄 Зберігаємо шаблонні завдання
        } else {
          setDailyTasks([]); // 🔄 Явно вказати порожній масив
          setTemplatedTask([]); // 🔄 Явно вказати порожній масив для шаблонних завдань
        }
        setIsLoaded(false);
      })
      .catch((error) => {
        console.error("Error loading tasks:", error);
        setIsLoaded(false);
      });
  }, []);
  return (
    <div
      className={`w-full ${!mdSize ? "grid lg:grid-cols-3 lg:grid-rows-[auto_1fr]" : "flex flex-col"}`}
      style={{ minHeight: `calc(100vh - ${hS}px)` }}
    >
      {/* Заголовок — по центру з glass effect */}
      <h2
        className={`flex justify-center mb-4 mt-2 ${!mdSize ? "col-span-3" : ""}`}
      >
        <span className="inline-block text-center text-sm font-medium py-3 px-6 rounded-xl bg-white/5 backdrop-blur-md text-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.06)]">
          {t("task_manager.template_daily_task_title")}
        </span>
      </h2>

      {/* Колонка 1 — графіки */}
      <div className="min-w-0 hidden lg:block overflow-auto">
        <TemplateChartsPanel templateTasks={templatedTask} />
      </div>

      {/* Колонки 2+3 — Quick Start/задачі та AI (рівно по 1/3) */}
      <main
        className={`flex min-w-0 flex-1 lg:col-span-2 overflow-auto ${outletContext.className}`}
        style={{ minHeight: 0 }}
      >
        {!isLoaded ? (
          <div className="flex-1 flex flex-col items-stretch justify-start min-w-0 min-h-0 w-full px-4 overflow-auto">
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
          <Preloader />
        )}
      </main>

      {/* Права колонка — AI у drawer на мобільному */}
      {mdSize && (
        <div className="flex-shrink-0">
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
