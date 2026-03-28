import { motion, AnimatePresence } from "framer-motion";
import { useHoverStore } from "@/storage/hoverStore";
import { HoverStyleElement } from "@/types/sound";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useHeaderSizeStore } from "@/storage/headerSizeStore";

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
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    setTimeout(() => {
      setHover(false, null, HoverStyleElement.circle);
    }, 100);
  }, [setHover, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="dialog"
          initial={{ opacity: 0, scale: 0.9, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -30 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed left-0 top-0 z-80 flex min-h-dvh w-full justify-center overflow-y-auto chrono-dialog-overlay px-3 md:px-4 items-start md:items-center"
          style={{
            paddingTop: `${headerSize + 12}px`,
            paddingBottom: "12px",
          }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative z-81 flex w-full max-w-lg flex-col overflow-hidden rounded-xl chrono-dialog bg-transparent",
              contentClassName,
              className
            )}
            style={{
              maxHeight: `calc(100dvh - ${headerSize + 88}px)`,
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DialogTask;
