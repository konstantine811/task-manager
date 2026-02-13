import { useTranslation } from "react-i18next";

const ChartTitle = ({ title }: { title: string }) => {
  const { t } = useTranslation();
  return (
    <h4 className="text-sm font-normal text-zinc-500 dark:text-zinc-400 text-left py-1 px-0">
      {t(title)}
    </h4>
  );
};

export default ChartTitle;
