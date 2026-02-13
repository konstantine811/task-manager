import React, { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";

export const SideMenu: React.FC<{
  overlayColor?: string;
  width?: number;
  children: React.ReactNode;
}> = ({ overlayColor = "bg-background/50", width = 400, children }) => {
  const [isActive, setIsActive] = useState<boolean>(true);
  const controls = useAnimation();

  useEffect(() => {
    controls.start(isActive ? "active" : "inactive");
  }, [isActive, controls]);

  const sidekickBodyStyles = {
    active: { x: 0 },
    inactive: { x: -width },
  };

  const menuHandlerStyles = {
    active: { x: 0, color: "#fff" },
    inactive: { x: 60, color: "#fff" },
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div
        className={`absolute inset-0 ${overlayColor} pointer-events-auto z-0 ${
          isActive ? "block" : "hidden"
        }`}
        onClick={() => setIsActive(false)}
      />

      <motion.div
        className="relative z-10 pointer-events-auto bg-card h-full box-border p-10 flex flex-col"
        style={{ maxWidth: `${width}px` }}
        drag="x"
        dragElastic={0.8}
        dragConstraints={{ left: -width, right: 0 }}
        dragMomentum={false}
        onDragEnd={(_event, info) => {
          const isDraggingLeft = info.offset.x < 0;
          const multiplier = isDraggingLeft ? 1 / 4 : 2 / 3;
          const threshold = width * multiplier;

          if (Math.abs(info.point.x) > threshold && isActive) {
            setIsActive(false);
          } else if (Math.abs(info.point.x) < threshold && !isActive) {
            setIsActive(true);
          } else {
            controls.start(isActive ? "active" : "inactive");
          }
        }}
        animate={controls}
        variants={sidekickBodyStyles}
        transition={{ type: "spring", damping: 30, stiffness: 580 }}
      >
        <motion.button
          onTap={() => setIsActive((s) => !s)}
          className="absolute top-2 right-2 p-2 text-sm font-medium text-foreground"
          variants={menuHandlerStyles}
          transition={{ type: "spring", damping: 30, stiffness: 580 }}
        >
          {isActive ? "Close" : "Open"}
        </motion.button>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </motion.div>
    </div>
  );
};

export default SideMenu;
