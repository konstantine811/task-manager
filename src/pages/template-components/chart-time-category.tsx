import { getItemTimeMapByPeriod } from "@/services/task-menager/analytics/template-handle-data";
import {
  ItemTimeMap,
  ItemTimeMapKeys,
  TypeAnalyticsPeriod,
} from "@/types/analytics/task-analytics.model";
import { Items } from "@/types/drag-and-drop.model";
import { useEffect, useState } from "react";
import SelectPeriodTime from "./select/select-period-time";
import ChartPieItem from "./chart-pie-item";
import ChartTitle from "../chart/chart-title";

const ChartTimeCategory = ({
  templateTasks,
  title,
  type,
}: {
  templateTasks: Items;
  title: string;
  type: ItemTimeMapKeys;
}) => {
  const [analyticsData, setAnalyticsData] = useState<ItemTimeMap>();
  const defaultPeriod: TypeAnalyticsPeriod = "all";
  const [period, setPeriod] = useState<TypeAnalyticsPeriod>(defaultPeriod); // Додано для зберігання вибраного періоду
  useEffect(() => {
    const analyticsData = getItemTimeMapByPeriod(templateTasks, period, type);
    setAnalyticsData(analyticsData);
  }, [templateTasks, period, type]);

  return (
    <>
      {analyticsData && (
        <>
          <div className="flex flex-wrap justify-center items-center gap-2">
            <ChartTitle title={title} />
            <SelectPeriodTime onChange={setPeriod} />
          </div>
          <div className="max-w-md mx-auto">
            <ChartPieItem data={analyticsData} type={type} />
          </div>
        </>
      )}
    </>
  );
};

export default ChartTimeCategory;
