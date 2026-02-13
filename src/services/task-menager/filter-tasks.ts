import {
  DayNumber,
  Items,
  ItemTaskCategory,
  NormalizedTask,
} from "@/types/drag-and-drop.model";
import { normalizeItems } from "./normalize";

export const filterTaskByDayOfWeedk = (
  tasks: Items | null | undefined,
  dayOfWeek: DayNumber
): {
  filteredTasks: Items;
  plannedTasks: ItemTaskCategory[];
  filteredNormalizedTasks: NormalizedTask[];
} => {
  if (!tasks || tasks.length === 0) {
    return { filteredTasks: [], plannedTasks: [], filteredNormalizedTasks: [] };
  }
  const taskItemsCategories: ItemTaskCategory[] = [];
  const filteredNormalizedTasks: NormalizedTask[] = [];

  const filteredTasks = tasks
    .map((category) => {
      const filteredTasks = category.tasks.filter((task) => {
        if (task.whenDo?.includes(dayOfWeek)) {
          if (task.isDetermined) {
            taskItemsCategories.push({
              ...task,
              categoryName: category.title,
            });
          }
          return true;
        } else {
          filteredNormalizedTasks.push({
            ...task,
            categoryName: category.title,
            categoryId: category.id,
          });
          return false;
        }
      });

      return {
        ...category,
        tasks: filteredTasks,
      };
    })
    .filter((category) => category.tasks.length > 0);
  return {
    filteredTasks,
    plannedTasks: taskItemsCategories,
    filteredNormalizedTasks,
  };
};

export const filterTasksByAnotherTasks = (
  base: Items,
  incoming: Items
): NormalizedTask[] => {
  const baseN = normalizeItems(base);
  const incomingN = normalizeItems(incoming).map((task) => task.id);
  return baseN.filter((task) => !incomingN.includes(task.id));
};
