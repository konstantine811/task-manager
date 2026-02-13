import { create } from "zustand";

interface HeaderSizeState {
  size: number;
  setSize: (size: number) => void;
}

export const useHeaderSizeStore = create<HeaderSizeState>((set) => ({
  size: 0,
  setSize: (size) => set({ size }),
}));
