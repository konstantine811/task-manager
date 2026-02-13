import { create } from "zustand";

interface SoundEnabledState {
  isSoundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export const useSoundEnabledStore = create<SoundEnabledState>((set) => ({
  isSoundEnabled: true,
  setSoundEnabled: (enabled) => set({ isSoundEnabled: enabled }),
}));
