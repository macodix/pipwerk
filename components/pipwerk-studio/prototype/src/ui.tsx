// Small building blocks: icons, tooltip layer, styled inputs.
import { useEffect, useRef, useState } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { useApp } from './store';

export function useL(): (de: string, en: string) => string {
  const lang = useApp().settings.lang;
  return (de, en) => (lang === 'en' ? en : de);
}

const PATHS: Record<string, string> = {
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  save: 'M5 3h11l3 3v15H5zM8 3v6h8V3M8 21v-7h8v7',
  check: 'M5 12.5l4.5 4.5L19 7',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  x: 'M6 6l12 12M18 6L6 18',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
  gear: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.5',
  menu: 'M4 6h16M4 12h16M4 18h16',
  down: 'M6 9l6 6 6-6',
  up: 'M6 15l6-6 6 6',
  right: 'M9 6l6 6-6 6',
  left: 'M15 6l-6 6 6 6',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  diamond: 'M12 2.5l9.5 9.5-9.5 9.5L2.5 12z',
  calc: 'M17 5H7l6 7-6 7h10',
  sliders: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  order: 'M5 19L19 5M9 5h10v10',
  edit: 'M4 20l4-1 11-11-3-3L5 16z',
  close: 'M4 12h11M11 6l6 6-6 6M20 5v14',
  candle: 'M8 3v4M8 17v4M5 7h6v10H5zM17 5v3M17 15v4M14 8h6v7h-6z',
  wallet: 'M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l2-3h12M16 13.5h3',
  chart: 'M3 18l5-6 4 3 8-10',
  dots: 'M4 12h3M10 8h3M16 14h4',
  wave: 'M3 14c3-8 5-8 8 0s5 8 9-2',
  zigzag: 'M3 17l5-9 4 7 4-11 5 9',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  wand: 'M5 19L16 8M14 6l4 4M18 2.5v3M16.5 4h3M6 4v2M5 5h2',
  warn: 'M12 3l10 18H2zM12 10v5M12 18v.5',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM9 14h6v6H9z',
  fit: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  rotate: 'M4 12a8 8 0 0 1 14-5l2 2M20 4v5h-5M20 12a8 8 0 0 1-14 5l-2-2M4 20v-5h5',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
  copy: 'M9 9h11v11H9zM5 15V4h11',
  tag: 'M3 12V4h8l10 10-8 8zM7.5 8.5h.01',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM8 7h7',
  zoomin: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M11 8v6M8 11h6',
  zoomout: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M8 11h6',
  params: 'M5 6h14M5 12h14M5 18h14M9 4v4M15 10v4M8 16v4',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  file: 'M6 3h8l5 5v13H6zM14 3v5h5',
  arrowdown: 'M12 5v14M6 13l6 6 6-6',
};

export function Icon({ name, size = 18, className = '' }: { name: string; size?: number; className?: string }) {
  return (
    <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name] ?? PATHS.info} />
    </svg>
  );
}

/** Mark on the tab of the properties view: a short message lies there while the view is hidden. */
export function PropsMark() {
  const L = useL();
  return <span className="props-mark" data-testid="props-mark" role="img" aria-label={L('Neue Meldung in der Eigenschaftenansicht', 'New message in the properties view')} />;
}

/** Global layer for explanations: any element with data-tip shows its text on hover or focus. */
export function TipLayer() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number; below: boolean; side: 'top' | 'right' | 'left' } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const show = (target: Element | null) => {
      window.clearTimeout(timer.current);
      const el = target?.closest?.('[data-tip]') as HTMLElement | null;
      if (!el || !el.dataset.tip) {
        setTip(null);
        return;
      }
      timer.current = window.setTimeout(() => {
        const r = el.getBoundingClientRect();
        const below = r.top < 90;
        // entries of the library explain themselves to the right, fields of the properties view to the left
        const inLib = !!el.closest('.region-library') && window.innerWidth >= 1100;
        const inProps = !!el.closest('.region-props') && window.innerWidth >= 1100;
        if (inLib) setTip({ text: el.dataset.tip ?? '', x: r.right + 10, y: r.top + r.height / 2, below, side: 'right' });
        else if (inProps) setTip({ text: el.dataset.tip ?? '', x: r.left - 10, y: r.top + r.height / 2, below, side: 'left' });
        else setTip({ text: el.dataset.tip ?? '', x: Math.min(Math.max(r.left + r.width / 2, 150), window.innerWidth - 150), y: below ? r.bottom + 8 : r.top - 8, below, side: 'top' });
      }, 140);
    };
    const over = (e: Event) => show(e.target as Element);
    const out = () => { window.clearTimeout(timer.current); setTip(null); };
    document.addEventListener('mouseover', over);
    document.addEventListener('focusin', over);
    document.addEventListener('mouseout', out);
    document.addEventListener('focusout', out);
    document.addEventListener('pointerdown', out);
    return () => {
      document.removeEventListener('mouseover', over);
      document.removeEventListener('focusin', over);
      document.removeEventListener('mouseout', out);
      document.removeEventListener('focusout', out);
      document.removeEventListener('pointerdown', out);
    };
  }, []);
  if (!tip) return null;
  const style: CSSProperties = {
    left: tip.x,
    top: tip.y,
    transform: tip.side === 'right' ? 'translate(0, -50%)' : tip.side === 'left' ? 'translate(-100%, -50%)' : tip.below ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
  };
  return (
    <div className="tip" role="tooltip" style={style} data-testid="tooltip">
      {tip.text}
    </div>
  );
}

