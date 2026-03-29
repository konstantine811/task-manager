import type {
  DayNumber,
  Items,
  ItemTaskCategory,
  NormalizedTask,
} from "@/types/drag-and-drop.model";
import type { ISODate } from "@/types/task-template.model";
import { normalizeItems } from "./normalize";
import { itemsToTemplateItems } from "./task-adapter";
import { generateInstancesForRange } from "./generate-instances";

/**
 * Returns template IDs that have an instance on the given date.
 * Handles weekdays, interval_days, times_per_week, once.
 */
export function getTemplateIdsPlannedForDate(
  tasks: Items,
  date: ISODate
): Set<string> {
  const templateItems = itemsToTemplateItems(tasks);
  const templates = templateItems.flatMap((cat) => cat.templates);
  const instances = generateInstancesForRange(templates, date, date, []);
  return new Set(instances.map((i) => String(i.templateId)));
}

export const filterTaskByDayOfWeedk = (
  tasks: Items | null | undefined,
  dateOrDayOfWeek: ISODate | DayNumber
): {
  filteredTasks: Items;
  plannedTasks: ItemTaskCategory[];
  filteredNormalizedTasks: NormalizedTask[];
} => {
  if (!tasks || tasks.length === 0) {
    return { filteredTasks: [], plannedTasks: [], filteredNormalizedTasks: [] };
  }

  const isISODate = typeof dateOrDayOfWeek === "string" && dateOrDayOfWeek.includes("-");
  const date: ISODate = isISODate ? (dateOrDayOfWeek as ISODate) : ("" as ISODate);
  const jsDay = isISODate ? new Date(date + "T12:00:00").getDay() : null;
  const dayOfWeek: DayNumber = isISODate
    ? ((jsDay === 0 ? 7 : jsDay) as DayNumber)
    : (dateOrDayOfWeek as DayNumber);

  const templateIdsOnDate = isISODate ? getTemplateIdsPlannedForDate(tasks, date) : null;

  const taskItemsCategories: ItemTaskCategory[] = [];
  const filteredNormalizedTasks: NormalizedTask[] = [];

  const filteredTasks = tasks
    .map((category) => {
      const filteredTasks = category.tasks.filter((task) => {
        const planned = templateIdsOnDate
          ? templateIdsOnDate.has(String(task.id))
          : (task.whenDo?.includes(dayOfWeek) ?? false);

        if (planned) {
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
