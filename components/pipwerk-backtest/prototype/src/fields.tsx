// Labelled fields with a short explanation in trader language that appears when pointing at them.
import type { ReactNode } from 'react';
import { TIME_UNITS } from './catalog';
import { INSTRUMENTS } from './sim/market';
import { Info, NumberInput, Select, TextInput, Toggle, useL } from './ui';
import type { SParam } from './model';
import type { Lang } from './model';

export function Field({
  label, tip, children, changed, note, testid, required,
}: { label: string; tip: string; children: ReactNode; changed?: boolean; note?: ReactNode; testid?: string; required?: boolean }) {
  const L = useL();
  return (
    <div className={`field${changed ? ' is-changed' : ''}`} data-testid={testid} data-changed={changed ? '1' : '0'}>
      <div className="field-label" data-tip={tip}>
        <span>{label}</span>
        {required && <span className="req">*</span>}
        <Info tip={tip} />
        {changed && <span className="chg-tag">{L('geändert', 'changed')}</span>}
      </div>
      <div className="field-value">{children}</div>
      {note && <div className="muted">{note}</div>}
    </div>
  );
}

/** Explanation of a strategy parameter by what its name and type say. */
export function paramTip(p: SParam, lang: Lang): string {
  const n = p.name.toLowerCase();
  const de = lang === 'de';
  if (n.includes('signal')) return de ? 'Die größere Kerzenlänge, auf der der Trend bestimmt wird, zum Beispiel H1. Gilt nur für diesen Testlauf.' : 'The longer candle length on which the trend is determined, for example H1. Applies to this test run only.';
  if (n.includes('handel')) return de ? 'Die kleinere Kerzenlänge, auf der der Trade geplant und die Order verwaltet wird, zum Beispiel M15. Gilt nur für diesen Testlauf.' : 'The shorter candle length on which the trade is planned and the order is managed, for example M15. Applies to this test run only.';
  if (n.includes('entry')) return de ? 'Zusätzlicher Abstand in Pips hinter dem Einstiegspunkt, damit der Kurs ihn sicher überschreiten muss.' : 'Extra distance in pips beyond the entry point so that the price has to clearly pass it.';
  if (n.includes('stop-puffer') || n.includes('stop_puffer')) return de ? 'Zusätzlicher Abstand in Pips hinter dem Stop-Bezug, damit der Stop-Loss nicht zu knapp liegt.' : 'Extra distance in pips beyond the stop reference so that the stop loss is not too tight.';
  if (n.includes('stop-abstand') || n.includes('stop_abstand')) return de ? 'Wie viele ATR (durchschnittliche Schwankungsbreite) der Stop-Loss vom Schlusskurs entfernt liegt. 0 setzt den Stop-Loss auf den Schlusskurs.' : 'How many ATR (average candle range) the stop loss is away from the close. 0 puts the stop loss at the close.';
  if (p.dtype === 'instrument') return de ? 'Ein weiteres Instrument, das die Strategie verwendet. Der Testlauf braucht auch dessen Kursdaten. Gilt nur für diesen Testlauf.' : 'Another instrument the strategy uses. The test run needs its price data too. Applies to this test run only.';
  if (p.dtype === 'time_unit') return de ? 'Die Kerzenlänge, zum Beispiel M15 für 15-Minuten-Kerzen. Gilt nur für diesen Testlauf.' : 'The candle length, for example M15 for 15-minute candles. Applies to this test run only.';
  return de ? 'Wert der Strategie. Sie können ihn für diesen Testlauf ändern; die Strategie selbst bleibt unverändert.' : 'Value of the strategy. You can change it for this test run; the strategy itself stays unchanged.';
}

export function ParamInput({ p, value, onChange, lang }: { p: SParam; value: string | number | boolean; onChange: (v: string | number | boolean) => void; lang: Lang }) {
  const de = lang === 'de';
  switch (p.dtype) {
    case 'time_unit':
      return (
        <Select value={String(value)} onChange={onChange} ariaLabel={p.name} testid={`param-${p.id}`}>
          {TIME_UNITS.map((u) => <option key={u.id} value={u.id}>{u.de}</option>)}
        </Select>
      );
    case 'instrument':
      return (
        <Select value={String(value)} onChange={onChange} ariaLabel={p.name} testid={`param-${p.id}`}>
          {INSTRUMENTS.map((i) => <option key={i.id} value={i.id}>{i.id} – {i.bezeichnung}</option>)}
        </Select>
      );
    case 'boolean':
      return <Toggle checked={Boolean(value)} onChange={onChange} label={Boolean(value) ? (de ? 'ja' : 'yes') : de ? 'nein' : 'no'} testid={`param-${p.id}`} />;
    case 'text':
      return <TextInput value={String(value)} onChange={onChange} ariaLabel={p.name} testid={`param-${p.id}`} />;
    case 'percent':
      return <NumberInput value={Math.round(Number(value) * 10000) / 100} onChange={(v) => onChange(v === '' ? 0 : v / 100)} unit="%" ariaLabel={p.name} testid={`param-${p.id}`} />;
    default:
      return <NumberInput value={Number(value)} onChange={(v) => onChange(v === '' ? 0 : v)} ariaLabel={p.name} testid={`param-${p.id}`} />;
  }
}
