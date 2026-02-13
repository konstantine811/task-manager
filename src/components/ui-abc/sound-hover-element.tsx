import { ReactNode, useRef, ElementType, memo } from "react";
import { useHoverStore } from "@storage/hoverStore";
import { HoverStyleElement, SoundTypeElement } from "@custom-types/sound";
import { forwardRef } from "react";
import clsx from "clsx"; // опціонально
import { motion, MotionProps } from "motion/react";
import { MOTION_FRAME_TRANSITION } from "@config/animations";
import { useClickStore } from "@/storage/clickStore";
import { useSoundEnabledStore } from "@/storage/soundEnabled";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SoundHoverElementProps = {
  children: ReactNode;
  hoverTypeElement?: SoundTypeElement;
  as?: ElementType;
  className?: string;
  hoverAnimType?: "scale" | "rotate" | "translate" | "translate-x"; // тип анімації при наведенні
  animValue?: number;
  hoverStyleElement?: HoverStyleElement;
  onClick?: (e: Event) => void;
  tooltipText?: string;
} & React.HTMLAttributes<HTMLElement> &
  MotionProps;

const SoundHoverElement = forwardRef<HTMLElement, SoundHoverElementProps>(
  (
    {
      children,
      hoverTypeElement = SoundTypeElement.BUTTON,
      as: Tag = "div",
      className,
      hoverAnimType = "scale",
      animValue = 1.1,
      hoverStyleElement = HoverStyleElement.circle,
      onClick,
      tooltipText,
      ...rest
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLElement>(null!);
    const ref = (forwardedRef as React.RefObject<HTMLElement>) ?? internalRef;
    const setHover = useHoverStore((s) => s.setHover);
    const setHoverStyle = useHoverStore((s) => s.setHoverStyle);
    const setClick = useClickStore((s) => s.setClick);
    const isSoundEnabled = useSoundEnabledStore(
      (state) => state.isSoundEnabled
    );
    const MotionTag = motion.create(Tag as ElementType);
    const hoverTransition = MOTION_FRAME_TRANSITION.spring;
    const handleMouseEnter = () => {
      setTimeout(() => {
        const rect = ref.current?.getBoundingClientRect?.();
        if (rect) {
          setHover(true, hoverTypeElement, hoverStyleElement, {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });
        }
      }, 0);
    };

    const handleMouseLeave = () => {
      setHover(false, hoverTypeElement, hoverStyleElement);
    };

    function getHoverTypeAnimation() {
      switch (hoverAnimType) {
        case "scale":
          return {
            scale: animValue,
            transition: hoverTransition,
          };
        case "translate":
          return {
            y: animValue,
            transition: hoverTransition,
          };
        case "translate-x":
          return {
            x: animValue,
            transition: hoverTransition,
          };
        case "rotate":
          return {
            rotate: animValue,
            transition: hoverTransition,
          };
        default:
          return {};
      }
    }

    return (
      <MotionTag
        ref={ref}
        onHoverStart={handleMouseEnter} // 🧠 замість onMouseEnter
        onHoverEnd={handleMouseLeave}
        className={clsx(className)}
        onClick={(e: Event) => {
          handleMouseLeave();
          if (onClick) {
            onClick(e);
            setHoverStyle(HoverStyleElement.circle);
            if (isSoundEnabled) {
              setClick(hoverTypeElement);
            }
          }
        }}
        whileHover={getHoverTypeAnimation()}
        {...rest}
      >
        {tooltipText ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>{children}</TooltipTrigger>
              <TooltipContent>
                <p className="text-background">{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          children
        )}
      </MotionTag>
    );
  }
);

export default memo(SoundHoverElement);
