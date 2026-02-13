import { TaskManagerState } from "@/storage/task-manager/task-manager";
import { createContext } from "react";
import { StoreApi } from "zustand";

export const TaskManagerContext =
  createContext<StoreApi<TaskManagerState> | null>(null);
