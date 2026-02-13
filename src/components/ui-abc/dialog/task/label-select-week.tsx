import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DayNumber } from "@/types/drag-and-drop.model";
import { ButtonHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";

interface LabelSelectWeekProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  weekData: DayNumber[];
  toggleDay: (day: DayNumber) => void;
  selectedDays: DayNumber[];
  label: string;
  prefixWeedDay: string;
}

const LabelSelectWeek = ({
  weekData,
  toggleDay,
  selectedDays,
  label,
  prefixWeedDay,
}: LabelSelectWeekProps) => {
  const [t] = useTranslation();
  return (
    <>
      <Label>{t(label)}</Label>
      <div className="col-span-3 flex items-center justify-center gap-1">
        {weekData.map((day) => (
          <Button
            key={day}
            variant={"ghost"}
            onClick={() => toggleDay(day)}
            className={`w-7 h-8 rounded-full transition-all duration-200 ${
              selectedDays.includes(day)
                ? "chrono-day-badge selected"
                : "chrono-day-badge hover:border-white/10 hover:bg-white/5"
            }`}
          >
            {t(`${prefixWeedDay}.${day}`)}
          </Button>
        ))}
      </div>
    </>
  );
};

export default LabelSelectWeek;
