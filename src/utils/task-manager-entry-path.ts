import { format } from "date-fns";
import { loadTemplateTasks } from "@/services/firebase/taskManagerData";
import { DateTemplate } from "@/config/data-config";
import { ROUTES } from "@/config/route-paths";

/**
 * Куди вести залогіненого користувача: щоденні (сьогодні), якщо шаблон не порожній, інакше — редактор шаблону.
 */
export async function getTaskManagerEntryPath(): Promise<string> {
  try {
    const items = await loadTemplateTasks();
    const today = format(new Date(), DateTemplate.dayMonthYear);
    const hasTemplates =
      !!items?.length && items.some((c) => c.tasks && c.tasks.length > 0);
    return hasTemplates ? `${ROUTES.DAILY}/${today}` : ROUTES.TEMPLATE;
  } catch {
    return ROUTES.TEMPLATE;
  }
}
