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
import {
  subscribeToNonEmptyJournalDates,
  subscribeToNonEmptyTaskDates,
} from "@/services/firebase/taskManagerData";
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
  const [journalDates, setJournalDates] = useState<Date[]>([]);

  const datesWithTasks = useMemo(() => {
    const toKey = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const map = new Map<number, Date>();
    [...activeDates, ...plannedTasks].forEach((d) => map.set(toKey(d), d));
    return Array.from(map.values());
  }, [activeDates, plannedTasks]);

  const taskDateKeys = useMemo(
    () =>
      new Set(
        datesWithTasks.map((d) =>
          new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
        )
      ),
    [datesWithTasks]
  );

  const journalDateKeys = useMemo(
    () =>
      new Set(
        journalDates.map((d) =>
          new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
        )
      ),
    [journalDates]
  );

  const taskOnlyDates = useMemo(
    () =>
      datesWithTasks.filter(
        (d) =>
          !journalDateKeys.has(
            new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
          )
      ),
    [datesWithTasks, journalDateKeys]
  );

  const journalOnlyDates = useMemo(
    () =>
      journalDates.filter(
        (d) =>
          !taskDateKeys.has(
            new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
          )
      ),
    [journalDates, taskDateKeys]
  );

  const taskAndJournalDates = useMemo(
    () =>
      datesWithTasks.filter((d) =>
        journalDateKeys.has(
          new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
        )
      ),
    [datesWithTasks, journalDateKeys]
  );

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

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    subscribeToNonEmptyJournalDates((dates) => {
      setJournalDates(dates);
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

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
          hasTasks: taskOnlyDates,
          hasJournal: journalOnlyDates,
          hasTasksAndJournal: taskAndJournalDates,
          today: today,
        }}
        modifiersClassNames={{
          selected:
            "!bg-transparent !rounded-xl overflow-hidden [&>button]:!bg-accent/90 [&>button]:!text-accent-foreground [&>button]:border [&>button]:border-accent/50 [&>button]:shadow-md [&>button]:shadow-accent/20 [&>button]:!rounded-xl",
          today:
            "!bg-transparent !rounded-xl overflow-hidden [&>button]:!bg-indigo-500/10 [&>button]:text-foreground [&>button]:font-semibold [&>button]:border [&>button]:border-indigo-400/55 [&>button]:ring-2 [&>button]:ring-indigo-500/35 [&>button]:shadow-[0_0_18px_rgba(99,102,241,0.18)] [&>button]:!rounded-xl",
          hasTasks:
            "relative flex justify-center after:block after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-indigo-400/90",
          hasJournal:
            "relative flex justify-center after:block after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-white after:ring-1 after:ring-zinc-400/30",
          hasTasksAndJournal:
            "relative flex justify-center before:block before:absolute before:bottom-0.5 before:left-[calc(50%-4px)] before:-translate-x-1/2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-white before:ring-1 before:ring-zinc-400/30 after:block after:absolute after:bottom-0.5 after:left-[calc(50%+4px)] after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-indigo-400/90",
        }}
      />
    </div>
  );
};

export default DailyCalendar;
