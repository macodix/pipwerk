// Import of files into the data stock (req-system-026): recognising instrument and data from the file name
// and, for JSON, from the content; checking a file by itself; the two sample files of the prototype.
// Every file is checked and taken over on its own. A file with a fault in format or content is refused as a
// whole, single faulty rows are skipped with their reason.
import { TIME_UNITS } from './catalog';
import type { DataRow, Kind } from './data';
import type { Txt } from './model';
import { DAY, INSTRUMENTS, isoDate, parseIsoDate, rng } from './sim/market';

const T = (de: string, en: string): Txt => ({ de, en });

/** What a file contains: '' (not known), a time unit such as 'h1', 'ticks' or 'contract'. */
export type DataSel = string;

export interface Rejected {
  line: number;
  reason: Txt;
}

export interface ItemResult {
  /** The whole file is refused. */
  error: Txt | null;
  accepted: number;
  from: string;
  to: string;
  rejectedCount: number;
  /** The first rejected rows. */
  rejected: Rejected[];
  row: DataRow | null;
}

export interface ImportItem {
  uid: string;
  name: string;
  size: number;
  text: string;
  format: 'csv' | 'json' | null;
  /** A fault found when the file was read (not JSON, not an object, no rows). */
  fileError: Txt | null;
  instrument: string;
  data: DataSel;
  /** Broker named in the content of a JSON file. */
  jsonBroker: string;
  result: ItemResult | null;
}

export const DATA_CHOICES: { id: DataSel; de: string; en: string }[] = [
  ...TIME_UNITS.map((u) => ({ id: u.id, de: `Kerzen ${u.de}`, en: `Candles ${u.de}` })),
  { id: 'ticks', de: 'Ticks', en: 'Ticks' },
  { id: 'contract', de: 'Kontraktdaten', en: 'Contract data' },
];

export const kindOf = (d: DataSel): Kind => (d === 'ticks' ? 'ticks' : d === 'contract' ? 'contract' : 'candles');

// ---- recognising -----------------------------------------------------------------------------------------

/** Names of `pipwerk-fetch-mt5` (`<Instrument>_<Daten>_<von>_<bis>.json`) and of CSV exports. */
export function guessFromName(name: string): { instrument: string; data: DataSel } {
  const base = name.replace(/\.[^.]*$/, '').toUpperCase();
  const tokens = base.split(/[^A-Z0-9]+/).filter(Boolean);
  const instrument = tokens.find((t) => INSTRUMENTS.some((i) => i.id === t)) ?? INSTRUMENTS.find((i) => base.includes(i.id))?.id ?? '';
  let data: DataSel = '';
  if (tokens.includes('TICKS') || tokens.includes('TICK')) data = 'ticks';
  else if (tokens.includes('CONTRACT') || tokens.includes('KONTRAKT') || tokens.includes('KONTRAKTDATEN')) data = 'contract';
  else data = TIME_UNITS.find((u) => tokens.includes(u.id.toUpperCase()))?.id ?? '';
  return { instrument, data };
}

function dataFromContent(v: unknown): DataSel {
  if (typeof v !== 'string') return '';
  const u = v.trim().toUpperCase();
  if (u === 'TICKS' || u === 'TICK') return 'ticks';
  if (u === 'CONTRACT') return 'contract';
  return TIME_UNITS.find((x) => x.id.toUpperCase() === u)?.id ?? '';
}

let uidNo = 0;

export function readItem(name: string, size: number, text: string): ImportItem {
  uidNo += 1;
  const lower = name.toLowerCase();
  const format = lower.endsWith('.json') ? 'json' : lower.endsWith('.csv') ? 'csv' : null;
  const g = guessFromName(name);
  const item: ImportItem = { uid: `f${uidNo}`, name, size, text, format, fileError: null, instrument: g.instrument, data: g.data, jsonBroker: '', result: null };
  if (format === 'json') {
    try {
      const o: unknown = JSON.parse(text);
      if (typeof o !== 'object' || o === null || Array.isArray(o)) {
        item.fileError = T('Die Datei enthält kein JSON-Objekt.', 'The file does not contain a JSON object.');
      } else {
        const r = o as Record<string, unknown>;
        if (typeof r.broker === 'string') item.jsonBroker = r.broker.trim();
        const ins = typeof r.instrument === 'string' ? r.instrument.trim().toUpperCase() : '';
        if (INSTRUMENTS.some((i) => i.id === ins)) item.instrument = ins;
        const d = dataFromContent(r.data);
        if (d) item.data = d;
        if (!Array.isArray(r.rows) && typeof r.contract !== 'object') item.fileError = T('Die Datei enthält weder „rows“ noch „contract“.', 'The file contains neither "rows" nor "contract".');
      }
    } catch {
      item.fileError = T('Keine gültige JSON-Datei.', 'Not a valid JSON file.');
    }
  } else if (format === null) {
    item.fileError = T('Format nicht erkannt. Erlaubt sind JSON und CSV.', 'Format not recognised. JSON and CSV are allowed.');
  }
  return item;
}

