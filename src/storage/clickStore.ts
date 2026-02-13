import { SoundTypeElement } from "@custom-types/sound";
import { create } from "zustand";

interface ClickState {
  clickTypeElement: SoundTypeElement | null;
  setClick: (clickType: SoundTypeElement) => void;
}

export const useClickStore = create<ClickState>((set) => ({
  clickTypeElement: null,
  setClick: (clickType: SoundTypeElement) => {
    // Sound functionality can be added later if needed
    set({
      clickTypeElement: clickType,
    });
  },
}));
