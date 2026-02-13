// components/number-field.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";

type NumberFieldProps = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number; // скільки знаків після коми показувати
  suffix?: string; // наприклад: "°" або "%"
  className?: string;
};

const clamp = (v: number, min = -Infinity, max = Infinity) =>
  Math.min(Math.max(v, min), max);

export function NumberField({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  precision,
  suffix,
  className,
}: NumberFieldProps) {
  const [text, setText] = React.useState<string>(() =>
    precision !== undefined ? value.toFixed(precision) : String(value)
  );

  // синхронізуємо зовнішнє значення у випадку змін ззовні (слайдер)
  React.useEffect(() => {
    setText(precision !== undefined ? value.toFixed(precision) : String(value));
  }, [value, precision]);

  const commit = (next: number) => {
    const c = clamp(next, min, max);
    onChange(precision !== undefined ? Number(c.toFixed(precision)) : c);
  };

  const parse = (s: string) => {
    // допускаємо лише число та "порожньо" під час набору
    if (s.trim() === "") return NaN;
    const n = Number(s.replace(",", "."));
    return isNaN(n) ? NaN : n;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = e.target.value;
    setText(t);
    const n = parse(t);
    // live-клемп під час набору (м’який): якщо число, одразу клемпимо
    if (!isNaN(n)) onChange(clamp(n, min, max));
  };

  const handleBlur = () => {
    const n = parse(text);
    commit(isNaN(n) ? value : n);
  };

  const inc = () => commit(value + step);
  const dec = () => commit(value - step);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      inc();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      dec();
    }
    if (e.key === "Enter") {
      handleBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className={cn("relative w-28", className)}>
      {/* сам інпут */}
      <Input
        type="text"
        inputMode="decimal"
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={onKeyDown}
        min={min}
        max={max}
        step={step}
        className={cn("pl-2 h-7 text-center font-medium")}
      />

      {/* суфікс (°, %, см...) */}
      {suffix ? (
        <span className="pointer-events-none absolute right-12 inset-y-0 flex items-center text-muted-foreground">
          {suffix}
        </span>
      ) : null}

      {/* стрілки як у Blender */}
      <div className="absolute px-0.5 inset-y-0 flex items-center gap-1 justify-between w-full">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="w-4 h-6 rounded-tr-none rounded-br-none"
          onClick={dec}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="w-4 h-6 rounded-tl-none rounded-bl-none"
          onClick={inc}
        >
          <ChevronRight className="h-4 w-4 " />
        </Button>
      </div>
    </div>
  );
}
