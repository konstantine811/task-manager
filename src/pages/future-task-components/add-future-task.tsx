import { useCallback, useEffect, useState } from "react";
import DailyAddTemplateButton from "../daily-components/daily-add-button";
import DialogFeatureTask from "./dialog-task";
import { ItemTaskCategory } from "@/types/drag-and-drop.model";
import TaskFutureTimeline from "./task-future-timeline";
import {
  loadDailyTasksByDate,
  saveDailyTasks,
} from "@/services/firebase/taskManagerData";
import { FirebaseCollection } from "@/config/firebase.config";
import Preloader from "@/components/page-partials/preloader/preloader";
import DialogAgree from "@/components/ui-abc/dialog/dialog-agree";
import { UniqueIdentifier } from "@dnd-kit/core";
import { useTranslation } from "react-i18next";

const AddFutureTask = ({ date }: { date: string | undefined }) => {
  const [isOpoenDialog, setIsOpenDialog] = useState(false);
  const [categoryTasks, setCategoryTasks] = useState<ItemTaskCategory[]>([]);
  const [editTask, setEditTask] = useState<ItemTaskCategory | null>(null);
  const [isOpenAgreeDialog, setIsOpenAgreeDialog] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<UniqueIdentifier>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [t] = useTranslation();
  const handleAddTask = () => {
    setIsOpenDialog(true);
  };

  useEffect(() => {
    setIsLoaded(false);
    if (date) {
      loadDailyTasksByDate<ItemTaskCategory[]>(
        date,
        FirebaseCollection.plannedTasks
      ).then((tasks) => {
        if (tasks && tasks.length) {
          setCategoryTasks(tasks);
        } else {
          setCategoryTasks([]); // 🔄 Явно вказати порожній масив
        }
        setIsLoaded(true);
      });
    }
  }, [date]);

  const handleUpdateTask = useCallback(
    (tasks: ItemTaskCategory[]) => {
      if (!isLoaded || !date) return;
      saveDailyTasks<ItemTaskCategory[]>(
        tasks,
        date,
        // "01.06.2025",
        FirebaseCollection.plannedTasks
      );
    },
    [date, isLoaded]
  );

  return (
    <>
      <DialogAgree
        isOpen={isOpenAgreeDialog}
        setIsOpen={setIsOpenAgreeDialog}
        title={t("task_manager.dialog_delete_task.title")}
        description={t("task_manager.dialog_delete_task.description")}
        buttonYesTitle={t("task_manager.dialog_delete_task.yes")}
        buttonNoTitle={t("task_manager.dialog_delete_task.no")}
        onAgree={(status) => {
          if (status && deleteTaskId) {
            setCategoryTasks((prev) => {
              const updated = prev.filter((task) => task.id !== deleteTaskId);
              handleUpdateTask(updated);
              return updated;
            });
          }
          setDeleteTaskId(undefined);
        }}
      />
      {isLoaded ? (
        <div className="flex flex-col gap-4">
          <DailyAddTemplateButton
            title={"task_manager.add"}
            onClick={handleAddTask}
          />
          <DialogFeatureTask
            isOpen={isOpoenDialog}
            setOpen={setIsOpenDialog}
            task={editTask}
            onChangeTask={(task, categoryName) => {
              const categoryTask: ItemTaskCategory = {
                ...task,
                categoryName: categoryName,
              };
              setIsOpenDialog(false);
              setEditTask(null);
              setCategoryTasks((prev) => {
                const index = prev.findIndex((t) => t.id === categoryTask.id);
                let updated: ItemTaskCategory[];

                if (index !== -1) {
                  updated = [...prev];
                  updated[index] = categoryTask;
                } else {
                  updated = [...prev, categoryTask];
                }

                handleUpdateTask(updated);
                return updated;
              });
            }}
          />
          {categoryTasks.length > 0 && (
            <TaskFutureTimeline
              tasks={categoryTasks}
              onEditTask={(task) => {
                setEditTask(task);
                setIsOpenDialog(true);
              }}
              onDeleteTask={(id) => {
                setDeleteTaskId(id);
                setIsOpenAgreeDialog(true);
              }}
            />
          )}
        </div>
      ) : (
        <Preloader />
      )}
    </>
  );
};

export default AddFutureTask;
