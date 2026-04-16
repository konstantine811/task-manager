import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { useHeaderSizeStore } from "@/storage/headerSizeStore";
import { ChronoNav } from "@/components/landing";
import { markEnteredAppThisSession } from "@/config/app-session";
import { motion } from "motion/react";
import TaskNavMenu from "./TaskNavMenu";

export interface TaskManagerOutletContext {
  className: string;
}

const TaskManager = () => {
  const { pathname } = useLocation();
  const headerSize = useHeaderSizeStore((s) => s.size);
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
