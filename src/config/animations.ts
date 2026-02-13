import { Transition } from "motion/react";

export const EASING_ANIMATION = {
  easeOutExpo: [0.16, 1, 0.3, 1],
};

export const MOTION_FRAME_TRANSITION: Record<string, Transition> = {
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 20,
    bounce: 10,
  },
  spring2: {
    type: "spring",
    stiffness: 50,
    damping: 3,
    bounce: 1,
    mass: 0.3,
  },
  spring3: {
    type: "spring",
    stiffness: 100,
    damping: 40,
  },
  spring4: {
    type: "spring",
    stiffness: 70,
    damping: 20,
    bounce: 0.1,
  },
};
