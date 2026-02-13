import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { cn } from "@/lib/utils"; // якщо використовуєш clsx / cn
import SoundHoverElement from "../sound-hover-element";
import { HoverStyleElement, SoundTypeElement } from "@/types/sound";
import WrapperHoverElement from "../wrapper-hover-element";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export default function NumberInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: NumberInputProps) {
  const decrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const increment = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  return (
    <div
      className={cn(
        "chrono-time-input flex items-center justify-between rounded-md px-3 py-2 w-fit",
        className
      )}
    >
      <WrapperHoverElement>
        <SoundHoverElement
          hoverTypeElement={SoundTypeElement.SELECT}
          hoverStyleElement={HoverStyleElement.quad}
        >
          <Button
            variant="ghost"
            size="sm"
            className={`text-lg ${
              value >= max && "text-zinc-600"
            }`}
            onClick={increment}
            disabled={value >= max}
          >
            +
          </Button>
        </SoundHoverElement>
      </WrapperHoverElement>
      <Input
        type="text"
        value={value === 0 ? "" : value} // показуємо "" коли 0
        onChange={(e) => {
          const inputValue = e.target.value;
          if (inputValue === "") {
            onChange(0); // передаємо 0, якщо стерли все
          } else {
            const onlyNumbers = inputValue.replace(/\D/g, ""); // залишаємо лише цифри
            const newValue = parseInt(onlyNumbers, 10);
            if (!isNaN(newValue)) {
              onChange(Math.min(Math.max(newValue, min), max));
            }
          }
        }}
        inputMode="numeric"
        className="w-12 text-center font-bold text-lg border-none focus:outline-none"
      />
      <WrapperHoverElement>
        <SoundHoverElement
          hoverTypeElement={SoundTypeElement.SELECT}
          hoverStyleElement={HoverStyleElement.quad}
        >
          <Button
            variant="ghost"
            size="sm"
            className={`text-lg ${
              value <= min && "text-zinc-600"
            }`}
            onClick={decrement}
            disabled={value <= min}
          >
            −
          </Button>
        </SoundHoverElement>
      </WrapperHoverElement>
    </div>
  );
}
