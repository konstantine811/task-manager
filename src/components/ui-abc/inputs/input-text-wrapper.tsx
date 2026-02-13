import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FC } from "react";

const InputTextWrapper: FC<{
  id: string;
  label: string;
  placeholder: string;
  icon?: React.ReactNode;
}> = ({ id, label, placeholder, icon }) => {
  return (
    <div className="space-y-2">
      <Label
        className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
        htmlFor={`${id}-input`}
      >
        {label}
      </Label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 flex items-center justify-center">
            {icon}
          </div>
        )}
        <Input
          id={`${id}-input`}
          name={id}
          className={cn(
            "w-full bg-card border border-border text-foreground text-sm rounded-sm p-3 focus:border-border focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-1 focus:ring-ring/30 transition-all placeholder:text-muted-foreground/80",
            icon && "pl-10"
          )}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export default InputTextWrapper;
