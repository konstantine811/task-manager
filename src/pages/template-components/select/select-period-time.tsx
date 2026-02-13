import SoundHoverElement from "@/components/ui-abc/sound-hover-element";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ANALYTICS_PERIODS } from "@/config/task-analytics.config";
import { TypeAnalyticsPeriod } from "@/types/analytics/task-analytics.model";
import { DayNumber } from "@/types/drag-and-drop.model";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const SelectPeriodTime = ({
  onChange,
}: {
  onChange: (period: TypeAnalyticsPeriod) => void;
}) => {
  const initialPeriod = ANALYTICS_PERIODS[0]; // Встановлюємо початковий період
  const [period, setPeriod] = useState<string | undefined>(initialPeriod);
  function parsePeriod(period: string | undefined): TypeAnalyticsPeriod {
    return isNaN(Number(period))
      ? (period as "all" | "by_all_week")
      : (Number(period) as DayNumber);
  }
  useEffect(() => {
    onChange(initialPeriod);
  }, [onChange, initialPeriod]);
  const [t] = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="inline-block">
          <SoundHoverElement animValue={1}>
            <Button
              className="w-56 bg-zinc-900/80 border-white/5 hover:border-white/10 hover:bg-zinc-800/80 text-zinc-300"
              variant="outline"
            >
              {t(`task_manager.day_names.${period}`)}
            </Button>
          </SoundHoverElement>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 chrono-dropdown-content">
        <DropdownMenuLabel>{t("chart.period")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={period}
          onValueChange={(val) => {
            setPeriod(val);
            onChange(parsePeriod(val)); // Викликаємо onChange з новим періодом
          }}
        >
          {ANALYTICS_PERIODS.map((period) => {
            return (
              <DropdownMenuRadioItem key={period} value={period.toString()}>
                {t(`task_manager.day_names.${period}`)}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SelectPeriodTime;
