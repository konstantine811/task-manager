import { create } from "zustand";

const ENTERED_APP_SESSION_KEY = "life-focus_entered_app_session";

const readHasEnteredAppThisSession = (): boolean => {
  try {
    return sessionStorage.getItem(ENTERED_APP_SESSION_KEY) === "1";
  } catch {
    return true;
  }
};

const writeHasEnteredAppThisSession = () => {
  try {
    sessionStorage.setItem(ENTERED_APP_SESSION_KEY, "1");
  } catch {
    /* private mode */
  }
};

interface AppSessionState {
  hasEnteredAppThisSession: boolean;
  markEnteredAppThisSession: () => void;
}

export const useAppSessionStore = create<AppSessionState>((set) => ({
  hasEnteredAppThisSession: readHasEnteredAppThisSession(),
  markEnteredAppThisSession: () => {
    writeHasEnteredAppThisSession();
    set({ hasEnteredAppThisSession: true });
  },
}));

export const hasEnteredAppThisSessionSnapshot = () =>
  useAppSessionStore.getState().hasEnteredAppThisSession;

export const markEnteredAppThisSessionSnapshot = () =>
  useAppSessionStore.getState().markEnteredAppThisSession();
