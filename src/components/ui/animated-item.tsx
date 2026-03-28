import { motion } from "motion/react";

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.4,
      ease: [0.22, 0.61, 0.36, 1] as const,
    },
  }),
};

interface AnimatedItemProps {
  children: React.ReactNode;
  index?: number;
  className?: string;
}

/** Wraps content with staggered y + opacity entrance animation */
export function AnimatedItem({ children, index = 0, className }: AnimatedItemProps) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className={className}
    >
      {children}
    </motion.div>
  );
}
