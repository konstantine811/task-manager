import { TaskManagerState } from "@/storage/task-manager/task-manager";
import { useContext } from "react";
import { TaskManagerContext } from "./create-context";
import { useStore } from "zustand";

export const useTaskManager = <T,>(
  selector: (state: TaskManagerState) => T
): T => {
  const store = useContext(TaskManagerContext);
  if (!store)
    throw new Error(
      "❌ useTaskManager must be used within <TaskManagerProvider>"
    );
  return useStore(store, selector);
};
