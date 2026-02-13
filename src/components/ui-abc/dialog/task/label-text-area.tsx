import { Textarea } from "@/components/ui/textarea";
import { Label } from "@radix-ui/react-label";
import { TextareaHTMLAttributes } from "react";

interface LabelTextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  label: string;
  id: string;
}

const LabelTextArea = ({ value, label, id, ...props }: LabelTextAreaProps) => {
  return (
    <>
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} value={value} {...props} className="col-span-3 bg-transparent" />
    </>
  );
};

export default LabelTextArea;
