// Small building blocks: icons, the layer for explanations, buttons, inputs and the labelled field.
import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

const PATHS: Record<string, string> = {
  plus: 'M12 5v14M5 12h14',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  save: 'M5 3h11l3 3v15H5zM8 3v6h8V3M8 21v-7h8v7',
  check: 'M5 12.5l4.5 4.5L19 7',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.5',
  menu: 'M4 6h16M4 12h16M4 18h16',
  down: 'M6 9l6 6 6-6',
  wallet: 'M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l2-3h12M16 13.5h3',
  chart: 'M3 18l5-6 4 3 8-10',
  warn: 'M12 3l10 18H2zM12 10v5M12 18v.5',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  file: 'M6 3h8l5 5v13H6zM14 3v5h5',
  database: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  upload: 'M12 16V4M7 9l5-5 5 5M5 20h14',
  download: 'M12 4v12M7 11l5 5 5-5M5 20h14',
  refresh: 'M4 12a8 8 0 0 1 14-5l2 2M20 4v5h-5M20 12a8 8 0 0 1-14 5l-2-2M4 20v-5h5',
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  x: 'M6 6l12 12M18 6L6 18',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z',
};

export function Icon({ name, size = 18, className = '' }: { name: string; size?: number; className?: string }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name] ?? PATHS.info} />
    </svg>
  );
}

/** `host` is the open dialog the element is in, or `null`: a dialog covers everything outside of it. */
type Tip = { text: string; x: number; y: number; below: boolean; host: HTMLElement | null };

/**
 * One layer for all explanations: every element with `data-tip` shows its text when
 * the mouse points at it or when it has the keyboard focus. A modal dialog is shown above
 * everything else (in the top layer of the browser), so the explanation of an element in a dialog
 * is placed in the dialog.
 */
export function TipLayer() {
  const [tip, setTip] = useState<Tip | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const show = (target: EventTarget | null) => {
      window.clearTimeout(timer.current);
      const element = target instanceof Element ? target.closest<HTMLElement>('[data-tip]') : null;
      const text = element?.dataset.tip;
      if (element === null || text === undefined || text === '') {
        setTip(null);
        return;
      }
      timer.current = window.setTimeout(() => {
        const rect = element.getBoundingClientRect();
        const below = rect.top < 90;
        setTip({
          text,
          x: Math.min(Math.max(rect.left + rect.width / 2, 150), Math.max(window.innerWidth - 150, 150)),
          y: below ? rect.bottom + 8 : rect.top - 8,
          below,
          host: element.closest<HTMLElement>('dialog[open]'),
        });
      }, 120);
    };
    const over = (event: Event) => {
      show(event.target);
    };
    const out = () => {
      window.clearTimeout(timer.current);
      setTip(null);
    };
    document.addEventListener('mouseover', over);
    document.addEventListener('focusin', over);
    document.addEventListener('mouseout', out);
    document.addEventListener('focusout', out);
    document.addEventListener('pointerdown', out);
    return () => {
      window.clearTimeout(timer.current);
      document.removeEventListener('mouseover', over);
      document.removeEventListener('focusin', over);
      document.removeEventListener('mouseout', out);
      document.removeEventListener('focusout', out);
      document.removeEventListener('pointerdown', out);
    };
  }, []);
  if (tip === null) {
    return null;
  }
  const style: CSSProperties = {
    left: tip.x,
    top: tip.y,
    transform: tip.below ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
  };
  const layer = (
    <div className="tip" role="tooltip" style={style} data-testid="tooltip">
      {tip.text}
    </div>
  );
  return tip.host === null ? layer : createPortal(layer, tip.host);
}

