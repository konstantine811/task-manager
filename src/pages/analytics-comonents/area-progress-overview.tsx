import {
  DEFAULT_CATEGORY_STYLE,
  CATEGORY_STYLE,
} from "@/components/dnd/config/category-style.config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { AreaProgress, ProgressTrend } from "@/types/progress.model";

const TREND_STYLES: Record<ProgressTrend, string> = {
  up: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  flat: "text-muted-foreground border-white/10 bg-white/5",
  down: "text-rose-400 border-rose-500/30 bg-rose-500/10",
};

const AreaProgressOverview = ({ data }: { data: AreaProgress[] }) => {
  const { t, i18n } = useTranslation();

  const sortedData = useMemo(
    () =>
      [...data].sort((a, b) => {
        if (b.completedTime !== a.completedTime) {
          return b.completedTime - a.completedTime;
        }
        return b.activeDays - a.activeDays;
      }),
    [data]
  );

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold">
          {t("task_manager.analytics.area_progress.title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("task_manager.analytics.area_progress.description")}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {sortedData.map((item) => {
          const style = CATEGORY_STYLE[item.areaId] ?? DEFAULT_CATEGORY_STYLE;
          const Icon = style.icon;
          const completionRatio =
            item.plannedTime > 0
              ? Math.min(100, Math.round((item.completedTime / item.plannedTime) * 100))
              : 0;

          return (
            <Card key={item.areaId} className="border-white/10 bg-background/60 backdrop-blur">
              <CardHeader className="gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                      <Icon className={cn("h-4 w-4", style.color)} />
                    </div>
                    <div>
                      <CardTitle>
                        {t(`task_manager.categories.${item.areaId}`)}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("task_manager.analytics.area_progress.last_activity")}{" "}
                        {item.lastActivityAt
                          ? new Date(item.lastActivityAt).toLocaleDateString(i18n.language)
                          : t("task_manager.analytics.area_progress.no_activity")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
                      TREND_STYLES[item.trend]
                    )}
                  >
                    {t(`task_manager.analytics.area_progress.trend.${item.trend}`)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="text-xs text-muted-foreground">
                      {t("task_manager.analytics.area_progress.consistency")}
                    </p>
                    <p className="mt-1 text-2xl font-semibold">{item.consistencyScore}%</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="text-xs text-muted-foreground">
                      {t("task_manager.analytics.area_progress.active_days")}
                    </p>
                    <p className="mt-1 text-2xl font-semibold">{item.activeDays}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="text-xs text-muted-foreground">
                      {t("task_manager.analytics.area_progress.completed_tasks")}
                    </p>
                    <p className="mt-1 text-2xl font-semibold">{item.completedTasks}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="text-xs text-muted-foreground">
                      {t("task_manager.analytics.area_progress.completed_time")}
                    </p>
                    <p className="mt-1 text-2xl font-semibold">{item.completedTime}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {t("task_manager.analytics.area_progress.time_completion")}
                    </span>
                    <span className="font-medium">
                      {item.completedTime} / {item.plannedTime} min
                    </span>
                  </div>
                  <Progress value={completionRatio} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default AreaProgressOverview;
