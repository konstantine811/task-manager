import { useTranslation } from "react-i18next";

const ChartTitle = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => {
  const { t } = useTranslation();
  return (
    <div className="py-1 px-0">
      <h4 className="text-sm font-normal text-zinc-500 dark:text-zinc-400 text-left">
        {t(title)}
      </h4>
      {subtitle && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
          {t(subtitle)}
        </p>
      )}
    </div>
  );
};

export default ChartTitle;
