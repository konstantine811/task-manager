import {
  Items,
  ItemTaskCategory,
  NormalizedTask,
} from "@/types/drag-and-drop.model";
import { UniqueIdentifier } from "@dnd-kit/core";
import { denormalizeItems, normalizeItems } from "./normalize";
import { CATEGORY_OPTIONS } from "@/components/dnd/config/category-options";
import i18n from "i18next";

const normalizeCategoryLabel = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const resolveCategoryKey = (raw: string) => {
  const value = raw.trim();
  if (!value) return value;

  if (CATEGORY_OPTIONS.includes(value)) return value;

  const normalized = normalizeCategoryLabel(value);

  for (const key of CATEGORY_OPTIONS) {
    if (normalizeCategoryLabel(key) === normalized) return key;
    const uaLabel = i18n.t(`task_manager.categories.${key}`, { lng: "ua" });
    if (normalizeCategoryLabel(uaLabel) === normalized) return key;
    const enLabel = i18n.t(`task_manager.categories.${key}`, { lng: "en" });
    if (normalizeCategoryLabel(enLabel) === normalized) return key;
  }

  return normalized;
};

export function mergeItemsDeep(base: Items, incoming: Items): Items {
  const baseN = normalizeItems(base);
  const baseNIds = new Set(baseN.map((task) => task.id));
  const incomingN = normalizeItems(incoming);

  incomingN.forEach((incomingTask) => {
    if (!baseNIds.has(incomingTask.id)) {
      const incomingCategoryKey = resolveCategoryKey(incomingTask.categoryName);
      const existingCategoryTask = baseN.find(
        (task) => resolveCategoryKey(task.categoryName) === incomingCategoryKey,
      );
      if (existingCategoryTask) {
        baseN.push({
          ...incomingTask,
          categoryId: existingCategoryTask.categoryId,
          categoryName: existingCategoryTask.categoryName,
        });
      } else {
        baseN.push(incomingTask);
      }
    }
  });

  return denormalizeItems(baseN);
}

export function addNewTask(base: Items, incoming: NormalizedTask): Items {
  const baseN = normalizeItems(base);
  const finded = baseN.find((task) => task.id === incoming.id);
  if (!finded) {
    const incomingCategoryKey = resolveCategoryKey(incoming.categoryName);
    const existingCategoryTask = baseN.find(
      (task) => resolveCategoryKey(task.categoryName) === incomingCategoryKey,
    );
    if (existingCategoryTask) {
      baseN.push({
        ...incoming,
        categoryId: existingCategoryTask.categoryId,
        categoryName: existingCategoryTask.categoryName,
      });
    } else {
      baseN.push(incoming);
    }
  }
  return denormalizeItems(baseN);
}

export function findPlannedOrDeterminedTask(task: Items): NormalizedTask[] {
  const taskN = normalizeItems(task);
  return taskN.filter((t) => t.isPlanned || t.isDetermined);
}

export function mergeItemsWithPlannedTasks(
  items: Items | null,
  plannedTasks: ItemTaskCategory[]
): Items {
  const result: Items = items
    ? items.map((category) => ({
        ...category,
        tasks: [...category.tasks],
      }))
    : [];

  plannedTasks.forEach((task) => {
    const categoryName = task.categoryName?.trim() || "";
    const plannedCategoryKey = resolveCategoryKey(categoryName);

    let existingCategory = result.find(
      (c) => resolveCategoryKey(c.title) === plannedCategoryKey
    );

    if (!existingCategory) {
      const canonicalTitle = CATEGORY_OPTIONS.includes(plannedCategoryKey)
        ? plannedCategoryKey
        : categoryName;
      existingCategory = {
        id: `cat-${Date.now()}-${Math.random()}`,
        title: canonicalTitle,
        tasks: [],
      };
      result.push(existingCategory);
    }

    const exists = existingCategory.tasks.some((t) => t.id === task.id);
    if (!exists) {
      existingCategory.tasks.push({
        id: task.id as UniqueIdentifier,
        title: task.title,
        isDone: task.isDone,
        time: task.time,
        timeDone: task.timeDone,
        priority: task.priority,
        isPlanned: true,
        whenDo: task.whenDo || [],
        isDetermined: task.isDetermined || false,
        schedule: task.schedule,
      });
    }
  });

  return result;
}
