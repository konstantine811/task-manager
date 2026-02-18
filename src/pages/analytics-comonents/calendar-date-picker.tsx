// src/components/calendar-date-picker.tsx

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
  format,
} from "date-fns";
import { toDate, formatInTimeZone } from "date-fns-tz";
import { DateRange } from "react-day-picker";
import { cva, VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { locales } from "@/config/calendar.config";
import { enUS } from "date-fns/locale";
import SoundHoverElement from "@/components/ui-abc/sound-hover-element";
import { HoverStyleElement } from "@/types/sound";

const multiSelectVariants = cva(
  "flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-card",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-card hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-card hover:text-accent-foreground text-background",
        link: "text-primary underline-offset-4 hover:underline text-background",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface CalendarDatePickerProps
  extends React.HTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof multiSelectVariants> {
  id?: string;
  className?: string;
  date: DateRange;
  closeOnSelect?: boolean;
  numberOfMonths?: 1 | 2;
  yearsRange?: number;
  onDateSelect: (range: { from: Date; to: Date }) => void;
}

export const CalendarDatePicker = React.forwardRef<
  HTMLButtonElement,
  CalendarDatePickerProps
>(
  (
    {
      id = "calendar-date-picker",
      className,
      date,
      closeOnSelect = false,
      numberOfMonths = 2,
      yearsRange = 10,
      onDateSelect,
      variant,
      ...props
    },
    ref
  ) => {
    const {
      t,
      i18n: { language },
    } = useTranslation();
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [selectedRange, setSelectedRange] = React.useState<string | null>(
      numberOfMonths === 2 ? t("thisYear") : t("today")
    );
    const [monthFrom, setMonthFrom] = React.useState<Date | undefined>(
      date?.from
    );
    const [yearFrom, setYearFrom] = React.useState<number | undefined>(
      date?.from?.getFullYear()
    );
    const [monthTo, setMonthTo] = React.useState<Date | undefined>(
      numberOfMonths === 2 ? date?.to : date?.from
    );
    const [yearTo, setYearTo] = React.useState<number | undefined>(
      numberOfMonths === 2 ? date?.to?.getFullYear() : date?.from?.getFullYear()
    );
    const [highlightedPart] = React.useState<string | null>(null);

    const today = new Date();
    const locale = locales[language] ?? enUS;
    const months = Array.from({ length: 12 }, (_, i) =>
      format(new Date(2000, i), "LLL", { locale })
    );
    const ranges = (t("task_manager.calendar.date_range", {
      returnObjects: true,
    }) ?? {}) as Record<string, string>;

    const years = Array.from(
      { length: yearsRange + 1 },
      (_, i) => today.getFullYear() - yearsRange / 2 + i
    );

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const handleClose = () => setIsPopoverOpen(false);

    const handleTogglePopover = () => setIsPopoverOpen((prev) => !prev);

    const selectDateRange = (from: Date, to: Date, range: string) => {
      const startDate = startOfDay(toDate(from, { timeZone }));
      const endDate =
        numberOfMonths === 2 ? endOfDay(toDate(to, { timeZone })) : startDate;
      onDateSelect({ from: startDate, to: endDate });
      setSelectedRange(range);
      setMonthFrom(from);
      setYearFrom(from.getFullYear());
      setMonthTo(to);
      setYearTo(to.getFullYear());
      if (closeOnSelect) {
        setIsPopoverOpen(false);
      }
    };

    const handleDateSelect = (range: DateRange | undefined) => {
      if (range) {
        let from = startOfDay(toDate(range.from as Date, { timeZone }));
        let to = range.to ? endOfDay(toDate(range.to, { timeZone })) : from;
        if (numberOfMonths === 1) {
          if (range.from !== date.from) {
            to = from;
          } else {
            from = startOfDay(toDate(range.to as Date, { timeZone }));
          }
        }
        onDateSelect({ from, to });
        setMonthFrom(from);
        setYearFrom(from.getFullYear());
        setMonthTo(to);
        setYearTo(to.getFullYear());
      }
      setSelectedRange(null);
    };

    const handleMonthChange = React.useCallback(
      (newMonthIndex: number, part: string) => {
        setSelectedRange(null);
        if (part === "from") {
          if (yearFrom !== undefined) {
            if (newMonthIndex < 0 || newMonthIndex > yearsRange + 1) return;
            const newMonth = new Date(yearFrom, newMonthIndex, 1);
            const from =
              numberOfMonths === 2
                ? startOfMonth(toDate(newMonth, { timeZone }))
                : date?.from
                ? new Date(
                    date.from.getFullYear(),
                    newMonth.getMonth(),
                    date.from.getDate()
                  )
                : newMonth;
            const to =
              numberOfMonths === 2
                ? date.to
                  ? endOfDay(toDate(date.to, { timeZone }))
                  : endOfMonth(toDate(newMonth, { timeZone }))
                : from;
            if (from <= to) {
              onDateSelect({ from, to });
              setMonthFrom(newMonth);
              setMonthTo(date.to);
            }
          }
        } else {
          if (yearTo !== undefined) {
            if (newMonthIndex < 0 || newMonthIndex > yearsRange + 1) return;
            const newMonth = new Date(yearTo, newMonthIndex, 1);
            const from = date.from
              ? startOfDay(toDate(date.from, { timeZone }))
              : startOfMonth(toDate(newMonth, { timeZone }));
            const to =
              numberOfMonths === 2
                ? endOfMonth(toDate(newMonth, { timeZone }))
                : from;
            if (from <= to) {
              onDateSelect({ from, to });
              setMonthTo(newMonth);
              setMonthFrom(date.from);
            }
          }
        }
      },
      [
        date,
        onDateSelect,
        numberOfMonths,
        timeZone,
        yearsRange,
        yearFrom,
        yearTo,
      ]
    );

    const handleYearChange = React.useCallback(
      (newYear: number, part: string) => {
        setSelectedRange(null);
        if (part === "from") {
          if (years.includes(newYear)) {
            const newMonth = monthFrom
              ? new Date(newYear, monthFrom ? monthFrom.getMonth() : 0, 1)
              : new Date(newYear, 0, 1);
            const from =
              numberOfMonths === 2
                ? startOfMonth(toDate(newMonth, { timeZone }))
                : date.from
                ? new Date(newYear, newMonth.getMonth(), date.from.getDate())
                : newMonth;
            const to =
              numberOfMonths === 2
                ? date.to
                  ? endOfDay(toDate(date.to, { timeZone }))
                  : endOfMonth(toDate(newMonth, { timeZone }))
                : from;
            if (from <= to) {
              onDateSelect({ from, to });
              setYearFrom(newYear);
              setMonthFrom(newMonth);
              setYearTo(date.to?.getFullYear());
              setMonthTo(date.to);
            }
          }
        } else {
          if (years.includes(newYear)) {
            const newMonth = monthTo
              ? new Date(newYear, monthTo.getMonth(), 1)
              : new Date(newYear, 0, 1);
            const from = date.from
              ? startOfDay(toDate(date.from, { timeZone }))
              : startOfMonth(toDate(newMonth, { timeZone }));
            const to =
              numberOfMonths === 2
                ? endOfMonth(toDate(newMonth, { timeZone }))
                : from;
            if (from <= to) {
              onDateSelect({ from, to });
              setYearTo(newYear);
              setMonthTo(newMonth);
              setYearFrom(date.from?.getFullYear());
              setMonthFrom(date.from);
            }
          }
        }
      },
      [date, monthFrom, monthTo, numberOfMonths, onDateSelect, timeZone, years]
    );

    const presets: Array<{
      key: keyof typeof ranges;
      start: Date;
      end: Date;
    }> = [
      // { key: "today", start: today, end: today },
      { key: "yesterday", start: subDays(today, 1), end: subDays(today, 1) },
      {
        key: "thisWeek",
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
      },
      {
        key: "lastWeek",
        start: subDays(startOfWeek(today, { weekStartsOn: 1 }), 7),
        end: subDays(endOfWeek(today, { weekStartsOn: 1 }), 7),
      },
      { key: "last7Days", start: subDays(today, 6), end: today },
      {
        key: "thisMonth",
        start: startOfMonth(today),
        end: endOfMonth(today),
      },
      {
        key: "lastMonth",
        start: startOfMonth(subDays(today, today.getDate())),
        end: endOfMonth(subDays(today, today.getDate())),
      },
      { key: "thisYear", start: startOfYear(today), end: today },
      {
        key: "lastYear",
        start: startOfYear(subDays(today, 365)),
        end: endOfYear(subDays(today, 365)),
      },
    ];

    // створюємо масив для рендеру кнопок:
    const dateRanges = presets.map((p) => ({
      label: ranges[p.key], // напр.: ranges["today"] → "Today" або "Сьогодні"
      start: p.start,
      end: p.end,
    }));
    /** Форматує окрему частину дати (день, місяць, рік) */
    const formatPart = (date: Date, fmt: string) =>
      formatInTimeZone(date, timeZone, fmt, { locale: locales[language] });

    const handleWheel = React.useCallback(
      (event: React.WheelEvent) => {
        event.preventDefault();
        setSelectedRange(null);
        if (highlightedPart === "firstDay") {
          const newDate = new Date(date.from as Date);
          const increment = event.deltaY > 0 ? -1 : 1;
          newDate.setDate(newDate.getDate() + increment);
          if (newDate <= (date.to as Date)) {
            if (numberOfMonths === 2) {
              onDateSelect({ from: newDate, to: new Date(date.to as Date) });
            } else {
              onDateSelect({ from: newDate, to: newDate });
            }
            setMonthFrom(newDate);
          } else if (newDate > (date.to as Date) && numberOfMonths === 1) {
            onDateSelect({ from: newDate, to: newDate });
            setMonthFrom(newDate);
          }
        } else if (highlightedPart === "firstMonth") {
          const currentMonth = monthFrom ? monthFrom.getMonth() : 0;
          const newMonthIndex = currentMonth + (event.deltaY > 0 ? -1 : 1);
          handleMonthChange(newMonthIndex, "from");
        } else if (highlightedPart === "firstYear" && yearFrom !== undefined) {
          const newYear = yearFrom + (event.deltaY > 0 ? -1 : 1);
          handleYearChange(newYear, "from");
        } else if (highlightedPart === "secondDay") {
          const newDate = new Date(date.to as Date);
          const increment = event.deltaY > 0 ? -1 : 1;
          newDate.setDate(newDate.getDate() + increment);
          if (newDate >= (date.from as Date)) {
            onDateSelect({ from: new Date(date.from as Date), to: newDate });
            setMonthTo(newDate);
          }
        } else if (highlightedPart === "secondMonth") {
          const currentMonth = monthTo ? monthTo.getMonth() : 0;
          const newMonthIndex = currentMonth + (event.deltaY > 0 ? -1 : 1);
          handleMonthChange(newMonthIndex, "to");
        } else if (highlightedPart === "secondYear" && yearTo !== undefined) {
          const newYear = yearTo + (event.deltaY > 0 ? -1 : 1);
          handleYearChange(newYear, "to");
        }
      },
      [
        date,
        monthFrom,
        monthTo,
        yearFrom,
        yearTo,
        numberOfMonths,
        highlightedPart,
        onDateSelect,
        handleMonthChange,
        handleYearChange,
      ]
    );

    React.useEffect(() => {
      const firstDayElement = document.getElementById(`firstDay-${id}`);
      const firstMonthElement = document.getElementById(`firstMonth-${id}`);
      const firstYearElement = document.getElementById(`firstYear-${id}`);
      const secondDayElement = document.getElementById(`secondDay-${id}`);
      const secondMonthElement = document.getElementById(`secondMonth-${id}`);
      const secondYearElement = document.getElementById(`secondYear-${id}`);

      const elements = [
        firstDayElement,
        firstMonthElement,
        firstYearElement,
        secondDayElement,
        secondMonthElement,
        secondYearElement,
      ];

      const addPassiveEventListener = (element: HTMLElement | null) => {
        if (element) {
          element.addEventListener(
            "wheel",
            handleWheel as unknown as EventListener,
            {
              passive: false,
            }
          );
        }
      };

      elements.forEach(addPassiveEventListener);

      return () => {
        elements.forEach((element) => {
          if (element) {
            element.removeEventListener(
              "wheel",
              handleWheel as unknown as EventListener
            );
          }
        });
      };
    }, [highlightedPart, date, id, handleWheel]);

    return (
      <>
        <style>
          {`
            .date-part {
              touch-action: none;
            }
          `}
        </style>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <div>
              <SoundHoverElement
                hoverStyleElement={HoverStyleElement.circle}
                animValue={1}
              >
                <Button
                  id="date"
                  ref={ref}
                  variant={"ghost"}
                  {...props}
                  className={cn(
                    "w-auto",
                    multiSelectVariants({ variant, className })
                  )}
                  onClick={handleTogglePopover}
                  suppressHydrationWarning
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date.from ? (
                    date.to ? (
                      <>
                        <span /* …firstDay props… */>
                          {formatPart(date.from, "dd")}
                        </span>
                        <span /* …firstMonth props… */>
                          {formatPart(date.from, "LLL")}
                        </span>
                        <span /* …firstYear props… */>
                          {formatPart(date.from, "y")}
                        </span>
                        {" – "}
                        <span /* …secondDay props… */>
                          {formatPart(date.to, "dd")}
                        </span>
                        <span /* …secondMonth props… */>
                          {formatPart(date.to, "LLL")}
                        </span>
                        <span /* …secondYear props… */>
                          {formatPart(date.to, "y")}
                        </span>
                      </>
                    ) : (
                      <>
                        <span /* day span */>
                          {formatPart(date.from, "dd")}
                        </span>
                        <span /* month span */>
                          {formatPart(date.from, "LLL")}
                        </span>
                        <span /* year span */>
                          {formatPart(date.from, "y")}
                        </span>
                      </>
                    )
                  ) : (
                    <>{t("pickDate")}</>
                  )}
                </Button>
              </SoundHoverElement>
            </div>
          </PopoverTrigger>
          {isPopoverOpen && (
            <PopoverContent
              className="calendar-date-picker-popover w-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 shadow-xl dark:shadow-black/50 z-[100]"
              side="bottom" // відкриваємо під тригером
              align="end" // вирівнювання по правому краю
              sideOffset={8} // відступ 8px від кнопки
              avoidCollisions={true} // трекінг меж екрану
              collisionPadding={12} // мінімальний відступ від країв вікна
              onInteractOutside={handleClose}
              onEscapeKeyDown={handleClose}
              style={{
                maxHeight: "var(--radix-popover-content-available-height)",
                overflowY: "auto",
              }}
            >
              <div className="flex flex-col md:flex-row">
                {numberOfMonths === 2 && (
                  <div className="flex flex-col gap-1 pr-4 text-left border-r border-foreground/10">
                    {dateRanges.map(({ label, start, end }) => (
                      <Button
                        key={label}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "justify-start hover:card hover:text-background",
                          selectedRange === label &&
                            "bg-primary text-background hover:card hover:text-background"
                        )}
                        onClick={() => {
                          selectDateRange(start, end, label);
                          setMonthFrom(start);
                          setYearFrom(start.getFullYear());
                          setMonthTo(end);
                          setYearTo(end.getFullYear());
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="flex flex-col">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2 ml-3">
                      <Select
                        onValueChange={(value) => {
                          handleMonthChange(months.indexOf(value), "from");
                          setSelectedRange(null);
                        }}
                        value={
                          monthFrom ? months[monthFrom.getMonth()] : undefined
                        }
                      >
                        <SelectTrigger className="hidden sm:flex w-[122px] focus:ring-0 focus:ring-offset-0 font-medium hover:bg-card hover:text-accent-foreground">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month, idx) => (
                            <SelectItem key={idx} value={month}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        onValueChange={(value) => {
                          handleYearChange(Number(value), "from");
                          setSelectedRange(null);
                        }}
                        value={yearFrom ? yearFrom.toString() : undefined}
                      >
                        <SelectTrigger className="hidden sm:flex w-[122px] focus:ring-0 focus:ring-offset-0 font-medium hover:bg-accent hover:text-accent-foreground">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year, idx) => (
                            <SelectItem key={idx} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {numberOfMonths === 2 && (
                      <div className="flex gap-2">
                        <Select
                          onValueChange={(value) => {
                            handleMonthChange(months.indexOf(value), "to");
                            setSelectedRange(null);
                          }}
                          value={
                            monthTo ? months[monthTo.getMonth()] : undefined
                          }
                        >
                          <SelectTrigger className="hidden sm:flex w-[122px] focus:ring-0 focus:ring-offset-0 font-medium hover:bg-accent hover:text-accent-foreground">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((month, idx) => (
                              <SelectItem key={idx} value={month}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          onValueChange={(value) => {
                            handleYearChange(Number(value), "to");
                            setSelectedRange(null);
                          }}
                          value={yearTo ? yearTo.toString() : undefined}
                        >
                          <SelectTrigger className="hidden sm:flex w-[122px] focus:ring-0 focus:ring-offset-0 font-medium hover:bg-accent hover:text-accent-foreground">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year, idx) => (
                              <SelectItem key={idx} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="flex">
                    <Calendar
                      mode="range"
                      locale={locales[language] ?? enUS}
                      defaultMonth={monthFrom}
                      month={monthFrom}
                      onMonthChange={setMonthFrom}
                      selected={date}
                      onSelect={handleDateSelect}
                      numberOfMonths={numberOfMonths}
                      showOutsideDays={false}
                      className={className}
                      modifiersClassNames={{
                        selected:
                          "!bg-accent !text-foreground border border-background",
                        today:
                          "bg-background shadow-md shadow-accent border border-accent",
                        active: "bg-foreground/20 text-foreground",
                        hasTasks:
                          "after:block after:absolute after:-bottom-1 after:w-1 after:h-1 after:bg-foreground after:rounded-full", // 👈 стилізуємо це окремо
                      }}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          )}
        </Popover>
      </>
    );
  }
);

CalendarDatePicker.displayName = "CalendarDatePicker";
