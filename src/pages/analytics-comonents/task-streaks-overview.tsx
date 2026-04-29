import { CATEGORY_STYLE, DEFAULT_CATEGORY_STYLE } from "@/components/dnd/config/category-style.config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TaskStreakInsight } from "@/types/analytics/task-analytics.model";
import { useTranslation } from "react-i18next";

const getUkrainianPluralKey = (count: number): "one" | "few" | "many" => {
  const n = Math.abs(count);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "one";
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return "few";
  }
  return "many";
};

const TaskStreaksOverview = ({ data }: { data: TaskStreakInsight[] }) => {
  const { t, i18n } = useTranslation();

  const formatDays = (count: number) => {
    const lang = i18n.language.toLowerCase();
    if (lang.startsWith("uk") || lang.startsWith("ua")) {
      const plural = getUkrainianPluralKey(count);
      return t(`task_manager.analytics.task_streaks.days_${plural}`, { count });
    }
    return t(
      `task_manager.analytics.task_streaks.days_${count === 1 ? "one" : "other"}`,
      { count },
    );
  };

  if (!data.length) return null;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold">
          {t("task_manager.analytics.task_streaks.title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("task_manager.analytics.task_streaks.description")}
        </p>
      </div>

      <Card className="border-white/10 bg-background/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">
            {t("task_manager.analytics.task_streaks.current")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.map((item) => {
            const style = CATEGORY_STYLE[item.categoryId] ?? DEFAULT_CATEGORY_STYLE;
            const Icon = style.icon;

            return (
              <div
                key={item.key}
                className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              >
                <div className="flex min-w-0 items-start gap-2">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.color}`} />
                  <span className="min-w-0 whitespace-normal break-words text-sm font-medium leading-snug">
                    {item.title}
                  </span>
                </div>
                <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground font-mono">
                  {formatDays(item.days)}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
};

export default TaskStreaksOverview;