export function Btn({
  children, onClick, kind = 'default', icon, disabled, title, testid, small, type = 'button', tip, className,
}: {
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
  kind?: 'default' | 'primary' | 'ghost' | 'danger' | 'quiet';
  icon?: string;
  disabled?: boolean;
  title?: string;
  testid?: string;
  small?: boolean;
  type?: 'button' | 'submit';
  tip?: string;
}) {
  return (
    <button
      type={type}
      className={`btn btn-${kind}${small ? ' btn-sm' : ''}${!children ? ' btn-icon' : ''}${className ? ` ${className}` : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={title}
      data-tip={tip ?? title}
      data-testid={testid}
    >
      {icon && <Icon name={icon} size={small ? 15 : 17} />}
      {children && <span>{children}</span>}
    </button>
  );
}

export function Select({
  value, onChange, children, testid, ariaLabel, disabled, className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  testid?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <span className={`select ${className}`}>
      <select value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid} aria-label={ariaLabel} disabled={disabled}>
        {children}
      </select>
      <Icon name="down" size={14} className="select-caret" />
    </span>
  );
}

export function TextInput({
  value, onChange, placeholder, testid, ariaLabel, type = 'text', inputMode, className = '', onBlur, autoFocus,
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  testid?: string;
  ariaLabel?: string;
  type?: string;
  inputMode?: 'decimal' | 'numeric' | 'text';
  className?: string;
  onBlur?: () => void;
  autoFocus?: boolean;
}) {
  return (
    <input
      className={`input ${className}`}
      type={type}
      inputMode={inputMode}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      data-testid={testid}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
    />
  );
}

/** Number input that keeps what is typed and reports only valid numbers. */
export function NumberInput({
  value, onChange, testid, ariaLabel, step, unit,
}: {
  value: number | string;
  onChange: (v: number | '') => void;
  testid?: string;
  ariaLabel?: string;
  step?: string;
  unit?: string;
}) {
  const [text, setText] = useState(String(value ?? ''));
  const last = useRef(value);
  useEffect(() => {
    if (last.current !== value && Number(text.replace(',', '.')) !== Number(value)) setText(String(value ?? ''));
    last.current = value;
  }, [value, text]);
  return (
    <span className="num-wrap">
      <input
        className="input"
        inputMode="decimal"
        step={step}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const t = e.target.value.trim().replace(',', '.');
          if (t === '') onChange('');
          else if (!Number.isNaN(Number(t))) onChange(Number(t));
        }}
        data-testid={testid}
        aria-label={ariaLabel}
      />
      {unit && <span className="unit">{unit}</span>}
    </span>
  );
}

export function Toggle({ checked, onChange, label, testid }: { checked: boolean; onChange: (v: boolean) => void; label: string; testid?: string }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} data-testid={testid} />
      <span className="toggle-box" aria-hidden="true">{checked && <Icon name="check" size={13} />}</span>
      <span>{label}</span>
    </label>
  );
}

export function Section({ title, children, aside, id, testid }: { title: string; children: ReactNode; aside?: ReactNode; id?: string; testid?: string }) {
  return (
    <section className="psec" id={id} data-testid={testid}>
      <header className="psec-head">
        <h3>{title}</h3>
        {aside}
      </header>
      <div className="psec-body">{children}</div>
    </section>
  );
}

export function Info({ tip, label }: { tip?: string; label?: string }) {
  if (!tip) return null;
  return (
    <span className="info" tabIndex={0} data-tip={tip} role="img" aria-label={label ?? 'Info'}>
      <Icon name="info" size={14} />
    </span>
  );
}

export function fmtDate(iso: string | null, lang: string): string {
  if (!iso) return '–';
  try {
    return new Date(iso).toLocaleString(lang === 'en' ? 'en-GB' : 'de-DE', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}
