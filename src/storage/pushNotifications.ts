import { create } from "zustand";

export type PushNotificationsStatus =
  | "idle"
  | "unsupported"
  | "permission_denied"
  | "registered"
  | "error";

interface PushNotificationsState {
  status: PushNotificationsStatus;
  token: string | null;
  lastError: string | null;
  setStatus: (
    status: PushNotificationsStatus,
    token?: string | null,
    lastError?: string | null,
  ) => void;
}

export const usePushNotificationsStore = create<PushNotificationsState>((set) => ({
  status: "idle",
  token: null,
  lastError: null,
  setStatus: (status, token = null, lastError = null) =>
    set({ status, token, lastError }),
}));
