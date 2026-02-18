import {
  ItemTimeMapKeys,
  TemplateTypeChart,
} from "@/types/analytics/task-analytics.model";
import { TypeAnalyticsPeriod } from "@/types/analytics/task-analytics.model";
import { Items } from "@/types/drag-and-drop.model";
import { useState } from "react";
import ChartTimeCount from "./chart-time-count";
import ChartTimeCategory from "./chart-time-category";
import ChartToogleItem from "./chart-toogle-item";
import SelectPeriodTime from "./select/select-period-time";
import { getSumTime } from "@/services/task-menager/analytics/sum-time";
import { useTranslation } from "react-i18next";
import { AnimatedItem } from "@/components/ui/animated-item";

const TemplateChartsPanel = ({ templateTasks }: { templateTasks: Items }) => {
  const [selectedItem, setSelectedItem] = useState<TemplateTypeChart[]>([]);
  const [period, setPeriod] = useState<TypeAnalyticsPeriod>("all");
  const [t] = useTranslation();
  const hasCharts = getSumTime(templateTasks) > 0;

  const hasPieCharts = selectedItem.some(
    (v) => v === TemplateTypeChart.category || v === TemplateTypeChart.task
  );

  if (!hasCharts) return null;

  return (
    <div className="w-auto">
      <AnimatedItem index={0}>
        <div className="flex flex-col items-center gap-3 mb-8">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("chart.charts_type_label")}
          </p>
          <ChartToogleItem onToggleItems={setSelectedItem} />
        </div>
      </AnimatedItem>
      {hasPieCharts && (
        <AnimatedItem index={1}>
          <div className="flex flex-col items-center gap-3 mb-8 mt-2">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t("chart.pie_charts_period_label")}
            </p>
            <SelectPeriodTime onChange={setPeriod} value={period} />
          </div>
        </AnimatedItem>
      )}
      <div className="flex flex-col gap-4 px-4 sm:px-6">
      {selectedItem.map((item, index) => {
        const idx = hasPieCharts ? index + 2 : index + 1;
        switch (item) {
          case TemplateTypeChart.timeCount:
            return (
              <AnimatedItem key={`${item}-${index}`} index={idx}>
                <div className="max-w-2xl mx-auto w-full">
                  <ChartTimeCount templateTasks={templateTasks} />
                </div>
              </AnimatedItem>
            );
          case TemplateTypeChart.category:
            return (
              <AnimatedItem key={`${item}-${index}`} index={idx}>
                <ChartTimeCategory
                  templateTasks={templateTasks}
                  title="chart.period_count_category_title"
                  type={ItemTimeMapKeys.category}
                  period={period}
                />
              </AnimatedItem>
            );
          case TemplateTypeChart.task:
            return (
              <AnimatedItem key={`${item}-${index}`} index={idx}>
                <ChartTimeCategory
                  templateTasks={templateTasks}
                  title="chart.period_count_task_title"
                  type={ItemTimeMapKeys.task}
                  period={period}
                />
              </AnimatedItem>
            );
          default:
            return null;
        }
      })}
      </div>
    </div>
  );
};

export default TemplateChartsPanel;
