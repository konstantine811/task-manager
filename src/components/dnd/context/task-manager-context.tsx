import { useMemo } from "react";
import { createTaskManagerStore } from "@/storage/task-manager/task-manager";
import { TaskManagerContext } from "./create-context";

export const TaskManagerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const store = useMemo(() => createTaskManagerStore(), []);
  return (
    <TaskManagerContext.Provider value={store}>
      {children}
    </TaskManagerContext.Provider>
  );
};