export function Btn({
  children,
  onClick,
  kind = 'default',
  icon,
  disabled,
  title,
  testid,
  type = 'button',
  tip,
  small,
}: {
  children?: ReactNode;
  onClick?: () => void;
  kind?: 'default' | 'primary' | 'ghost' | 'danger';
  icon?: string;
  disabled?: boolean;
  title?: string;
  testid?: string;
  type?: 'button' | 'submit';
  tip?: string;
  small?: boolean;
}) {
  return (
    <button
      type={type}
      className={`btn btn-${kind}${children === undefined ? ' btn-icon' : ''}${small === true ? ' btn-sm' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={title}
      data-tip={tip ?? title}
      data-testid={testid}
    >
      {icon !== undefined && <Icon name={icon} size={17} />}
      {children !== undefined && <span>{children}</span>}
    </button>
  );
}

export function Select({
  value,
  onChange,
  children,
  id,
  testid,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  id?: string;
  testid?: string;
  disabled?: boolean;
}) {
  return (
    <span className="select">
      <select
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        data-testid={testid}
        disabled={disabled}
      >
        {children}
      </select>
      <Icon name="down" size={14} className="select-caret" />
    </span>
  );
}

export function TextInput({
  value,
  onChange,
  id,
  testid,
  placeholder,
  list,
  maxLength,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  testid?: string;
  placeholder?: string;
  /** The `id` of a `<datalist>` with suggestions. */
  list?: string;
  maxLength?: number;
  disabled?: boolean;
}) {
  return (
    <input
      className="input"
      type="text"
      id={id}
      value={value}
      placeholder={placeholder}
      list={list}
      maxLength={maxLength}
      disabled={disabled}
      autoComplete="off"
      spellCheck={false}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      data-testid={testid}
    />
  );
}

/**
 * A number input that keeps what is typed and reports only valid numbers
 * (a comma counts as decimal point); an empty field reports `''`.
 */
export function NumberInput({
  value,
  onChange,
  id,
  testid,
  unit,
  disabled,
}: {
  value: number | '';
  onChange: (value: number | '') => void;
  id?: string;
  testid?: string;
  unit?: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState(String(value));
  const last = useRef(value);
  useEffect(() => {
    // A value that comes from outside (another account chosen) replaces the typed text.
    if (last.current !== value && Number(text.replace(',', '.')) !== Number(value)) {
      setText(String(value));
    }
    last.current = value;
  }, [value, text]);
  return (
    <span className="num-wrap">
      <input
        className="input"
        id={id}
        inputMode="decimal"
        autoComplete="off"
        disabled={disabled}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          const typed = event.target.value.trim().replace(',', '.');
          if (typed === '') {
            onChange('');
          } else if (!Number.isNaN(Number(typed))) {
            onChange(Number(typed));
          }
        }}
        data-testid={testid}
      />
      {unit !== undefined && <span className="unit">{unit}</span>}
    </span>
  );
}

/** The explanation of a field in trader language; reachable with the mouse and the keyboard. */
export function Info({ tip }: { tip: string }) {
  const { t } = useTranslation();
  return (
    <span className="info" tabIndex={0} data-tip={tip} role="img" aria-label={`${t('common.explanation')}: ${tip}`}>
      <Icon name="info" size={14} />
    </span>
  );
}

/**
 * A checkbox with its label and the explanation (same place as for `Field`: pointing at the label
 * or the symbol, or the focus on the symbol). `note` is a line of text under it.
 */
export function CheckField({
  label,
  tip,
  checked,
  onChange,
  testid,
  disabled,
  note,
}: {
  label: string;
  tip: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  testid?: string;
  disabled?: boolean;
  note?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="field check-field" data-testid={testid === undefined ? undefined : `field-${testid}`}>
      <div className="field-label" data-tip={tip}>
        <input
          type="checkbox"
          id={id}
          checked={checked}
          disabled={disabled}
          data-testid={testid}
          onChange={(event) => {
            onChange(event.target.checked);
          }}
        />
        <label htmlFor={id}>{label}</label>
        <Info tip={tip} />
      </div>
      {note !== undefined && <div className="muted">{note}</div>}
    </div>
  );
}

/**
 * A labelled field with a short explanation that appears when pointing at the label or the
 * info symbol, or when the symbol has the focus. `children` gets the `id` of the control.
 */
export function Field({
  label,
  tip,
  children,
  required,
  testid,
  note,
  group,
}: {
  label: string;
  tip: string;
  children: (id: string) => ReactNode;
  required?: boolean;
  testid?: string;
  note?: ReactNode;
  /** The field is a group of controls: the label is a text and names the group by `aria-labelledby`. */
  group?: boolean;
}) {
  const id = useId();
  return (
    <div className="field" data-testid={testid}>
      <div className="field-label" data-tip={tip}>
        {group === true ? <span id={id}>{label}</span> : <label htmlFor={id}>{label}</label>}
        {required === true && <span className="req" aria-hidden="true">*</span>}
        <Info tip={tip} />
      </div>
      <div className="field-value">{children(id)}</div>
      {note !== undefined && <div className="muted">{note}</div>}
    </div>
  );
}
