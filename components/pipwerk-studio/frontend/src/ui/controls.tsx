import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Icon } from './Icon';

/** The controls of the interface in one design: colours, spacing and shape come from the style sheet (specification 5.1). */

export function Btn({
  children,
  onClick,
  kind = 'default',
  icon,
  disabled,
  title,
  testid,
  small,
  type = 'button',
  tip,
}: {
  children?: ReactNode;
  onClick?: () => void;
  kind?: 'default' | 'primary' | 'ghost' | 'danger' | 'quiet';
  icon?: string;
  disabled?: boolean;
  /** The accessible name of a button that shows only a symbol. */
  title?: string;
  testid?: string;
  small?: boolean;
  type?: 'button' | 'submit';
  tip?: string;
}) {
  return (
    <button
      type={type}
      className={`btn btn-${kind}${small === true ? ' btn-sm' : ''}${children === undefined ? ' btn-icon' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={title}
      data-tip={tip ?? title}
      data-testid={testid}
    >
      {icon !== undefined ? <Icon name={icon} size={small === true ? 15 : 17} /> : null}
      {children !== undefined ? <span>{children}</span> : null}
    </button>
  );
}

export function Select({
  value,
  onChange,
  children,
  testid,
  ariaLabel,
  disabled,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  testid?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <span className={`select ${className}`}>
      <select
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        data-testid={testid}
        aria-label={ariaLabel}
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
  placeholder,
  testid,
  ariaLabel,
  className = '',
  autoFocus,
  onEnter,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  testid?: string;
  ariaLabel?: string;
  className?: string;
  autoFocus?: boolean;
  onEnter?: () => void;
}) {
  return (
    <input
      className={`input ${className}`}
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && onEnter !== undefined) {
          event.preventDefault();
          onEnter();
        }
      }}
      data-testid={testid}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
    />
  );
}

/** A number input that keeps what is typed and reports only valid numbers (a comma counts as decimal separator). */
export function NumberInput({
  value,
  onChange,
  testid,
  ariaLabel,
  unit,
}: {
  value: number | '';
  onChange: (value: number | '') => void;
  testid?: string;
  ariaLabel?: string;
  unit?: string;
}) {
  const [text, setText] = useState(String(value));
  const last = useRef(value);
  useEffect(() => {
    if (last.current !== value && Number(text.replace(',', '.')) !== Number(value)) {
      setText(String(value));
    }
    last.current = value;
  }, [value, text]);
  return (
    <span className="num-wrap">
      <input
        className="input"
        inputMode="decimal"
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
        aria-label={ariaLabel}
      />
      {unit !== undefined ? <span className="unit">{unit}</span> : null}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  testid,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  testid?: string;
}) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
        data-testid={testid}
      />
      <span className="toggle-box" aria-hidden="true">
        {checked ? <Icon name="check" size={13} /> : null}
      </span>
      <span>{label}</span>
    </label>
  );
}

export function Section({
  title,
  children,
  aside,
  testid,
}: {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
  testid?: string;
}) {
  return (
    <section className="psec" data-testid={testid}>
      <header className="psec-head">
        <h3>{title}</h3>
        {aside}
      </header>
      <div className="psec-body">{children}</div>
    </section>
  );
}

/** The symbol "i" that explains a field when it is pointed at or focused. */
export function Info({ tip, label }: { tip?: string; label: string }) {
  if (tip === undefined || tip === '') {
    return null;
  }
  return (
    <span className="info" tabIndex={0} data-tip={tip} role="img" aria-label={label}>
      <Icon name="info" size={14} />
    </span>
  );
}
