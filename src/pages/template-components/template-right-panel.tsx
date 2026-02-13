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
import { AiAssistantPanel } from "@/components/ai/ai-assistant-panel";
import { useTranslation } from "react-i18next";

const TemplateRightPanel = ({
  templateTasks,
  onReplaceTasks,
}: {
  templateTasks: Items;
  onReplaceTasks?: (items: Items) => void;
}) => {
  const [selectedItem, setSelectedItem] = useState<TemplateTypeChart[]>([]);
  const [period, setPeriod] = useState<TypeAnalyticsPeriod>("all");
  const [t] = useTranslation();
  const hasCharts = getSumTime(templateTasks) > 0;
  const hasPieCharts = selectedItem.some(
    (v) => v === TemplateTypeChart.category || v === TemplateTypeChart.task
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pt-8 w-full">
      {/* Ліва сторона — графіки */}
      {hasCharts && (
        <div className="flex-1 min-w-0 lg:max-w-[55%]">
          <div>
            <div className="flex flex-col items-center gap-3 mb-8">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t("chart.charts_type_label")}
              </p>
              <ChartToogleItem onToggleItems={setSelectedItem} />
            </div>
            {hasPieCharts && (
              <div className="flex flex-col items-center gap-3 mb-8 mt-2">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t("chart.pie_charts_period_label")}
                </p>
                <SelectPeriodTime onChange={setPeriod} value={period} />
              </div>
            )}
            <div className="flex flex-col gap-4">
            {selectedItem.map((item) => {
              switch (item) {
                case TemplateTypeChart.timeCount:
                  return (
                    <ChartTimeCount templateTasks={templateTasks} key={item} />
                  );
                case TemplateTypeChart.category:
                  return (
                    <ChartTimeCategory
                      templateTasks={templateTasks}
                      title="chart.period_count_category_title"
                      type={ItemTimeMapKeys.category}
                      period={period}
                      key={item}
                    />
                  );
                case TemplateTypeChart.task:
                  return (
                    <ChartTimeCategory
                      templateTasks={templateTasks}
                      title="chart.period_count_task_title"
                      type={ItemTimeMapKeys.task}
                      period={period}
                      key={item}
                    />
                  );
                default:
                  return null;
              }
            })}
            </div>
          </div>
        </div>
      )}

      {/* Права сторона — AI помічник */}
      <div className="flex-1 min-w-0 lg:min-w-[320px]">
        <AiAssistantPanel
          templateTasks={templateTasks}
          onReplaceTasks={onReplaceTasks}
        />
      </div>
    </div>
  );
};

export default TemplateRightPanel;
