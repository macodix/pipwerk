/** Date and time in the local time of the browser, with parts filled with zeros. `null` if the text is no time. */
export function localDateTimeParts(
  iso: string,
): { year: string; month: string; day: string; hours: string; minutes: string } | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const pad = (value: number): string => String(value).padStart(2, '0');
  return {
    year: String(date.getFullYear()).padStart(4, '0'),
    month: pad(date.getMonth() + 1),
    day: pad(date.getDate()),
    hours: pad(date.getHours()),
    minutes: pad(date.getMinutes()),
  };
}
