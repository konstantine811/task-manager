import { HoverStyleElement, SoundTypeElement } from "@/types/sound";
import { create } from "zustand";

interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface HoverState {
  isHovering: boolean;
  boundingBox: BoundingBox | null;
  hoverTypeElement: SoundTypeElement | null;
  hoverStyleElement: HoverStyleElement;
  isHoveringWrapper: boolean;
  setHoverType: (hoverType: SoundTypeElement) => void;
  setHover: (
    hovering: boolean,
    hoverType: SoundTypeElement | null,
    hoverStyle: HoverStyleElement,
    box?: BoundingBox
  ) => void;
  setHoverWrapper: (hovering: boolean) => void;
  setHoverStyle: (hoverStyle: HoverStyleElement) => void;
}

let lastHoverState = {
  isHovering: false,
  hoverTypeElement: null as SoundTypeElement | null,
  hoverStyleElement: HoverStyleElement.circle,
};

export const useHoverStore = create<HoverState>((set) => ({
  isHovering: false,
  boundingBox: null,
  hoverTypeElement: null,
  hoverStyleElement: HoverStyleElement.circle,
  isHoveringWrapper: false,
  setHoverStyle: (hoverStyle: HoverStyleElement) =>
    set({ hoverStyleElement: hoverStyle }),
  setHover: (hovering, hoverType, hoverStyle, box) => {
    if (
      hovering === lastHoverState.isHovering &&
      hoverType === lastHoverState.hoverTypeElement &&
      hoverStyle === lastHoverState.hoverStyleElement
    ) {
      return;
    }

    lastHoverState = {
      isHovering: hovering,
      hoverTypeElement: hoverType,
      hoverStyleElement: hoverStyle,
    };

    set({
      isHovering: hovering,
      hoverTypeElement: hoverType,
      hoverStyleElement: hoverStyle,
      boundingBox: box ?? null,
    });
  },
  setHoverWrapper: (hovering) => set({ isHoveringWrapper: hovering }),
  setHoverType: (hoverType) => set({ hoverTypeElement: hoverType }),
}));
