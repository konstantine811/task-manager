import type { TaskCategoryKey } from "@/services/ai/gemini.types";

/** Один елемент задачі в стартовому пакеті */
export interface StarterPackTask {
  titleKey: string;
  category: TaskCategoryKey;
  timeMinutes: number;
  days: number[]; // 1-7
}

export interface StarterPack {
  id: string;
  nameKey: string;
  descriptionKey: string;
  tasks: StarterPackTask[];
}

export const starterPacks: StarterPack[] = [
  {
    id: "order",
    nameKey: "quick_start.pack.order.name",
    descriptionKey: "quick_start.pack.order.desc",
    tasks: [
      {
        titleKey: "quick_start.pack.order.task_inbox",
        category: "leisure",
        timeMinutes: 5,
        days: [1, 2, 3, 4, 5],
      },
      {
        titleKey: "quick_start.pack.order.task_plan",
        category: "leisure",
        timeMinutes: 5,
        days: [1, 2, 3, 4, 5],
      },
      {
        titleKey: "quick_start.pack.order.task_clean",
        category: "leisure",
        timeMinutes: 10,
        days: [1, 2, 3, 4, 5],
      },
    ],
  },
  {
    id: "health",
    nameKey: "quick_start.pack.health.name",
    descriptionKey: "quick_start.pack.health.desc",
    tasks: [
      {
        titleKey: "quick_start.pack.health.task_walk",
        category: "health",
        timeMinutes: 15,
        days: [1, 2, 3, 4, 5, 6, 7],
      },
      {
        titleKey: "quick_start.pack.health.task_stretch",
        category: "health",
        timeMinutes: 10,
        days: [1, 2, 3, 4, 5],
      },
      {
        titleKey: "quick_start.pack.health.task_water",
        category: "health",
        timeMinutes: 2,
        days: [1, 2, 3, 4, 5, 6, 7],
      },
      {
        titleKey: "quick_start.pack.health.task_sleep",
        category: "health",
        timeMinutes: 3,
        days: [1, 2, 3, 4, 5, 6, 7],
      },
    ],
  },
  {
    id: "focus",
    nameKey: "quick_start.pack.focus.name",
    descriptionKey: "quick_start.pack.focus.desc",
    tasks: [
      {
        titleKey: "quick_start.pack.focus.task_deep",
        category: "career",
        timeMinutes: 60,
        days: [1, 3, 5],
      },
      {
        titleKey: "quick_start.pack.focus.task_prep",
        category: "career",
        timeMinutes: 10,
        days: [1, 2, 3, 4, 5],
      },
    ],
  },
  {
    id: "learning",
    nameKey: "quick_start.pack.learning.name",
    descriptionKey: "quick_start.pack.learning.desc",
    tasks: [
      {
        titleKey: "quick_start.pack.learning.task_lesson",
        category: "personal_growth",
        timeMinutes: 20,
        days: [1, 3, 5],
      },
      {
        titleKey: "quick_start.pack.learning.task_practice",
        category: "personal_growth",
        timeMinutes: 15,
        days: [2, 4],
      },
      {
        titleKey: "quick_start.pack.learning.task_notes",
        category: "personal_growth",
        timeMinutes: 10,
        days: [6],
      },
    ],
  },
  {
    id: "family",
    nameKey: "quick_start.pack.family.name",
    descriptionKey: "quick_start.pack.family.desc",
    tasks: [
      {
        titleKey: "quick_start.pack.family.task_daily",
        category: "relationships",
        timeMinutes: 30,
        days: [1, 2, 3, 4, 5, 6, 7],
      },
      {
        titleKey: "quick_start.pack.family.task_weekend",
        category: "relationships",
        timeMinutes: 90,
        days: [6, 7],
      },
    ],
  },
];