/** A readable file lacks instrument or data: the import waits for the user. */
export const needsInput = (i: ImportItem): boolean => i.format !== null && !i.fileError && (i.instrument === '' || i.data === '') && !i.result;

// ---- time zones ------------------------------------------------------------------------------------------

export function tzValid(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz.trim() !== '';
  } catch {
    return false;
  }
}

function tzOffsetMin(tz: string, utcMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'));
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000);
}

/** The server time of the broker (local time in the zone) as UTC. */
export function localToUtc(tz: string, localMs: number): number {
  const first = localMs - tzOffsetMin(tz, localMs) * 60000;
  return localMs - tzOffsetMin(tz, first) * 60000;
}

// ---- checking one file ------------------------------------------------------------------------------------

interface RowIn {
  /** Time as local milliseconds (CSV) or UTC (JSON). */
  t: number;
  v: number[];
}

const noTime = T('Zeitpunkt nicht lesbar', 'Time not readable');
const noNumber = T('Kurs fehlt oder ist keine Zahl', 'Price missing or not a number');
const notPositive = T('Kurs nicht größer als null', 'Price not greater than zero');
const order = T('Zeitpunkt nicht aufsteigend', 'Time not ascending');
const highBelowOpen = T('Hoch liegt unter der Eröffnung', 'High is below the open');
const closeBelowLow = T('Schluss liegt unter dem Tief', 'Close is below the low');
const askBelowBid = T('Brief liegt unter dem Geld', 'Ask is below the bid');

function checkRow(kind: Kind, v: number[]): Txt | null {
  if (v.some((x) => Number.isNaN(x))) return noNumber;
  if (v.some((x) => x <= 0)) return notPositive;
  if (kind === 'candles') {
    if (v[1] < v[0]) return highBelowOpen;
    if (v[3] < v[2]) return closeBelowLow;
  } else if (v[1] < v[0]) return askBelowBid;
  return null;
}

function parseJsonTime(s: unknown): number {
  if (typeof s !== 'string') return Number.NaN;
  return Date.parse(/(Z|[+-]\d{2}:?\d{2})$/.test(s) ? s : `${s}Z`);
}

function parseCsvTime(date: string, time: string): number {
  const d = /^(\d{4})[.-](\d{2})[.-](\d{2})$/.exec(date);
  const t = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(time);
  if (!d || !t) return Number.NaN;
  return Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]), Number(t[3] ?? 0));
}

/** Checks a file by itself. Nothing of the stock changes here; the caller takes over `row`. */
export function importFile(item: ImportItem, broker: string, tz: string): ItemResult {
  const fail = (error: Txt): ItemResult => ({ error, accepted: 0, from: '', to: '', rejectedCount: 0, rejected: [], row: null });
  if (item.fileError) return fail(item.fileError);
  const kind = kindOf(item.data);
  const tf = kind === 'candles' ? item.data : null;
  const rowOf = (from: string, to: string): DataRow => ({
    id: `i${Date.now().toString(36)}${item.uid}`, broker, instrument: item.instrument, kind, tf, from, to, origin: 'import',
  });
  const rejected: Rejected[] = [];
  let rejectedCount = 0;
  const reject = (line: number, reason: Txt) => {
    rejectedCount += 1;
    if (rejected.length < 3) rejected.push({ line, reason });
  };

  if (item.format === 'json') {
    const o = JSON.parse(item.text) as Record<string, unknown>;
    if (kind === 'contract') {
      const c = o.contract as Record<string, unknown> | undefined;
      if (!c || typeof c !== 'object') return fail(T('Die Datei enthält keine Kontraktdaten („contract“ fehlt).', 'The file contains no contract data ("contract" is missing).'));
      for (const f of ['tickSize', 'tickValue', 'contractSize']) {
        if (typeof c[f] !== 'number' || (c[f] as number) <= 0) return fail(T(`Kontraktdaten unvollständig: „${f}“ fehlt oder ist nicht größer als null.`, `Contract data incomplete: "${f}" is missing or not greater than zero.`));
      }
      return { error: null, accepted: 1, from: '', to: '', rejectedCount: 0, rejected: [], row: rowOf('', '') };
    }
    if (!Array.isArray(o.rows)) return fail(T('Die Datei enthält keine Zeilen („rows“ fehlt).', 'The file contains no rows ("rows" is missing).'));
    const keys = kind === 'candles' ? ['o', 'h', 'l', 'c'] : ['bid', 'ask'];
    const ok: RowIn[] = [];
    (o.rows as Record<string, unknown>[]).forEach((r, i) => {
      const t = parseJsonTime(r?.t);
      if (Number.isNaN(t)) { reject(i + 1, noTime); return; }
      const v = keys.map((k) => (typeof r[k] === 'number' ? (r[k] as number) : Number.NaN));
      const why = checkRow(kind, v);
      if (why) { reject(i + 1, why); return; }
      if (ok.length && t <= ok[ok.length - 1].t) { reject(i + 1, order); return; }
      ok.push({ t, v });
    });
    return done(ok, rejected, rejectedCount, (ms) => ms, rowOf, fail);
  }

  // CSV in the export format of MetaTrader 5: tab separated, with a header line, times in server time
  if (kind === 'contract') return fail(T('Eine CSV-Datei enthält keine Kontraktdaten. Nehmen Sie dafür eine JSON-Datei.', 'A CSV file contains no contract data. Use a JSON file for them.'));
  if (!tzValid(tz)) return fail(T('Die Zeitzone ist unbekannt.', 'The time zone is unknown.'));
  const need = kind === 'candles' ? 4 : 2;
  const ok: RowIn[] = [];
  item.text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim() || (i === 0 && line.trim().startsWith('<'))) return;
    const f = line.split(/[\t;,]/).map((x) => x.trim());
    const hasTime = /^\d{1,2}:\d{2}/.test(f[1] ?? '');
    const t = parseCsvTime(f[0], hasTime ? f[1] : '00:00');
    if (Number.isNaN(t)) { reject(i + 1, noTime); return; }
    const v = f.slice(hasTime ? 2 : 1, (hasTime ? 2 : 1) + need).map((x) => (x === '' ? Number.NaN : Number(x)));
    while (v.length < need) v.push(Number.NaN);
    const why = checkRow(kind, v);
    if (why) { reject(i + 1, why); return; }
    if (ok.length && t <= ok[ok.length - 1].t) { reject(i + 1, order); return; }
    ok.push({ t, v });
  });
  return done(ok, rejected, rejectedCount, (ms) => localToUtc(tz, ms), rowOf, fail);
}

