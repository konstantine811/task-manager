import { SoundTypeElement } from "@/types/sound";
import SoundHoverElement from "../../sound-hover-element";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckboxProps } from "@radix-ui/react-checkbox";

interface LabelCheckBoxProps extends CheckboxProps {
  label: string;
  id: string;
}

const LabelCheckData = ({ id, label, ...props }: LabelCheckBoxProps) => {
  return (
    <>
      <Label htmlFor={id}>{label}</Label>
      <SoundHoverElement
        className="h-5 w-5"
        animValue={1.4}
        hoverTypeElement={SoundTypeElement.SELECT}
      >
        <Checkbox id={id} className={`w-5 h-5`} {...props} />
      </SoundHoverElement>
    </>
  );
};

export default LabelCheckData;
