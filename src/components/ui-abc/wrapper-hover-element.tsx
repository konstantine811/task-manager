import { ReactNode, useRef, ElementType, useMemo } from "react";
import { useHoverStore } from "@storage/hoverStore";
import { forwardRef } from "react";
import clsx from "clsx"; // опціонально
import { motion, MotionProps } from "motion/react";

type WrapperHoverElementProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
} & React.HTMLAttributes<HTMLElement> &
  MotionProps;

const WrapperHoverElement = forwardRef<HTMLElement, WrapperHoverElementProps>(
  ({ children, as: Tag = "div", className, ...rest }, forwardedRef) => {
    const internalRef = useRef<HTMLElement>(null!);
    const ref = (forwardedRef as React.RefObject<HTMLElement>) ?? internalRef;
    const setHoverWrapper = useHoverStore((s) => s.setHoverWrapper);
    const MotionTag = useMemo(
      () => motion.create(Tag as ElementType),
      [Tag]
    );

    return (
      <MotionTag
        ref={ref}
        onMouseEnter={() => setHoverWrapper(true)}
        onMouseLeave={() => {
          setHoverWrapper(false);
        }}
        className={clsx(className)}
        {...rest}
      >
        {children}
      </MotionTag>
    );
  }
);

export default WrapperHoverElement;
