import type { FirstReleaseMetricDefinition } from "@/types/progress.model";

export const FIRST_RELEASE_PROGRESS_METRICS: FirstReleaseMetricDefinition[] = [
  {
    key: "activeDays",
    label: "Active days",
    description: "How many days had real movement in a life area.",
  },
  {
    key: "consistencyScore",
    label: "Consistency score",
    description: "How stable the effort was across the selected period.",
  },
  {
    key: "completedTime",
    label: "Completed time",
    description: "How much focused time was actually invested.",
  },
  {
    key: "completedTasks",
    label: "Completed tasks",
    description: "How many tasks were fully finished in the selected period.",
  },
];
