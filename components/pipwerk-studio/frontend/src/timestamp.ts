const TIMESTAMP =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:Z|[+-](\d{2}):(\d{2}))$/;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/**
 * Accepts only real calendar dates and times. `Date.parse` is not used for the
 * check because browsers differ in how they roll over impossible values.
 *
 * Shared by the revision response check, the build revision check in the
 * browser and the lookup at build time (Node.js).
 */
export function isTimestamp(value: string): boolean {
  const match = TIMESTAMP.exec(value);
  if (match === null) {
    return false;
  }
  const [year = 0, month = 0, day = 0, hours = 0, minutes = 0, seconds = 0, offsetHours = 0, offsetMinutes = 0] =
    match.slice(1).map((part) => (part === undefined ? 0 : Number(part)));
  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month) &&
    hours <= 23 &&
    minutes <= 59 &&
    seconds <= 59 &&
    offsetHours <= 23 &&
    offsetMinutes <= 59
  );
}
