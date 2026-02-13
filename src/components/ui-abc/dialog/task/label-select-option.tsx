import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@radix-ui/react-label";
import SoundHoverElement from "../../sound-hover-element";
import { HoverStyleElement } from "@/types/sound";
import { useTranslation } from "react-i18next";

interface LabelSelectOptionProps<T> {
  id: string;
  label: string;
  placeholder: string;
  selectLabel: string;
  value: T;
  onChange: (value: T) => void;
  options: Record<string, T> | T[]; // ✅ підтримка enum або масиву
  prefixTranslationPath: string;
  classPrefixFunction: (value: T) => string;
}

const LabelSelectOption = <T extends string>({
  selectLabel,
  id,
  label,
  onChange,
  placeholder,
  value,
  options,
  prefixTranslationPath,
  classPrefixFunction,
}: LabelSelectOptionProps<T>) => {
  const [t] = useTranslation();
  return (
    <>
      <Label htmlFor={id}>{t(label)}</Label>
      <Select name={id} value={value} onValueChange={onChange}>
        <SelectTrigger name="prioriy" className="w-full col-span-3 chrono-select-trigger">
          <SelectValue placeholder={t(placeholder)} />
        </SelectTrigger>
        <SelectContent className="chrono-select-content">
          <SelectGroup>
            <SelectLabel>{t(selectLabel)}</SelectLabel>
            {Object.values(options).map((p) => (
              <SoundHoverElement
                key={p}
                animValue={0.99}
                hoverStyleElement={HoverStyleElement.none}
              >
                <SelectItem value={p} className={`${classPrefixFunction(p)}`}>
                  {t(`${prefixTranslationPath}.${p.toLowerCase()}`)}
                </SelectItem>
              </SoundHoverElement>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
};

export default LabelSelectOption;
