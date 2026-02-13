import { Calendar } from "@/components/ui/calendar";
import { formatISO } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { enUS } from "date-fns/locale";
import { useNavigate, useParams } from "react-router";
import { RoutPath } from "@/config/router-config";
import { parseDate } from "@/utils/date.util";
import { Items, ItemTaskCategory } from "@/types/drag-and-drop.model";
import { FirebaseCollection } from "@/config/firebase.config";
import { subscribeToNonEmptyTaskDates } from "@/services/firebase/taskManagerData";
import { Unsubscribe } from "firebase/auth";
import { locales } from "@/config/calendar.config";

const DailyCalendar = () => {
  const { id: dateId } = useParams();
  const parsedDate = parseDate(
    dateId ?? formatISO(new Date(), { representation: "date" })
  );

  const [date, setDate] = useState<Date | undefined>(parsedDate);
  const [activeDates, setActiveDates] = useState<Date[]>([]);
  const [plannedTasks, setPlannedTasks] = useState<Date[]>([]);

  const datesWithTasks = useMemo(() => {
    const toKey = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const map = new Map<number, Date>();
    [...activeDates, ...plannedTasks].forEach((d) => map.set(toKey(d), d));
    return Array.from(map.values());
  }, [activeDates, plannedTasks]);

  const navigate = useNavigate();
  const today = new Date();

  const handleUpdatePlannedTasks = useCallback((dates: Date[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // обнуляємо час

    const futureOrTodayDates = dates.filter((date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() >= today.getTime();
    });

    setPlannedTasks(futureOrTodayDates);
  }, []);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;
    subscribeToNonEmptyTaskDates<Items>(
      FirebaseCollection.dailyTasks,
      (dates) => {
        setActiveDates(dates);
      }
    ).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    subscribeToNonEmptyTaskDates<ItemTaskCategory[]>(
      FirebaseCollection.plannedTasks,
      handleUpdatePlannedTasks
    ).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [handleUpdatePlannedTasks]);

  const handleDate = useCallback(
    (date: Date | undefined) => {
      if (date) {
        const formatted = formatISO(date, { representation: "date" });
        navigate(
          `${RoutPath.TASK_MANAGER}/${RoutPath.TASK_MANAGER_DAILY.replace(
            ":id",
            formatted
          )}`
        );
        setTimeout(() => {
          setDate(date);
        });
      }
    },
    [navigate]
  );

  const { i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <div className="flex justify-center w-full">
      <Calendar
        mode="single"
        selected={date}
        onSelect={(date) => handleDate(date)}
        locale={locales[lang] ?? enUS}
        modifiers={{
          hasTasks: datesWithTasks,
          today: today,
        }}
        modifiersClassNames={{
          selected: "!bg-accent/90 !text-accent-foreground border border-accent/50",
          today: "bg-background shadow-md shadow-accent/30 border border-accent/40",
          hasTasks:
            "relative flex justify-center after:block after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-indigo-400/90",
        }}
      />
    </div>
  );
};

export default DailyCalendar;
