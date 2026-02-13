import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import SoundHoverElement from "../sound-hover-element";
import { PanelTopClose, PanelTopOpen } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useHeaderSizeStore } from "@/storage/headerSizeStore";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import useScrollBehavior from "@/hooks/use-scroll-behavior";

const CustomDrawer = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  useScrollBehavior(open);
  const [t] = useTranslation();
  const hs = useHeaderSizeStore((s) => s.size);

  return (
    <Drawer open={open} onOpenChange={setOpen} preventScrollRestoration={false}>
      <DrawerTrigger asChild>
        <div>
          <Button
            className={cn(
              `bg-card hover:bg-card/50 rounded-r-none !pr-7 !py-6 fixed z-30 text-foreground right-0 shadow-sm shadow-foreground`
            )}
            style={{ top: `${hs + 10}px` }}
          >
            <SoundHoverElement
              animValue={0.9}
              hoverAnimType="scale"
              className=""
              as="div"
            >
              {open ? (
                <PanelTopOpen className="!w-8 !h-8" />
              ) : (
                <PanelTopClose className="!w-8 !h-8" />
              )}
            </SoundHoverElement>
          </Button>
        </div>
      </DrawerTrigger>
      <DrawerContent className="border-border z-[1000]  outline-none">
        <ScrollArea className="w-full touch-auto overscroll-contain px-2 max-h-[60vh] overflow-auto">
          <DrawerHeader>
            <DrawerTitle>{t(title)}</DrawerTitle>
            <DrawerDescription>{t(description)}</DrawerDescription>
          </DrawerHeader>
          {children}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};

export default CustomDrawer;
