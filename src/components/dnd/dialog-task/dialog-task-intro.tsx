import { getRandomFromTo } from "@/utils/random";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function DialogTaskIntro() {
  const [t] = useTranslation();
  const [translateRandom, setTranslateRandom] = useState(1);

  useEffect(() => {
    setTranslateRandom(getRandomFromTo(1, 4));
  }, []);
  return (
    <div className="mb-2 pr-14">
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-semibold wrap-break-word">
          {t(`task_manager.dialog_create_task.${translateRandom}.title`)}
        </h3>
        <p className="chrono-dialog-description font-mono text-sm">
          {t(`task_manager.dialog_create_task.${translateRandom}.description`)}
        </p>
      </div>
    </div>
  );
}

export default DialogTaskIntro;
