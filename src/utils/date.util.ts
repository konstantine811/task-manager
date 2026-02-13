export function parseDates(dates: string[]) {
  return dates
    .map((date) => parseDate(date))
    .filter((d) => !isNaN(d.getTime()));
}

export function parseDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isFutureDate(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parsedDate = parseDate(date);
  return today < parsedDate;
}
