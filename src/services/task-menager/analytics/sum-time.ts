import { Items } from "@/types/drag-and-drop.model";
import { normalizeItems } from "../normalize";

export const getSumTime = (tasks: Items): number => {
  const tasksN = normalizeItems(tasks);
  if (tasksN.length <= 1) {
    return 0;
  }
  return tasksN.reduce((total, task) => {
    return total + (task.isDetermined ? task.timeDone : task.time);
  }, 0);
};
