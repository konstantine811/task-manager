import { UniqueIdentifier, useDroppable } from "@dnd-kit/core";
import { Trash2 } from "lucide-react";

const Trash = ({ id }: { id: UniqueIdentifier }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      className={`${
        isOver ? "bg-destructive/30" : "bg-background/30"
      } fixed left-0  top-1/2 translate-y-[-50%] w-8 my-auto h-1/2 border rounded-lg flex items-center justify-center  text-2xl z-50 mb-5 border-destructive/30 text-destructive  transition-all duration-100`}
      ref={setNodeRef}
    >
      <Trash2 />
    </div>
  );
};

export default Trash;
