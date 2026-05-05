import { createContext, useContext } from "react";

/** ISO date (yyyy-mm-dd) of the daily board; null for template / unknown. */
export const DailyTimerDayContext = createContext<string | null>(null);

export const useDailyTimerDayId = (): string | null =>
  useContext(DailyTimerDayContext);
