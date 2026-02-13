import { Container } from "@/components/dnd/container";
import { TaskItem } from "@/components/dnd/task-item";
import { CATEGORY_OPTIONS } from "@/components/dnd/config/category-options";
import type { Items } from "@/types/drag-and-drop.model";

type SuggestedTasksPreviewProps = {
  items: Items;
};

/** Відображення запропонованих задач за категоріями — як у шаблоні */
export function SuggestedTasksPreview({ items }: SuggestedTasksPreviewProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-6">
      {items.map((category) => (
        <Container
          key={String(category.id)}
          label={String(category.id)}
          options={CATEGORY_OPTIONS}
          readOnly
        >
          {category.tasks.map((task, idx) => (
            <li key={task.id}>
              <TaskItem
                index={idx}
                task={task}
                templated
                readOnly
              />
            </li>
          ))}
        </Container>
      ))}
    </div>
  );
}
