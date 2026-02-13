import { TemplateTypeChart } from "@/types/analytics/task-analytics.model";
import useAnalyticsConfig from "@/config/task-menager/analytics.config";
import { ChartPie } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Reorder } from "framer-motion";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

const ChartCheckboxSort = ({
  onToggleItems,
}: {
  onToggleItems: (data: TemplateTypeChart[]) => void;
}) => {
  const [selected, setSelected] = useState<TemplateTypeChart[]>([
    TemplateTypeChart.timeCount,
    TemplateTypeChart.category,
    TemplateTypeChart.task,
  ]);

  const [order, setOrder] = useState<TemplateTypeChart[]>([...selected]);
  const analyticsConfig = useAnalyticsConfig();
  const [t] = useTranslation();

  useEffect(() => {
    // Передаємо лише обрані елементи, у правильному порядку
    const orderedSelected = order.filter((key) => selected.includes(key));
    onToggleItems(orderedSelected);
  }, [selected, order, onToggleItems]);

  return (
    <Reorder.Group
      axis="x"
      values={order}
      onReorder={setOrder}
      className="flex gap-1"
    >
      {order.map((key) => (
        <Reorder.Item
          key={key}
          value={key}
          whileDrag={{ scale: 1.15 }}
          className="cursor-grab"
        >
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition select-none flex-wrap ${
              selected.includes(key)
                ? "chrono-chart-toggle selected text-indigo-200"
                : "chrono-chart-toggle text-zinc-400"
            }`}
          >
            <Checkbox
              id={key}
              checked={selected.includes(key)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelected((prev) => [...prev, key]);
                } else {
                  setSelected((prev) => prev.filter((k) => k !== key));
                }
              }}
            />
            {analyticsConfig[key]?.icon || <ChartPie />}
            <span className="text-xs">{t(`chart.${key}`)}</span>
          </div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
};

export default ChartCheckboxSort;
