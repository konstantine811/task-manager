import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCallback, useRef, useState } from "react";

type Props = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  suffix?: string;
  className?: string;
  label?: string;
};

const clamp = (v: number, min = -Infinity, max = Infinity) =>
  Math.min(Math.max(v, min), max);

const snap = (v: number, step = 1) =>
  step > 0 ? Math.round(v / step) * step : v;

export default function CustomBlenderSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  precision,
  suffix,
  className,
  label,
}: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [editing, setEditing] = useState(false);

  const pct = ((value - min) / (max - min)) * 100;
  const display =
    (precision ?? 0) > 0 ? value.toFixed(precision) : String(value);

  const commit = useCallback(
    (next: number) => {
      const c = clamp(snap(next, step), min, max);
      onChange(precision !== undefined ? Number(c.toFixed(precision)) : c);
    },
    [min, max, step, precision, onChange]
  );

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return value;
      const rect = el.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      return min + ratio * (max - min);
    },
    [min, max, value]
  );

  const startDrag = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const next = valueFromClientX(e.clientX);
    commit(next);
  };

  const onDrag = (e: React.PointerEvent) => {
    if (!(e.buttons & 1)) return; // тільки коли натиснута ЛКМ
    const next = valueFromClientX(e.clientX);
    commit(next);
  };

  const onTrackClick = (e: React.MouseEvent) => {
    const next = valueFromClientX(e.clientX);
    commit(next);
  };

  // клавіатура на тумбі
  const onThumbKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      commit(value - step);
    }
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      commit(value + step);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      setEditing(true);
    }
  };

  return (
    <div className={cn("w-full select-none", className)}>
      {label ? (
        <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      ) : null}

      <div className="relative">
        {/* Трек */}
        <div
          ref={trackRef}
          className="h-5 w-full rounded-sm overflow-hidden bg-background relative cursor-pointer"
          onClick={onTrackClick}
          onPointerDown={startDrag}
          onPointerMove={onDrag}
        >
          {/* Заповнена синя частина */}
          {!editing ? (
            <div
              className="absolute left-0 top-0 h-5 ronded-bl-xl bg-accent"
              style={{ width: `${pct}%` }}
            />
          ) : null}
          {/* Тумба */}
          <button
            type="button"
            className="absolute 
                       h-full w-1 bg-background/50 top-1 -translate-y-1 -translate-x-1"
            style={{ left: `${pct}%` }}
            onPointerDown={startDrag}
            onPointerMove={onDrag}
            onKeyDown={onThumbKey}
            aria-label={label ?? "slider"}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            role="slider"
          />
          {/* Число по центру */}
          {!editing ? (
            <button
              type="button"
              onDoubleClick={() => setEditing(true)}
              onMouseDown={(e) => e.stopPropagation()} // не запускаємо drag
              className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground/80 bg-transparent"
            >
              {display}
              {suffix ?? ""}
            </button>
          ) : (
            <Input
              autoFocus
              defaultValue={display}
              className="absolute left-1/2 top-1/2 h-7 w-full -translate-x-1/2 -translate-y-1/2
                         text-left"
              onBlur={(e) => {
                const n = Number(String(e.target.value).replace(",", "."));
                commit(isNaN(n) ? value : n);
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") {
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
