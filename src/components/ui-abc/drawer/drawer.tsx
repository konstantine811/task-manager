import {
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { createContext, useContext, useEffect, useState } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { MOTION_FRAME_TRANSITION } from "@/config/animations";

export type DrawerDirection = "right" | "top" | "bottom" | "left";
const DrawerContext = createContext<{
  direction: "right" | "top" | "bottom" | "left";
  open: boolean;
  setOpen: (v: boolean) => void;
}>({
  direction: "right",
  open: false,
  setOpen: () => {},
});

export const Drawer = ({
  direction = "right",
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  direction?: DrawerDirection;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"; // 🛑 блокує scroll
    } else {
      document.body.style.overflow = ""; // ✅ повертає назад
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <DrawerContext.Provider value={{ direction, open, setOpen }}>
      {children}
    </DrawerContext.Provider>
  );
};

export const DrawerTrigger = ({ children }: { children: React.ReactNode }) => {
  const { setOpen } = useContext(DrawerContext);
  return <div onClick={() => setOpen(true)}>{children}</div>;
};

export const DrawerClose = ({ children }: { children: React.ReactNode }) => {
  const { setOpen } = useContext(DrawerContext);
  return <div onClick={() => setOpen(false)}>{children}</div>;
};

const drawerContentVariants = cva(
  "fixed z-[1000] flex h-auto  w-full h-full justify-end",
  {
    variants: {
      direction: {
        right: "top-0 bottom-0 right-0",
        left: "top-0 bottom-0 left-0",
        top: "top-0 left-0 right-0 h-64",
        bottom: "bottom-0 left-0 right-0 h-64",
      },
    },
    defaultVariants: {
      direction: "right",
    },
  }
);

export const DrawerContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { open, setOpen, direction } = useContext(DrawerContext);
  const controls = useDragControls();
  const x = useMotionValue(100);
  const opacity = useTransform(x, [-140, 0, 140], [0, 1, 0]);
  const getInitial = () => {
    switch (direction) {
      case "right":
        return { x: 400 };
      case "left":
        return { x: 100 };
      case "top":
        return { y: -100 };
      case "bottom":
        return { y: 100 };
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset w-full h-full bg-background/10 backdrop-blur-xs left-0 top-0 z-[1000]"
            style={{ opacity }}
          ></motion.div>
          <motion.div
            className={cn(
              drawerContentVariants({ direction }),
              className,
              "touch-none z-[10000]"
            )}
            animate={{ x: 0 }}
            exit={getInitial()}
            transition={MOTION_FRAME_TRANSITION.spring3}
            style={{ x }}
            drag="x"
            onClick={(e) => e.stopPropagation()}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={{
              left: 0,
              right: 2,
              top: 0,
              bottom: 0,
            }}
            dragControls={controls}
            onDragEnd={() => {
              if (x.get() > 140) {
                setOpen(false);
              }
            }}
          >
            <motion.div
              className="fixed inset w-full h-full left-0 top-0"
              onClick={() => {
                setOpen(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className="max-w-md w-full relative bg-card flex justify-center h-full ml-18"
            >
              <button
                className="w-8 h-full ml-1 !bg-transparent relative z-50 touch-none cursor-grab"
                onPointerDown={(e) => {
                  controls.start(e);
                }}
              >
                <div className="fixed ml-1 w-1 h-14 rounded-md bg-muted-foreground"></div>
              </button>
              {children}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const DrawerHeader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { setOpen } = useContext(DrawerContext);
  return (
    <div className={cn("py-4 flex gap-2 justify-between", className)}>
      <div>{children}</div>
      <div className="fixed top-3 right-3 z-50">
        <Button
          variant="outline"
          onClick={() => {
            setOpen(false);
          }}
          className="rounded-full h-10 w-10 border-foreground/10 bg-background/50 backdrop-blur-md"
        >
          <X />
        </Button>
      </div>
    </div>
  );
};

export const DrawerFooter = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("p-4 border-t mt-auto", className)}>{children}</div>;

export const DrawerTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <h2 className={cn("text-lg font-bold", className)}>{children}</h2>;

export const DrawerDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
);
