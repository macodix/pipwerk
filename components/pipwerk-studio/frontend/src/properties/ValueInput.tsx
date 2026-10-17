import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Choice, DataType, Scalar } from '../api/elementTypes';
import type { SupportedLanguage } from '../i18n';
import { TIME_UNITS, timeUnitLabel } from '../model/timeUnits';

type ValueInputProps = {
  datatype: DataType;
  value: Scalar | undefined;
  choices?: readonly Choice[];
  language: SupportedLanguage;
  /** Accessible name of the input. */
  label: string;
  onChange: (value: Scalar) => void;
  disabled?: boolean;
};

const NUMBER = /^-?\d+(\.\d+)?$/;
const INTEGER = /^-?\d+$/;

/** A decimal text moved by two places, without floating-point error: `7` → `0.07`. */
export function percentToShare(text: string): number {
  return Number(`${text}e-2`);
}

export function shareToPercent(share: number): string {
  return String(Number(`${share}e2`));
}

function toText(value: Scalar | undefined, datatype: DataType): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (datatype === 'percent' && typeof value === 'number') {
    return shareToPercent(value);
  }
  return String(value);
}

/** A number typed as text. A text that is not a number is not stored; the field is marked until it is one. */
function NumberField({
  datatype,
  value,
  label,
  onChange,
  disabled,
}: Pick<ValueInputProps, 'datatype' | 'value' | 'label' | 'onChange' | 'disabled'>) {
  const [draft, setDraft] = useState(toText(value, datatype));
  const [focused, setFocused] = useState(false);
  const pattern = datatype === 'integer' ? INTEGER : NUMBER;
  const normalized = draft.trim().replace(',', '.');
  const valid = normalized === '' || pattern.test(normalized);

  useEffect(() => {
    if (!focused) {
      setDraft(toText(value, datatype));
    }
  }, [value, datatype, focused]);

  return (
    <span className="value-input-number">
      <input
        type="text"
        inputMode={datatype === 'integer' ? 'numeric' : 'decimal'}
        aria-label={label}
        aria-invalid={valid ? undefined : true}
        value={draft}
        disabled={disabled}
        onFocus={() => {
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
        }}
        onChange={(event) => {
          const text = event.target.value;
          setDraft(text);
          const next = text.trim().replace(',', '.');
          if (next === '') {
            onChange(null);
          } else if (pattern.test(next)) {
            onChange(datatype === 'percent' ? percentToShare(next) : Number(next));
          }
        }}
      />
      {datatype === 'percent' ? <span aria-hidden="true"> %</span> : null}
    </span>
  );
}

/** The input for a fixed value, by datatype (item 5 of the order). */
export function ValueInput(props: ValueInputProps) {
  const { datatype, value, choices = [], language, label, onChange, disabled } = props;
  const { t } = useTranslation();

  switch (datatype) {
    case 'number':
    case 'integer':
    case 'percent':
      return <NumberField datatype={datatype} value={value} label={label} onChange={onChange} disabled={disabled} />;
    case 'boolean':
      return (
        <input
          type="checkbox"
          aria-label={label}
          checked={value === true}
          disabled={disabled}
          onChange={(event) => {
            onChange(event.target.checked);
          }}
        />
      );
    case 'choice':
      return (
        <select
          aria-label={label}
          value={typeof value === 'string' ? value : ''}
          disabled={disabled}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        >
          {typeof value !== 'string' || !choices.some((choice) => choice.id === value) ? (
            <option value={typeof value === 'string' ? value : ''}>
              {typeof value === 'string' && value !== '' ? value : t('properties.choose')}
            </option>
          ) : null}
          {choices.map((choice) => (
            <option key={choice.id} value={choice.id}>
              {choice.label[language]}
            </option>
          ))}
        </select>
      );
    case 'time_unit':
      return (
        <select
          aria-label={label}
          value={typeof value === 'string' ? value : ''}
          disabled={disabled}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        >
          {typeof value !== 'string' || !TIME_UNITS.includes(value) ? (
            <option value={typeof value === 'string' ? value : ''}>
              {typeof value === 'string' && value !== '' ? value : t('properties.choose')}
            </option>
          ) : null}
          {TIME_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {timeUnitLabel(unit)}
            </option>
          ))}
        </select>
      );
    case 'timestamp':
      return (
        <input
          type="datetime-local"
          step={1}
          aria-label={label}
          value={typeof value === 'string' ? value : ''}
          disabled={disabled}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      );
    case 'date':
      return (
        <input
          type="date"
          aria-label={label}
          value={typeof value === 'string' ? value : ''}
          disabled={disabled}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      );
    case 'expression':
    case 'object':
    case 'text':
      return (
        <input
          type="text"
          aria-label={label}
          value={typeof value === 'string' ? value : ''}
          disabled={disabled}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      );
  }
}
