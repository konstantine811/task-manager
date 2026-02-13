import NumberInput from "@/components/ui-abc/inputs/input-number";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function TimePickerInputs({
  onChange,
  time,
}: {
  onChange: (timeSeconds: number) => void;
  time?: number;
}) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [t] = useTranslation();
  const handleHoursChange = (value: number) => {
    if (!isNaN(value) && value >= 0 && value <= 12) {
      setHours(value);
    } else {
      setHours(0);
    }
  };

  const handleMinutesChange = (value: number) => {
    if (!isNaN(value) && value >= 0 && value <= 60) {
      setMinutes(value);
    } else {
      setMinutes(0);
    }
  };

  useEffect(() => {
    if (time) {
      const totalMinutes = Math.floor(time / 60);
      const totalHours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;
      setHours(totalHours);
      setMinutes(remainingMinutes);
    }
  }, [time]);

  useEffect(() => {
    const totalSeconds = hours * 3600 + minutes * 60;
    onChange(totalSeconds);
  }, [hours, minutes, onChange]);

  return (
    <>
      <div className="col-span-3 flex gap-1">
        <div className="flex flex-col items-center space-y-1">
          <Label htmlFor="hours" className="text-xs text-zinc-500">
            {t("task_manager.dialog_create_task.task.time.hours")}
          </Label>
          <NumberInput
            min={0}
            max={12}
            value={hours}
            onChange={(value) => {
              handleHoursChange(value);
            }}
          />
        </div>

        <div className="flex flex-col items-center space-y-1">
          <Label htmlFor="minutes" className="text-xs text-zinc-500">
            {t("task_manager.dialog_create_task.task.time.minutes")}
          </Label>
          <NumberInput
            min={0}
            max={60}
            value={minutes}
            onChange={(value) => {
              handleMinutesChange(value);
            }}
          />
        </div>
      </div>
    </>
  );
}
