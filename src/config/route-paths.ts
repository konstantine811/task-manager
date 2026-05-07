import { format } from "date-fns";
import { DateTemplate } from "@/config/data-config";

export const ROUTES = {
  HOME: "/",
  APP: "/app",
  TEMPLATE: "/app/template",
  DAILY: "/app/daily",
  DAILY_ID: "/app/daily/:id",
  ANALYTICS: "/app/analytics",
  BILLING: "/app/billing",
} as const;

export const getTodayDailyRoute = () =>
  `${ROUTES.DAILY}/${format(new Date(), DateTemplate.dayMonthYear)}`;
