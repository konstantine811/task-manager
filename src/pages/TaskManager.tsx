import { useEffect } from "react";
import { Outlet } from "react-router";
import { ChronoNav } from "@/components/landing";
import { markEnteredAppThisSession } from "@/config/app-session";
import TaskNavMenu from "./TaskNavMenu";

export interface TaskManagerOutletContext {
  className: string;
}

const TaskManager = () => {
  const outletConext: TaskManagerOutletContext = {
    className: "",
  };

  useEffect(() => {
    markEnteredAppThisSession();
  }, []);

  return (
    <div className="box-border min-h-dvh flex flex-col chrono-page-bg text-foreground relative h-full">
      <ChronoNav variant="app" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col grow pb-20">
        <Outlet context={outletConext} />
      </div>
      <TaskNavMenu />
    </div>
  );
};

export default TaskManager;
