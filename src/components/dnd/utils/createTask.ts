import { DayNumber, ItemTask, Priority } from "@/types/drag-and-drop.model";

export const createTask = (
  title: string,
  priority: Priority,
  time: number,
  isPlanned = false,
  wastedTime = 0,
  whenDo: DayNumber[] = [],
  isDetermined = false
) => {
  const newTask: ItemTask = {
    id: `${title}-${Date.now()}`,
    title,
    isDone: false,
    time,
    timeDone: wastedTime,
    isPlanned,
    priority,
    whenDo, // Дні тижня, коли потрібно виконати завдання
    isDetermined,
  };
  return newTask;
};
