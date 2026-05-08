export function formatSeconds(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds };
}

export function paresSecondToTime(seconds: number) {
  const abs = Math.abs(seconds);
  const hours = Math.floor(abs / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
  };
}

/** Seconds since local midnight (clock time for pickers). */
export function getSecondsSinceMidnight(date = new Date()): number {
  return (
    date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
  );
}
