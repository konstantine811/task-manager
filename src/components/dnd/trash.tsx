import { UniqueIdentifier, useDroppable } from "@dnd-kit/core";
import { Trash2 } from "lucide-react";

const Trash = ({ id }: { id: UniqueIdentifier }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center z-50 transition-all duration-200 ${
        isOver
          ? "bg-red-500/30 text-red-400 shadow-[0_0_24px_rgba(239,68,68,0.5)] scale-110"
          : "bg-white/5 text-zinc-500"
      }`}
      ref={setNodeRef}
    >
      <Trash2 className="w-6 h-6" />
    </div>
  );
};

export default Trash;
