import { useTranslation } from "react-i18next";

import DailySidePanelContent from "./daily-side-panel-content";
import { useHeaderSizeStore } from "@/storage/headerSizeStore";

const DailySidePanelWrapper = () => {
  const [t] = useTranslation();
  const hS = useHeaderSizeStore((s) => s.size);
  return (
    <div
      className="mx-auto w-full right-0 px-4 sticky"
      style={{ top: `${hS}px` }}
    >
      <header className="grid gap-1.5 py-4 px-10 text-center">
        <h2 className="text-lg text-foreground font-semibold leading-none tracking-tight">
          {t("task_manager.calendar.header.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("task_manager.calendar.header.description")}
        </p>
      </header>
      <DailySidePanelContent />
    </div>
  );
};

export default DailySidePanelWrapper;
