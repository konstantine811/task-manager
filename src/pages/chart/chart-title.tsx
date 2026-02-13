import { useTranslation } from "react-i18next";

const ChartTitle = ({ title }: { title: string }) => {
  const { t } = useTranslation();
  return <h4 className="text-xl text-zinc-400 text-center">{t(title)}</h4>;
};

export default ChartTitle;
