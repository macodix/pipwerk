import { useTranslation } from 'react-i18next';

import type { BindingKind } from '../api/elementTypes';
import type { Binding } from '../document/types';
import { ExpressionInput } from '../expression/ExpressionInput';
import type { ExpressionPlace } from '../expression/fields';
import type { ExpressionContext } from '../expression/scope';
import { useStudio } from '../state/StudioContext';
import { startBinding, type BindingSpec } from './specs';
import { ValueInput } from './ValueInput';

type BindingEditorProps = {
  spec: BindingSpec;
  binding: Binding | undefined;
  onChange: (binding: Binding | null) => void;
  /** Where an expression of this row stands, for the recognized names. */
  place: ExpressionPlace;
  context: ExpressionContext;
  /** Show the value only (an element of an unknown type). */
  readOnly?: boolean;
};

/**
 * One row of the property view: the label, the choice of the kind of binding
 * from the kinds the description allows, and the input for the value.
 */
export function BindingEditor({ spec, binding, onChange, place, context, readOnly }: BindingEditorProps) {
  const { t } = useTranslation();
  const { document, language } = useStudio();
  const parameterNames = document.parameters.map((parameter) => parameter.name);
  const kinds: readonly BindingKind[] = spec.bindings;
  const onlyKind = kinds.length === 1 ? kinds[0] : undefined;
  const effectiveKind: BindingKind | undefined = binding?.kind ?? onlyKind;
  const locked = readOnly === true;

  function change(next: Binding | null): void {
    onChange(next === null || binding === undefined ? next : { ...binding, ...next });
  }

  function changeKind(kind: BindingKind | ''): void {
    if (kind === '') {
      onChange(null);
    } else {
      // The old value does not fit the new kind: start from the standard of the kind.
      onChange(startBinding(kind, spec, parameterNames));
    }
  }

  let valueControl;
  if (effectiveKind === 'fixed') {
    valueControl = (
      <ValueInput
        datatype={spec.datatype}
        value={binding?.value}
        choices={spec.choices}
        language={language}
        label={spec.label}
        disabled={locked}
        onChange={(value) => {
          change({ kind: 'fixed', value });
        }}
      />
    );
  } else if (effectiveKind === 'parameter') {
    const selected = typeof binding?.value === 'string' ? binding.value : '';
    valueControl = (
      <select
        aria-label={spec.label}
        value={selected}
        disabled={locked}
        onChange={(event) => {
          change({ kind: 'parameter', value: event.target.value });
        }}
      >
        {selected === '' || !parameterNames.includes(selected) ? (
          <option value={selected}>{selected === '' ? t('properties.choose') : selected}</option>
        ) : null}
        {parameterNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    );
  } else if (effectiveKind === 'expression') {
    valueControl = (
      <ExpressionInput
        value={typeof binding?.value === 'string' ? binding.value : ''}
        place={place}
        context={context}
        label={spec.label}
        disabled={locked}
        onChange={(text) => {
          change({ kind: 'expression', value: text });
        }}
      />
    );
  } else if (effectiveKind === 'application') {
    valueControl = <span className="binding-application">{t('properties.application')}</span>;
  } else {
    // Nothing is set: the kind select says so.
    valueControl = null;
  }

  return (
    <div className="binding-row">
      <span className="binding-label">
        {spec.label}
        {spec.required || spec.must ? <span aria-hidden="true"> *</span> : null}
      </span>
      {onlyKind === undefined ? (
        <select
          className="binding-kind"
          aria-label={t('properties.bindingKindOf', { name: spec.label })}
          value={binding?.kind ?? ''}
          disabled={locked}
          onChange={(event) => {
            changeKind(event.target.value as BindingKind | '');
          }}
        >
          <option value="">{t('properties.unset')}</option>
          {kinds.map((kind) => (
            <option key={kind} value={kind}>
              {t(`properties.binding.${kind}`)}
            </option>
          ))}
        </select>
      ) : null}
      {valueControl === null ? null : <div className="binding-value">{valueControl}</div>}
    </div>
  );
}
