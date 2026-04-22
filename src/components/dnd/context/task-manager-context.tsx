import { useMemo } from "react";
import { createTaskManagerStore } from "@/storage/task-manager/task-manager";
import { TaskManagerContext } from "./create-context";
import { TaskMediaSessionSync } from "./task-media-session-sync";

export const TaskManagerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const store = useMemo(() => createTaskManagerStore(), []);
  return (
    <TaskManagerContext.Provider value={store}>
      <TaskMediaSessionSync />
      {children}
    </TaskManagerContext.Provider>
  );
};
