import { MultipleContainers } from "@/components/dnd/multiple-container";
import Preloader from "@/components/page-partials/preloader/preloader";
import {
  loadTemplateTasks,
  saveTemplateTasks,
} from "@/services/firebase/taskManagerData";
import { useHeaderSizeStore } from "@/storage/headerSizeStore";
import { Items } from "@/types/drag-and-drop.model";
import { rectSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { TaskManagerOutletContext } from "./TaskManager";
import { TaskManagerProvider } from "@/components/dnd/context/task-manager-context";
import { useTranslation } from "react-i18next";
import TemplateRightPanel from "./template-components/template-right-panel";
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
    <div className="flex w-full" style={{ minHeight: `calc(100vh - ${hS}px)` }}>
      {/* Ліва колонка */}
      <div className="flex-1" />

      {/* Центральна колонка */}
      <main
        className={`w-full max-w-2xl px-4 flex flex-col justify-center ${outletContext.className}`}
        style={{ minHeight: `calc(100vh - ${hS}px)` }}
      >
        {!isLoaded ? (
          <div className="max-w-2xl w-full m-auto">
            <h2 className="text-center text-foreground/50 text-sm mb-4 mt-2">
              {t("task_manager.template_daily_task_title")}
            </h2>
            <TaskManagerProvider>
              <MultipleContainers
                strategy={rectSortingStrategy}
                vertical
                trashable
                templated={true}
                items={dailyTasks}
                onChangeTasks={(tasks) => {
                  saveTemplateTasks(tasks);
                  setTimeout(() => {
                    setTemplatedTask(tasks);
                  }, 0);
                }}
              />
            </TaskManagerProvider>
          </div>
        ) : (
          <Preloader />
        )}
      </main>

      {/* Права колонка */}
      <div className="flex-1 relative">
        {mdSize ? (
          <CustomDrawer
            title="task_manager.analytics.header.title"
            description="task_manager.analytics.header.description"
          >
            <TemplateRightPanel templateTasks={templatedTask} />
          </CustomDrawer>
        ) : (
          <TemplateRightPanel templateTasks={templatedTask} />
        )}
      </div>
    </div>
  );
};

export default TemplateTask;
