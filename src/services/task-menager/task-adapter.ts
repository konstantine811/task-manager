import type { UniqueIdentifier } from "@dnd-kit/core";
import type { ItemTask, Items, DayNumber } from "@/types/drag-and-drop.model";
import type { TaskTemplate, TemplateItems } from "@/types/task-template.model";

/**
 * Convert ItemTask (legacy) to TaskTemplate.
 * Maps whenDo → schedule: { type: "weekdays", days }
 */
export function itemTaskToTaskTemplate(task: ItemTask): TaskTemplate {
  return {
    id: task.id,
    title: task.title,
    timePlanned: task.time,
    priority: task.priority,
    schedule:
      task.whenDo && task.whenDo.length > 0
        ? { type: "weekdays", days: task.whenDo }
        : { type: "weekdays", days: [1, 2, 3, 4, 5, 6, 7] },
    isPlanned: task.isPlanned,
    isDetermined: task.isDetermined,
  };
}

/**
 * Convert TaskTemplate to ItemTask (for backward compat / display).
 * Maps schedule.weekdays → whenDo
 */
export function taskTemplateToItemTask(
  template: TaskTemplate,
  isDone = false
): ItemTask {
  const days: DayNumber[] =
    template.schedule.type === "weekdays"
      ? [...template.schedule.days]
      : [1, 2, 3, 4, 5, 6, 7];
  return {
    id: template.id,
    title: template.title,
    isDone,
    time: template.timePlanned,
    timeDone: 0,
    priority: template.priority,
    isPlanned: template.isPlanned,
    whenDo: days,
    isDetermined: template.isDetermined,
  };
}

/**
 * Convert TaskCategory (tasks) to TaskTemplateCategory (templates)
 */
export function itemsToTemplateItems(items: Items): TemplateItems {
  return items.map((cat) => ({
    id: cat.id,
    title: cat.title,
    templates: cat.tasks.map(itemTaskToTaskTemplate),
  }));
}

/**
 * Convert TemplateItems back to Items (legacy)
 */
export function templateItemsToItems(
  templateItems: TemplateItems,
  getIsDone?: (templateId: UniqueIdentifier) => boolean
): Items {
  return templateItems.map((cat) => ({
    id: cat.id,
    title: cat.title,
    tasks: cat.templates.map((t) =>
      taskTemplateToItemTask(t, getIsDone?.(t.id) ?? false)
    ),
  }));
}
