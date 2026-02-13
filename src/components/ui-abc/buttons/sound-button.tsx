import { Button } from "@/components/ui/button";
import SoundHoverElement from "../sound-hover-element";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface SoundButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

const SoundButton = ({ children, ...rest }: SoundButtonProps) => {
  return (
    <SoundHoverElement animValue={1.02}>
      <Button
        variant="ghost"
        asChild
        className="hover:bg-card/70 border border-border hover:border-border hover:text-foreground"
        {...rest}
      >
        {children}
      </Button>
    </SoundHoverElement>
  );
};

export default SoundButton;
