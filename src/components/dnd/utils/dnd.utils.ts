import { Items, Priority } from "@/types/drag-and-drop.model";
import {
  defaultDropAnimationSideEffects,
  DropAnimation,
  UniqueIdentifier,
} from "@dnd-kit/core";

export enum PriorityPrefixClass {
  text = "text",
  border = "border",
  from = "from",
}

export const findContainer = (id: UniqueIdentifier, items: Items) => {
  return items.find((cat) => cat.tasks.some((t) => t.id === id))?.id;
};

export const getIndex = (id: UniqueIdentifier, items: Items) => {
  const container = items.find((cat) => cat.tasks.some((t) => t.id === id));

  if (!container) {
    return -1;
  }

  return container.tasks.findIndex((t) => t.id === id);
};

export function getPriorityClassByPrefix(
  priority: Priority,
  type: PriorityPrefixClass = PriorityPrefixClass.text
) {
  switch (priority) {
    case Priority.HIGH:
      return `${type}-destructive`;
    case Priority.MEDIUM:
      return `${type}-accent`;
    case Priority.LOW:
      return `${type}-foreground`;
    default:
      return "";
  }
}

export function getPriorityClassFrom(priority: Priority) {
  switch (priority) {
    case Priority.HIGH:
      return "from-destructive";
    case Priority.MEDIUM:
      return "from-accent";
    case Priority.LOW:
      return "from-foreground";
    default:
      return "";
  }
}

export function getPriorityClassBg(priority: Priority) {
  switch (priority) {
    case Priority.HIGH:
      return "bg-destructive";
    case Priority.MEDIUM:
      return "bg-accent";
    case Priority.LOW:
      return "bg-foreground";
    default:
      return "";
  }
}

export function getPriorityClassForegroundText(priority: Priority) {
  switch (priority) {
    case Priority.HIGH:
      return "text-foreground";
    case Priority.MEDIUM:
      return "text-foreground";
    case Priority.LOW:
      return "text-background";
    default:
      return "";
  }
}

export function getPriorityBorderClass(priority: Priority) {
  switch (priority) {
    case Priority.HIGH:
      return "border-destructive";
    case Priority.MEDIUM:
      return "border-accent";
    case Priority.LOW:
      return "border-foreground";
    default:
      return "";
  }
}

export const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};
