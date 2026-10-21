// Formatting of values for the interface.
import { choiceLabel } from './catalog';
import type { PropDef } from './model';
import type { Lang } from './model';
import type { Val } from './sim/engine';
import { fmtTime } from './sim/market';

export function fmtN(v: number, digits: number, lang: Lang): string {
  return v.toLocaleString(lang === 'en' ? 'en-GB' : 'de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtMoney(v: number, cur: string, lang: Lang, digits = 2): string {
  return `${fmtN(v, digits, lang)} ${cur}`;
}

export function fmtPct(v: number | null, lang: Lang, digits = 1): string {
  return v === null ? '–' : `${fmtN(v * 100, digits, lang)} %`;
}

export function fmtSigned(v: number, digits: number, lang: Lang): string {
  return `${v > 0 ? '+' : ''}${fmtN(v, digits, lang)}`;
}

/** A property value as text. `digits` is the number of decimals of prices of the instrument. */
export function fmtVal(v: Val, p: Pick<PropDef, 'dtype' | 'choices' | 'id'> | undefined, lang: Lang, digits: number): string {
  if (v === null || v === undefined) return '–';
  if (typeof v === 'boolean') return v ? (lang === 'en' ? 'yes' : 'ja') : lang === 'en' ? 'no' : 'nein';
  if (typeof v === 'string') {
    if (p?.choices) return choiceLabel(p.choices, v, lang);
    if (v === 'buy') return lang === 'en' ? 'buy' : 'buy (Kauf)';
    if (v === 'sell') return lang === 'en' ? 'sell' : 'sell (Verkauf)';
    if (v === 'wartend') return lang === 'en' ? 'pending' : 'wartend';
    if (v === 'ausgefuehrt') return lang === 'en' ? 'filled' : 'ausgeführt';
    if (v === 'geloescht') return lang === 'en' ? 'deleted' : 'gelöscht';
    return v;
  }
  if (p?.dtype === 'timestamp') return fmtTime(v, lang);
  if (p?.dtype === 'integer') return fmtN(v, 0, lang);
  if (p?.id === 'volumen') return fmtN(v, 2, lang);
  if (p?.id === 'kapital' || p?.id === 'freie_margin' || p?.id === 'offener_gewinn_oder_verlust') return fmtN(v, 2, lang);
  if (p?.id === 'wert') return fmtN(v, digits, lang);
  return fmtN(v, Math.abs(v) >= 100 && digits > 3 ? 2 : digits, lang);
}

export function elapsed(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
