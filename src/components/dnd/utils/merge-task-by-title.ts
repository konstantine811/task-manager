import { ItemTask } from "@/types/drag-and-drop.model";

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

function findIndexByTitle(tasks: ItemTask[], title: string): number {
  const norm = normalizeTitle(title);
  return tasks.findIndex((t) => normalizeTitle(t.title) === norm);
}

/**
 * Merges newTask into existing task with same title.
 * Merge: time, whenDo, schedule from newTask; preserves id.
 * Returns the merged task, or null if no match.
 */
export function mergeTaskInto(
  existing: ItemTask,
  newTask: ItemTask
): ItemTask {
  return {
    ...existing,
    time: Number(newTask.time) || 0,
    whenDo: (newTask.whenDo?.length
      ? newTask.whenDo
      : existing.whenDo ?? []) as (1 | 2 | 3 | 4 | 5 | 6 | 7)[],
    schedule: newTask.schedule ?? existing.schedule,
    isDetermined: newTask.isDetermined ?? existing.isDetermined,
    isPlanned: newTask.isPlanned ?? existing.isPlanned,
    priority: newTask.priority ?? existing.priority,
  };
}

/**
 * Merges newTask into existing task with same title, or appends newTask.
 * For inserting at a specific index, use findIndexByTitle + mergeTaskInto + manual insert.
 */
export function mergeOrAddTask(
  tasks: ItemTask[],
  newTask: ItemTask
): ItemTask[] {
  const existingIndex = findIndexByTitle(tasks, newTask.title);

  if (existingIndex >= 0) {
    const merged = mergeTaskInto(tasks[existingIndex], newTask);
    const next = [...tasks];
    next[existingIndex] = merged;
    return next;
  }

  return [...tasks, newTask];
}

/**
 * Merges newTask into tasks at existingIndex, or inserts at insertIndex.
 */
export function mergeOrInsertAt(
  tasks: ItemTask[],
  newTask: ItemTask,
  insertIndex: number
): ItemTask[] {
  const existingIndex = findIndexByTitle(tasks, newTask.title);

  if (existingIndex >= 0) {
    const merged = mergeTaskInto(tasks[existingIndex], newTask);
    const next = [...tasks];
    next[existingIndex] = merged;
    return next;
  }

  return [
    ...tasks.slice(0, insertIndex),
    newTask,
    ...tasks.slice(insertIndex),
  ];
}
