import { motion, AnimatePresence } from "framer-motion";
import { useHoverStore } from "@/storage/hoverStore";
import { HoverStyleElement } from "@/types/sound";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useHeaderSizeStore } from "@/storage/headerSizeStore";
import { createPortal } from "react-dom";

const DialogTask = ({
  isOpen,
  setOpen,
  children,
  className = "p-4",
  contentClassName,
}: {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) => {
  const setHover = useHoverStore((s) => s.setHover);
  const headerSize = useHeaderSizeStore((s) => s.size);

  useEffect(() => {
    setTimeout(() => {
      setHover(false, null, HoverStyleElement.circle);
    }, 100);
  }, [setHover, isOpen]);

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-80 flex h-dvh w-full justify-center overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] chrono-dialog-overlay px-3 md:px-4 items-start md:items-center"
          style={{
            paddingTop: `${headerSize + 12}px`,
            paddingBottom: "12px",
          }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative z-81 flex w-full max-w-lg min-h-0 flex-col overflow-visible rounded-xl chrono-dialog bg-transparent",
              contentClassName,
              className
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
};

export default DialogTask;