function done(
  ok: RowIn[], rejected: Rejected[], rejectedCount: number, toUtc: (ms: number) => number,
  rowOf: (from: string, to: string) => DataRow, fail: (e: Txt) => ItemResult,
): ItemResult {
  if (ok.length === 0) return fail(T('Die Datei enthält keine gültige Zeile.', 'The file contains no valid row.'));
  const from = isoDate(toUtc(ok[0].t));
  const to = isoDate(toUtc(ok[ok.length - 1].t));
  return { error: null, accepted: ok.length, from, to, rejectedCount, rejected, row: rowOf(from, to) };
}

// ---- the sample files ---------------------------------------------------------------------------------------

function* weekdays(from: string, to: string): Generator<number> {
  for (let t = parseIsoDate(from); t <= parseIsoDate(to); t += DAY) {
    const wd = new Date(t).getUTCDay();
    if (wd !== 0 && wd !== 6) yield t;
  }
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Two invented sample files: a CSV export of M15 candles of EURUSD and a JSON file of H1 candles of XAUUSD. */
export function sampleFiles(): { name: string; text: string }[] {
  // 1: CSV, export format of MetaTrader 5, tab separated; three rows with a high below the open
  const r1 = rng(4711);
  const csv: string[] = ['<DATE>\t<TIME>\t<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>\t<TICKVOL>\t<VOL>\t<SPREAD>'];
  let px = 1.0905;
  let n = 0;
  for (const day of weekdays('2024-10-21', '2025-03-02')) {
    const d = new Date(day);
    for (let q = 0; q < 96; q++) {
      const o = px;
      const c = o + (r1() - 0.5) * 0.0006;
      const h = Math.max(o, c) + r1() * 0.0002;
      const l = Math.min(o, c) - r1() * 0.0002;
      px = c;
      n += 1;
      const bad = n === 701 || n === 3101 || n === 5001;
      csv.push([
        `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())}`, `${pad(Math.floor(q / 4))}:${pad((q % 4) * 15)}:00`,
        o.toFixed(5), (bad ? o - 0.0002 : h).toFixed(5), l.toFixed(5), c.toFixed(5), String(40 + Math.floor(r1() * 200)), '0', String(8 + Math.floor(r1() * 6)),
      ].join('\t'));
    }
  }
  // 2: JSON as `pipwerk-fetch-mt5` writes it; one row with a close below the low
  const r2 = rng(2718);
  let gold = 3318;
  const rows: Record<string, unknown>[] = [];
  for (const day of weekdays('2025-04-14', '2025-04-18')) {
    for (let h = 0; h < 24; h++) {
      const o = gold;
      const c = o + (r2() - 0.5) * 6;
      const hi = Math.max(o, c) + r2() * 2;
      const lo = Math.min(o, c) - r2() * 2;
      gold = c;
      rows.push({ t: `${isoDate(day)}T${pad(h)}:00:00Z`, o: Number(o.toFixed(2)), h: Number(hi.toFixed(2)), l: Number(lo.toFixed(2)), c: Number(c.toFixed(2)) });
    }
  }
  rows[57] = { ...rows[57], c: Number((Number(rows[57].l) - 1).toFixed(2)) };
  const json = JSON.stringify({ broker: 'Demo-Broker (MetaTrader 5)', instrument: 'XAUUSD', data: 'H1', rows });
  return [
    { name: 'EURUSD_M15_2024-10-21_2025-03-02.csv', text: csv.join('\n') },
    { name: 'XAUUSD_H1_2025-04-12_2025-04-20.json', text: json },
  ];
}
