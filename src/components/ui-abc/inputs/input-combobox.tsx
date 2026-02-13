import { SquareMenu } from "lucide-react";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import SoundHoverElement from "../sound-hover-element";
import { useTranslation } from "react-i18next";
import { normalizeStr } from "@/utils/string.util";

function InputCombobox({
  onValueChange,
  outerValue = "",
  options,
  className = "",
}: {
  onValueChange?: (value: string) => void;
  outerValue?: string;
  options: string[];
  className?: string;
}) {
  const [editingValue, setEditingValue] = useState(""); // те, що вводиться
  const [open, setOpen] = useState(false); // стан відкриття поповера
  const [t] = useTranslation();
  const handleSetValue = (newVal: string) => {
    setEditingValue(newVal);
  };

  useEffect(() => {
    setEditingValue(outerValue);
  }, [outerValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSetValue(editingValue);
    }
  };

  const handleSelect = (label: string) => {
    handleSetValue(label);
  };

  useEffect(() => {
    if (onValueChange) {
      onValueChange(editingValue);
    }
  }, [editingValue, onValueChange]);

  const getCategoryLabel = (key: string) =>
    t(`task_manager.categories.${key}`);

  return (
    <div className={`flex gap-1 items-center w-full ${className}`}>
      <Input
        value={
          options.includes(editingValue)
            ? getCategoryLabel(editingValue)
            : editingValue
        }
        onChange={(e) => {
          const val = e.target.value;
          const found = options.find((option) => {
            return (
              normalizeStr(getCategoryLabel(option).toLowerCase()) ===
              normalizeStr(val.toLowerCase())
            );
          });
          setEditingValue(found ?? val);
        }}
        onKeyDown={handleKeyDown}
        placeholder={t("task_manager.combobox_placeholder")}
        className="text-xl"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div>
            <SoundHoverElement animValue={0.9}>
              <Button variant="ghost" size="icon">
                <SquareMenu />
              </Button>
            </SoundHoverElement>
          </div>
        </PopoverTrigger>
        {open && (
          <PopoverContent className="chrono-popover-content w-64 p-2">
            <Command className="bg-transparent">
              <CommandGroup>
                {options.map((option, i) => (
                  <SoundHoverElement animValue={0.99} key={`option-${i}`}>
                    <CommandItem
                      onSelect={() => {
                        handleSelect(option);
                        setOpen(false);
                      }}
                    >
                      {getCategoryLabel(option)}
                    </CommandItem>
                  </SoundHoverElement>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}

export default InputCombobox;
