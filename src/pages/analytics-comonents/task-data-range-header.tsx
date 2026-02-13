import { useMemo } from "react";
import { format, Locale } from "date-fns";
import { enUS, uk } from "date-fns/locale";
import { RangeTaskAnalyticRecord } from "@/types/analytics/task-analytics.model";
import { useTranslation } from "react-i18next";
import { LanguageType } from "@/i18n";
import { getDateFnsLocaleCode } from "@/utils/lang";
import { DateTemplate } from "@/config/data-config";

const localeMap: Record<string, Locale> = {
  en: enUS,
  uk: uk,
};

const TaskDateRangeHeader = ({
  tasks,
}: {
  tasks: RangeTaskAnalyticRecord[];
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as LanguageType;
  const locale = localeMap[getDateFnsLocaleCode(currentLang)] || enUS;
  const { minDate, maxDate } = useMemo(() => {
    if (tasks.length === 0) return { minDate: null, maxDate: null };

    const sorted = [...tasks].sort((a, b) => a.date.localeCompare(b.date));
    return {
      minDate: new Date(sorted[0].date),
      maxDate: new Date(sorted[sorted.length - 1].date),
    };
  }, [tasks]);

  if (!minDate || !maxDate) return null;

  return (
    <h2 className="text-xl  text-muted-foreground text-center mb-4">
      {t("task_manager.analytics.header_range.title")}{" "}
      <span className="text-primary">
        {format(minDate, DateTemplate.dayMonthYearShort, {
          locale,
        })}{" "}
        –{" "}
        {format(maxDate, DateTemplate.dayMonthYearShort, {
          locale,
        })}
      </span>
    </h2>
  );
};

export default TaskDateRangeHeader;
