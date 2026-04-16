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
              "fixed right-3 z-50 h-14 w-14 rounded-full border border-zinc-300/80 bg-white/80 p-0 text-zinc-800 shadow-lg backdrop-blur-xl hover:bg-white/90 dark:border-white/10 dark:bg-[rgba(10,10,12,0.72)] dark:text-zinc-100 dark:hover:bg-[rgba(10,10,12,0.84)]",
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
                <PanelTopOpen className="w-8! h-8!" />
              ) : (
                <PanelTopClose className="w-8! h-8!" />
              )}
            </SoundHoverElement>
          </Button>
        </div>
      </DrawerTrigger>
      <DrawerContent className="z-1000 rounded-t-2xl border border-zinc-300/80 bg-white/88 text-zinc-900 shadow-2xl backdrop-blur-xl outline-none dark:border-white/10 dark:bg-[rgba(10,10,12,0.82)] dark:text-zinc-100">
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
