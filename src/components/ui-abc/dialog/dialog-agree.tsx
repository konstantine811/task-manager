import DialogTask from "@/components/ui-abc/dialog/dialog";
import SoundHoverElement from "@/components/ui-abc/sound-hover-element";
import WrapperHoverElement from "@/components/ui-abc/wrapper-hover-element";
import { Button } from "@/components/ui/button";
import { HoverStyleElement, SoundTypeElement } from "@/types/sound";
import { ScrollArea } from "@radix-ui/react-scroll-area";

const DialogAgree = ({
  isOpen,
  title,
  description,
  onAgree,
  buttonYesTitle,
  buttonNoTitle,
  setIsOpen,
}: {
  isOpen: boolean;
  title: string;
  description: string;
  buttonYesTitle: string;
  buttonNoTitle: string;
  onAgree: (status: boolean) => void;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  return (
    <DialogTask isOpen={isOpen} setOpen={setIsOpen}>
      <ScrollArea className="w-full h-full touch-auto overscroll-contain">
        <div className="flex flex-col items-center gap-4 p-6">
          <h3 className="text-lg text-foreground/80">{title}</h3>
          <p className="text-md text-foreground/50">{description}</p>
        </div>
        <div className="flex justify-center items-center gap-4">
          <WrapperHoverElement className="flex items-center justify-center gap-2">
            <SoundHoverElement
              hoverTypeElement={SoundTypeElement.SELECT_2}
              hoverStyleElement={HoverStyleElement.quad}
            >
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  onAgree(true);
                  setIsOpen(false);
                }}
              >
                {buttonYesTitle}
              </Button>
            </SoundHoverElement>
            <SoundHoverElement
              hoverTypeElement={SoundTypeElement.SELECT_2}
              hoverStyleElement={HoverStyleElement.quad}
            >
              <Button
                variant="ghost"
                className="w-full hover:bg-muted"
                onClick={() => {
                  onAgree(false);
                  setIsOpen(false);
                }}
              >
                {buttonNoTitle}
              </Button>
            </SoundHoverElement>
          </WrapperHoverElement>
        </div>
      </ScrollArea>
    </DialogTask>
  );
};

export default DialogAgree;
