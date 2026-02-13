import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FC } from "react";

const TextareaWrapper: FC<{
  id: string;
  label: string;
  placeholder: string;
}> = ({ id, label, placeholder }) => {
  return (
    <div className="space-y-2">
      <Label
        className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
        htmlFor={`${id}-textarea`}
      >
        {label}
      </Label>
      <Textarea
        className="w-full bg-card border border-border text-foreground text-sm rounded-sm p-3 focus:border-border focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-1 focus:ring-foreground/30 transition-all placeholder:text-muted-foreground/80"
        id={`${id}-textarea`}
        name={id}
        placeholder={placeholder}
      />
    </div>
  );
};

export default TextareaWrapper;
