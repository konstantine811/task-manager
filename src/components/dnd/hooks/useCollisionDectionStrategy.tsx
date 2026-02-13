import { Items } from "@/types/drag-and-drop.model";
import {
  closestCenter,
  CollisionDetection,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
  UniqueIdentifier,
} from "@dnd-kit/core";
import { useCallback } from "react";
import { TRASH_ID } from "../config/dnd.config";

const useCollisionDectionStrategy = ({
  activeId,
  items,
  lastOverId,
  recentlyMovedToNewContainer,
}: {
  activeId: UniqueIdentifier | null;
  items: Items;
  lastOverId: React.RefObject<UniqueIdentifier | null>;
  recentlyMovedToNewContainer: React.RefObject<boolean>;
}) => {
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      const categoryIds = items.map((cat) => cat.id);

      if (activeId && categoryIds.includes(activeId)) {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((container) =>
            categoryIds.includes(container.id)
          ),
        });
      }

      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0
          ? pointerIntersections
          : rectIntersection(args);

      let overId = getFirstCollision(intersections, "id");

      if (overId != null) {
        if (overId === TRASH_ID) {
          return intersections;
        }

        const matchedCategory = items.find((cat) => cat.id === overId);

        if (matchedCategory) {
          if (matchedCategory.tasks.length > 0) {
            const closest = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (container) =>
                  matchedCategory.tasks.some((t) => t.id === container.id)
              ),
            });

            overId = closest[0]?.id ?? overId;
          }

          // ✅ Важливо: дозволяємо дропнути на порожню категорію
          lastOverId.current = matchedCategory.id;
          return [{ id: matchedCategory.id }];
        }

        lastOverId.current = overId;
        return [{ id: overId }];
      }

      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = activeId;
      }

      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [activeId, items, lastOverId, recentlyMovedToNewContainer]
  );

  return collisionDetectionStrategy;
};

export default useCollisionDectionStrategy;
