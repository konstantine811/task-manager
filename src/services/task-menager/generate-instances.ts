import type { UniqueIdentifier } from "@dnd-kit/core";
import {
  addDays,
  differenceInDays,
  formatISO,
  getDay,
  isWithinInterval,
  parseISO,
  startOfWeek,
  type Day,
} from "date-fns";
import type { ISODate, TaskTemplate } from "@/types/task-template.model";
import type { TaskInstance } from "@/types/task-instance.model";

/** Get day of week 1=Mon..7=Sun (date-fns uses 0=Sun, we use 1=Mon) */
function toDayNumber(d: Date): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const fns = getDay(d); // 0=Sun, 1=Mon, ... 6=Sat
  return (fns === 0 ? 7 : fns) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

function toDateFnsDay(n: number): Day {
  return (n === 7 ? 0 : n) as Day;
}

/** Check if date matches weekdays rule */
function matchesWeekdays(date: Date, days: number[]): boolean {
  const dn = toDayNumber(date);
  return days.includes(dn);
}

/** Check if date matches interval_days from anchor */
function matchesIntervalDays(
  date: Date,
  every: number,
  anchorDate: ISODate
): boolean {
  const anchor = parseISO(anchorDate);
  anchor.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = differenceInDays(d, anchor);
  if (diff < 0) return false;
  return diff % every === 0;
}

/** Get all dates in range for times_per_week — N instances per week, spread evenly */
function getDatesForTimesPerWeek(
  from: Date,
  to: Date,
  times: number,
  weekStartsOn: 1 | 2 | 3 | 4 | 5 | 6 | 7 = 1
): Date[] {
  const result: Date[] = [];
  const dayMap = toDateFnsDay(weekStartsOn);
  let weekStart = startOfWeek(from, { weekStartsOn: dayMap });
  if (weekStart < from) weekStart = new Date(from);

  while (weekStart <= to) {
    for (let i = 0; i < times; i++) {
      const offset = times > 1 ? Math.floor((i * 7) / times) : 0;
      const d = addDays(weekStart, offset);
      if (d >= from && d <= to) result.push(d);
    }
    weekStart = addDays(weekStart, 7);
  }
  return result;
}

/** Generate instances for a single template in date range */
function generateForTemplate(
  template: TaskTemplate,
  from: Date,
  to: Date,
  existingInstanceDates: Set<string>
): TaskInstance[] {
  const instances: TaskInstance[] = [];
  const idPrefix = `instance-${template.id}-`;

  const addInstance = (_date: Date, dateStr: ISODate) => {
    const key = `${template.id}:${dateStr}`;
    if (existingInstanceDates.has(key)) return;
    existingInstanceDates.add(key);

    const instanceId = `${idPrefix}${dateStr}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    instances.push({
      id: instanceId as UniqueIdentifier,
      templateId: template.id,
      date: dateStr,
      status: "todo",
      timeDone: 0,
    });
  };

  const schedule = template.schedule;

  switch (schedule.type) {
    case "weekdays": {
      let d = new Date(from);
      d.setHours(0, 0, 0, 0);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      while (d <= toDate) {
        if (matchesWeekdays(d, schedule.days)) {
          addInstance(d, formatISO(d, { representation: "date" }) as ISODate);
        }
        d = addDays(d, 1);
      }
      break;
    }
    case "interval_days": {
      let d = new Date(from);
      d.setHours(0, 0, 0, 0);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      while (d <= toDate) {
        if (matchesIntervalDays(d, schedule.every, schedule.anchorDate)) {
          addInstance(d, formatISO(d, { representation: "date" }) as ISODate);
        }
        d = addDays(d, 1);
      }
      break;
    }
    case "times_per_week": {
      const weekStartsOn = schedule.weekStartsOn ?? 1;
      const dates = getDatesForTimesPerWeek(
        from,
        to,
        schedule.times,
        weekStartsOn as 1 | 2 | 3 | 4 | 5 | 6 | 7
      );
      for (const d of dates) {
        addInstance(d, formatISO(d, { representation: "date" }) as ISODate);
      }
      break;
    }
    case "once": {
      const onceDate = parseISO(schedule.date);
      if (isWithinInterval(onceDate, { start: from, end: to })) {
        addInstance(onceDate, schedule.date);
      }
      break;
    }
    case "custom":
      // RRULE not implemented — skip
      break;
  }

  return instances;
}

/**
 * Generate TaskInstances for all templates in date range.
 * Avoids duplicates by checking existing instances.
 */
export function generateInstancesForRange(
  templates: TaskTemplate[],
  from: ISODate,
  to: ISODate,
  existingInstances: TaskInstance[] = []
): TaskInstance[] {
  const fromDate = parseISO(from);
  const toDate = parseISO(to);
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(23, 59, 59, 999);

  const existingSet = new Set(
    existingInstances.map((i) => `${i.templateId}:${i.date}`)
  );

  const result: TaskInstance[] = [...existingInstances];

  for (const template of templates) {
    const newInstances = generateForTemplate(
      template,
      fromDate,
      toDate,
      existingSet
    );
    result.push(...newInstances);
  }

  return result;
}
