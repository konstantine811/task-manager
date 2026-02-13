import { useState, useEffect } from "react";
import { BreakPoints } from "@/config/adaptive.config";

export const useIsAdoptive = (breakpoint: keyof typeof BreakPoints = "md") => {
  const [isAdoptive, setIsAdoptive] = useState(false);
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      setIsAdoptive(width <= BreakPoints[breakpoint]);
    };

    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, [breakpoint]);

  return {
    isAdoptiveSize: isAdoptive,
    screenWidth,
  };
};
