import { paresSecondToTime } from "@/utils/time.util";
import { useCallback, useEffect, useRef, useState } from "react";

const range = (count: number) =>
  Array.from({ length: count }, (_, i) => String(i - 1).padStart(2, "0"));

const ITEM_HEIGHT = 28; // h-7 = 1.75rem = 28px

const ScrollColumn = ({
  values,
  selected,
  onChange,
  type,
}: {
  values: string[];
  selected: string;
  onChange: (val: string) => void;
  type: "hour" | "minute";
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!ref.current) return;

    const scrollTop = ref.current.scrollTop;
    const clientHeight = ref.current.clientHeight;

    // Центр елемента
    const center = scrollTop + clientHeight / 2;
    const index = Math.floor(center / ITEM_HEIGHT);
    const value = values[index];

    if (value && value !== selected) {
      onChange(value);
    }
  }, [onChange, selected, values]);

  // debounce scroll
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timeout: NodeJS.Timeout;
    const onScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        handleScroll();
      }, 80);
    };

    el.addEventListener("scroll", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(timeout);
    };
  }, [handleScroll]);

  // scroll to selected
  useEffect(() => {
    if (ref.current) {
      const index = values.indexOf(selected);
      const targetScrollTop =
        index * ITEM_HEIGHT - ref.current.clientHeight / 2 + ITEM_HEIGHT / 2;
      ref.current.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });
    }
  }, [selected, values]);

  return (
    <div
      ref={ref}
      className="chrono-time-drum h-[84px] w-16 overflow-y-auto snap-y snap-mandatory scroll-smooth"
    >
      {values.map((val) => {
        const isValidValue =
          val !== "-1" &&
          ((type === "minute" && val !== "60") ||
            (type === "hour" && val !== "24"));

        return (
          <div
            key={val}
            className={`snap-center flex items-center justify-center transition-colors ${
              val === selected ? "chrono-time-drum-selected" : "chrono-time-drum-unselected"
            }`}
            style={{ height: `${ITEM_HEIGHT}px` }}
          >
            {isValidValue && val}
          </div>
        );
      })}
    </div>
  );
};

export interface TimePickerProps {
  onChange?: (val: number) => void;
  className?: string;
  time?: number;
}

export const TimePickerScroll = ({
  onChange,
  className = "",
  time = 0,
}: TimePickerProps) => {
  const now = new Date();
  const [hour, setHour] = useState(String(now.getHours()).padStart(2, "0"));
  const [minute, setMinute] = useState("00");

  const emit = useCallback(
    (h: string, m: string) => {
      const seconds = parseInt(h) * 3600 + parseInt(m) * 60;
      onChange?.(seconds);
    },
    [onChange]
  );
  useEffect(() => {
    if (time === 0) return;
    const { hours, minutes } = paresSecondToTime(time);
    setHour(hours);
    setMinute(minutes);
  }, [time]);

  useEffect(() => {
    emit(hour, minute);
  }, [hour, minute, emit]);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className}`}
    >
      <div className="relative flex justify-center items-center space-x-2">
        {/* selection window with sharp white lines */}
        <div className="chrono-time-drum-window absolute inset-x-0 top-1/2 -translate-y-1/2 h-7 pointer-events-none" />
        <ScrollColumn
          type="hour"
          values={range(26)}
          selected={hour}
          onChange={(val) => setHour(val)}
        />
        <span className="chrono-time-drum-colon flex items-center">:</span>
        <ScrollColumn
          type="minute"
          values={range(62)}
          selected={minute}
          onChange={(val) => setMinute(val)}
        />
      </div>
    </div>
  );
};

export default TimePickerScroll;
