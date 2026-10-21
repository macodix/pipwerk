function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

/** Date and time in the local time zone of the browser, 24-hour clock. */
export function localParts(isoTimestamp: string): {
  year: string;
  month: string;
  day: string;
  hours: string;
  minutes: string;
} {
  const date = new Date(isoTimestamp);
  return {
    year: pad(date.getFullYear(), 4),
    month: pad(date.getMonth() + 1),
    day: pad(date.getDate()),
    hours: pad(date.getHours()),
    minutes: pad(date.getMinutes()),
  };
}
