import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TaskAnalyticsBarOrientation } from "@/types/analytics/task-analytics.model";
import { RectangleHorizontal, RectangleVertical } from "lucide-react";
import { useCallback, useState } from "react";

const ChartTimeToggle = ({
  onValueChange,
  value = "horizontal",
}: {
  onValueChange: (value: TaskAnalyticsBarOrientation) => void;
  value: TaskAnalyticsBarOrientation;
}) => {
  const [chartBarOrienation, setChartBarOrienation] =
    useState<TaskAnalyticsBarOrientation>(value);

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (!value) return; // 🛑 Не дозволяти знімати виділення

      const newValue = value as TaskAnalyticsBarOrientation;
      if (newValue !== chartBarOrienation) {
        setChartBarOrienation(newValue);
        onValueChange(newValue);
      }
    },
    [chartBarOrienation, onValueChange]
  );

  return (
    <ToggleGroup
      type="single"
      value={chartBarOrienation}
      onValueChange={handleChange}
    >
      <ToggleGroupItem value="vertical" aria-label="Toggle vertical">
        <RectangleVertical />
      </ToggleGroupItem>
      <ToggleGroupItem value="horizontal" aria-label="Toggle horizontal">
        <RectangleHorizontal />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default ChartTimeToggle;
