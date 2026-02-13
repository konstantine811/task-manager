import { TemplateTypeChart } from "@/types/analytics/task-analytics.model";
import { ChartColumn, ChartPie } from "lucide-react";

const useAnalyticsConfig = () => {
  const analyticsConfig = {
    [TemplateTypeChart.category]: {
      title: "chart.period_count_category_title",
      icon: <ChartPie className="h-4" />,
    },
    [TemplateTypeChart.task]: {
      title: "chart.period_count_task_title",
      icon: <ChartPie className="h-4" />,
    },
    [TemplateTypeChart.timeCount]: {
      title: "chart.period_count_person_title",
      icon: <ChartColumn className="h-4" />,
    },
  };

  return analyticsConfig;
};

export default useAnalyticsConfig;
