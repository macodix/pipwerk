// Formatting of numbers and times for the interface. Times of the data stock are UTC.
import type { SupportedLanguage } from './i18n';

function locale(language: SupportedLanguage): string {
  return language === 'en' ? 'en-GB' : 'de-DE';
}

/** A number with at most `maxDigits` decimals and at least `minDigits`. */
export function formatNumber(
  value: number,
  language: SupportedLanguage,
  maxDigits = 2,
  minDigits = 0,
): string {
  return value.toLocaleString(locale(language), {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: Math.max(maxDigits, minDigits),
  });
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * A moment (ISO 8601 text) in UTC to the minute: `05.01.2026 08:00` in German,
 * `2026-01-05 08:00` in English. The caller names the time zone (UTC).
 */
export function formatMoment(iso: string, language: SupportedLanguage): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const day = pad(date.getUTCDate());
  const month = pad(date.getUTCMonth() + 1);
  const time = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
  return language === 'en' ? `${year}-${month}-${day} ${time}` : `${day}.${month}.${year} ${time}`;
}

export function formatPeriod(start: string, end: string, language: SupportedLanguage): string {
  return `${formatMoment(start, language)} – ${formatMoment(end, language)}`;
}

/**
 * Whether `value` is a real date with a time to the minute, `yyyy-mm-ddThh:mm` (the value of
 * the input field `datetime-local`). The interface reads it as UTC.
 */
export function isMinute(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** The moment (ISO 8601 with time zone Z) for a value `yyyy-mm-ddThh:mm`, read as UTC. */
export function minuteToMoment(value: string): string {
  return `${value}:00Z`;
}

/** The text of a size in bytes, for example `12.4 KB`. */
export function formatBytes(bytes: number, language: SupportedLanguage): string {
  if (bytes < 1024) {
    return `${formatNumber(bytes, language, 0)} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${formatNumber(bytes / 1024, language, 1)} KB`;
  }
  return `${formatNumber(bytes / (1024 * 1024), language, 1)} MB`;
}
