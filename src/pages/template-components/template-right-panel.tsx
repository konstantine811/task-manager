import {
  ItemTimeMapKeys,
  TemplateTypeChart,
} from "@/types/analytics/task-analytics.model";
import { Items } from "@/types/drag-and-drop.model";
import { useState } from "react";
import { useHeaderSizeStore } from "@/storage/headerSizeStore";
import ChartTimeCount from "./chart-time-count";
import ChartTimeCategory from "./chart-time-category";
import ChartToogleItem from "./chart-toogle-item";
import { getSumTime } from "@/services/task-menager/analytics/sum-time";

const TemplateRightPanel = ({ templateTasks }: { templateTasks: Items }) => {
  const [selectedItem, setSelectedItem] = useState<TemplateTypeChart[]>([]);
  const hS = useHeaderSizeStore((s) => s.size);
  return (
    <>
      {getSumTime(templateTasks) > 0 && (
        <div className="w-auto pt-8 sticky top-0" style={{ top: `${hS}px` }}>
          <div className="flex justify-center mb-2">
            <ChartToogleItem onToggleItems={setSelectedItem} />
          </div>
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
                    key={item}
                  />
                );
              case TemplateTypeChart.task:
                return (
                  <ChartTimeCategory
                    templateTasks={templateTasks}
                    title="chart.period_count_task_title"
                    type={ItemTimeMapKeys.task}
                    key={item}
                  />
                );
              default:
                return null;
            }
          })}
        </div>
      )}
    </>
  );
};

export default TemplateRightPanel;
