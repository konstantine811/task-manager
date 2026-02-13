import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CurveOptions,
  ValueCurveOption,
} from "@/types/analytics/task-analytics.model";
import { useTranslation } from "react-i18next";

const SelectTypeLineChart = ({
  value,
  onChange,
}: {
  value: ValueCurveOption;
  onChange: (val: ValueCurveOption) => void;
}) => {
  const [t] = useTranslation();
  const curveOptions: CurveOptions[] = [
    {
      value: ValueCurveOption.curveLinear,
      label: "chart.line_chart_type.linear",
      icon: "📈",
    },
    {
      value: ValueCurveOption.curveStepAfter,
      label: "chart.line_chart_type.step",
      icon: "╺╸╻",
    },
    {
      value: ValueCurveOption.curveBasis,
      label: "chart.line_chart_type.smooth",
      icon: "📈",
    },
    {
      value: ValueCurveOption.curveCardinal,
      label: "chart.line_chart_type.smooth_cardinal",
      icon: "≋",
    },
    {
      value: ValueCurveOption.curveMonotoneX,
      label: "chart.line_chart_type.monotone",
      icon: "〰️",
    },
  ];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[220px] chrono-select-trigger">
        <SelectValue placeholder={t("chart.line_chart_type.title")} />
      </SelectTrigger>
      <SelectContent className="chrono-select-content">
        <SelectGroup>
          <SelectLabel>{t("chart.line_chart_type.title")}</SelectLabel>
          {curveOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <span className="flex items-center gap-2">
                <span>{opt.icon}</span>
                <span>{t(opt.label)}</span>
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default SelectTypeLineChart;
