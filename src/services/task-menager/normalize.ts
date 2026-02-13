import { Items, ItemTask, NormalizedTask } from "@/types/drag-and-drop.model";
import { UniqueIdentifier } from "@dnd-kit/core";

export function normalizeItems(items: Items): NormalizedTask[] {
  const result: NormalizedTask[] = [];

  for (const category of items) {
    for (const task of category.tasks) {
      result.push({
        ...task,
        categoryId: category.id,
        categoryName: category.title,
      });
    }
  }

  return result;
}

export function denormalizeItems(normalizedTasks: NormalizedTask[]): Items {
  const map = new Map<
    UniqueIdentifier,
    { id: UniqueIdentifier; title: string; tasks: ItemTask[] }
  >();

  for (const task of normalizedTasks) {
    if (!map.has(task.categoryId)) {
      map.set(task.categoryId, {
        id: task.categoryId,
        title: task.categoryName,
        tasks: [],
      });
    }

    const { tasks } = map.get(task.categoryId)!;

    tasks.push({
      id: task.id,
      title: task.title,
      isDone: task.isDone,
      time: task.time,
      timeDone: task.timeDone,
      priority: task.priority,
      isPlanned: task.isPlanned,
      whenDo: task.whenDo,
      isDetermined: task.isDetermined,
    });
  }

  return Array.from(map.values());
}
