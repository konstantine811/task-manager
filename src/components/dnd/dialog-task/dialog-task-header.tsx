import { ReactNode } from "react";

import Dialog from "@/components/ui-abc/dialog/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

function DialogTaskHeader({
  isOpen,
  setOpen,
  children,
}: {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Dialog isOpen={isOpen} setOpen={setOpen} className="p-4 md:p-6">
      <div className="relative w-full">
        <div className="absolute top-[-19px] right-[-19px] z-20 rounded-full">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full bg-white/80 text-zinc-500 backdrop-blur-sm transition duration-200 hover:bg-zinc-200/80 hover:text-zinc-900 dark:bg-zinc-950/85 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-200"
            onClick={() => setOpen(false)}
          >
            <X />
          </Button>
        </div>
        {children}
      </div>
    </Dialog>
  );
}

export default DialogTaskHeader;
